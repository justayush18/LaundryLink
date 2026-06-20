package com.laundrylink.laundrylink.api;

public record AuthenticatedUserView(
        String displayName,
        String email,
        String phoneNumber,
        UserRoleType role,
        boolean termsAccepted,
        Long termsAcceptanceTimestamp,
        String termsAcceptedVersion,
        boolean emailVerified
) {
}