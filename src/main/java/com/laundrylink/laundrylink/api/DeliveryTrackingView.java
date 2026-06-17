package com.laundrylink.laundrylink.api;

import java.util.List;

public record DeliveryTrackingView(
        String orderId,
        OrderStatus status,
        String customerEmail,
        String pickupAddress,
        String pickupSlot,
        String deliveryAddress,
        String deliverySlot,
        String statusNotes,
        long updatedAt,
        List<StatusTransition> history
) {
}
