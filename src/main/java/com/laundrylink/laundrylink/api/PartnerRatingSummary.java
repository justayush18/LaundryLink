package com.laundrylink.laundrylink.api;

import java.util.List;

public record PartnerRatingSummary(
        String partnerEmail,
        double averageRating,
        int totalReviews,
        int oneStarCount,
        int twoStarCount,
        int threeStarCount,
        int fourStarCount,
        int fiveStarCount,
        List<ReviewView> reviews
) {
}
