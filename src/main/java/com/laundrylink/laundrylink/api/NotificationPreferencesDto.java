package com.laundrylink.laundrylink.api;

public record NotificationPreferencesDto(
        boolean orderStatusAlerts,
        boolean paymentAlerts,
        boolean deliveryAlerts,
        boolean reviewReminders
) {
}
