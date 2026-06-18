package com.laundrylink.laundrylink.api;

public record AdminRevenueReport(
        double dailyRevenue,
        double weeklyRevenue,
        double monthlyRevenue,
        double totalRevenue
) {
}
