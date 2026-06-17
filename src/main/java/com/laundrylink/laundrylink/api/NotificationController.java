package com.laundrylink.laundrylink.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.service.NotificationService;

@RestController
@RequestMapping(path = "/api/v1/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/history")
    public NotificationHistoryResponse getHistory() {
        AuthenticatedPrincipal principal = currentPrincipal();
        return notificationService.getHistoryResponse(principal.email());
    }

    @PutMapping("/history/{notificationId}/read")
    public void markAsRead(@PathVariable String notificationId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        notificationService.markAsRead(principal.email(), notificationId);
    }

    @GetMapping("/preferences")
    public NotificationPreferencesDto getPreferences() {
        AuthenticatedPrincipal principal = currentPrincipal();
        return notificationService.getPreferences(principal.email());
    }

    @PutMapping(value = "/preferences", consumes = MediaType.APPLICATION_JSON_VALUE)
    public NotificationPreferencesDto updatePreferences(@RequestBody NotificationPreferencesDto dto) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return notificationService.updatePreferences(principal.email(), dto);
    }

    private AuthenticatedPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
