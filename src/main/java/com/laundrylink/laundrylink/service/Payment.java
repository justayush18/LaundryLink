package com.laundrylink.laundrylink.service;

import com.laundrylink.laundrylink.api.PaymentMethod;
import com.laundrylink.laundrylink.api.PaymentStatus;

public class Payment {
    private final String paymentId;
    private final String orderId;
    private final double amount;
    private final PaymentMethod paymentMethod;
    private volatile PaymentStatus status;
    private final String transactionId;
    private final long createdAt;
    private volatile long updatedAt;

    public Payment(String paymentId, String orderId, double amount, PaymentMethod paymentMethod, String transactionId) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.status = PaymentStatus.PENDING;
        this.transactionId = transactionId;
        
        long now = System.currentTimeMillis() / 1000L;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public String getOrderId() {
        return orderId;
    }

    public double getAmount() {
        return amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
        this.updatedAt = System.currentTimeMillis() / 1000L;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public long getUpdatedAt() {
        return updatedAt;
    }
}
