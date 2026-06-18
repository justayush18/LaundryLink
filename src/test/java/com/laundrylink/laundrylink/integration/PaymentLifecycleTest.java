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
public class PaymentLifecycleTest {

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
    private OrderEntity savedOrder;

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

        savedOrder = orderRepository.save(new OrderEntity(
                "order-pay-123",
                "aarav@example.com",
                "partner@freshfold.example",
                90.0,
                "Pickup Address",
                "Slot A",
                "Delivery Address",
                "Slot B"
        ));
    }

    @Test
    public void testPaymentAndInvoiceLifecycle() throws Exception {
        // 1. Initiate payment
        InitiatePaymentRequest initReq = new InitiatePaymentRequest("order-pay-123", PaymentMethod.RAZORPAY);

        MvcResult result = mockMvc.perform(post("/api/v1/payments/initiate")
                .header(HttpHeaders.AUTHORIZATION, customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(initReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        PaymentView payment = objectMapper.readValue(responseContent, PaymentView.class);
        String paymentId = payment.paymentId();

        // 2. Process payment
        mockMvc.perform(post("/api/v1/payments/" + paymentId + "/process")
                .header(HttpHeaders.AUTHORIZATION, customerToken)
                .param("simulateSuccess", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        // 3. Fetch invoice
        mockMvc.perform(get("/api/v1/payments/orders/order-pay-123/invoice")
                .header(HttpHeaders.AUTHORIZATION, customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId").value(paymentId))
                .andExpect(jsonPath("$.invoiceStatus").value("GENERATED"));
    }
}
