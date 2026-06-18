package com.laundrylink.laundrylink.api;

import java.util.Map;

public record AdminAnalyticsSummary(
        double totalRevenue,
        long successfulPaymentsCount,
        double refundedAmount,
        long refundedPaymentsCount,
        String topRatedPartner,
        double averagePartnerReputationScore,
        double averageOrderProcessingTimeHours,
        long totalOrders,
        Map<String, Long> ordersByStatus,
        long totalCustomers,
        long totalPartners,
        long totalDeliveryAgents
) {
}
