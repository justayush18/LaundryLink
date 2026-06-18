package com.laundrylink.laundrylink.api;

public record PartnerPerformanceAnalytics(
        String partnerEmail,
        String businessName,
        long totalOrders,
        long completedOrders,
        double averageRating,
        double totalRevenueGenerated,
        String onboardingStatus
) {
}
