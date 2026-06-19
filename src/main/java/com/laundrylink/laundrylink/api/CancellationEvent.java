package com.laundrylink.laundrylink.api;

public record CancellationEvent(
        String orderId,
        long cancelledAt,
        String reason,
        double penaltyApplied
) {}
