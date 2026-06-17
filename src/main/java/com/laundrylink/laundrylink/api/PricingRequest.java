package com.laundrylink.laundrylink.api;

import java.util.List;

public record PricingRequest(
        List<RateCardItem> rateCard
) {
}
