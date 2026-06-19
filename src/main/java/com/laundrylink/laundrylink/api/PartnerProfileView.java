package com.laundrylink.laundrylink.api;

public record PartnerProfileView(
        String email,
        String businessName,
        String description,
        String serviceHubAddress,
        String onboardingStatus,
        double reputationScore,
        int totalReviews,
        String openingTime,
        String closingTime,
        int serviceSlaHours,
        int dailyCapacityLimit,
        int capacityUsed,
        String openStatus,
        String earliestDeliveryTime,
        boolean nextDayDelivery,
        String nextAvailableSlot,
        String capacityIndicator,
        boolean fastestDelivery,
        int monthlyCancellationsUsed,
        double cancellationPercentage,
        double cancellationPenaltyPerOrder,
        double cancellationPenaltyOwed,
        java.util.List<CancellationEvent> cancellationHistory
) {
}
