package com.laundrylink.laundrylink.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
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
public class OrderLifecycleTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String customerToken;
    private String partnerToken;
    private String deliveryToken;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilter(jwtAuthenticationFilter)
                .build();

        // Register or fetch customer
        UserEntity customer = userRepository.findByEmail("aarav@example.com")
                .orElseGet(() -> userRepository.save(new UserEntity("aarav@example.com", "hash", "Aarav", "123", UserRoleType.CUSTOMER)));
        customerToken = "Bearer " + jwtService.generateToken(customer);

        // Fetch or create laundry partner
        UserEntity partnerUser = userRepository.findByEmail("partner@freshfold.example")
                .orElseGet(() -> userRepository.save(new UserEntity("partner@freshfold.example", "hash", "FreshFold", "456", UserRoleType.LAUNDRY_PARTNER)));
        partnerToken = "Bearer " + jwtService.generateToken(partnerUser);

        // Fetch or create delivery partner
        UserEntity deliveryUser = userRepository.findByEmail("ravi.delivery@example.com")
                .orElseGet(() -> userRepository.save(new UserEntity("ravi.delivery@example.com", "hash", "Ravi", "789", UserRoleType.DELIVERY_PARTNER)));
        deliveryUser.setOnline(true);
        deliveryUser.setActive(true);
        userRepository.save(deliveryUser);

        // Turn off all other riders to ensure deterministic assignment
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRoleType.DELIVERY_PARTNER && !u.getEmail().equalsIgnoreCase("ravi.delivery@example.com"))
                .forEach(u -> {
                    u.setOnline(false);
                    userRepository.save(u);
                });

        deliveryToken = "Bearer " + jwtService.generateToken(deliveryUser);

        // Ensure partner profile exists in database
        partnerRepository.findByEmail("partner@freshfold.example")
                .orElseGet(() -> {
                    PartnerEntity partner = new PartnerEntity("partner@freshfold.example", "FreshFold Laundry", "Desc", "Address", "ACTIVE");
                    partner.setPricingRateCard(List.of(new RateCardItemEntity("SHIRT", "WASH_AND_FOLD", 45.0)));
                    return partnerRepository.save(partner);
                });
    }

    @Test
    public void testFullOrderLifecycle() throws Exception {
        // 1. Customer places order
        PlaceOrderRequest orderReq = new PlaceOrderRequest(
                "partner@freshfold.example",
                List.of(new OrderItemDto("SHIRT", "WASH_AND_FOLD", 2)),
                "Pickup 123",
                "Slot A",
                "Delivery 123",
                "Slot B"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").isNotEmpty())
                .andExpect(jsonPath("$.totalCost").value(80.0)) // Seed price is 40.0, so 40 * 2 = 80
                .andExpect(jsonPath("$.status").value("PLACED"))
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        OrderView order = objectMapper.readValue(responseContent, OrderView.class);
        String orderId = order.orderId();

        // 2. Partner accepts order -> triggers auto-assignment to ravi.delivery@example.com
        OrderStatusUpdateRequest acceptRequest = new OrderStatusUpdateRequest(OrderStatus.ACCEPTED, "Accepted by partner");
        mockMvc.perform(put("/api/v1/orders/" + orderId + "/status")
                .header(HttpHeaders.AUTHORIZATION, partnerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(acceptRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PICKUP_ASSIGNED"))
                .andExpect(jsonPath("$.deliveryPartnerEmail").value("ravi.delivery@example.com"));
    }
}
