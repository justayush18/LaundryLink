package com.laundrylink.laundrylink.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laundrylink.laundrylink.api.*;
import com.laundrylink.laundrylink.persistence.*;
import com.laundrylink.laundrylink.security.JwtService;
import com.laundrylink.laundrylink.security.JwtAuthenticationFilter;

@SpringBootTest
@Transactional
public class DeliveryLifecycleTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String deliveryToken;
    private OrderEntity savedOrder;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilter(jwtAuthenticationFilter)
                .build();

        UserEntity rider = userRepository.findByEmail("ravi.delivery@example.com")
                .orElseGet(() -> userRepository.save(new UserEntity("ravi.delivery@example.com", "hash", "Ravi Singh", "999", UserRoleType.DELIVERY_PARTNER)));
        deliveryToken = "Bearer " + jwtService.generateToken(rider);

        OrderEntity order = new OrderEntity(
                "order-del-123",
                "aarav@example.com",
                "partner@freshfold.example",
                150.0,
                "Pickup Address",
                "Slot A",
                "Delivery Address",
                "Slot B"
        );
        order.setStatus(OrderStatus.PICKUP_ASSIGNED);
        order.setPickupRiderEmail("ravi.delivery@example.com");
        savedOrder = orderRepository.save(order);
    }

    @Test
    public void testDeliveryDashboardAndTracking() throws Exception {
        // 1. Fetch dashboard
        mockMvc.perform(get("/api/v1/deliveries/dashboard")
                .header(HttpHeaders.AUTHORIZATION, deliveryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upcomingPickups").isNotEmpty());

        // 2. Fetch tracking details
        mockMvc.perform(get("/api/v1/deliveries/order-del-123/tracking")
                .header(HttpHeaders.AUTHORIZATION, deliveryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value("order-del-123"))
                .andExpect(jsonPath("$.status").value("PICKUP_ASSIGNED"));

        // 3. Update status to PICKUP_COMPLETED
        OrderStatusUpdateRequest completeReq = new OrderStatusUpdateRequest(OrderStatus.PICKUP_COMPLETED, "Picked up from customer and delivered to vendor");
        mockMvc.perform(put("/api/v1/orders/order-del-123/status")
                .header(HttpHeaders.AUTHORIZATION, deliveryToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PICKUP_COMPLETED"));
    }
}
