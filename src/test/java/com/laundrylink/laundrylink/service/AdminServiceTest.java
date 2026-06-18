package com.laundrylink.laundrylink.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.laundrylink.laundrylink.api.*;
import com.laundrylink.laundrylink.persistence.*;

@ExtendWith(MockitoExtension.class)
public class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private LaundryPartnerService laundryPartnerService;

    @InjectMocks
    private AdminService adminService;

    @Test
    public void testGetAllUsers_Filtered() {
        UserEntity u1 = new UserEntity();
        u1.setEmail("u1@example.com");
        u1.setRole(UserRoleType.CUSTOMER);
        u1.setActive(true);

        UserEntity u2 = new UserEntity();
        u2.setEmail("u2@example.com");
        u2.setRole(UserRoleType.LAUNDRY_PARTNER);
        u2.setActive(false);

        when(userRepository.findAll()).thenReturn(List.of(u1, u2));

        List<AdminUserView> result = adminService.getAllUsers(UserRoleType.CUSTOMER, true);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("u1@example.com", result.get(0).email());
    }

    @Test
    public void testSearchUsers() {
        UserEntity u1 = new UserEntity();
        u1.setEmail("test@example.com");
        u1.setDisplayName("Test User");

        when(userRepository.findAll()).thenReturn(List.of(u1));

        List<AdminUserView> result = adminService.searchUsers("test", "User");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("test@example.com", result.get(0).email());
    }

    @Test
    public void testSetUserActiveStatus() {
        UserEntity u = new UserEntity();
        u.setEmail("test@example.com");
        u.setActive(true);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(u));

        AdminUserView result = adminService.setUserActiveStatus("test@example.com", false);

        assertNotNull(result);
        assertFalse(result.active());
        verify(userRepository, times(1)).save(u);
    }

    @Test
    public void testGetDashboardSummary() {
        when(userRepository.count()).thenReturn(10L);
        when(orderRepository.count()).thenReturn(5L);
        when(paymentRepository.count()).thenReturn(3L);
        when(reviewRepository.count()).thenReturn(2L);
        when(notificationRepository.count()).thenReturn(8L);

        AdminDashboardView summary = adminService.getDashboardSummary();

        assertNotNull(summary);
        assertEquals(10L, summary.totalUsers());
        assertEquals(5L, summary.totalOrders());
        assertEquals(3L, summary.totalPayments());
    }

    @Test
    public void testGetRevenueReport() {
        PaymentEntity p1 = new PaymentEntity("pay-1", "order-1", 100.0, PaymentMethod.RAZORPAY, "tx-1");
        p1.setStatus(PaymentStatus.SUCCESS);
        p1.setCreatedAt(System.currentTimeMillis() / 1000L - 100);

        when(paymentRepository.findAll()).thenReturn(List.of(p1));

        AdminRevenueReport report = adminService.getRevenueReport();

        assertNotNull(report);
        assertEquals(100.0, report.dailyRevenue());
        assertEquals(100.0, report.weeklyRevenue());
        assertEquals(100.0, report.monthlyRevenue());
        assertEquals(100.0, report.totalRevenue());
    }
}
