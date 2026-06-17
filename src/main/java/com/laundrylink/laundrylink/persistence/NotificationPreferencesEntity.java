package com.laundrylink.laundrylink.persistence;

import jakarta.persistence.*;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreferencesEntity {

    @Id
    private String recipientEmail;

    private boolean orderStatusAlerts = true;
    private boolean paymentAlerts = true;
    private boolean deliveryAlerts = true;
    private boolean reviewReminders = true;

    public NotificationPreferencesEntity() {}

    public NotificationPreferencesEntity(String recipientEmail) {
        this.recipientEmail = recipientEmail;
        this.orderStatusAlerts = true;
        this.paymentAlerts = true;
        this.deliveryAlerts = true;
        this.reviewReminders = true;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public boolean isOrderStatusAlerts() {
        return orderStatusAlerts;
    }

    public void setOrderStatusAlerts(boolean orderStatusAlerts) {
        this.orderStatusAlerts = orderStatusAlerts;
    }

    public boolean isPaymentAlerts() {
        return paymentAlerts;
    }

    public void setPaymentAlerts(boolean paymentAlerts) {
        this.paymentAlerts = paymentAlerts;
    }

    public boolean isDeliveryAlerts() {
        return deliveryAlerts;
    }

    public void setDeliveryAlerts(boolean deliveryAlerts) {
        this.deliveryAlerts = deliveryAlerts;
    }

    public boolean isReviewReminders() {
        return reviewReminders;
    }

    public void setReviewReminders(boolean reviewReminders) {
        this.reviewReminders = reviewReminders;
    }
}
