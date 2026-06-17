package com.laundrylink.laundrylink.api;

public record AvailabilitySlot(
        String dayOfWeek,
        String startTime,
        String endTime,
        int maxOrders
) {
}
