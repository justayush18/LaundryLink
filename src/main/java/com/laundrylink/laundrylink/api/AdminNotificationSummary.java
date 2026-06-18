package com.laundrylink.laundrylink.api;

import java.util.Map;

public record AdminNotificationSummary(
        long totalNotifications,
        long unreadNotifications,
        long readNotifications,
        long totalEmailsSent,
        Map<String, Long> notificationsByType
) {
}
