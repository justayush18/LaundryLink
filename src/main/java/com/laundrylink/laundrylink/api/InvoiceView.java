package com.laundrylink.laundrylink.api;

import java.util.List;

public record InvoiceView(
        String invoiceId,
        String orderId,
        String paymentId,
        String customerEmail,
        String partnerEmail,
        double amount,
        List<OrderItemDto> items,
        InvoiceStatus invoiceStatus,
        long generatedAt
) {
}
