package com.laundrylink.laundrylink.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.transaction.annotation.Transactional;
import com.laundrylink.laundrylink.api.*;
import com.laundrylink.laundrylink.persistence.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PartnerRepository partnerRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationRepository notificationRepository;
    private final LaundryPartnerService laundryPartnerService;

    public AdminService(UserRepository userRepository,
                        PartnerRepository partnerRepository,
                        OrderRepository orderRepository,
                        PaymentRepository paymentRepository,
                        InvoiceRepository invoiceRepository,
                        ReviewRepository reviewRepository,
                        NotificationRepository notificationRepository,
                        LaundryPartnerService laundryPartnerService) {
        this.userRepository = userRepository;
        this.partnerRepository = partnerRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.reviewRepository = reviewRepository;
        this.notificationRepository = notificationRepository;
        this.laundryPartnerService = laundryPartnerService;
    }

    // ==========================================
    // 1. User Management
    // ==========================================

    public List<AdminUserView> getAllUsers(UserRoleType role, Boolean active) {
        List<UserEntity> users = userRepository.findAll();
        if (role != null) {
            users = users.stream()
                    .filter(u -> u.getRole() == role)
                    .collect(Collectors.toList());
        }
        if (active != null) {
            users = users.stream()
                    .filter(u -> u.isActive() == active)
                    .collect(Collectors.toList());
        }
        return users.stream()
                .map(this::toAdminUserView)
                .collect(Collectors.toList());
    }

    public List<AdminUserView> searchUsers(String email, String displayName) {
        List<UserEntity> users = userRepository.findAll();
        if (email != null && !email.trim().isEmpty()) {
            String searchEmail = email.trim().toLowerCase();
            users = users.stream()
                    .filter(u -> u.getEmail().toLowerCase().contains(searchEmail))
                    .collect(Collectors.toList());
        }
        if (displayName != null && !displayName.trim().isEmpty()) {
            String searchName = displayName.trim().toLowerCase();
            users = users.stream()
                    .filter(u -> u.getDisplayName().toLowerCase().contains(searchName))
                    .collect(Collectors.toList());
        }
        return users.stream()
                .map(this::toAdminUserView)
                .collect(Collectors.toList());
    }

    public AdminUserView updateUserRole(String email, UserRoleType newRole) {
        UserEntity user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setRole(newRole);
        userRepository.save(user);
        return toAdminUserView(user);
    }

    public AdminUserView setUserActiveStatus(String email, boolean active) {
        UserEntity user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!active) {
            boolean hasActiveOrders = false;
            if (user.getRole() == UserRoleType.CUSTOMER) {
                hasActiveOrders = orderRepository.findByCustomerEmail(user.getEmail()).stream()
                        .anyMatch(o -> o.getStatus() != OrderStatus.DELIVERED && o.getStatus() != OrderStatus.CANCELLED);
            } else if (user.getRole() == UserRoleType.LAUNDRY_PARTNER) {
                hasActiveOrders = orderRepository.findByPartnerEmail(user.getEmail()).stream()
                        .anyMatch(o -> o.getStatus() != OrderStatus.DELIVERED && o.getStatus() != OrderStatus.CANCELLED);
            } else if (user.getRole() == UserRoleType.DELIVERY_PARTNER) {
                hasActiveOrders = orderRepository.findByDeliveryPartnerEmail(user.getEmail()).stream()
                        .anyMatch(o -> o.getStatus() != OrderStatus.DELIVERED && o.getStatus() != OrderStatus.CANCELLED);
            }

            if (hasActiveOrders) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot block user with ongoing orders or active tasks.");
            }
        }

        user.setActive(active);
        userRepository.save(user);
        return toAdminUserView(user);
    }

    @Transactional
    public void deleteUser(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        UserEntity user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        partnerRepository.findByEmail(normalizedEmail).ifPresent(partnerRepository::delete);
        userRepository.delete(user);
    }

    private AdminUserView toAdminUserView(UserEntity u) {
        return new AdminUserView(
                u.getEmail(),
                u.getDisplayName(),
                u.getPhoneNumber(),
                u.getRole(),
                u.isActive(),
                u.getCreatedAt(),
                u.getUpdatedAt()
        );
    }

    // ==========================================
    // 2. Partner Management & Verification
    // ==========================================

    public List<AdminPartnerView> getAllPartners() {
        return partnerRepository.findAll().stream()
                .map(this::toAdminPartnerView)
                .collect(Collectors.toList());
    }

    public AdminPartnerView getPartnerDetails(String email) {
        PartnerEntity partner = partnerRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partner not found"));
        return toAdminPartnerView(partner);
    }

    public AdminPartnerView updatePartnerStatus(String email, String status) {
        PartnerEntity partner = partnerRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partner not found"));
        partner.setOnboardingStatus(status.toUpperCase());
        partnerRepository.save(partner);
        return toAdminPartnerView(partner);
    }

    public PartnerDocumentView verifyPartnerDocument(String email, String documentId, String status, String rejectionReason) {
        return laundryPartnerService.verifyDocument(email, documentId, status, rejectionReason);
    }

    public AdminPartnerView updateCancellationPenalty(String email, double penalty) {
        PartnerEntity partner = partnerRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partner not found"));
        partner.setCancellationPenaltyPerOrder(penalty);
        partnerRepository.save(partner);
        return toAdminPartnerView(partner);
    }

    private AdminPartnerView toAdminPartnerView(PartnerEntity p) {
        List<PartnerDocumentView> docs = p.getDocuments().stream()
                .map(d -> new PartnerDocumentView(
                        d.getDocumentId(),
                        d.getDocumentType(),
                        d.getFileName(),
                        d.getVerificationStatus(),
                        d.getRejectionReason()
                )).collect(Collectors.toList());

        int cancellationsUsed = laundryPartnerService.getMonthlyCancellationsCount(p.getEmail());
        double cancellationPercentage = laundryPartnerService.getCancellationPercentage(p.getEmail(), cancellationsUsed);
        double penaltyPerOrder = p.getCancellationPenaltyPerOrder();
        List<CancellationEvent> history = laundryPartnerService.getCancellationHistory(p.getEmail(), penaltyPerOrder);
        double penaltyOwed = 0.0;
        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(kolkata);
        java.time.YearMonth currentYm = java.time.YearMonth.from(nowIst.toLocalDate());
        for (CancellationEvent event : history) {
            java.time.Instant instant = java.time.Instant.ofEpochSecond(event.cancelledAt());
            java.time.YearMonth ym = java.time.YearMonth.from(instant.atZone(kolkata).toLocalDate());
            if (ym.equals(currentYm)) {
                penaltyOwed += event.penaltyApplied();
            }
        }

        return new AdminPartnerView(
                p.getEmail(),
                p.getBusinessName(),
                p.getDescription(),
                p.getServiceHubAddress(),
                p.getOnboardingStatus(),
                p.getReputationScore(),
                p.getTotalReviews(),
                docs,
                cancellationsUsed,
                cancellationPercentage,
                penaltyPerOrder,
                penaltyOwed
        );
    }

    // ==========================================
    // 3. Order Monitoring
    // ==========================================

    public List<OrderView> getAllOrders(OrderStatus status, String customerEmail, String partnerEmail, String deliveryPartnerEmail) {
        List<OrderEntity> orders = orderRepository.findAll();
        if (status != null) {
            orders = orders.stream()
                    .filter(o -> o.getStatus() == status)
                    .collect(Collectors.toList());
        }
        if (customerEmail != null && !customerEmail.trim().isEmpty()) {
            String email = customerEmail.trim().toLowerCase();
            orders = orders.stream()
                    .filter(o -> o.getCustomerEmail().toLowerCase().contains(email))
                    .collect(Collectors.toList());
        }
        if (partnerEmail != null && !partnerEmail.trim().isEmpty()) {
            String email = partnerEmail.trim().toLowerCase();
            orders = orders.stream()
                    .filter(o -> o.getPartnerEmail().toLowerCase().contains(email))
                    .collect(Collectors.toList());
        }
        if (deliveryPartnerEmail != null && !deliveryPartnerEmail.trim().isEmpty()) {
            String email = deliveryPartnerEmail.trim().toLowerCase();
            orders = orders.stream()
                    .filter(o -> o.getDeliveryPartnerEmail() != null && o.getDeliveryPartnerEmail().toLowerCase().contains(email))
                    .collect(Collectors.toList());
        }
        return orders.stream()
                .map(this::toOrderView)
                .collect(Collectors.toList());
    }

    public OrderView getOrderDetails(String orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return toOrderView(order);
    }

    private OrderView toOrderView(OrderEntity order) {
        List<OrderItemDto> itemsDto = order.getItems().stream()
                .map(i -> new OrderItemDto(i.getItemCategory(), i.getServiceType(), i.getQuantity()))
                .collect(Collectors.toList());
        List<StatusTransition> historyDto = order.getHistory().stream()
                .map(h -> new StatusTransition(h.getStatus(), h.getTimestamp(), h.getNotes()))
                .collect(Collectors.toList());
        return new OrderView(
                order.getOrderId(),
                order.getCustomerEmail(),
                order.getPartnerEmail(),
                order.getDeliveryPartnerEmail(),
                order.getPaymentId(),
                order.getStatus(),
                itemsDto,
                order.getTotalCost(),
                order.getPickupAddress(),
                order.getPickupSlot(),
                order.getDeliveryAddress(),
                order.getDeliverySlot(),
                order.getStatusNotes(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                historyDto,
                order.isAcceptedByRider(),
                order.getCancellationFee(),
                order.getRefundAmount()
        );
    }

    // ==========================================
    // 4. Payment & Invoice Monitoring
    // ==========================================

    public List<PaymentView> getAllPayments(PaymentStatus status) {
        List<PaymentEntity> payments = paymentRepository.findAll();
        if (status != null) {
            payments = payments.stream()
                    .filter(p -> p.getStatus() == status)
                    .collect(Collectors.toList());
        }
        return payments.stream()
                .map(this::toPaymentView)
                .collect(Collectors.toList());
    }

    public List<InvoiceView> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(this::toInvoiceView)
                .collect(Collectors.toList());
    }

    private PaymentView toPaymentView(PaymentEntity p) {
        return new PaymentView(
                p.getPaymentId(),
                p.getOrderId(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getStatus(),
                p.getTransactionId(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }

    private InvoiceView toInvoiceView(InvoiceEntity invoice) {
        List<OrderItemDto> itemsDto = invoice.getItems().stream()
                .map(i -> new OrderItemDto(i.getItemCategory(), i.getServiceType(), i.getQuantity()))
                .collect(Collectors.toList());
        return new InvoiceView(
                String.valueOf(invoice.getId()),
                invoice.getOrderId(),
                invoice.getPaymentId(),
                invoice.getCustomerEmail(),
                invoice.getPartnerEmail(),
                invoice.getAmount(),
                itemsDto,
                invoice.getInvoiceStatus(),
                invoice.getGeneratedAt()
        );
    }

    // ==========================================
    // 5. Review Monitoring
    // ==========================================

    public List<ReviewView> getAllReviews() {
        return reviewRepository.findAll().stream()
                .map(this::toReviewView)
                .collect(Collectors.toList());
    }

    public List<ReviewView> getReviewsForPartner(String email) {
        return reviewRepository.findByPartnerEmail(email.trim().toLowerCase()).stream()
                .map(this::toReviewView)
                .collect(Collectors.toList());
    }

    private ReviewView toReviewView(ReviewEntity r) {
        return new ReviewView(
                String.valueOf(r.getId()),
                r.getOrderId(),
                r.getCustomerEmail(),
                r.getPartnerEmail(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }

    // ==========================================
    // 6. Notification Monitoring
    // ==========================================

    public List<NotificationView> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(this::toNotificationView)
                .collect(Collectors.toList());
    }

    public AdminNotificationSummary getNotificationSummary() {
        List<NotificationEntity> list = notificationRepository.findAll();
        long total = list.size();
        long unread = list.stream().filter(n -> !n.isRead()).count();
        long read = total - unread;
        long emailsSent = list.stream().filter(NotificationEntity::isEmailSent).count();

        Map<String, Long> byType = list.stream()
                .collect(Collectors.groupingBy(n -> n.getType().name(), Collectors.counting()));

        return new AdminNotificationSummary(total, unread, read, emailsSent, byType);
    }

    private NotificationView toNotificationView(NotificationEntity n) {
        return new NotificationView(
                String.valueOf(n.getId()),
                n.getRecipientEmail(),
                n.getType(),
                n.getMessage(),
                n.getCreatedAt(),
                n.isRead(),
                n.isEmailSent()
        );
    }

    // ==========================================
    // 7. Enhanced Reports & Analytics
    // ==========================================

    public AdminAnalyticsSummary getAnalyticsSummary() {
        List<PaymentEntity> payments = paymentRepository.findAll();
        List<OrderEntity> orders = orderRepository.findAll();
        List<UserEntity> users = userRepository.findAll();
        List<PartnerEntity> partners = partnerRepository.findAll();

        // Successful payments
        double totalRevenue = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(PaymentEntity::getAmount)
                .sum();
        long successfulCount = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .count();

        // Refunded payments
        double refundedAmount = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.REFUNDED)
                .mapToDouble(PaymentEntity::getAmount)
                .sum();
        long refundedCount = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.REFUNDED)
                .count();

        // Top rated partner (highest reputation score)
        String topRated = partners.stream()
                .max(Comparator.comparingDouble(PartnerEntity::getReputationScore))
                .map(PartnerEntity::getBusinessName)
                .orElse("None");

        // Average reputation score of all partners
        double avgReputation = partners.isEmpty() ? 0.0 :
                partners.stream().mapToDouble(PartnerEntity::getReputationScore).average().orElse(0.0);

        // Average order processing time (in hours)
        double totalHours = 0.0;
        int completedCount = 0;
        for (OrderEntity o : orders) {
            if (o.getStatus() == OrderStatus.DELIVERED) {
                long placedTime = o.getCreatedAt();
                long deliveredTime = o.getUpdatedAt();

                for (StatusTransitionEntity t : o.getHistory()) {
                    if (t.getStatus() == OrderStatus.PLACED) {
                        placedTime = t.getTimestamp();
                    } else if (t.getStatus() == OrderStatus.DELIVERED) {
                        deliveredTime = t.getTimestamp();
                    }
                }
                double diffHours = (deliveredTime - placedTime) / 3600.0;
                totalHours += diffHours;
                completedCount++;
            }
        }
        double avgProcessingTime = completedCount > 0 ? (totalHours / completedCount) : 0.0;

        // General counts
        long totalOrders = orders.size();
        Map<String, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getStatus().name(), Collectors.counting()));

        long totalCustomers = users.stream().filter(u -> u.getRole() == UserRoleType.CUSTOMER).count();
        long totalPartners = users.stream().filter(u -> u.getRole() == UserRoleType.LAUNDRY_PARTNER).count();
        long totalDeliveryAgents = users.stream().filter(u -> u.getRole() == UserRoleType.DELIVERY_PARTNER).count();

        return new AdminAnalyticsSummary(
                totalRevenue,
                successfulCount,
                refundedAmount,
                refundedCount,
                topRated,
                avgReputation,
                avgProcessingTime,
                totalOrders,
                ordersByStatus,
                totalCustomers,
                totalPartners,
                totalDeliveryAgents
        );
    }

    // ==========================================
    // 8. New Dashboard Summary API
    // ==========================================

    public AdminDashboardView getDashboardSummary() {
        long totalUsers = userRepository.count();
        long totalCustomers = userRepository.findAll().stream().filter(u -> u.getRole() == UserRoleType.CUSTOMER).count();
        long totalPartners = userRepository.findAll().stream().filter(u -> u.getRole() == UserRoleType.LAUNDRY_PARTNER).count();
        long totalDeliveryPartners = userRepository.findAll().stream().filter(u -> u.getRole() == UserRoleType.DELIVERY_PARTNER).count();
        long totalOrders = orderRepository.count();

        double totalRevenue = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(PaymentEntity::getAmount)
                .sum();

        long totalPayments = paymentRepository.count();
        long totalReviews = reviewRepository.count();
        long totalNotifications = notificationRepository.count();

        long totalActivePartners = partnerRepository.findAll().stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getOnboardingStatus()))
                .count();

        long totalPendingPartnerVerifications = partnerRepository.findAll().stream()
                .filter(p -> "PENDING".equalsIgnoreCase(p.getOnboardingStatus()) || "PENDING_VERIFICATION".equalsIgnoreCase(p.getOnboardingStatus()))
                .count();

        return new AdminDashboardView(
                totalUsers,
                totalCustomers,
                totalPartners,
                totalDeliveryPartners,
                totalOrders,
                totalRevenue,
                totalPayments,
                totalReviews,
                totalNotifications,
                totalActivePartners,
                totalPendingPartnerVerifications
        );
    }

    // ==========================================
    // 9. Revenue Report Endpoint
    // ==========================================

    public AdminRevenueReport getRevenueReport() {
        List<PaymentEntity> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .collect(Collectors.toList());

        long now = System.currentTimeMillis() / 1000L;
        long oneDay = 86400L;
        long oneWeek = 604800L;
        long oneMonth = 2592000L;

        double daily = payments.stream()
                .filter(p -> now - p.getCreatedAt() <= oneDay)
                .mapToDouble(PaymentEntity::getAmount)
                .sum();

        double weekly = payments.stream()
                .filter(p -> now - p.getCreatedAt() <= oneWeek)
                .mapToDouble(PaymentEntity::getAmount)
                .sum();

        double monthly = payments.stream()
                .filter(p -> now - p.getCreatedAt() <= oneMonth)
                .mapToDouble(PaymentEntity::getAmount)
                .sum();

        double total = payments.stream()
                .mapToDouble(PaymentEntity::getAmount)
                .sum();

        return new AdminRevenueReport(daily, weekly, monthly, total);
    }

    // ==========================================
    // 10. Partner Performance Analytics
    // ==========================================

    public List<PartnerPerformanceAnalytics> getPartnerPerformanceAnalytics() {
        List<PartnerEntity> partners = partnerRepository.findAll();
        List<OrderEntity> orders = orderRepository.findAll();
        List<PaymentEntity> payments = paymentRepository.findAll();

        return partners.stream().map(p -> {
            String email = p.getEmail().toLowerCase();

            long totalOrders = orders.stream()
                    .filter(o -> o.getPartnerEmail().equalsIgnoreCase(email))
                    .count();

            long completedOrders = orders.stream()
                    .filter(o -> o.getPartnerEmail().equalsIgnoreCase(email) && o.getStatus() == OrderStatus.DELIVERED)
                    .count();

            double revenue = payments.stream()
                    .filter(pay -> pay.getStatus() == PaymentStatus.SUCCESS)
                    .filter(pay -> orders.stream()
                            .anyMatch(o -> o.getOrderId().equals(pay.getOrderId()) && o.getPartnerEmail().equalsIgnoreCase(email)))
                    .mapToDouble(PaymentEntity::getAmount)
                    .sum();

            return new PartnerPerformanceAnalytics(
                    p.getEmail(),
                    p.getBusinessName(),
                    totalOrders,
                    completedOrders,
                    p.getReputationScore(),
                    revenue,
                    p.getOnboardingStatus()
            );
        }).collect(Collectors.toList());
    }
}
