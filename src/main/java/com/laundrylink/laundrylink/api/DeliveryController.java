package com.laundrylink.laundrylink.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.service.OrderService;

@RestController
@RequestMapping(path = "/api/v1/deliveries", produces = MediaType.APPLICATION_JSON_VALUE)
public class DeliveryController {

    private final OrderService orderService;

    public DeliveryController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/dashboard")
    public DeliveryDashboardView getDashboard() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.DELIVERY_PARTNER && principal.role() != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Delivery Partners or Admins can access the delivery dashboard");
        }
        return orderService.getDeliveryDashboard(principal.email());
    }

    @GetMapping("/{orderId}/tracking")
    public DeliveryTrackingView getTracking(@PathVariable String orderId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return orderService.getDeliveryTracking(orderId, principal.email(), principal.role());
    }

    @PutMapping("/availability")
    public void updateAvailability(@RequestParam boolean online) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.DELIVERY_PARTNER && principal.role() != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Delivery Partners or Admins can update availability");
        }
        orderService.updateRiderOnlineStatus(principal.email(), online);
    }

    @PutMapping("/{orderId}/accept")
    public OrderView acceptTask(@PathVariable String orderId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.DELIVERY_PARTNER && principal.role() != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Delivery Partners or Admins can accept tasks");
        }
        return orderService.acceptDeliveryTask(orderId, principal.email());
    }

    @PutMapping("/{orderId}/cancel")
    public OrderView cancelTask(@PathVariable String orderId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.DELIVERY_PARTNER && principal.role() != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Delivery Partners or Admins can cancel tasks");
        }
        return orderService.cancelDeliveryTask(orderId, principal.email());
    }

    private AuthenticatedPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
