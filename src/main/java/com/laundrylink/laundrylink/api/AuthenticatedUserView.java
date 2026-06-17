package com.laundrylink.laundrylink.api;

public record AuthenticatedUserView(String displayName, String email, String phoneNumber, UserRoleType role) {
}