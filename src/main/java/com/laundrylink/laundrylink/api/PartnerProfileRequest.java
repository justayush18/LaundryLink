package com.laundrylink.laundrylink.api;

public record PartnerProfileRequest(
        String businessName,
        String description,
        String serviceHubAddress
) {
}
