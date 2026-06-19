package com.laundrylink.laundrylink.persistence;

import java.util.ArrayList;
import java.util.List;
import com.laundrylink.laundrylink.api.OrderStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "orders")
public class OrderEntity extends AuditedEntity {

    @Id
    private String orderId;

    @Column(nullable = false)
    private String customerEmail;

    @Column(nullable = false)
    private String partnerEmail;

    private String deliveryPartnerEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    private double totalCost;
    
    private String pickupAddress;
    private String pickupSlot;
    private String deliveryAddress;
    private String deliverySlot;
    
    @Column(columnDefinition = "TEXT")
    private String statusNotes;
    
    private String paymentId;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private List<OrderItemEntity> items = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private List<StatusTransitionEntity> history = new ArrayList<>();

    public OrderEntity() {}

    public OrderEntity(String orderId, String customerEmail, String partnerEmail, double totalCost,
                       String pickupAddress, String pickupSlot, String deliveryAddress, String deliverySlot) {
        this.orderId = orderId;
        this.customerEmail = customerEmail;
        this.partnerEmail = partnerEmail;
        this.totalCost = totalCost;
        this.pickupAddress = pickupAddress;
        this.pickupSlot = pickupSlot;
        this.deliveryAddress = deliveryAddress;
        this.deliverySlot = deliverySlot;
        this.status = OrderStatus.PLACED;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getPartnerEmail() {
        return partnerEmail;
    }

    public void setPartnerEmail(String partnerEmail) {
        this.partnerEmail = partnerEmail;
    }

    public String getDeliveryPartnerEmail() {
        return deliveryPartnerEmail;
    }

    public void setDeliveryPartnerEmail(String deliveryPartnerEmail) {
        this.deliveryPartnerEmail = deliveryPartnerEmail;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public double getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(double totalCost) {
        this.totalCost = totalCost;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public String getPickupSlot() {
        return pickupSlot;
    }

    public void setPickupSlot(String pickupSlot) {
        this.pickupSlot = pickupSlot;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getDeliverySlot() {
        return deliverySlot;
    }

    public void setDeliverySlot(String deliverySlot) {
        this.deliverySlot = deliverySlot;
    }

    public String getStatusNotes() {
        return statusNotes;
    }

    public void setStatusNotes(String statusNotes) {
        this.statusNotes = statusNotes;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public List<OrderItemEntity> getItems() {
        return items;
    }

    public void setItems(List<OrderItemEntity> items) {
        this.items = items;
    }

    public List<StatusTransitionEntity> getHistory() {
        return history;
    }

    public void setHistory(List<StatusTransitionEntity> history) {
        this.history = history;
    }

    private boolean acceptedByRider = false;

    public boolean isAcceptedByRider() {
        return acceptedByRider;
    }

    public void setAcceptedByRider(boolean acceptedByRider) {
        this.acceptedByRider = acceptedByRider;
    }
}
