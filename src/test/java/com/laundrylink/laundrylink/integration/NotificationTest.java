package com.laundrylink.laundrylink.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

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
public class NotificationTest {

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

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilter(jwtAuthenticationFilter)
                .build();

        UserEntity customer = userRepository.findByEmail("aarav@example.com")
                .orElseGet(() -> userRepository.save(new UserEntity("aarav@example.com", "hash", "Aarav", "123", UserRoleType.CUSTOMER)));
        customerToken = "Bearer " + jwtService.generateToken(customer);

        partnerRepository.findByEmail("partner@freshfold.example")
                .orElseGet(() -> {
                    PartnerEntity partner = new PartnerEntity("partner@freshfold.example", "FreshFold Laundry", "Desc", "Address", "ACTIVE");
                    partner.setPricingRateCard(List.of(new RateCardItemEntity("SHIRT", "WASH_AND_FOLD", 45.0)));
                    return partnerRepository.save(partner);
                });
    }

    @Test
    public void testNotificationPreferencesAndHistory() throws Exception {
        // 1. Get default preferences
        mockMvc.perform(get("/api/v1/notifications/preferences")
                .header(HttpHeaders.AUTHORIZATION, customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatusAlerts").value(true));

        // 2. Update preferences
        NotificationPreferencesDto updateReq = new NotificationPreferencesDto(true, false, true, false);
        mockMvc.perform(put("/api/v1/notifications/preferences")
                .header(HttpHeaders.AUTHORIZATION, customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatusAlerts").value(true))
                .andExpect(jsonPath("$.paymentAlerts").value(false));

        // 3. Place order to trigger order status alert
        PlaceOrderRequest orderReq = new PlaceOrderRequest(
                "partner@freshfold.example",
                List.of(new OrderItemDto("SHIRT", "WASH_AND_FOLD", 2)),
                "Pickup Address",
                "Slot A",
                "Delivery Address",
                "Slot B"
        );
        mockMvc.perform(post("/api/v1/orders")
                .header(HttpHeaders.AUTHORIZATION, customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk());

        // 4. Fetch notification history
        mockMvc.perform(get("/api/v1/notifications/history")
                .header(HttpHeaders.AUTHORIZATION, customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalNotifications").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.unreadNotifications").value(greaterThanOrEqualTo(1)));
    }
}
