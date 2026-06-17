package com.laundrylink.laundrylink.api;

public record ReviewRequest(
        String orderId,
        int rating,
        String comment
) {
}
