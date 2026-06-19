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

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final LaundryPartnerService laundryPartnerService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, LaundryPartnerService laundryPartnerService, @Lazy PaymentService paymentService, @Lazy NotificationService notificationService, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.laundryPartnerService = laundryPartnerService;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
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

        List<OrderItemEntity> itemEntities = request.items().stream()
                .map(i -> new OrderItemEntity(i.itemCategory(), i.serviceType(), i.quantity()))
                .collect(Collectors.toList());
        order.setItems(itemEntities);

        long now = System.currentTimeMillis() / 1000L;
        StatusTransitionEntity placementTransition = new StatusTransitionEntity(OrderStatus.PLACED, now, "Order placed successfully.");
        order.getHistory().add(placementTransition);

        order = orderRepository.saveAndFlush(order);
        
        notificationService.sendNotification(customerEmail, NotificationType.ORDER_STATUS, 
                "Your order has been placed successfully. Order ID: " + orderId);
        notificationService.sendNotification(request.partnerEmail(), NotificationType.ORDER_STATUS, 
                "New order received! Order ID: " + orderId);
                
        return toView(order);
    }

    public OrderView getOrder(String orderId, String email, UserRoleType role) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        // Verify ownership/authorization
        if (role == UserRoleType.CUSTOMER && !order.getCustomerEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view this order");
        }
        if (role == UserRoleType.LAUNDRY_PARTNER && !order.getPartnerEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view this order");
        }
        if (role == UserRoleType.DELIVERY_PARTNER && order.getDeliveryPartnerEmail() != null 
                && !order.getDeliveryPartnerEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view this order");
        }

        return toView(order);
    }

    public List<OrderView> getOrderHistory(String email, UserRoleType role) {
        List<OrderEntity> list = switch (role) {
            case CUSTOMER -> orderRepository.findByCustomerEmail(email);
            case LAUNDRY_PARTNER -> orderRepository.findByPartnerEmail(email);
            case DELIVERY_PARTNER -> orderRepository.findByDeliveryPartnerEmail(email);
            case ADMIN -> orderRepository.findAll();
        };

        return list.stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    public OrderView updateOrderStatus(String orderId, String email, UserRoleType role, OrderStatusUpdateRequest request) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

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
                if (order.getStatus() != OrderStatus.PLACED) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Orders can only be cancelled while in PLACED state");
                }
                break;

            case LAUNDRY_PARTNER:
                if (!order.getPartnerEmail().equalsIgnoreCase(email)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: This order is not assigned to you");
                }
                if (newStatus != OrderStatus.ACCEPTED && newStatus != OrderStatus.PROCESSING 
                        && newStatus != OrderStatus.READY_FOR_DELIVERY && newStatus != OrderStatus.CANCELLED) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition for Laundry Partner");
                }
                break;

            case DELIVERY_PARTNER:
                if (order.getDeliveryPartnerEmail() == null || !order.getDeliveryPartnerEmail().equalsIgnoreCase(email)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not the assigned delivery partner");
                }
                if (newStatus != OrderStatus.PICKUP_ASSIGNED && newStatus != OrderStatus.PICKED_UP 
                        && newStatus != OrderStatus.DELIVERY_ASSIGNED && newStatus != OrderStatus.DELIVERED) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition for Delivery Partner");
                }
                break;

            case ADMIN:
                break;

            default:
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized role");
        }

        long now = System.currentTimeMillis() / 1000L;
        order.setStatus(newStatus);
        order.setStatusNotes(notes);
        order.getHistory().add(new StatusTransitionEntity(newStatus, now, notes));
        
        orderRepository.saveAndFlush(order);

        if (newStatus == OrderStatus.ACCEPTED || newStatus == OrderStatus.READY_FOR_DELIVERY) {
            autoAssignRider(order);
        }

        if (newStatus == OrderStatus.DELIVERED) {
            paymentService.completeCodPayment(orderId);
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Your order " + orderId + " has been successfully delivered!");
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.REVIEW_REMINDER, 
                    "Please take a moment to rate your experience for order " + orderId);
            notificationService.sendNotification(order.getPartnerEmail(), NotificationType.ORDER_STATUS, 
                    "Order " + orderId + " has been delivered.");
        } else if (newStatus == OrderStatus.ACCEPTED) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Your order " + orderId + " has been accepted by the laundry partner.");
        } else if (newStatus == OrderStatus.PICKED_UP) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.DELIVERY, 
                    "Your clothes have been picked up for order " + orderId);
            notificationService.sendNotification(order.getPartnerEmail(), NotificationType.DELIVERY, 
                    "Clothes for order " + orderId + " are in transit to your hub.");
        } else if (newStatus == OrderStatus.PROCESSING) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Your clothes are being processed for order " + orderId);
        } else if (newStatus == OrderStatus.READY_FOR_DELIVERY) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Your clothes are ready for delivery for order " + orderId);
        } else if (newStatus == OrderStatus.CANCELLED) {
            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.ORDER_STATUS, 
                    "Order " + orderId + " has been cancelled.");
            notificationService.sendNotification(order.getPartnerEmail(), NotificationType.ORDER_STATUS, 
                    "Order " + orderId + " has been cancelled.");
        }
        return toView(order);
    }

    public OrderView assignDeliveryPartner(String orderId, String email, UserRoleType role, String deliveryPartnerEmail) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

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

        order.setDeliveryPartnerEmail(targetDeliveryPartnerEmail);

        long now = System.currentTimeMillis() / 1000L;
        // Auto state transition on assignment
        if (order.getStatus() == OrderStatus.ACCEPTED) {
            order.setStatus(OrderStatus.PICKUP_ASSIGNED);
            order.setStatusNotes("Delivery partner assigned for pickup: " + targetDeliveryPartnerEmail);
            order.getHistory().add(new StatusTransitionEntity(OrderStatus.PICKUP_ASSIGNED, now, "Delivery partner assigned for pickup: " + targetDeliveryPartnerEmail));
        } else if (order.getStatus() == OrderStatus.READY_FOR_DELIVERY) {
            order.setStatus(OrderStatus.DELIVERY_ASSIGNED);
            order.setStatusNotes("Delivery partner assigned for delivery: " + targetDeliveryPartnerEmail);
            order.getHistory().add(new StatusTransitionEntity(OrderStatus.DELIVERY_ASSIGNED, now, "Delivery partner assigned for delivery: " + targetDeliveryPartnerEmail));
        }

        orderRepository.saveAndFlush(order);

        notificationService.sendNotification(order.getCustomerEmail(), NotificationType.DELIVERY, 
                "Delivery partner " + targetDeliveryPartnerEmail + " has been assigned to order " + orderId);
        notificationService.sendNotification(targetDeliveryPartnerEmail, NotificationType.DELIVERY, 
                "You have been assigned to order " + orderId);
        notificationService.sendNotification(order.getPartnerEmail(), NotificationType.DELIVERY, 
                "Delivery partner " + targetDeliveryPartnerEmail + " assigned for order " + orderId);

        return toView(order);
    }

    public DeliveryDashboardView getDeliveryDashboard(String deliveryPartnerEmail) {
        List<OrderEntity> allOrders = orderRepository.findAll();
        
        List<OrderEntity> riderOrders = allOrders.stream()
                .filter(o -> o.getDeliveryPartnerEmail() != null 
                        && o.getDeliveryPartnerEmail().equalsIgnoreCase(deliveryPartnerEmail))
                .collect(Collectors.toList());

        List<OrderView> assignedTasks = riderOrders.stream()
                .filter(o -> !o.isAcceptedByRider() 
                        && (o.getStatus() == OrderStatus.PICKUP_ASSIGNED 
                            || o.getStatus() == OrderStatus.DELIVERY_ASSIGNED))
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> upcomingPickups = riderOrders.stream()
                .filter(o -> o.isAcceptedByRider() 
                        && o.getStatus() == OrderStatus.PICKUP_ASSIGNED)
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> activeDeliveries = riderOrders.stream()
                .filter(o -> o.isAcceptedByRider() 
                        && (o.getStatus() == OrderStatus.PICKED_UP 
                            || o.getStatus() == OrderStatus.DELIVERY_ASSIGNED))
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> completedDeliveries = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(this::toView)
                .collect(Collectors.toList());

        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(kolkata);
        long startOfToday = nowIst.toLocalDate().atStartOfDay(kolkata).toEpochSecond();

        long completedTodayCount = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED && o.getUpdatedAt() >= startOfToday)
                .count();
        double todayEarnings = completedTodayCount * 60.0;

        long nowSeconds = System.currentTimeMillis() / 1000L;
        long startOfWeek = nowSeconds - 7 * 86400;
        long completedThisWeekCount = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED && o.getUpdatedAt() >= startOfWeek)
                .count();
        double weeklyEarnings = completedThisWeekCount * 60.0;

        long startOfMonth = nowSeconds - 30 * 86400;
        long completedThisMonthCount = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED && o.getUpdatedAt() >= startOfMonth)
                .count();
        double monthlyEarnings = completedThisMonthCount * 60.0;

        long totalCompleted = riderOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .count();
        double totalEarnings = totalCompleted * 60.0;

        int dailyCancellations = getDailyCancellationCount(deliveryPartnerEmail);

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
        if (order.getStatus() != OrderStatus.ACCEPTED && order.getStatus() != OrderStatus.READY_FOR_DELIVERY) {
            return;
        }

        // Find active and online delivery partners
        java.util.List<UserEntity> eligibleRiders = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRoleType.DELIVERY_PARTNER && u.isActive() && u.isOnline())
                .collect(Collectors.toList());

        if (eligibleRiders.isEmpty()) {
            return;
        }

        // Get riders who previously cancelled this order
        java.util.Set<String> excludedRiders = new java.util.HashSet<>();
        if (order.getHistory() != null) {
            for (StatusTransitionEntity transition : order.getHistory()) {
                if (transition.getNotes() != null && transition.getNotes().toLowerCase().startsWith("task rejected by rider: ")) {
                    String cancelledEmail = transition.getNotes().substring("task rejected by rider: ".length()).trim();
                    excludedRiders.add(cancelledEmail.toLowerCase());
                }
            }
        }

        // Filter out excluded riders
        eligibleRiders = eligibleRiders.stream()
                .filter(u -> !excludedRiders.contains(u.getEmail().toLowerCase()))
                .collect(Collectors.toList());

        if (eligibleRiders.isEmpty()) {
            return;
        }

        // Pick the rider with the minimum count of active assignments
        UserEntity bestRider = null;
        long minActiveCount = Long.MAX_VALUE;

        for (UserEntity rider : eligibleRiders) {
            long activeCount = orderRepository.findAll().stream()
                    .filter(o -> o.getDeliveryPartnerEmail() != null
                            && o.getDeliveryPartnerEmail().equalsIgnoreCase(rider.getEmail())
                            && (o.getStatus() == OrderStatus.PICKUP_ASSIGNED
                                    || o.getStatus() == OrderStatus.DELIVERY_ASSIGNED
                                    || o.getStatus() == OrderStatus.PICKED_UP))
                    .count();

            if (activeCount < minActiveCount) {
                minActiveCount = activeCount;
                bestRider = rider;
            }
        }

        if (bestRider != null) {
            order.setDeliveryPartnerEmail(bestRider.getEmail());
            order.setAcceptedByRider(false);
            long now = System.currentTimeMillis() / 1000L;

            if (order.getStatus() == OrderStatus.ACCEPTED) {
                order.setStatus(OrderStatus.PICKUP_ASSIGNED);
                order.setStatusNotes("Delivery partner assigned for pickup: " + bestRider.getEmail());
                order.getHistory().add(new StatusTransitionEntity(OrderStatus.PICKUP_ASSIGNED, now, "Delivery partner assigned for pickup: " + bestRider.getEmail()));
            } else if (order.getStatus() == OrderStatus.READY_FOR_DELIVERY) {
                order.setStatus(OrderStatus.DELIVERY_ASSIGNED);
                order.setStatusNotes("Delivery partner assigned for delivery: " + bestRider.getEmail());
                order.getHistory().add(new StatusTransitionEntity(OrderStatus.DELIVERY_ASSIGNED, now, "Delivery partner assigned for delivery: " + bestRider.getEmail()));
            }

            orderRepository.saveAndFlush(order);

            notificationService.sendNotification(order.getCustomerEmail(), NotificationType.DELIVERY,
                    "Delivery partner " + bestRider.getEmail() + " has been assigned to order " + order.getOrderId());
            notificationService.sendNotification(bestRider.getEmail(), NotificationType.DELIVERY,
                    "You have been assigned to order " + order.getOrderId());
            notificationService.sendNotification(order.getPartnerEmail(), NotificationType.DELIVERY,
                    "Delivery partner " + bestRider.getEmail() + " assigned for order " + order.getOrderId());
        }
    }

    public void triggerPendingAssignments() {
        List<OrderEntity> pendingOrders = orderRepository.findAll().stream()
                .filter(order -> (order.getStatus() == OrderStatus.ACCEPTED || order.getStatus() == OrderStatus.READY_FOR_DELIVERY)
                        && order.getDeliveryPartnerEmail() == null)
                .collect(Collectors.toList());
        for (OrderEntity order : pendingOrders) {
            autoAssignRider(order);
        }
    }

    public int getDailyCancellationCount(String email) {
        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(kolkata);
        java.time.ZonedDateTime startOfDayIst = nowIst.toLocalDate().atStartOfDay(kolkata);
        long startOfDayEpochSecond = startOfDayIst.toEpochSecond();

        String expectedNote = "Task rejected by rider: " + email;
        int count = 0;
        List<OrderEntity> orders = orderRepository.findAll();
        for (OrderEntity o : orders) {
            if (o.getHistory() != null) {
                for (StatusTransitionEntity transition : o.getHistory()) {
                    if (transition.getTimestamp() >= startOfDayEpochSecond
                            && transition.getNotes() != null
                            && transition.getNotes().trim().equalsIgnoreCase(expectedNote.trim())) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    public OrderView acceptDeliveryTask(String orderId, String email) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getDeliveryPartnerEmail() == null || !order.getDeliveryPartnerEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not the assigned delivery partner");
        }

        if (order.getStatus() != OrderStatus.PICKUP_ASSIGNED && order.getStatus() != OrderStatus.DELIVERY_ASSIGNED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order cannot be accepted in the current state");
        }

        order.setAcceptedByRider(true);
        orderRepository.saveAndFlush(order);

        return toView(order);
    }

    public OrderView cancelDeliveryTask(String orderId, String email) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getDeliveryPartnerEmail() == null || !order.getDeliveryPartnerEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not the assigned delivery partner");
        }

        if (order.getStatus() != OrderStatus.PICKUP_ASSIGNED && order.getStatus() != OrderStatus.DELIVERY_ASSIGNED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order cannot be cancelled/rejected in the current state");
        }

        int cancelsToday = getDailyCancellationCount(email);
        if (cancelsToday >= 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Daily cancellation limit reached (2/2).");
        }

        long now = System.currentTimeMillis() / 1000L;
        OrderStatus oldStatus = order.getStatus();
        OrderStatus revertedStatus = (oldStatus == OrderStatus.PICKUP_ASSIGNED) ? OrderStatus.ACCEPTED : OrderStatus.READY_FOR_DELIVERY;

        order.setStatus(revertedStatus);
        order.setDeliveryPartnerEmail(null);
        order.setAcceptedByRider(false);
        order.setStatusNotes("Task rejected by rider: " + email);
        order.getHistory().add(new StatusTransitionEntity(revertedStatus, now, "Task rejected by rider: " + email));

        orderRepository.saveAndFlush(order);

        // Auto trigger reassignment for this order
        autoAssignRider(order);

        return toView(order);
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
        } else if (role == UserRoleType.DELIVERY_PARTNER && order.getDeliveryPartnerEmail() != null 
                && order.getDeliveryPartnerEmail().equalsIgnoreCase(email)) {
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
                order.isAcceptedByRider()
        );
    }
}
