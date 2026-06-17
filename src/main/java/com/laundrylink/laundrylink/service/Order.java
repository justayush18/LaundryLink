package com.laundrylink.laundrylink.service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import com.laundrylink.laundrylink.api.OrderItemDto;
import com.laundrylink.laundrylink.api.OrderStatus;
import com.laundrylink.laundrylink.api.StatusTransition;

public class Order {
    private final String orderId;
    private final String customerEmail;
    private final String partnerEmail;
    private volatile String deliveryPartnerEmail;
    private volatile OrderStatus status;
    private final List<OrderItemDto> items;
    private final double totalCost;
    
    private final String pickupAddress;
    private final String pickupSlot;
    private final String deliveryAddress;
    private final String deliverySlot;
    
    private volatile String statusNotes;
    private final long createdAt;
    private volatile long updatedAt;
    private volatile String paymentId;
    
    private final List<StatusTransition> history = new CopyOnWriteArrayList<>();

    public Order(String orderId, String customerEmail, String partnerEmail, List<OrderItemDto> items, double totalCost,
                 String pickupAddress, String pickupSlot, String deliveryAddress, String deliverySlot) {
        this.orderId = orderId;
        this.customerEmail = customerEmail;
        this.partnerEmail = partnerEmail;
        this.items = List.copyOf(items);
        this.totalCost = totalCost;
        this.pickupAddress = pickupAddress;
        this.pickupSlot = pickupSlot;
        this.deliveryAddress = deliveryAddress;
        this.deliverySlot = deliverySlot;
        
        long now = System.currentTimeMillis() / 1000L;
        this.createdAt = now;
        this.updatedAt = now;
        
        this.status = OrderStatus.PLACED;
        this.history.add(new StatusTransition(OrderStatus.PLACED, now, "Order placed successfully."));
    }

    public String getOrderId() {
        return orderId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getPartnerEmail() {
        return partnerEmail;
    }

    public String getDeliveryPartnerEmail() {
        return deliveryPartnerEmail;
    }

    public void setDeliveryPartnerEmail(String deliveryPartnerEmail) {
        this.deliveryPartnerEmail = deliveryPartnerEmail;
        touch();
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void transitionStatus(OrderStatus newStatus, String notes) {
        long now = System.currentTimeMillis() / 1000L;
        this.status = newStatus;
        this.statusNotes = notes;
        this.history.add(new StatusTransition(newStatus, now, notes));
        touch();
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public double getTotalCost() {
        return totalCost;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public String getPickupSlot() {
        return pickupSlot;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public String getDeliverySlot() {
        return deliverySlot;
    }

    public String getStatusNotes() {
        return statusNotes;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public long getUpdatedAt() {
        return updatedAt;
    }

    public List<StatusTransition> getHistory() {
        return Collections.unmodifiableList(history);
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
        touch();
    }

    private void touch() {
        this.updatedAt = System.currentTimeMillis() / 1000L;
    }
}
