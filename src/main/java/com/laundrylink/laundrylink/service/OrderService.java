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

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final LaundryPartnerService laundryPartnerService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    public OrderService(OrderRepository orderRepository, LaundryPartnerService laundryPartnerService, @Lazy PaymentService paymentService, @Lazy NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.laundryPartnerService = laundryPartnerService;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
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

        if (role == UserRoleType.DELIVERY_PARTNER) {
            if (!email.equalsIgnoreCase(deliveryPartnerEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Delivery partners can only assign themselves");
            }
        } else if (role != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Admin or Delivery Partners can assign delivery tasks");
        }

        order.setDeliveryPartnerEmail(deliveryPartnerEmail);

        long now = System.currentTimeMillis() / 1000L;
        // Auto state transition on assignment
        if (order.getStatus() == OrderStatus.ACCEPTED) {
            order.setStatus(OrderStatus.PICKUP_ASSIGNED);
            order.setStatusNotes("Delivery partner assigned for pickup: " + deliveryPartnerEmail);
            order.getHistory().add(new StatusTransitionEntity(OrderStatus.PICKUP_ASSIGNED, now, "Delivery partner assigned for pickup: " + deliveryPartnerEmail));
        } else if (order.getStatus() == OrderStatus.READY_FOR_DELIVERY) {
            order.setStatus(OrderStatus.DELIVERY_ASSIGNED);
            order.setStatusNotes("Delivery partner assigned for delivery: " + deliveryPartnerEmail);
            order.getHistory().add(new StatusTransitionEntity(OrderStatus.DELIVERY_ASSIGNED, now, "Delivery partner assigned for delivery: " + deliveryPartnerEmail));
        }

        orderRepository.saveAndFlush(order);

        notificationService.sendNotification(order.getCustomerEmail(), NotificationType.DELIVERY, 
                "Delivery partner " + deliveryPartnerEmail + " has been assigned to order " + orderId);
        notificationService.sendNotification(deliveryPartnerEmail, NotificationType.DELIVERY, 
                "You have been assigned to order " + orderId);
        notificationService.sendNotification(order.getPartnerEmail(), NotificationType.DELIVERY, 
                "Delivery partner " + deliveryPartnerEmail + " assigned for order " + orderId);

        return toView(order);
    }

    public DeliveryDashboardView getDeliveryDashboard(String deliveryPartnerEmail) {
        List<OrderView> pendingPickups = orderRepository.findAll().stream()
                .filter(order -> order.getStatus() == OrderStatus.ACCEPTED)
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> pendingDeliveries = orderRepository.findAll().stream()
                .filter(order -> order.getStatus() == OrderStatus.READY_FOR_DELIVERY)
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> assignedTasks = orderRepository.findAll().stream()
                .filter(order -> order.getDeliveryPartnerEmail() != null
                        && order.getDeliveryPartnerEmail().equalsIgnoreCase(deliveryPartnerEmail)
                        && (order.getStatus() == OrderStatus.PICKUP_ASSIGNED
                                || order.getStatus() == OrderStatus.PICKED_UP
                                || order.getStatus() == OrderStatus.DELIVERY_ASSIGNED))
                .map(this::toView)
                .collect(Collectors.toList());

        return new DeliveryDashboardView(pendingPickups, pendingDeliveries, assignedTasks);
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
                historyDto
        );
    }
}
