package com.laundrylink.laundrylink.api;

public record InitiatePaymentRequest(
        String orderId,
        PaymentMethod paymentMethod
) {
}
