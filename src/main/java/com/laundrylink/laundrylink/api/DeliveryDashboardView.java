package com.laundrylink.laundrylink.api;

import java.util.List;

public record DeliveryDashboardView(
        List<OrderView> assignedTasks,
        List<OrderView> activeDeliveries,
        List<OrderView> upcomingPickups,
        List<OrderView> completedDeliveries,
        double todayEarnings,
        double weeklyEarnings,
        double monthlyEarnings,
        double totalEarnings,
        int dailyCancellations,
        boolean online
) {
}
