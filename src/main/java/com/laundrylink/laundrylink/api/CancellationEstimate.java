package com.laundrylink.laundrylink.api;

public record CancellationEstimate(
        double cancellationChargePercentage,
        double cancellationFee,
        double refundAmount,
        String message
) {}
