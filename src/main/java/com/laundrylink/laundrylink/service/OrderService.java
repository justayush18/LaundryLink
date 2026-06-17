package com.laundrylink.laundrylink.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
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

@Service
public class OrderService {

    private final Map<String, Order> orders = new ConcurrentHashMap<>();
    private final LaundryPartnerService laundryPartnerService;
    private final PaymentService paymentService;

    public OrderService(LaundryPartnerService laundryPartnerService, @Lazy PaymentService paymentService) {
        this.laundryPartnerService = laundryPartnerService;
        this.paymentService = paymentService;
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
        Order order = new Order(
                orderId,
                customerEmail,
                request.partnerEmail(),
                request.items(),
                totalCost,
                request.pickupAddress(),
                request.pickupSlot(),
                request.deliveryAddress(),
                request.deliverySlot()
        );

        orders.put(orderId, order);
        return toView(order);
    }

    public OrderView getOrder(String orderId, String email, UserRoleType role) {
        Order order = orders.get(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }

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
        return orders.values().stream()
                .filter(order -> {
                    if (role == UserRoleType.CUSTOMER) {
                        return order.getCustomerEmail().equalsIgnoreCase(email);
                    } else if (role == UserRoleType.LAUNDRY_PARTNER) {
                        return order.getPartnerEmail().equalsIgnoreCase(email);
                    } else if (role == UserRoleType.DELIVERY_PARTNER) {
                        return order.getDeliveryPartnerEmail() != null && order.getDeliveryPartnerEmail().equalsIgnoreCase(email);
                    } else if (role == UserRoleType.ADMIN) {
                        return true;
                    }
                    return false;
                })
                .map(this::toView)
                .collect(Collectors.toList());
    }

    public OrderView updateOrderStatus(String orderId, String email, UserRoleType role, OrderStatusUpdateRequest request) {
        Order order = orders.get(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }

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
                // Admins have full access
                break;

            default:
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized role");
        }

        order.transitionStatus(newStatus, notes);
        if (newStatus == OrderStatus.DELIVERED) {
            paymentService.completeCodPayment(orderId);
        }
        return toView(order);
    }

    public OrderView assignDeliveryPartner(String orderId, String email, UserRoleType role, String deliveryPartnerEmail) {
        Order order = orders.get(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }

        if (role == UserRoleType.DELIVERY_PARTNER) {
            if (!email.equalsIgnoreCase(deliveryPartnerEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Delivery partners can only assign themselves");
            }
        } else if (role != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Admin or Delivery Partners can assign delivery tasks");
        }

        order.setDeliveryPartnerEmail(deliveryPartnerEmail);

        // Auto state transition on assignment
        if (order.getStatus() == OrderStatus.ACCEPTED) {
            order.transitionStatus(OrderStatus.PICKUP_ASSIGNED, "Delivery partner assigned for pickup: " + deliveryPartnerEmail);
        } else if (order.getStatus() == OrderStatus.READY_FOR_DELIVERY) {
            order.transitionStatus(OrderStatus.DELIVERY_ASSIGNED, "Delivery partner assigned for delivery: " + deliveryPartnerEmail);
        }

        return toView(order);
    }

    public DeliveryDashboardView getDeliveryDashboard(String deliveryPartnerEmail) {
        List<OrderView> pendingPickups = orders.values().stream()
                .filter(order -> order.getStatus() == OrderStatus.ACCEPTED)
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> pendingDeliveries = orders.values().stream()
                .filter(order -> order.getStatus() == OrderStatus.READY_FOR_DELIVERY)
                .map(this::toView)
                .collect(Collectors.toList());

        List<OrderView> assignedTasks = orders.values().stream()
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
        Order order = orders.get(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }

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
                order.getHistory()
        );
    }

    public void linkPaymentToOrder(String orderId, String paymentId) {
        Order order = orders.get(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        order.setPaymentId(paymentId);
    }

    private OrderView toView(Order order) {
        return new OrderView(
                order.getOrderId(),
                order.getCustomerEmail(),
                order.getPartnerEmail(),
                order.getDeliveryPartnerEmail(),
                order.getPaymentId(),
                order.getStatus(),
                order.getItems(),
                order.getTotalCost(),
                order.getPickupAddress(),
                order.getPickupSlot(),
                order.getDeliveryAddress(),
                order.getDeliverySlot(),
                order.getStatusNotes(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getHistory()
        );
    }
}
