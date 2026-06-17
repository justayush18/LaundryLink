package com.laundrylink.laundrylink.api;

public record RateCardItem(
        String itemCategory,
        String serviceType,
        double price
) {
}
