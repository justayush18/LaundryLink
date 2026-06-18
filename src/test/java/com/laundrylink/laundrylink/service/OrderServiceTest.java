package com.laundrylink.laundrylink.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.*;
import com.laundrylink.laundrylink.persistence.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private LaundryPartnerService laundryPartnerService;

    @Mock
    private PaymentService paymentService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private OrderService orderService;

    @Test
    public void testPlaceOrder_Success() {
        PlaceOrderRequest req = new PlaceOrderRequest(
                "partner@example.com",
                List.of(new OrderItemDto("SHIRT", "WASH_AND_FOLD", 2)),
                "Pickup Address",
                "Monday 09:00 - 11:00",
                "Delivery Address",
                "Wednesday 14:00 - 16:00"
        );

        PricingView pricing = new PricingView(
                "partner@example.com",
                List.of(new RateCardItem("SHIRT", "WASH_AND_FOLD", 45.0))
        );

        when(laundryPartnerService.getPricing("partner@example.com")).thenReturn(pricing);
        when(orderRepository.saveAndFlush(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderView view = orderService.placeOrder("customer@example.com", req);

        assertNotNull(view);
        assertEquals("customer@example.com", view.customerEmail());
        assertEquals("partner@example.com", view.partnerEmail());
        assertEquals(90.0, view.totalCost());
        assertEquals(OrderStatus.PLACED, view.status());
    }

    @Test
    public void testUpdateStatus_CustomerCancel_Success() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setCustomerEmail("customer@example.com");
        order.setStatus(OrderStatus.PLACED);
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));
        when(orderRepository.saveAndFlush(any(OrderEntity.class))).thenReturn(order);

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest(OrderStatus.CANCELLED, "Customer changed mind");
        OrderView view = orderService.updateOrderStatus("order-123", "customer@example.com", UserRoleType.CUSTOMER, request);

        assertNotNull(view);
        assertEquals(OrderStatus.CANCELLED, view.status());
    }

    @Test
    public void testUpdateStatus_CustomerCancel_Forbidden() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setCustomerEmail("customer@example.com");
        order.setStatus(OrderStatus.ACCEPTED); // Already accepted, cannot cancel
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest(OrderStatus.CANCELLED, "Cancel");
        assertThrows(ResponseStatusException.class, () -> {
            orderService.updateOrderStatus("order-123", "customer@example.com", UserRoleType.CUSTOMER, request);
        });
    }
}
