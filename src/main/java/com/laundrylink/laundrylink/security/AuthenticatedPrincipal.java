package com.laundrylink.laundrylink.security;

import com.laundrylink.laundrylink.api.UserRoleType;

public record AuthenticatedPrincipal(String displayName, String email, String phoneNumber, UserRoleType role) {
}