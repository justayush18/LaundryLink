package com.laundrylink.laundrylink.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.service.AdminService;

@RestController
@RequestMapping(path = "/api/v1/admin", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminController {

    private final AdminService adminService;
    private final com.laundrylink.laundrylink.service.DemoDataSeeder demoDataSeeder;

    public AdminController(AdminService adminService, com.laundrylink.laundrylink.service.DemoDataSeeder demoDataSeeder) {
        this.adminService = adminService;
        this.demoDataSeeder = demoDataSeeder;
    }

    // ==========================================
    // 1. Dashboard Summary Endpoint
    // ==========================================

    @GetMapping("/dashboard")
    public AdminDashboardView getDashboardSummary() {
        requireAdmin();
        return adminService.getDashboardSummary();
    }

    // ==========================================
    // 2. User Management Endpoints
    // ==========================================

    @GetMapping("/users")
    public List<AdminUserView> getUsers(
            @RequestParam(required = false) UserRoleType role,
            @RequestParam(required = false) Boolean active) {
        requireAdmin();
        return adminService.getAllUsers(role, active);
    }

    @GetMapping("/users/search")
    public List<AdminUserView> searchUsers(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String displayName) {
        requireAdmin();
        return adminService.searchUsers(email, displayName);
    }

    @PutMapping("/users/{email}/role")
    public AdminUserView updateUserRole(@PathVariable String email, @RequestParam UserRoleType role) {
        requireAdmin();
        return adminService.updateUserRole(email, role);
    }

    @PutMapping("/users/{email}/status")
    public AdminUserView updateUserStatus(@PathVariable String email, @RequestParam boolean active) {
        requireAdmin();
        return adminService.setUserActiveStatus(email, active);
    }

    @DeleteMapping("/users/{email}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable String email) {
        requireAdmin();
        adminService.deleteUser(email);
    }

    // ==========================================
    // 3. Partner Management Endpoints
    // ==========================================

    @GetMapping("/partners")
    public List<AdminPartnerView> getPartners() {
        requireAdmin();
        return adminService.getAllPartners();
    }

    @GetMapping("/partners/{email}")
    public AdminPartnerView getPartner(@PathVariable String email) {
        requireAdmin();
        return adminService.getPartnerDetails(email);
    }

    @PutMapping("/partners/{email}/status")
    public AdminPartnerView updatePartnerStatus(@PathVariable String email, @RequestParam String status) {
        requireAdmin();
        return adminService.updatePartnerStatus(email, status);
    }

    @PutMapping("/partners/{email}/cancellation-penalty")
    public AdminPartnerView updateCancellationPenalty(@PathVariable String email, @RequestParam double penalty) {
        requireAdmin();
        return adminService.updateCancellationPenalty(email, penalty);
    }

    @PutMapping(value = "/partners/{email}/documents/{documentId}/verify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public PartnerDocumentView verifyPartnerDocument(
            @PathVariable String email,
            @PathVariable String documentId,
            @RequestBody DocumentVerifyRequest request) {
        requireAdmin();
        return adminService.verifyPartnerDocument(email, documentId, request.status(), request.rejectionReason());
    }

    // ==========================================
    // 4. Order Monitoring Endpoints
    // ==========================================

    @GetMapping("/orders")
    public List<OrderView> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String partnerEmail,
            @RequestParam(required = false) String deliveryPartnerEmail) {
        requireAdmin();
        return adminService.getAllOrders(status, customerEmail, partnerEmail, deliveryPartnerEmail);
    }

    @GetMapping("/orders/{orderId}")
    public OrderView getOrder(@PathVariable String orderId) {
        requireAdmin();
        return adminService.getOrderDetails(orderId);
    }

    // ==========================================
    // 5. Payment & Invoice Monitoring Endpoints
    // ==========================================

    @GetMapping("/payments")
    public List<PaymentView> getPayments(@RequestParam(required = false) PaymentStatus status) {
        requireAdmin();
        return adminService.getAllPayments(status);
    }

    @GetMapping("/invoices")
    public List<InvoiceView> getInvoices() {
        requireAdmin();
        return adminService.getAllInvoices();
    }

    // ==========================================
    // 6. Review Monitoring Endpoints
    // ==========================================

    @GetMapping("/reviews")
    public List<ReviewView> getReviews() {
        requireAdmin();
        return adminService.getAllReviews();
    }

    @GetMapping("/reviews/partners/{email}")
    public List<ReviewView> getReviewsForPartner(@PathVariable String email) {
        requireAdmin();
        return adminService.getReviewsForPartner(email);
    }

    // ==========================================
    // 7. Notification Monitoring Endpoints
    // ==========================================

    @GetMapping("/notifications")
    public List<NotificationView> getNotifications() {
        requireAdmin();
        return adminService.getAllNotifications();
    }

    @GetMapping("/notifications/summary")
    public AdminNotificationSummary getNotificationSummary() {
        requireAdmin();
        return adminService.getNotificationSummary();
    }

    // ==========================================
    // 8. Reports & Analytics Endpoints
    // ==========================================

    @GetMapping("/analytics/summary")
    public AdminAnalyticsSummary getAnalyticsSummary() {
        requireAdmin();
        return adminService.getAnalyticsSummary();
    }

    @GetMapping("/reports/revenue")
    public AdminRevenueReport getRevenueReport() {
        requireAdmin();
        return adminService.getRevenueReport();
    }

    @GetMapping("/analytics/partners")
    public List<PartnerPerformanceAnalytics> getPartnerPerformanceAnalytics() {
        requireAdmin();
        return adminService.getPartnerPerformanceAnalytics();
    }

    // ==========================================
    // 9. Database Management & Seeding Endpoints
    // ==========================================

    @PostMapping("/reset-database")
    @ResponseStatus(HttpStatus.OK)
    public void resetDatabase() {
        requireAdmin();
        try {
            System.out.println("[ADMIN CONTROLLER] Starting database reset request...");
            demoDataSeeder.manualResetAndSeed();
            System.out.println("[ADMIN CONTROLLER] Database reset request completed successfully.");
        } catch (Exception e) {
            System.err.println("[ADMIN CONTROLLER ERROR] Failed to reset database: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Database reset failed: " + e.getMessage(), e);
        }
    }

    // ==========================================
    // Private Security Helper Methods
    // ==========================================

    private void requireAdmin() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    private AuthenticatedPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
