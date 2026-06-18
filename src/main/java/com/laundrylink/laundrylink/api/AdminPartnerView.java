package com.laundrylink.laundrylink.api;

import java.util.List;

public record AdminPartnerView(
        String email,
        String businessName,
        String description,
        String serviceHubAddress,
        String onboardingStatus,
        double reputationScore,
        int totalReviews,
        List<PartnerDocumentView> documents
) {
}
