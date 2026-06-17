package com.laundrylink.laundrylink.api;

public record OrderItemDto(
        String itemCategory,
        String serviceType,
        int quantity
) {
}
