package com.laundrylink.laundrylink.service;

import com.laundrylink.laundrylink.api.UserRoleType;

public record RegisteredAccount(String displayName, String email, String passwordHash, String phoneNumber,
        UserRoleType role) {
}