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
public class ReviewRatingTest {

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
    private OrderRepository orderRepository;

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

        UserEntity partnerUser = userRepository.findByEmail("partner@freshfold.example")
                .orElseGet(() -> userRepository.save(new UserEntity("partner@freshfold.example", "hash", "FreshFold", "456", UserRoleType.LAUNDRY_PARTNER)));

        partnerRepository.findByEmail("partner@freshfold.example")
                .orElseGet(() -> {
                    PartnerEntity partner = new PartnerEntity("partner@freshfold.example", "FreshFold Laundry", "Desc", "Address", "ACTIVE");
                    partner.setPricingRateCard(List.of(new RateCardItemEntity("SHIRT", "WASH_AND_FOLD", 45.0)));
                    return partnerRepository.save(partner);
                });

        OrderEntity order = new OrderEntity(
                "order-rev-123",
                "aarav@example.com",
                "partner@freshfold.example",
                90.0,
                "Pickup Address",
                "Slot A",
                "Delivery Address",
                "Slot B"
        );
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);
    }

    @Test
    public void testSubmitAndGetReview() throws Exception {
        // 1. Submit review
        ReviewRequest request = new ReviewRequest("order-rev-123", 5, "Perfect wash");

        mockMvc.perform(post("/api/v1/reviews")
                .header(HttpHeaders.AUTHORIZATION, customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value("order-rev-123"))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Perfect wash"));

        // 2. Fetch partner ratings
        mockMvc.perform(get("/api/v1/reviews/partners/partner@freshfold.example")
                .header(HttpHeaders.AUTHORIZATION, customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(5.0))
                .andExpect(jsonPath("$.totalReviews").value(1));
    }
}
