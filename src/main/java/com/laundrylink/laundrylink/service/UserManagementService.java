package com.laundrylink.laundrylink.service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.laundrylink.laundrylink.api.AddressView;
import com.laundrylink.laundrylink.api.UserProfileView;
import com.laundrylink.laundrylink.api.UserRoleSummary;
import com.laundrylink.laundrylink.api.UserRoleType;

@Service
public class UserManagementService {

    private static final Map<UserRoleType, UserProfileView> PROFILES = new EnumMap<>(UserRoleType.class);
    private static final Map<UserRoleType, List<AddressView>> ADDRESSES = new EnumMap<>(UserRoleType.class);

    static {
        PROFILES.put(UserRoleType.CUSTOMER, new UserProfileView(
                "Customer",
                "Aarav Mehta",
                "aarav@example.com",
                "+91-90000-10001",
                "ACTIVE",
                List.of(
                        "Register and login",
                        "Place and track orders",
                        "Manage profile and addresses",
                        "Pay online",
                        "Receive OTP-based order verification")));

        PROFILES.put(UserRoleType.LAUNDRY_PARTNER, new UserProfileView(
                "Laundry Partner",
                "FreshFold Laundry",
                "partner@freshfold.example",
                "+91-90000-20002",
                "ACTIVE",
                List.of(
                        "Accept or reject orders",
                        "Update order status",
                        "Manage service availability",
                        "View earnings")));

        PROFILES.put(UserRoleType.DELIVERY_PARTNER, new UserProfileView(
                "Delivery Partner",
                "Ravi Singh",
                "ravi.delivery@example.com",
                "+91-90000-30003",
                "ACTIVE",
                List.of(
                        "Accept pickup assignments",
                        "Pickup and deliver orders",
                        "Update delivery status",
                        "Track assigned jobs")));

        PROFILES.put(UserRoleType.ADMIN, new UserProfileView(
                "Admin",
                "LaundryLink Admin",
                "admin@laundrylink.example",
                "+91-90000-40004",
                "ACTIVE",
                List.of(
                        "Manage users",
                        "Manage partners",
                        "Review reports",
                        "Handle disputes")));

        ADDRESSES.put(UserRoleType.CUSTOMER, List.of(
                new AddressView("Home", "12 Green Park Road", "Bengaluru", "Karnataka", "560001", true),
                new AddressView("Office", "87 Tech Street", "Bengaluru", "Karnataka", "560103", false)));

        ADDRESSES.put(UserRoleType.LAUNDRY_PARTNER, List.of());
        ADDRESSES.put(UserRoleType.DELIVERY_PARTNER, List.of());
        ADDRESSES.put(UserRoleType.ADMIN, List.of());
    }

    public List<UserRoleSummary> roleSummaries() {
        return List.of(
                new UserRoleSummary("Customer", "Places orders and manages delivery addresses"),
                new UserRoleSummary("Laundry Partner", "Processes orders and manages service availability"),
                new UserRoleSummary("Delivery Partner", "Handles pickup and delivery execution"),
                new UserRoleSummary("Admin", "Oversees users, partners, and platform operations"));
    }

    public List<UserProfileView> profiles() {
        return List.copyOf(PROFILES.values());
    }

    public UserProfileView profile(UserRoleType role) {
        return PROFILES.get(role);
    }

    public List<AddressView> addresses(UserRoleType role) {
        return ADDRESSES.getOrDefault(role, List.of());
    }
}