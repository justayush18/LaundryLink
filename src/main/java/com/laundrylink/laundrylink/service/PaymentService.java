package com.laundrylink.laundrylink.service;

import java.util.List;
import java.util.UUID;
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
import com.laundrylink.laundrylink.api.OrderItemDto;
import com.laundrylink.laundrylink.api.NotificationType;
import com.laundrylink.laundrylink.persistence.PaymentEntity;
import com.laundrylink.laundrylink.persistence.PaymentRepository;
import com.laundrylink.laundrylink.persistence.InvoiceEntity;
import com.laundrylink.laundrylink.persistence.InvoiceItemEntity;
import com.laundrylink.laundrylink.persistence.InvoiceRepository;
import com.laundrylink.laundrylink.persistence.OrderEntity;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final OrderService orderService;
    private final PaymentProcessor paymentProcessor;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository, @Lazy OrderService orderService, PaymentProcessor paymentProcessor, @Lazy NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.orderService = orderService;
        this.paymentProcessor = paymentProcessor;
        this.notificationService = notificationService;
    }

    public PaymentView initiatePayment(String customerEmail, InitiatePaymentRequest request) {
        OrderEntity orderEntity = orderService.findOrderByIdentifier(request.orderId());
        
        // Fetch order to verify ownership and existence
        OrderView order = orderService.getOrder(orderEntity.getOrderId(), customerEmail, UserRoleType.CUSTOMER);

        // Check if there is already a successful payment for this order
        boolean hasSuccessPayment = paymentRepository.findAll().stream()
                .anyMatch(p -> p.getOrderId().equals(orderEntity.getOrderId()) && p.getStatus() == PaymentStatus.SUCCESS);
        if (hasSuccessPayment) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is already paid");
        }

        String paymentId = UUID.randomUUID().toString();
        String transactionId = paymentProcessor.createTransaction(orderEntity.getOrderId(), order.totalCost(), request.paymentMethod());

        PaymentEntity payment = new PaymentEntity(
                paymentId,
                orderEntity.getOrderId(),
                order.totalCost(),
                request.paymentMethod(),
                transactionId
        );

        paymentRepository.save(payment);
        orderService.linkPaymentToOrder(orderEntity.getOrderId(), paymentId);

        String displayId = orderEntity.getDisplayOrderId() != null ? orderEntity.getDisplayOrderId() : orderEntity.getOrderId();

        notificationService.sendNotification(customerEmail, NotificationType.PAYMENT,
                "Payment of " + payment.getAmount() + " initiated for order " + displayId + ". Payment ID: " + payment.getPaymentId());
        notificationService.sendNotification("admin@velora.example", NotificationType.PAYMENT,
                "Payment of " + payment.getAmount() + " initiated for order " + displayId + ". Payment ID: " + payment.getPaymentId());

        return toPaymentView(payment);
    }

    public PaymentView processPayment(String customerEmail, String paymentId, boolean simulateSuccess) {
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        // Verify customer owns the corresponding order
        OrderView order = orderService.getOrder(payment.getOrderId(), customerEmail, UserRoleType.CUSTOMER);
        OrderEntity orderEntity = orderService.findOrderByIdentifier(payment.getOrderId());
        String displayId = orderEntity.getDisplayOrderId() != null ? orderEntity.getDisplayOrderId() : orderEntity.getOrderId();

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment is not in PENDING status");
        }

        if (simulateSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            generateInvoice(payment, order);
            paymentRepository.save(payment);
            
            notificationService.sendNotification(customerEmail, NotificationType.PAYMENT,
                    "Payment of " + payment.getAmount() + " succeeded for order " + displayId + ".");
            notificationService.sendNotification("admin@velora.example", NotificationType.PAYMENT,
                    "Payment of " + payment.getAmount() + " succeeded for order " + displayId + ".");
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            
            notificationService.sendNotification(customerEmail, NotificationType.PAYMENT,
                    "Payment of " + payment.getAmount() + " failed for order " + displayId + ".");
            notificationService.sendNotification("admin@velora.example", NotificationType.PAYMENT,
                    "Payment of " + payment.getAmount() + " failed for order " + displayId + ".");
        }

        return toPaymentView(payment);
    }

    public void completeCodPayment(String orderId) {
        OrderEntity orderEntity = orderService.findOrderByIdentifier(orderId);
        String actualOrderId = orderEntity.getOrderId();
        String displayId = orderEntity.getDisplayOrderId() != null ? orderEntity.getDisplayOrderId() : actualOrderId;

        // Find the PENDING COD payment linked to this order
        PaymentEntity codPayment = paymentRepository.findAll().stream()
                .filter(p -> p.getOrderId().equals(actualOrderId) 
                        && p.getPaymentMethod() == PaymentMethod.COD 
                        && p.getStatus() == PaymentStatus.PENDING)
                .findFirst()
                .orElse(null);

        if (codPayment != null) {
            codPayment.setStatus(PaymentStatus.SUCCESS);
            
            // Retrieve order directly using admin scope (internal completion)
            OrderView order = orderService.getOrderHistory(actualOrderId, UserRoleType.ADMIN).stream()
                    .filter(o -> o.orderId().equals(displayId) || o.orderId().equals(actualOrderId))
                    .findFirst()
                    .orElse(null);
            
            if (order != null) {
                generateInvoice(codPayment, order);
                paymentRepository.save(codPayment);
                
                notificationService.sendNotification(order.customerEmail(), NotificationType.PAYMENT,
                        "COD Payment of " + codPayment.getAmount() + " was successful for order " + displayId + ".");
                notificationService.sendNotification("admin@velora.example", NotificationType.PAYMENT,
                        "COD Payment of " + codPayment.getAmount() + " was successful for order " + displayId + ".");
            }
        }
    }

    public PaymentView refundPayment(String adminEmail, String paymentId) {
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only successful payments can be refunded");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

        // Cancel the corresponding invoice if it exists
        invoiceRepository.findByOrderId(payment.getOrderId()).ifPresent(i -> {
            i.setInvoiceStatus(InvoiceStatus.CANCELLED);
            invoiceRepository.save(i);
        });

        OrderEntity orderEntity = orderService.findOrderByIdentifier(payment.getOrderId());
        String displayId = orderEntity.getDisplayOrderId() != null ? orderEntity.getDisplayOrderId() : orderEntity.getOrderId();

        notificationService.sendNotification(orderEntity.getCustomerEmail(), NotificationType.PAYMENT,
                "Payment of " + payment.getAmount() + " has been refunded for order " + displayId + ".");
        notificationService.sendNotification(adminEmail, NotificationType.PAYMENT,
                "Payment of " + payment.getAmount() + " has been refunded for order " + displayId + ".");

        return toPaymentView(payment);
    }

    public InvoiceView getInvoiceByOrderId(String email, UserRoleType role, String orderId) {
        OrderEntity order = orderService.findOrderByIdentifier(orderId);
        InvoiceEntity invoice = invoiceRepository.findByOrderId(order.getOrderId())
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
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        // Delegate security check: verify that the user can access the corresponding order details.
        orderService.getOrder(payment.getOrderId(), email, role);

        return toPaymentView(payment);
    }

    private void generateInvoice(PaymentEntity payment, OrderView order) {
        InvoiceEntity invoice = new InvoiceEntity(
                orderService.findOrderByIdentifier(order.orderId()).getOrderId(),
                payment.getPaymentId(),
                order.customerEmail(),
                order.partnerEmail(),
                payment.getAmount()
        );
        List<InvoiceItemEntity> items = order.items().stream()
                .map(i -> new InvoiceItemEntity(i.itemCategory(), i.serviceType(), i.quantity()))
                .collect(Collectors.toList());
        invoice.setItems(items);
        invoiceRepository.save(invoice);
    }

    private PaymentView toPaymentView(PaymentEntity payment) {
        String displayOrderId = orderService.getDisplayOrderIdByOrderId(payment.getOrderId());
        return new PaymentView(
                payment.getPaymentId(),
                displayOrderId,
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getTransactionId(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }

    private InvoiceView toInvoiceView(InvoiceEntity invoice) {
        List<OrderItemDto> itemsDto = invoice.getItems().stream()
                .map(i -> new OrderItemDto(i.getItemCategory(), i.getServiceType(), i.getQuantity()))
                .collect(Collectors.toList());
        String displayOrderId = orderService.getDisplayOrderIdByOrderId(invoice.getOrderId());
        return new InvoiceView(
                String.valueOf(invoice.getId()),
                displayOrderId,
                invoice.getPaymentId(),
                invoice.getCustomerEmail(),
                invoice.getPartnerEmail(),
                invoice.getAmount(),
                itemsDto,
                invoice.getInvoiceStatus(),
                invoice.getGeneratedAt()
        );
    }
}
