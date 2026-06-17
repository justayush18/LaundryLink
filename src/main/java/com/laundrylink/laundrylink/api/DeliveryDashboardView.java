package com.laundrylink.laundrylink.api;

import java.util.List;

public record DeliveryDashboardView(
        List<OrderView> pendingPickups,
        List<OrderView> pendingDeliveries,
        List<OrderView> assignedTasks
) {
}
