package com.laundrylink.laundrylink.api;

public record ReviewView(
        String reviewId,
        String orderId,
        String customerEmail,
        String partnerEmail,
        int rating,
        String comment,
        long createdAt
) {
}
