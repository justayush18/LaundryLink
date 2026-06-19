package com.laundrylink.laundrylink.api;

public enum OrderStatus {
    PLACED,
    ACCEPTED,
    PROCESSING,
    READY_FOR_DELIVERY,
    PICKUP_ASSIGNED,
    ARRIVED_AT_PICKUP,
    PICKED_UP,
    DELIVERY_ASSIGNED,
    DELIVERED,
    CANCELLED
}
