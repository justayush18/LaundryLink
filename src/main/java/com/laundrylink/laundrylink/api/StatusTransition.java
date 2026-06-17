package com.laundrylink.laundrylink.api;

public record StatusTransition(
        OrderStatus status,
        long timestamp,
        String notes
) {
}
