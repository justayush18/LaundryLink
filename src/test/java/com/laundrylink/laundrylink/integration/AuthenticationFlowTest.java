package com.laundrylink.laundrylink.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laundrylink.laundrylink.api.AuthLoginRequest;
import com.laundrylink.laundrylink.api.AuthRegisterRequest;
import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.security.JwtAuthenticationFilter;
import com.laundrylink.laundrylink.persistence.UserRepository;
import com.laundrylink.laundrylink.persistence.UserEntity;

@SpringBootTest
@Transactional
public class AuthenticationFlowTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private UserRepository userRepository;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilter(jwtAuthenticationFilter)
                .build();
    }

    @Test
    public void testRegisterAndLoginFlow() throws Exception {
        AuthRegisterRequest registerReq = new AuthRegisterRequest(
                "Integration Customer",
                "integration.customer@example.com",
                "Password@123",
                "0987654321",
                UserRoleType.CUSTOMER
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.displayName").value("Integration Customer"));

        // Retrieve generated OTP code from the database
        UserEntity user = userRepository.findByEmail("integration.customer@example.com")
                .orElseThrow(() -> new AssertionError("Registered user not found in database"));
        
        String otpCode = user.getOtpCode();
        org.junit.jupiter.api.Assertions.assertNotNull(otpCode);

        // Perform OTP verification call
        com.laundrylink.laundrylink.api.VerifyOtpRequest verifyReq = new com.laundrylink.laundrylink.api.VerifyOtpRequest(
                "integration.customer@example.com",
                otpCode
        );

        mockMvc.perform(post("/api/v1/auth/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.emailVerified").value(true));

        AuthLoginRequest loginReq = new AuthLoginRequest(
                "integration.customer@example.com",
                "Password@123"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    public void testLoginWithInvalidCredentials() throws Exception {
        AuthLoginRequest loginReq = new AuthLoginRequest(
                "nonexistent@example.com",
                "WrongPassword"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized());
    }
}
