package com.laundrylink.laundrylink.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.InitiatePaymentRequest;
import com.laundrylink.laundrylink.api.InvoiceStatus;
import com.laundrylink.laundrylink.api.InvoiceView;
import com.laundrylink.laundrylink.api.PaymentMethod;
import com.laundrylink.laundrylink.api.PaymentStatus;
import com.laundrylink.laundrylink.api.PaymentView;
import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.api.OrderView;

@Service
public class PaymentService {

    private final Map<String, Payment> payments = new ConcurrentHashMap<>();
    private final Map<String, Invoice> invoices = new ConcurrentHashMap<>();
    private final OrderService orderService;
    private final PaymentProcessor paymentProcessor;

    public PaymentService(@Lazy OrderService orderService, PaymentProcessor paymentProcessor) {
        this.orderService = orderService;
        this.paymentProcessor = paymentProcessor;
    }

    public PaymentView initiatePayment(String customerEmail, InitiatePaymentRequest request) {
        // Fetch order to verify ownership and existence
        OrderView order = orderService.getOrder(request.orderId(), customerEmail, UserRoleType.CUSTOMER);

        // Check if there is already a successful payment for this order
        boolean hasSuccessPayment = payments.values().stream()
                .anyMatch(p -> p.getOrderId().equals(request.orderId()) && p.getStatus() == PaymentStatus.SUCCESS);
        if (hasSuccessPayment) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is already paid");
        }

        String paymentId = UUID.randomUUID().toString();
        String transactionId = paymentProcessor.createTransaction(request.orderId(), order.totalCost(), request.paymentMethod());

        Payment payment = new Payment(
                paymentId,
                request.orderId(),
                order.totalCost(),
                request.paymentMethod(),
                transactionId
        );

        payments.put(paymentId, payment);
        orderService.linkPaymentToOrder(request.orderId(), paymentId);

        return toPaymentView(payment);
    }

    public PaymentView processPayment(String customerEmail, String paymentId, boolean simulateSuccess) {
        Payment payment = payments.get(paymentId);
        if (payment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
        }

        // Verify customer owns the corresponding order
        OrderView order = orderService.getOrder(payment.getOrderId(), customerEmail, UserRoleType.CUSTOMER);

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment is not in PENDING status");
        }

        if (simulateSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            generateInvoice(payment, order);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
        }

        return toPaymentView(payment);
    }

    public void completeCodPayment(String orderId) {
        // Find the PENDING COD payment linked to this order
        Payment codPayment = payments.values().stream()
                .filter(p -> p.getOrderId().equals(orderId) 
                        && p.getPaymentMethod() == PaymentMethod.COD 
                        && p.getStatus() == PaymentStatus.PENDING)
                .findFirst()
                .orElse(null);

        if (codPayment != null) {
            codPayment.setStatus(PaymentStatus.SUCCESS);
            
            // Retrieve order directly using admin scope (internal completion)
            OrderView order = orderService.getOrderHistory(codPayment.getOrderId(), UserRoleType.ADMIN).stream()
                    .filter(o -> o.orderId().equals(orderId))
                    .findFirst()
                    .orElse(null);
            
            if (order != null) {
                generateInvoice(codPayment, order);
            }
        }
    }

    public PaymentView refundPayment(String adminEmail, String paymentId) {
        Payment payment = payments.get(paymentId);
        if (payment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only successful payments can be refunded");
        }

        payment.setStatus(PaymentStatus.REFUNDED);

        // Cancel the corresponding invoice if it exists
        invoices.values().stream()
                .filter(i -> i.getPaymentId().equals(paymentId))
                .forEach(i -> i.setInvoiceStatus(InvoiceStatus.CANCELLED));

        return toPaymentView(payment);
    }

    public InvoiceView getInvoiceByOrderId(String email, UserRoleType role, String orderId) {
        Invoice invoice = invoices.values().stream()
                .filter(i -> i.getOrderId().equals(orderId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found for this order"));

        // Enforce role-based security:
        // - Customer can only view their own invoices.
        // - Laundry Partner can only view invoices for their own orders.
        // - Admin can view all.
        boolean authorized = false;
        if (role == UserRoleType.ADMIN) {
            authorized = true;
        } else if (role == UserRoleType.CUSTOMER && invoice.getCustomerEmail().equalsIgnoreCase(email)) {
            authorized = true;
        } else if (role == UserRoleType.LAUNDRY_PARTNER && invoice.getPartnerEmail().equalsIgnoreCase(email)) {
            authorized = true;
        }

        if (!authorized) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view this invoice");
        }

        return toInvoiceView(invoice);
    }

    public PaymentView getPayment(String paymentId, String email, UserRoleType role) {
        Payment payment = payments.get(paymentId);
        if (payment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
        }

        // Delegate security check: verify that the user can access the corresponding order details.
        orderService.getOrder(payment.getOrderId(), email, role);

        return toPaymentView(payment);
    }

    private void generateInvoice(Payment payment, OrderView order) {
        String invoiceId = UUID.randomUUID().toString();
        Invoice invoice = new Invoice(
                invoiceId,
                order.orderId(),
                payment.getPaymentId(),
                order.customerEmail(),
                order.partnerEmail(),
                payment.getAmount(),
                order.items()
        );
        invoices.put(invoiceId, invoice);
    }

    private PaymentView toPaymentView(Payment payment) {
        return new PaymentView(
                payment.getPaymentId(),
                payment.getOrderId(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getTransactionId(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }

    private InvoiceView toInvoiceView(Invoice invoice) {
        return new InvoiceView(
                invoice.getInvoiceId(),
                invoice.getOrderId(),
                invoice.getPaymentId(),
                invoice.getCustomerEmail(),
                invoice.getPartnerEmail(),
                invoice.getAmount(),
                invoice.getItems(),
                invoice.getInvoiceStatus(),
                invoice.getGeneratedAt()
        );
    }
}
