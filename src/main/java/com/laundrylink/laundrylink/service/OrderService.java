package com.laundrylink.laundrylink.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.OrderItemDto;
import com.laundrylink.laundrylink.api.OrderStatus;
import com.laundrylink.laundrylink.api.OrderView;
import com.laundrylink.laundrylink.api.CancellationEstimate;
import com.laundrylink.laundrylink.api.PlaceOrderRequest;
import com.laundrylink.laundrylink.api.PricingView;
import com.laundrylink.laundrylink.api.RateCardItem;
import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.api.OrderStatusUpdateRequest;
import com.laundrylink.laundrylink.api.DeliveryDashboardView;
import com.laundrylink.laundrylink.api.DeliveryTrackingView;
import com.laundrylink.laundrylink.api.NotificationType;
import com.laundrylink.laundrylink.api.StatusTransition;
import com.laundrylink.laundrylink.persistence.OrderEntity;
import com.laundrylink.laundrylink.persistence.OrderItemEntity;
import com.laundrylink.laundrylink.persistence.OrderRepository;
import com.laundrylink.laundrylink.persistence.StatusTransitionEntity;
import com.laundrylink.laundrylink.persistence.UserRepository;
import com.laundrylink.laundrylink.persistence.UserEntity;
import com.laundrylink.laundrylink.persistence.PaymentRepository;
import com.laundrylink.laundrylink.persistence.PaymentEntity;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final LaundryPartnerService laundryPartnerService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public OrderService(OrderRepository orderRepository, LaundryPartnerService laundryPartnerService, @Lazy PaymentService paymentService, @Lazy NotificationService notificationService, UserRepository userRepository, PaymentRepository paymentRepository) {
        this.orderRepository = orderRepository;
        this.laundryPartnerService = laundryPartnerService;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    public OrderView placeOrder(String customerEmail, PlaceOrderRequest request) {
        // Calculate costs dynamically based on partner's rate card
        double totalCost = 0.0;
        PricingView pricing = null;
        try {
            pricing = laundryPartnerService.getPricing(request.partnerEmail());
        } catch (Exception e) {
            // Ignored, fallback pricing will be used
        }

        for (OrderItemDto item : request.items()) {
            double pricePerItem = 50.0; // default fallback
            if (pricing != null && pricing.rateCard() != null) {
                for (RateCardItem rateItem : pricing.rateCard()) {
                    if (rateItem.itemCategory().equalsIgnoreCase(item.itemCategory())
                            && rateItem.serviceType().equalsIgnoreCase(item.serviceType())) {
                        pricePerItem = rateItem.price();
                        break;
                    }
                }
            }
            totalCost += pricePerItem * item.quantity();
        }

        String orderId = UUID.randomUUID().toString();
        String displayOrderId = generateNextDisplayOrderId();
        OrderEntity order = new OrderEntity(
                orderId,
                customerEmail,
                request.partnerEmail(),
                totalCost,
                request.pickupAddress(),
                request.pickupSlot(),
                request.deliveryAddress(),
                request.deliverySlot()
        );
        order.setDisplayOrderId(displayOrderId);

        List<OrderItemEntity> itemEntities = request.items().stream()
                .map(i -> new OrderItemEntity(i.itemCategory(), i.serviceType(), i.quantity()))
                .collect(Collectors.toList());
        order.setItems(itemEntities);

        long now = System.currentTimeMillis() / 1000L;
        StatusTransitionEntity placementTransition = new StatusTransitionEntity(OrderStatus.PLACED, now, "Order placed successfully.");
        order.getHistory().add(placementTransition);

        order = orderRepository.saveAndFlush(order);
        
        // Auto assign pickup rider
        autoAssignRider(order);
        
        notificationService.sendNotification(customerEmail, NotificationType.ORDER_STATUS, 
                "Your order " + order.getDisplayOrderId() + " has been placed successfully.");
        notificationService.sendNotification(request.partnerEmail(), NotificationType.ORDER_STATUS, 
                "New order received! Order ID: " + order.getDisplayOrderId());
                
        return toView(order);
    }

    public OrderView getOrder(String orderId, String email, UserRoleType role) {
        OrderEntity order = findOrderByIdentifier(orderId);

        // Verify ownership/authorization
        if (role == UserRoleType.CUSTOMER && !order.getCustomerEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view this order");
        }
        if (role == UserRoleType.LAUNDRY_PARTNER && !order.getPartnerEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view this order");
        }
        if (role == UserRoleType.DELIVERY_PARTNER) {
            boolean isAssigned = (order.getPickupRiderEmail() != null && order.getPickupRiderEmail().equalsIgnoreCase(email))
                    || (order.getDeliveryPartnerEmail() != null && order.getDeliveryPartnerEmail().equalsIgnoreCase(email));
            if (!isAssigned) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view this order");
            }
        }

        return toView(order);
    }

    public List<OrderView> getOrderHistory(String email, UserRoleType role) {
        List<OrderEntity> list = switch (role) {
            case CUSTOMER -> orderRepository.findByCustomerEmail(email);
            case LAUNDRY_PARTNER -> orderRepository.findByPartnerEmail(email);
            case DELIVERY_PARTNER -> orderRepository.findByPickupRiderEmailOrDeliveryPartnerEmail(email, email);
            case ADMIN -> orderRepository.findAll();
        };

        return list.stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    public OrderView updateOrderStatus(String orderId, String email, UserRoleType role, OrderStatusUpdateRequest request) {
        OrderEntity order = findOrderByIdentifier(orderId);
        String actualOrderId = order.getOrderId();

        OrderStatus newStatus = request.status();
        String notes = request.statusNotes();

        if (role == UserRoleType.LAUNDRY_PARTNER && newStatus == OrderStatus.CANCELLED) {
            if (order.getStatus() != OrderStatus.PLACED) {
                notes = "Cancelled by laundry partner: " + (notes != null ? notes : "Accepted order cancelled by laundry partner");
            }
        }

        switch (role) {
            case CUSTOMER:
                if (!order.getCustomerEmail().equalsIgnoreCase(email)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You do not own this order");
                }
                if (newStatus != OrderStatus.CANCELLED) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customers can only cancel orders");
                }
                if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order cannot be cancelled in the current state");
                }
                break;

            case LAUNDRY_PARTNER:
                if (!order.getPartnerEmail().equalsIgnoreCase(email)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: This order is not assigned to you");
                }
                if (newStatus == OrderStatus.PROCESSING) {
                    if (order.getStatus() != OrderStatus.PICKUP_COMPLETED) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot start processing: Clothes have not been received by vendor yet.");
                    }
                } else if (newStatus == OrderStatus.READY_FOR_DELIVERY) {
                    if (order.getStatus() != OrderStatus.PROCESSING) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot mark ready: Order must be in PROCESSING status.");
                    }
                } else if (newStatus != OrderStatus.CANCELLED) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition for Laundry Partner");
                }
                break;

            case DELIVERY_PARTNER:
                if (newStatus == OrderStatus.PICKUP_COMPLETED) {
                    if (order.getPickupRiderEmail() == null || !order.getPickupRiderEmail().equalsIgnoreCase(email)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not the assigned pickup rider");
                    }
                    if (order.getStatus() != OrderStatus.PICKUP_ASSIGNED) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot complete pickup: Order is not in PICKUP_ASSIGNED status.");
                    }
                } else if (newStatus == OrderStatus.DELIVERED) {
                    if (order.getDeliveryPartnerEmail() == null || !order.getDeliveryPartnerEmail().equalsIgnoreCase(email)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not the assigned delivery rider");
                    }
                    if (order.getStatus() != OrderStatus.DELIVERY_ASSIGNED) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot complete delivery: Order is not in DELIVERY_ASSIGNED status.");
                    }
                } else {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition for Delivery Partner");
                }
                break;

            case ADMIN:
                break;

            default:
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized role");
        }

        if (role == UserRoleType.CUSTOMER && newStatus == OrderStatus.CANCELLED) {
            CancellationEstimate estimate = getCancellationEstimate(actualOrderId, email, role);
            order.setCancellationFee(estimate.cancellationFee());
            order.setRefundAmount(estimate.refundAmount());
        }

        long now = System.currentTimeMillis() / 1000L;
        order.setStatus(newStatus);
        order.setStatusNotes(notes);
        order.getHistory().add(new StatusTransitionEntity(newStatus, now, notes));
        
        orderRepository.saveAndFlush(order);

        if (newStatus == OrderStatus.READY_FOR_DELIVERY) {
            autoAssignRider(order);
        }

        if (newStatus == OrderStatus.DELIVERED) {
            paymentService.completeCodPayment(actualOrderId);
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Your order " + order.getDisplayOrderId() + " has been successfully delivered!");
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.REVIEW_REMINDER, 
                    "Please take a moment to rate your experience for order " + order.getDisplayOrderId());
            notificationService.sendNotification(order.getPartnerEmail(), NotificationType.ORDER_STATUS, 
                    "Order " + order.getDisplayOrderId() + " has been delivered.");
        } else if (newStatus == OrderStatus.PICKUP_COMPLETED) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.DELIVERY, 
                    "Your clothes have been picked up and delivered to the vendor for order " + order.getDisplayOrderId());
            notificationService.sendNotification(order.getPartnerEmail(), NotificationType.DELIVERY, 
                    "Clothes for order " + order.getDisplayOrderId() + " are received. You can start processing.");
        } else if (newStatus == OrderStatus.PROCESSING) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Your clothes are being processed for order " + order.getDisplayOrderId());
        } else if (newStatus == OrderStatus.READY_FOR_DELIVERY) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Your clothes are ready for delivery for order " + order.getDisplayOrderId());
        } else if (newStatus == OrderStatus.CANCELLED) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Order " + order.getDisplayOrderId() + " has been cancelled.");
            notificationService.sendNotification(order.getPartnerEmail(), NotificationType.ORDER_STATUS, 
                    "Order " + order.getDisplayOrderId() + " has been cancelled.");
        }
        return toView(order);
    }

    public OrderView assignDeliveryPartner(String orderId, String email, UserRoleType role, String deliveryPartnerEmail) {
        OrderEntity order = findOrderByIdentifier(orderId);

        String targetDeliveryPartnerEmail = deliveryPartnerEmail;
        if (role == UserRoleType.DELIVERY_PARTNER) {
            if (targetDeliveryPartnerEmail == null || targetDeliveryPartnerEmail.trim().isEmpty()) {
                targetDeliveryPartnerEmail = email;
            } else if (!email.equalsIgnoreCase(targetDeliveryPartnerEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Delivery partners can only assign themselves");
            }
        } else if (role != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Admin or Delivery Partners can assign delivery tasks");
        } else {
            if (targetDeliveryPartnerEmail == null || targetDeliveryPartnerEmail.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery partner email is required");
            }
        }

        order.setAcceptedByRider(true);
 
        long now = System.currentTimeMillis() / 1000L;
        // Auto state transition on assignment
        if (order.getStatus() == OrderStatus.PLACED) {
            order.setPickupRiderEmail(targetDeliveryPartnerEmail);
            order.setStatus(OrderStatus.PICKUP_ASSIGNED);
            order.setStatusNotes("Delivery partner assigned for pickup: " + targetDeliveryPartnerEmail);
            order.getHistory().add(new StatusTransitionEntity(OrderStatus.PICKUP_ASSIGNED, now, "Delivery partner assigned for pickup: " + targetDeliveryPartnerEmail));
        } else if (order.getStatus() == OrderStatus.READY_FOR_DELIVERY) {
            order.setDeliveryPartnerEmail(targetDeliveryPartnerEmail);
            order.setStatus(OrderStatus.DELIVERY_ASSIGNED);
            order.setStatusNotes("Delivery partner assigned for delivery: " + targetDeliveryPartnerEmail);
            order.getHistory().add(new StatusTransitionEntity(OrderStatus.DELIVERY_ASSIGNED, now, "Delivery partner assigned for delivery: " + targetDeliveryPartnerEmail));
        }

        orderRepository.saveAndFlush(order);

        notificationService.sendNotification(order.getCustomerEmail(), NotificationType.DELIVERY, 
                "Delivery partner " + targetDeliveryPartnerEmail + " has been assigned to order " + order.getDisplayOrderId());
        notificationService.sendNotification(targetDeliveryPartnerEmail, NotificationType.DELIVERY, 
                "You have been assigned to order " + order.getDisplayOrderId());
        notificationService.sendNotification(order.getPartnerEmail(), NotificationType.DELIVERY, 
                "Delivery partner " + targetDeliveryPartnerEmail + " assigned for order " + order.getDisplayOrderId());

        return toView(order);
    }

    public DeliveryDashboardView getDeliveryDashboard(String deliveryPartnerEmail) {
        List<OrderEntity> riderOrders = orderRepository.findByPickupRiderEmailOrDeliveryPartnerEmail(deliveryPartnerEmail, deliveryPartnerEmail);

        List<OrderView> assignedTasks = List.of(); // Empty placeholder since we removed this tab

        List<OrderView> upcomingPickups = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PICKUP_ASSIGNED
                        && o.getPickupRiderEmail() != null
                        && o.getPickupRiderEmail().equalsIgnoreCase(deliveryPartnerEmail))
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> activeDeliveries = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERY_ASSIGNED
                        && o.getDeliveryPartnerEmail() != null
                        && o.getDeliveryPartnerEmail().equalsIgnoreCase(deliveryPartnerEmail))
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> completedDeliveries = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED
                        && o.getDeliveryPartnerEmail() != null
                        && o.getDeliveryPartnerEmail().equalsIgnoreCase(deliveryPartnerEmail))
                .map(this::toView)
                .collect(Collectors.toList());

        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(kolkata);
        long startOfToday = nowIst.toLocalDate().atStartOfDay(kolkata).toEpochSecond();

        long completedTodayCount = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED
                        && o.getDeliveryPartnerEmail() != null
                        && o.getDeliveryPartnerEmail().equalsIgnoreCase(deliveryPartnerEmail)
                        && o.getUpdatedAt() >= startOfToday)
                .count();
        double todayEarnings = completedTodayCount * 60.0;

        long nowSeconds = System.currentTimeMillis() / 1000L;
        long startOfWeek = nowSeconds - 7 * 86400;
        long completedThisWeekCount = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED
                        && o.getDeliveryPartnerEmail() != null
                        && o.getDeliveryPartnerEmail().equalsIgnoreCase(deliveryPartnerEmail)
                        && o.getUpdatedAt() >= startOfWeek)
                .count();
        double weeklyEarnings = completedThisWeekCount * 60.0;

        long startOfMonth = nowSeconds - 30 * 86400;
        long completedThisMonthCount = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED
                        && o.getDeliveryPartnerEmail() != null
                        && o.getDeliveryPartnerEmail().equalsIgnoreCase(deliveryPartnerEmail)
                        && o.getUpdatedAt() >= startOfMonth)
                .count();
        double monthlyEarnings = completedThisMonthCount * 60.0;

        long totalCompleted = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED
                        && o.getDeliveryPartnerEmail() != null
                        && o.getDeliveryPartnerEmail().equalsIgnoreCase(deliveryPartnerEmail))
                .count();
        double totalEarnings = totalCompleted * 60.0;

        int dailyCancellations = 0; // Cancellations limit removed under auto assignment

        boolean online = userRepository.findByEmail(deliveryPartnerEmail)
                .map(UserEntity::isOnline)
                .orElse(false);

        return new DeliveryDashboardView(
                assignedTasks,
                activeDeliveries,
                upcomingPickups,
                completedDeliveries,
                todayEarnings,
                weeklyEarnings,
                monthlyEarnings,
                totalEarnings,
                dailyCancellations,
                online
        );
    }

    public void autoAssignRider(OrderEntity order) {
        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.READY_FOR_DELIVERY) {
            return;
        }

        // Find active and online delivery partners
        java.util.List<UserEntity> eligibleRiders = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRoleType.DELIVERY_PARTNER && u.isActive() && u.isOnline())
                .collect(Collectors.toList());

        if (eligibleRiders.isEmpty()) {
            return;
        }

        // Rule 1 (Different Riders): For delivery phase, try to assign a rider different from the pickup rider
        if (order.getStatus() == OrderStatus.READY_FOR_DELIVERY && order.getPickupRiderEmail() != null) {
            String pickupRiderEmail = order.getPickupRiderEmail();
            java.util.List<UserEntity> otherRiders = eligibleRiders.stream()
                    .filter(u -> !u.getEmail().equalsIgnoreCase(pickupRiderEmail))
                    .collect(Collectors.toList());
            if (!otherRiders.isEmpty()) {
                eligibleRiders = otherRiders;
            }
        }

        // Pick the rider with the minimum count of active assignments
        UserEntity bestRider = null;
        long minActiveCount = Long.MAX_VALUE;

        for (UserEntity rider : eligibleRiders) {
            long activeCount = orderRepository.findAll().stream()
                    .filter(o -> (o.getPickupRiderEmail() != null && o.getPickupRiderEmail().equalsIgnoreCase(rider.getEmail()) && o.getStatus() == OrderStatus.PICKUP_ASSIGNED)
                            || (o.getDeliveryPartnerEmail() != null && o.getDeliveryPartnerEmail().equalsIgnoreCase(rider.getEmail()) && o.getStatus() == OrderStatus.DELIVERY_ASSIGNED))
                    .count();

            if (activeCount < minActiveCount) {
                minActiveCount = activeCount;
                bestRider = rider;
            }
        }

        if (bestRider != null) {
            long now = System.currentTimeMillis() / 1000L;
            if (order.getStatus() == OrderStatus.PLACED) {
                order.setPickupRiderEmail(bestRider.getEmail());
                order.setStatus(OrderStatus.PICKUP_ASSIGNED);
                order.setStatusNotes("Pickup rider assigned: " + bestRider.getEmail());
                order.getHistory().add(new StatusTransitionEntity(OrderStatus.PICKUP_ASSIGNED, now, "Pickup rider assigned: " + bestRider.getEmail()));
            } else if (order.getStatus() == OrderStatus.READY_FOR_DELIVERY) {
                order.setDeliveryPartnerEmail(bestRider.getEmail());
                order.setStatus(OrderStatus.DELIVERY_ASSIGNED);
                order.setStatusNotes("Delivery rider assigned: " + bestRider.getEmail());
                order.getHistory().add(new StatusTransitionEntity(OrderStatus.DELIVERY_ASSIGNED, now, "Delivery rider assigned: " + bestRider.getEmail()));
            }

            orderRepository.saveAndFlush(order);

            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.DELIVERY,
                    "Rider " + bestRider.getEmail() + " has been assigned to order " + order.getDisplayOrderId());
            notificationService.sendNotification(bestRider.getEmail(), NotificationType.DELIVERY,
                    "You have been assigned to order " + order.getDisplayOrderId());
            notificationService.sendNotification(order.getPartnerEmail(), NotificationType.DELIVERY,
                    "Rider " + bestRider.getEmail() + " assigned for order " + order.getDisplayOrderId());
        }
    }

    public void triggerPendingAssignments() {
        // Find all online riders
        java.util.List<UserEntity> onlineRiders = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRoleType.DELIVERY_PARTNER && u.isActive() && u.isOnline())
                .collect(Collectors.toList());
        if (onlineRiders.isEmpty()) {
            return;
        }

        // Find pending/stuck orders:
        // 1. Orders in PLACED or READY_FOR_DELIVERY with no rider assigned.
        // 2. Orders in PICKUP_ASSIGNED or DELIVERY_ASSIGNED where the rider is assigned but offline.
        List<OrderEntity> pendingOrders = orderRepository.findAll().stream()
                .filter(order -> {
                    if (order.getStatus() == OrderStatus.PLACED) {
                        return order.getPickupRiderEmail() == null;
                    }
                    if (order.getStatus() == OrderStatus.READY_FOR_DELIVERY) {
                        return order.getDeliveryPartnerEmail() == null;
                    }
                    if (order.getStatus() == OrderStatus.PICKUP_ASSIGNED) {
                        if (order.getPickupRiderEmail() == null) {
                            return true;
                        }
                        // Check if assigned pickup rider went offline
                        return userRepository.findByEmail(order.getPickupRiderEmail())
                                .map(u -> !u.isOnline())
                                .orElse(true);
                    }
                    if (order.getStatus() == OrderStatus.DELIVERY_ASSIGNED) {
                        if (order.getDeliveryPartnerEmail() == null) {
                            return true;
                        }
                        // Check if assigned delivery partner went offline
                        return userRepository.findByEmail(order.getDeliveryPartnerEmail())
                                .map(u -> !u.isOnline())
                                .orElse(true);
                    }
                    return false;
                })
                .collect(Collectors.toList());

        for (OrderEntity order : pendingOrders) {
            // Revert status to unassigned state so autoAssignRider can process it
            if (order.getStatus() == OrderStatus.PICKUP_ASSIGNED) {
                order.setStatus(OrderStatus.PLACED);
                order.setPickupRiderEmail(null);
            } else if (order.getStatus() == OrderStatus.DELIVERY_ASSIGNED) {
                order.setStatus(OrderStatus.READY_FOR_DELIVERY);
                order.setDeliveryPartnerEmail(null);
            }
            orderRepository.saveAndFlush(order);

            autoAssignRider(order);
        }
    }

    public int getDailyCancellationCount(String email) {
        return 0;
    }

    public void updateRiderOnlineStatus(String email, boolean online) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setOnline(online);
        userRepository.saveAndFlush(user);
        if (online) {
            triggerPendingAssignments();
        }
    }

    public DeliveryTrackingView getDeliveryTracking(String orderId, String email, UserRoleType role) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        boolean authorized = false;
        if (role == UserRoleType.ADMIN) {
            authorized = true;
        } else if (role == UserRoleType.CUSTOMER && order.getCustomerEmail().equalsIgnoreCase(email)) {
            authorized = true;
        } else if (role == UserRoleType.LAUNDRY_PARTNER && order.getPartnerEmail().equalsIgnoreCase(email)) {
            authorized = true;
        } else if (role == UserRoleType.DELIVERY_PARTNER && 
                ((order.getDeliveryPartnerEmail() != null && order.getDeliveryPartnerEmail().equalsIgnoreCase(email))
                || (order.getPickupRiderEmail() != null && order.getPickupRiderEmail().equalsIgnoreCase(email)))) {
            authorized = true;
        }

        if (!authorized) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to track this order");
        }

        List<StatusTransition> historyDto = order.getHistory().stream()
                .map(h -> new StatusTransition(h.getStatus(), h.getTimestamp(), h.getNotes()))
                .collect(Collectors.toList());

        return new DeliveryTrackingView(
                order.getOrderId(),
                order.getStatus(),
                order.getCustomerEmail(),
                order.getPickupAddress(),
                order.getPickupSlot(),
                order.getDeliveryAddress(),
                order.getDeliverySlot(),
                order.getStatusNotes(),
                order.getUpdatedAt(),
                historyDto
        );
    }

    public void linkPaymentToOrder(String orderId, String paymentId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        order.setPaymentId(paymentId);
        orderRepository.save(order);
    }

    private OrderView toView(OrderEntity order) {
        List<OrderItemDto> itemsDto = order.getItems().stream()
                .map(i -> new OrderItemDto(i.getItemCategory(), i.getServiceType(), i.getQuantity()))
                .collect(Collectors.toList());
        List<StatusTransition> historyDto = order.getHistory().stream()
                .map(h -> new StatusTransition(h.getStatus(), h.getTimestamp(), h.getNotes()))
                .collect(Collectors.toList());

        String paymentMethod = null;
        String paymentStatus = null;
        if (order.getPaymentId() != null) {
            java.util.Optional<PaymentEntity> paymentOpt = paymentRepository.findById(order.getPaymentId());
            if (paymentOpt.isPresent()) {
                PaymentEntity p = paymentOpt.get();
                paymentMethod = p.getPaymentMethod().name();
                paymentStatus = p.getStatus().name();
            }
        }

        return new OrderView(
                order.getDisplayOrderId() != null ? order.getDisplayOrderId() : order.getOrderId(),
                order.getCustomerEmail(),
                order.getPartnerEmail(),
                (order.getStatus() == OrderStatus.PICKUP_ASSIGNED || order.getStatus() == OrderStatus.PICKUP_COMPLETED)
                        ? order.getPickupRiderEmail()
                        : order.getDeliveryPartnerEmail(),
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
                order.getRefundAmount(),
                paymentMethod,
                paymentStatus
        );
    }

    public String getDisplayOrderIdByOrderId(String orderId) {
        return orderRepository.findById(orderId)
                .map(OrderEntity::getDisplayOrderId)
                .orElse(orderId);
    }

    public OrderEntity findOrderByIdentifier(String identifier) {
        return orderRepository.findById(identifier)
                .or(() -> orderRepository.findByDisplayOrderId(identifier))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private synchronized String generateNextDisplayOrderId() {
        List<OrderEntity> allOrders = orderRepository.findAll();
        int maxNum = 10000;
        for (OrderEntity o : allOrders) {
            String displayId = o.getDisplayOrderId();
            if (displayId != null && displayId.startsWith("VL")) {
                try {
                    int num = Integer.parseInt(displayId.substring(2));
                    if (num > maxNum) {
                        maxNum = num;
                    }
                } catch (NumberFormatException e) {
                    // Ignore non-numeric formats
                }
            }
        }
        return "VL" + (maxNum + 1);
    }

    public int getCustomerMonthlyCancellationsCount(String email) {
        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(kolkata);
        java.time.ZonedDateTime startOfMonthIst = nowIst.toLocalDate().withDayOfMonth(1).atStartOfDay(kolkata);
        long startOfMonthEpoch = startOfMonthIst.toEpochSecond();

        int count = 0;
        List<OrderEntity> orders = orderRepository.findAll();
        for (OrderEntity o : orders) {
            if (o.getCustomerEmail().equalsIgnoreCase(email) && o.getHistory() != null) {
                for (StatusTransitionEntity transition : o.getHistory()) {
                    if (transition.getStatus() == OrderStatus.CANCELLED 
                            && transition.getTimestamp() >= startOfMonthEpoch
                            && transition.getNotes() != null
                            && transition.getNotes().toLowerCase().contains("cancelled by customer")) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    public CancellationEstimate getCancellationEstimate(String orderId, String email, UserRoleType role) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (role == UserRoleType.CUSTOMER && !order.getCustomerEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You do not own this order");
        }

        int cancellationsCount = getCustomerMonthlyCancellationsCount(order.getCustomerEmail());
        
        double chargePercent = 0.0;
        String message = "Order has not been accepted by the partner yet.";

        if (cancellationsCount >= 3) {
            switch (order.getStatus()) {
                case PLACED:
                    chargePercent = 0.0;
                    message = "Order has not been assigned to a rider yet.";
                    break;
                case PICKUP_ASSIGNED:
                    chargePercent = 25.0;
                    message = "A pickup rider has been assigned.";
                    break;
                case PICKUP_COMPLETED:
                    chargePercent = 50.0;
                    message = "Pickup completed and clothes delivered to vendor.";
                    break;
                case PROCESSING:
                    chargePercent = 75.0;
                    message = "Vendor has started processing your laundry.";
                    break;
                case READY_FOR_DELIVERY:
                case DELIVERY_ASSIGNED:
                    chargePercent = 100.0;
                    message = "Laundry operations have completed; clothes are out for delivery.";
                    break;
                default:
                    chargePercent = 100.0;
                    message = "Order cannot be cancelled.";
                    break;
            }
        } else {
            message = "You have remaining free monthly cancellations. This cancellation is free of charge.";
        }

        double totalCost = order.getTotalCost();
        double fee = totalCost * (chargePercent / 100.0);
        double refund = Math.max(0.0, totalCost - fee);

        return new CancellationEstimate(chargePercent, fee, refund, message);
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 5000)
    public void runDemoSimulation() {
        if (isRunningTest()) {
            return;
        }

        // Trigger unassigned/stuck order assignments
        triggerPendingAssignments();
    }

    private boolean isRunningTest() {
        String command = System.getProperty("sun.java.command", "").toLowerCase();
        if (command.contains("surefire") || command.contains("junit") || command.contains("test")) {
            return true;
        }
        for (StackTraceElement element : Thread.currentThread().getStackTrace()) {
            String className = element.getClassName().toLowerCase();
            if (className.contains("junit") || className.contains("surefire") || className.contains("test")) {
                return true;
            }
        }
        return false;
    }

    private long getLastStatusTransitionTime(OrderEntity order) {
        if (order.getHistory() == null || order.getHistory().isEmpty()) {
            return order.getUpdatedAt() != 0 ? order.getUpdatedAt() : (System.currentTimeMillis() / 1000L);
        }
        long lastTime = 0;
        for (StatusTransitionEntity t : order.getHistory()) {
            if (t.getTimestamp() > lastTime) {
                lastTime = t.getTimestamp();
            }
        }
        return lastTime;
    }
}
