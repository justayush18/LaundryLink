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
        order.setStatus(OrderStatus.DELIVERED); // Delivered, cannot cancel
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest(OrderStatus.CANCELLED, "Cancel");
        assertThrows(ResponseStatusException.class, () -> {
            orderService.updateOrderStatus("order-123", "customer@example.com", UserRoleType.CUSTOMER, request);
        });
    }

    @Test
    public void testUpdateStatus_CustomerCancel_FreeAllowance() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setCustomerEmail("customer@example.com");
        order.setStatus(OrderStatus.ACCEPTED);
        order.setTotalCost(100.0);
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));
        when(orderRepository.findAll()).thenReturn(List.of()); // 0 cancellations
        when(orderRepository.saveAndFlush(any(OrderEntity.class))).thenReturn(order);

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest(OrderStatus.CANCELLED, "cancelled by customer");
        OrderView view = orderService.updateOrderStatus("order-123", "customer@example.com", UserRoleType.CUSTOMER, request);

        assertNotNull(view);
        assertEquals(OrderStatus.CANCELLED, view.status());
        assertEquals(0.0, view.cancellationFee());
        assertEquals(100.0, view.refundAmount());
    }

    @Test
    public void testUpdateStatus_CustomerCancel_ExceededAllowance_Progression() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setCustomerEmail("customer@example.com");
        order.setStatus(OrderStatus.ACCEPTED);
        order.setTotalCost(100.0);
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        // Prepare existing cancelled orders to exceed allowance (3 cancellations)
        List<OrderEntity> existingOrders = new ArrayList<>();
        long startOfThisMonthEpoch = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Kolkata"))
                .toLocalDate().withDayOfMonth(1).atStartOfDay(java.time.ZoneId.of("Asia/Kolkata")).toEpochSecond();
        
        for (int i = 0; i < 3; i++) {
            OrderEntity o = new OrderEntity();
            o.setCustomerEmail("customer@example.com");
            o.setHistory(List.of(new StatusTransitionEntity(OrderStatus.CANCELLED, startOfThisMonthEpoch + 10, "cancelled by customer")));
            existingOrders.add(o);
        }

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));
        when(orderRepository.findAll()).thenReturn(existingOrders);
        when(orderRepository.saveAndFlush(any(OrderEntity.class))).thenReturn(order);

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest(OrderStatus.CANCELLED, "cancelled by customer");
        OrderView view = orderService.updateOrderStatus("order-123", "customer@example.com", UserRoleType.CUSTOMER, request);

        assertNotNull(view);
        assertEquals(OrderStatus.CANCELLED, view.status());
        assertEquals(15.0, view.cancellationFee()); // 15% of 100.0 for ACCEPTED
        assertEquals(85.0, view.refundAmount());
    }

    @Test
    public void testAssignDeliveryPartner_SelfClaim_Success() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setCustomerEmail("customer@example.com");
        order.setPartnerEmail("partner@example.com");
        order.setStatus(OrderStatus.ACCEPTED);
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));
        when(orderRepository.saveAndFlush(any(OrderEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderView view = orderService.assignDeliveryPartner("order-123", "rider@example.com", UserRoleType.DELIVERY_PARTNER, null);

        assertNotNull(view);
        assertEquals("rider@example.com", view.deliveryPartnerEmail());
        assertEquals(OrderStatus.PICKUP_ASSIGNED, view.status());
        verify(orderRepository, times(1)).saveAndFlush(order);
    }

    @Test
    public void testAssignDeliveryPartner_ForbiddenForOtherRider() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setStatus(OrderStatus.ACCEPTED);

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));

        assertThrows(ResponseStatusException.class, () -> {
            orderService.assignDeliveryPartner("order-123", "rider@example.com", UserRoleType.DELIVERY_PARTNER, "other_rider@example.com");
        });
    }

    @Test
    public void testAssignDeliveryPartner_AdminAssign_Success() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setCustomerEmail("customer@example.com");
        order.setPartnerEmail("partner@example.com");
        order.setStatus(OrderStatus.READY_FOR_DELIVERY);
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));
        when(orderRepository.saveAndFlush(any(OrderEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderView view = orderService.assignDeliveryPartner("order-123", "admin@example.com", UserRoleType.ADMIN, "rider@example.com");

        assertNotNull(view);
        assertEquals("rider@example.com", view.deliveryPartnerEmail());
        assertEquals(OrderStatus.DELIVERY_ASSIGNED, view.status());
        verify(orderRepository, times(1)).saveAndFlush(order);
    }

    @Test
    public void testLaundryPartnerCancel_PlacedStatus() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setCustomerEmail("customer@example.com");
        order.setPartnerEmail("partner@example.com");
        order.setStatus(OrderStatus.PLACED);
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));
        when(orderRepository.saveAndFlush(any(OrderEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest(OrderStatus.CANCELLED, "Out of stock");
        OrderView view = orderService.updateOrderStatus("order-123", "partner@example.com", UserRoleType.LAUNDRY_PARTNER, request);

        assertNotNull(view);
        assertEquals(OrderStatus.CANCELLED, view.status());
        assertEquals("Out of stock", order.getStatusNotes());
    }

    @Test
    public void testLaundryPartnerCancel_AcceptedStatus() {
        OrderEntity order = new OrderEntity();
        order.setOrderId("order-123");
        order.setCustomerEmail("customer@example.com");
        order.setPartnerEmail("partner@example.com");
        order.setStatus(OrderStatus.ACCEPTED);
        order.setItems(new ArrayList<>());
        order.setHistory(new ArrayList<>());

        when(orderRepository.findById("order-123")).thenReturn(Optional.of(order));
        when(orderRepository.saveAndFlush(any(OrderEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest(OrderStatus.CANCELLED, "Machine broke");
        OrderView view = orderService.updateOrderStatus("order-123", "partner@example.com", UserRoleType.LAUNDRY_PARTNER, request);

        assertNotNull(view);
        assertEquals(OrderStatus.CANCELLED, view.status());
        assertTrue(order.getStatusNotes().startsWith("Cancelled by laundry partner:"));
        assertTrue(order.getStatusNotes().contains("Machine broke"));
    }
}
