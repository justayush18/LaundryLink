package com.laundrylink.laundrylink.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;

import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.persistence.UserEntity;
import com.laundrylink.laundrylink.persistence.UserRepository;
import com.laundrylink.laundrylink.security.JwtService;
import com.laundrylink.laundrylink.security.JwtAuthenticationFilter;

@SpringBootTest
@Transactional
public class AdminDashboardTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String customerToken;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilter(jwtAuthenticationFilter)
                .build();

        UserEntity admin = userRepository.findByEmail("admin@velora.example")
                .orElseGet(() -> userRepository.save(new UserEntity("admin@velora.example", "hash", "Admin User", "999", UserRoleType.ADMIN)));
        adminToken = "Bearer " + jwtService.generateToken(admin);

        UserEntity customer = userRepository.findByEmail("aarav@example.com")
                .orElseGet(() -> userRepository.save(new UserEntity("aarav@example.com", "hash", "Aarav", "123", UserRoleType.CUSTOMER)));
        customerToken = "Bearer " + jwtService.generateToken(customer);
    }

    @Test
    public void testAdminDashboardSummary_Success() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").exists())
                .andExpect(jsonPath("$.totalRevenue").exists());
    }

    @Test
    public void testAdminDashboardSummary_ForbiddenForCustomer() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                .header(HttpHeaders.AUTHORIZATION, customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testAdminDashboardSummary_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isForbidden()); // Spring Security denies unauthenticated as Forbidden by default
    }

    @Test
    public void testAdminUserStatusUpdate() throws Exception {
        mockMvc.perform(put("/api/v1/admin/users/aarav@example.com/status")
                .header(HttpHeaders.AUTHORIZATION, adminToken)
                .param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }
}
