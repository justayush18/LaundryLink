package com.laundrylink.laundrylink.api;

public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds, AuthenticatedUserView user) {
}