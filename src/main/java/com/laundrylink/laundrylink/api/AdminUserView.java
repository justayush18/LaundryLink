package com.laundrylink.laundrylink.api;

public record AdminUserView(
        String email,
        String displayName,
        String phoneNumber,
        UserRoleType role,
        boolean active,
        long createdAt,
        long updatedAt
) {
}
