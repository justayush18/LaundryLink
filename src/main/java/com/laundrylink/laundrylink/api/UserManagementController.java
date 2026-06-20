package com.laundrylink.laundrylink.api;

import java.util.List;

import com.laundrylink.laundrylink.service.UserManagementService;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping(path = "/api/v1/users", produces = MediaType.APPLICATION_JSON_VALUE)
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping("/roles")
    public List<UserRoleSummary> roles() {
        requireAdmin();
        return userManagementService.roleSummaries();
    }

    @GetMapping("/profiles")
    public List<UserProfileView> profiles() {
        requireAdmin();
        return userManagementService.profiles();
    }

    @GetMapping("/{role}/profile")
    public UserProfileView profile(@PathVariable UserRoleType role) {
        requireAdminOrCurrentRole(role);
        return userManagementService.profile(role);
    }

    @GetMapping("/{role}/addresses")
    public List<AddressView> addresses(@PathVariable UserRoleType role) {
        requireAdminOrCurrentRole(role);
        return userManagementService.addresses(role);
    }

    @PostMapping(value = "/accept-terms", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthenticatedUserView acceptTerms(@RequestBody AcceptTermsRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof com.laundrylink.laundrylink.security.AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userManagementService.acceptTerms(principal.email(), request.acceptedVersion());
    }

    private void requireAdmin() {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    private void requireAdminOrCurrentRole(UserRoleType role) {
        if (isAdmin()) {
            return;
        }
        UserRoleType currentRole = currentRole();
        if (currentRole != role) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for selected role");
        }
    }

    private boolean isAdmin() {
        return currentRole() == UserRoleType.ADMIN;
    }

    private UserRoleType currentRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof com.laundrylink.laundrylink.security.AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.role();
    }
}