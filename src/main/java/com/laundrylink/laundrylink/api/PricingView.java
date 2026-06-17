package com.laundrylink.laundrylink.api;

import java.util.List;

public record PricingView(
        String email,
        List<RateCardItem> rateCard
) {
}
