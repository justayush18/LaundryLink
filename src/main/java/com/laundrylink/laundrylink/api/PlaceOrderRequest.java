package com.laundrylink.laundrylink.api;

import java.util.List;

public record PlaceOrderRequest(
        String partnerEmail,
        List<OrderItemDto> items,
        String pickupAddress,
        String pickupSlot,
        String deliveryAddress,
        String deliverySlot
) {
}
