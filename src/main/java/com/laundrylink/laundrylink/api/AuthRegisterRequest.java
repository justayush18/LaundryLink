package com.laundrylink.laundrylink.api;

public record AuthRegisterRequest(String displayName, String email, String password, String phoneNumber,
        UserRoleType role) {
}