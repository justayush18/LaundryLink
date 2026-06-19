package com.laundrylink.laundrylink.api;

import java.util.List;

public record OrderView(
        String orderId,
        String customerEmail,
        String partnerEmail,
        String deliveryPartnerEmail,
        String paymentId,
        OrderStatus status,
        List<OrderItemDto> items,
        double totalCost,
        String pickupAddress,
        String pickupSlot,
        String deliveryAddress,
        String deliverySlot,
        String statusNotes,
        long createdAt,
        long updatedAt,
        List<StatusTransition> history,
        boolean acceptedByRider,
        Double cancellationFee,
        Double refundAmount
) {
}
