package com.laundrylink.laundrylink.api;

import java.util.List;

public record UserProfileView(String role, String displayName, String email, String phoneNumber, String accountStatus,
        List<String> capabilities) {
}