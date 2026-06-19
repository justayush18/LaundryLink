package com.laundrylink.laundrylink.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.service.OrderService;

@RestController
@RequestMapping(path = "/api/v1/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public OrderView placeOrder(@RequestBody PlaceOrderRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can place orders");
        }
        return orderService.placeOrder(principal.email(), request);
    }

    @GetMapping("/{orderId}")
    public OrderView getOrder(@PathVariable String orderId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return orderService.getOrder(orderId, principal.email(), principal.role());
    }

    @GetMapping("/history")
    public List<OrderView> getOrderHistory() {
        AuthenticatedPrincipal principal = currentPrincipal();
        return orderService.getOrderHistory(principal.email(), principal.role());
    }

    @GetMapping("/{orderId}/cancellation-estimate")
    public CancellationEstimate getCancellationEstimate(@PathVariable String orderId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return orderService.getCancellationEstimate(orderId, principal.email(), principal.role());
    }

    @PutMapping(value = "/{orderId}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    public OrderView updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody OrderStatusUpdateRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return orderService.updateOrderStatus(orderId, principal.email(), principal.role(), request);
    }

    @PutMapping(value = "/{orderId}/assign-delivery", consumes = MediaType.APPLICATION_JSON_VALUE)
    public OrderView assignDelivery(
            @PathVariable String orderId,
            @RequestBody AssignDeliveryRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return orderService.assignDeliveryPartner(orderId, principal.email(), principal.role(), request.deliveryPartnerEmail());
    }

    private AuthenticatedPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
