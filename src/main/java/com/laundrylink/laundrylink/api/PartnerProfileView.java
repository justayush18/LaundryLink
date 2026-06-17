package com.laundrylink.laundrylink.api;

public record PartnerProfileView(
        String email,
        String businessName,
        String description,
        String serviceHubAddress,
        String onboardingStatus
) {
}
