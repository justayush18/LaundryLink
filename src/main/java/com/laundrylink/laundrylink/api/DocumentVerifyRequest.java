package com.laundrylink.laundrylink.api;

public record DocumentVerifyRequest(
        String status,
        String rejectionReason
) {
}
