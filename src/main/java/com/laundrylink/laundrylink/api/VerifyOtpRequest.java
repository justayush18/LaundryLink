package com.laundrylink.laundrylink.api;

public record VerifyOtpRequest(String email, String otpCode) {}
