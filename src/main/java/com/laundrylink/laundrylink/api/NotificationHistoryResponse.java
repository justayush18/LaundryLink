package com.laundrylink.laundrylink.api;

import java.util.List;

public record NotificationHistoryResponse(
        int totalNotifications,
        int unreadNotifications,
        int readNotifications,
        List<NotificationView> notifications
) {
}
