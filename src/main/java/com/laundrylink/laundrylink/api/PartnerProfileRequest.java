package com.laundrylink.laundrylink.api;

public record PartnerProfileRequest(
        String businessName,
        String description,
        String serviceHubAddress,
        String openingTime,
        String closingTime,
        Integer serviceSlaHours,
        Integer dailyCapacityLimit
) {
}

