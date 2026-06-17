package com.laundrylink.laundrylink.api;

public record PaymentView(
        String paymentId,
        String orderId,
        double amount,
        PaymentMethod paymentMethod,
        PaymentStatus status,
        String transactionId,
        long createdAt,
        long updatedAt
) {
}
