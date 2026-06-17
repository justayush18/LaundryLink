package com.laundrylink.laundrylink.api;

public record NotificationView(
        String notificationId,
        String recipientEmail,
        NotificationType type,
        String message,
        long createdAt,
        boolean read,
        boolean emailSent
) {
}
