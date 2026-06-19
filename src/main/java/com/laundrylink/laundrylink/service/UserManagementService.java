package com.laundrylink.laundrylink.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;

import com.laundrylink.laundrylink.api.AddressView;
import com.laundrylink.laundrylink.api.UserProfileView;
import com.laundrylink.laundrylink.api.UserRoleSummary;
import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.persistence.UserRepository;
import com.laundrylink.laundrylink.persistence.UserEntity;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final OrderService orderService;

    public UserManagementService(UserRepository userRepository, @Lazy OrderService orderService) {
        this.userRepository = userRepository;
        this.orderService = orderService;
    }

    public List<UserRoleSummary> roleSummaries() {
        return List.of(
                new UserRoleSummary("Customer", "Places orders and manages delivery addresses"),
                new UserRoleSummary("Laundry Partner", "Processes orders and manages service availability"),
                new UserRoleSummary("Delivery Partner", "Handles pickup and delivery execution"),
                new UserRoleSummary("Admin", "Oversees users, partners, and platform operations"));
    }

    public List<UserProfileView> profiles() {
        return userRepository.findAll().stream()
                .map(this::toProfileView)
                .collect(Collectors.toList());
    }

    public UserProfileView profile(UserRoleType role) {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == role)
                .findFirst()
                .map(this::toProfileView)
                .orElse(null);
    }

    public List<AddressView> addresses(UserRoleType role) {
        if (role == UserRoleType.CUSTOMER) {
            return List.of(
                    new AddressView("Home", "12 Green Park Road", "Bengaluru", "Karnataka", "560001", true),
                    new AddressView("Office", "87 Tech Street", "Bengaluru", "Karnataka", "560103", false));
        }
        return List.of();
    }

    private UserProfileView toProfileView(UserEntity u) {
        Integer cancellationsCount = null;
        Integer remainingFree = null;
        if (u.getRole() == UserRoleType.CUSTOMER) {
            cancellationsCount = orderService.getCustomerMonthlyCancellationsCount(u.getEmail());
            remainingFree = Math.max(0, 3 - cancellationsCount);
        }

        return new UserProfileView(
                u.getRole().name(),
                u.getDisplayName(),
                u.getEmail(),
                u.getPhoneNumber(),
                "ACTIVE",
                getCapabilities(u.getRole()),
                cancellationsCount,
                remainingFree
        );
    }

    private List<String> getCapabilities(UserRoleType role) {
        return switch (role) {
            case CUSTOMER -> List.of(
                    "Register and login",
                    "Place and track orders",
                    "Manage profile and addresses",
                    "Pay online",
                    "Receive OTP-based order verification");
            case LAUNDRY_PARTNER -> List.of(
                    "Accept or reject orders",
                    "Update order status",
                    "Manage service availability",
                    "View earnings");
            case DELIVERY_PARTNER -> List.of(
                    "Accept pickup assignments",
                    "Pickup and deliver orders",
                    "Update delivery status",
                    "Track assigned jobs");
            case ADMIN -> List.of(
                    "Manage users",
                    "Manage partners",
                    "Review reports",
                    "Handle disputes");
        };
    }
}