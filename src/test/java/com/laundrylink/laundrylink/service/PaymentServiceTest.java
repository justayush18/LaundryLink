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
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private OrderService orderService;

    @Mock
    private PaymentProcessor paymentProcessor;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    public void testInitiatePayment_Success() {
        InitiatePaymentRequest req = new InitiatePaymentRequest("order-123", PaymentMethod.RAZORPAY);
        
        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.PLACED, List.of(new OrderItemDto("SHIRT", "WASH_AND_FOLD", 2)),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of()
        );

        when(orderService.getOrder("order-123", "customer@example.com", UserRoleType.CUSTOMER)).thenReturn(orderView);
        when(paymentRepository.findAll()).thenReturn(List.of());
        when(paymentProcessor.createTransaction("order-123", 100.0, PaymentMethod.RAZORPAY)).thenReturn("tx-123");

        PaymentView view = paymentService.initiatePayment("customer@example.com", req);

        assertNotNull(view);
        assertEquals("order-123", view.orderId());
        assertEquals(100.0, view.amount());
        assertEquals(PaymentMethod.RAZORPAY, view.paymentMethod());
        assertEquals(PaymentStatus.PENDING, view.status());
        assertEquals("tx-123", view.transactionId());

        verify(paymentRepository, times(1)).save(any(PaymentEntity.class));
        verify(orderService, times(1)).linkPaymentToOrder(eq("order-123"), anyString());
        verify(notificationService, times(1)).sendNotification(eq("customer@example.com"), eq(NotificationType.PAYMENT), anyString());
    }

    @Test
    public void testInitiatePayment_AlreadyPaid() {
        InitiatePaymentRequest req = new InitiatePaymentRequest("order-123", PaymentMethod.RAZORPAY);
        
        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.PLACED, List.of(new OrderItemDto("SHIRT", "WASH_AND_FOLD", 2)),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of()
        );

        when(orderService.getOrder("order-123", "customer@example.com", UserRoleType.CUSTOMER)).thenReturn(orderView);
        
        PaymentEntity existingSuccess = new PaymentEntity("pay-123", "order-123", 100.0, PaymentMethod.RAZORPAY, "tx-123");
        existingSuccess.setStatus(PaymentStatus.SUCCESS);
        when(paymentRepository.findAll()).thenReturn(List.of(existingSuccess));

        assertThrows(ResponseStatusException.class, () -> {
            paymentService.initiatePayment("customer@example.com", req);
        });
    }

    @Test
    public void testProcessPayment_Success() {
        PaymentEntity payment = new PaymentEntity("pay-123", "order-123", 100.0, PaymentMethod.RAZORPAY, "tx-123");
        payment.setStatus(PaymentStatus.PENDING);

        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.PLACED, List.of(new OrderItemDto("SHIRT", "WASH_AND_FOLD", 2)),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of()
        );

        when(paymentRepository.findById("pay-123")).thenReturn(Optional.of(payment));
        when(orderService.getOrder("order-123", "customer@example.com", UserRoleType.CUSTOMER)).thenReturn(orderView);

        PaymentView view = paymentService.processPayment("customer@example.com", "pay-123", true);

        assertNotNull(view);
        assertEquals(PaymentStatus.SUCCESS, view.status());
        verify(invoiceRepository, times(1)).save(any(InvoiceEntity.class));
        verify(paymentRepository, times(1)).save(payment);
        verify(notificationService, times(2)).sendNotification(anyString(), eq(NotificationType.PAYMENT), anyString());
    }

    @Test
    public void testProcessPayment_Failure() {
        PaymentEntity payment = new PaymentEntity("pay-123", "order-123", 100.0, PaymentMethod.RAZORPAY, "tx-123");
        payment.setStatus(PaymentStatus.PENDING);

        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.PLACED, List.of(),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of()
        );

        when(paymentRepository.findById("pay-123")).thenReturn(Optional.of(payment));
        when(orderService.getOrder("order-123", "customer@example.com", UserRoleType.CUSTOMER)).thenReturn(orderView);

        PaymentView view = paymentService.processPayment("customer@example.com", "pay-123", false);

        assertNotNull(view);
        assertEquals(PaymentStatus.FAILED, view.status());
        verify(invoiceRepository, never()).save(any(InvoiceEntity.class));
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    public void testCompleteCodPayment() {
        PaymentEntity payment = new PaymentEntity("pay-123", "order-123", 100.0, PaymentMethod.COD, "tx-123");
        payment.setStatus(PaymentStatus.PENDING);

        when(paymentRepository.findAll()).thenReturn(List.of(payment));

        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.PLACED, List.of(),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of()
        );

        when(orderService.getOrderHistory("order-123", UserRoleType.ADMIN)).thenReturn(List.of(orderView));

        paymentService.completeCodPayment("order-123");

        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        verify(paymentRepository, times(1)).save(payment);
        verify(invoiceRepository, times(1)).save(any(InvoiceEntity.class));
    }

    @Test
    public void testRefundPayment_Success() {
        PaymentEntity payment = new PaymentEntity("pay-123", "order-123", 100.0, PaymentMethod.RAZORPAY, "tx-123");
        payment.setStatus(PaymentStatus.SUCCESS);

        InvoiceEntity invoice = new InvoiceEntity("order-123", "pay-123", "customer@example.com", "partner@example.com", 100.0);

        when(paymentRepository.findById("pay-123")).thenReturn(Optional.of(payment));
        when(invoiceRepository.findByOrderId("order-123")).thenReturn(Optional.of(invoice));

        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.DELIVERED, List.of(),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of()
        );
        when(orderService.getOrderHistory("order-123", UserRoleType.ADMIN)).thenReturn(List.of(orderView));

        PaymentView view = paymentService.refundPayment("admin@example.com", "pay-123");

        assertNotNull(view);
        assertEquals(PaymentStatus.REFUNDED, view.status());
        assertEquals(InvoiceStatus.CANCELLED, invoice.getInvoiceStatus());
        verify(paymentRepository, times(1)).save(payment);
        verify(invoiceRepository, times(1)).save(invoice);
    }
}
