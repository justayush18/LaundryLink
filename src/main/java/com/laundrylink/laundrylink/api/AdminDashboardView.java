package com.laundrylink.laundrylink.api;

public record AdminDashboardView(
        long totalUsers,
        long totalCustomers,
        long totalPartners,
        long totalDeliveryPartners,
        long totalOrders,
        double totalRevenue,
        long totalPayments,
        long totalReviews,
        long totalNotifications,
        long totalActivePartners,
        long totalPendingPartnerVerifications
) {
}
