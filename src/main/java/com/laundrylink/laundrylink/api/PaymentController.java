package com.laundrylink.laundrylink.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.service.PaymentService;

@RestController
@RequestMapping(path = "/api/v1/payments", produces = MediaType.APPLICATION_JSON_VALUE)
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/initiate")
    public PaymentView initiatePayment(@RequestBody InitiatePaymentRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Customers can initiate payments");
        }
        return paymentService.initiatePayment(principal.email(), request);
    }

    @PostMapping("/{paymentId}/process")
    public PaymentView processPayment(
            @PathVariable String paymentId,
            @RequestParam(defaultValue = "true") boolean simulateSuccess) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Customers can process payments");
        }
        return paymentService.processPayment(principal.email(), paymentId, simulateSuccess);
    }

    @PostMapping("/{paymentId}/refund")
    public PaymentView refundPayment(@PathVariable String paymentId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Admins can initiate refunds");
        }
        return paymentService.refundPayment(principal.email(), paymentId);
    }

    @GetMapping("/{paymentId}")
    public PaymentView getPayment(@PathVariable String paymentId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return paymentService.getPayment(paymentId, principal.email(), principal.role());
    }

    @GetMapping("/orders/{orderId}/invoice")
    public InvoiceView getInvoiceByOrderId(@PathVariable String orderId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return paymentService.getInvoiceByOrderId(principal.email(), principal.role(), orderId);
    }

    private AuthenticatedPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
