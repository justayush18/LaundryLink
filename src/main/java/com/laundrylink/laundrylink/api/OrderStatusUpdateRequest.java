package com.laundrylink.laundrylink.api;

public record OrderStatusUpdateRequest(
        OrderStatus status,
        String statusNotes
) {
}
