package com.laundrylink.laundrylink.api;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laundrylink.laundrylink.service.UserManagementService;

@RestController
@RequestMapping(path = "/api/v1/users", produces = MediaType.APPLICATION_JSON_VALUE)
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping("/roles")
    public List<UserRoleSummary> roles() {
        return userManagementService.roleSummaries();
    }

    @GetMapping("/profiles")
    public List<UserProfileView> profiles() {
        return userManagementService.profiles();
    }

    @GetMapping("/{role}/profile")
    public UserProfileView profile(@PathVariable UserRoleType role) {
        return userManagementService.profile(role);
    }

    @GetMapping("/{role}/addresses")
    public List<AddressView> addresses(@PathVariable UserRoleType role) {
        return userManagementService.addresses(role);
    }
}