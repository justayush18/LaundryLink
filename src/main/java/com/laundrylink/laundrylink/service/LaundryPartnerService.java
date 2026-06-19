package com.laundrylink.laundrylink.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.context.annotation.Lazy;

import com.laundrylink.laundrylink.api.AvailabilitySlot;
import com.laundrylink.laundrylink.api.AvailabilityView;
import com.laundrylink.laundrylink.api.PartnerDocumentView;
import com.laundrylink.laundrylink.api.PartnerProfileView;
import com.laundrylink.laundrylink.api.PricingView;
import com.laundrylink.laundrylink.api.RateCardItem;
import com.laundrylink.laundrylink.api.ServiceAreaView;
import com.laundrylink.laundrylink.api.OrderStatus;
import com.laundrylink.laundrylink.api.CancellationEvent;
import com.laundrylink.laundrylink.persistence.OrderEntity;
import com.laundrylink.laundrylink.persistence.StatusTransitionEntity;
import com.laundrylink.laundrylink.persistence.AvailabilitySlotEntity;
import com.laundrylink.laundrylink.persistence.PartnerDocumentEntity;
import com.laundrylink.laundrylink.persistence.PartnerEntity;
import com.laundrylink.laundrylink.persistence.PartnerRepository;
import com.laundrylink.laundrylink.persistence.RateCardItemEntity;
import com.laundrylink.laundrylink.persistence.OrderRepository;

@Service
public class LaundryPartnerService {

    private final PartnerRepository partnerRepository;
    private final OrderRepository orderRepository;

    public LaundryPartnerService(PartnerRepository partnerRepository, @Lazy OrderRepository orderRepository) {
        this.partnerRepository = partnerRepository;
        this.orderRepository = orderRepository;
        seedDefaultPartner();
    }

    public PartnerProfileView getProfile(String email) {
        PartnerEntity profile = getOrCreateProfile(email);
        return mapToView(profile, getFastestSla());
    }

    public List<PartnerProfileView> getAllPartners() {
        int fastest = getFastestSla();
        return partnerRepository.findAll().stream()
                .map(profile -> mapToView(profile, fastest))
                .collect(Collectors.toList());
    }

    public PartnerProfileView updateProfile(
            String email,
            String businessName,
            String description,
            String serviceHubAddress,
            String openingTime,
            String closingTime,
            Integer serviceSlaHours,
            Integer dailyCapacityLimit
    ) {
        PartnerEntity profile = getOrCreateProfile(email);
        profile.setBusinessName(businessName);
        profile.setDescription(description);
        profile.setServiceHubAddress(serviceHubAddress);
        if (openingTime != null) {
            profile.setOpeningTime(openingTime);
        }
        if (closingTime != null) {
            profile.setClosingTime(closingTime);
        }
        if (serviceSlaHours != null) {
            profile.setServiceSlaHours(serviceSlaHours);
        }
        if (dailyCapacityLimit != null) {
            profile.setDailyCapacityLimit(dailyCapacityLimit);
        }
        partnerRepository.save(profile);
        return mapToView(profile, getFastestSla());
    }

    private int getFastestSla() {
        return partnerRepository.findAll().stream()
                .filter(p -> "ACTIVE".equals(p.getOnboardingStatus()))
                .mapToInt(PartnerEntity::getServiceSlaHours)
                .min()
                .orElse(6);
    }

    private int getCapacityUsed(String partnerEmail) {
        if (orderRepository == null) return 0;
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        java.time.LocalDate today = nowIst.toLocalDate();

        return (int) orderRepository.findByPartnerEmail(partnerEmail).stream()
                .filter(o -> {
                    java.time.Instant instant = java.time.Instant.ofEpochSecond(o.getCreatedAt());
                    java.time.ZonedDateTime orderTimeIst = instant.atZone(java.time.ZoneId.of("Asia/Kolkata"));
                    return orderTimeIst.toLocalDate().equals(today) && o.getStatus() != OrderStatus.CANCELLED;
                })
                .count();
    }

    private PartnerProfileView mapToView(PartnerEntity profile, int fastestSlaHours) {
        java.time.ZoneId zone = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now(zone);
        java.time.LocalTime currentTime = now.toLocalTime();
        java.time.LocalDate currentDate = now.toLocalDate();

        String openingTimeStr = profile.getOpeningTime() != null ? profile.getOpeningTime() : "09:00";
        String closingTimeStr = profile.getClosingTime() != null ? profile.getClosingTime() : "21:00";
        java.time.LocalTime open = java.time.LocalTime.parse(openingTimeStr);
        java.time.LocalTime close = java.time.LocalTime.parse(closingTimeStr);
        int sla = profile.getServiceSlaHours() > 0 ? profile.getServiceSlaHours() : 6;
        int limit = profile.getDailyCapacityLimit() > 0 ? profile.getDailyCapacityLimit() : 20;

        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("h:mm a");

        String openStatus;
        String earliestDeliveryTime;
        boolean nextDayDelivery = false;
        String nextAvailableSlot = null;

        boolean isOpen = !currentTime.isBefore(open) && !currentTime.isAfter(close);
        if (isOpen) {
            openStatus = "OPEN";
            long remainingMinutes = java.time.temporal.ChronoUnit.MINUTES.between(currentTime, close);
            long slaMinutes = sla * 60L;
            if (remainingMinutes >= slaMinutes) {
                java.time.LocalTime deliveryTime = currentTime.plusMinutes(slaMinutes);
                earliestDeliveryTime = "Today before " + deliveryTime.format(timeFormatter);
                nextDayDelivery = false;
            } else {
                long rolloverMinutes = slaMinutes - remainingMinutes;
                java.time.LocalTime deliveryTime = open.plusMinutes(rolloverMinutes);
                earliestDeliveryTime = "Tomorrow before " + deliveryTime.format(timeFormatter);
                nextDayDelivery = true;
            }
        } else {
            openStatus = "CLOSED";
            if (currentTime.isBefore(open)) {
                java.time.LocalTime deliveryTime = open.plusHours(sla);
                earliestDeliveryTime = "Today before " + deliveryTime.format(timeFormatter);
                nextAvailableSlot = "Today " + open.format(timeFormatter);
                nextDayDelivery = false;
            } else {
                java.time.LocalTime deliveryTime = open.plusHours(sla);
                earliestDeliveryTime = "Tomorrow before " + deliveryTime.format(timeFormatter);
                nextAvailableSlot = "Tomorrow " + open.format(timeFormatter);
                nextDayDelivery = true;
            }
        }

        int used = getCapacityUsed(profile.getEmail());
        int remaining = limit - used;
        String capacityIndicator;
        if (remaining <= 0) {
            capacityIndicator = "Fully Booked Today";
        } else if (remaining <= 3) {
            capacityIndicator = "Limited Availability (" + remaining + "/" + limit + " slots remaining)";
        } else {
            capacityIndicator = "Available Today (" + remaining + "/" + limit + " slots remaining)";
        }

        boolean fastestDelivery = (sla <= fastestSlaHours) && "ACTIVE".equals(profile.getOnboardingStatus());

        int cancellationsUsed = getMonthlyCancellationsCount(profile.getEmail());
        double cancellationPercentage = getCancellationPercentage(profile.getEmail(), cancellationsUsed);
        double penaltyPerOrder = profile.getCancellationPenaltyPerOrder();
        List<CancellationEvent> history = getCancellationHistory(profile.getEmail(), penaltyPerOrder);
        double penaltyOwed = 0.0;
        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(kolkata);
        java.time.YearMonth currentYm = java.time.YearMonth.from(nowIst.toLocalDate());
        for (CancellationEvent event : history) {
            java.time.Instant instant = java.time.Instant.ofEpochSecond(event.cancelledAt());
            java.time.YearMonth ym = java.time.YearMonth.from(instant.atZone(kolkata).toLocalDate());
            if (ym.equals(currentYm)) {
                penaltyOwed += event.penaltyApplied();
            }
        }

        return new PartnerProfileView(
                profile.getEmail(),
                profile.getBusinessName(),
                profile.getDescription(),
                profile.getServiceHubAddress(),
                profile.getOnboardingStatus(),
                profile.getReputationScore(),
                profile.getTotalReviews(),
                openingTimeStr,
                closingTimeStr,
                sla,
                limit,
                used,
                openStatus,
                earliestDeliveryTime,
                nextDayDelivery,
                nextAvailableSlot,
                capacityIndicator,
                fastestDelivery,
                cancellationsUsed,
                cancellationPercentage,
                penaltyPerOrder,
                penaltyOwed,
                history
        );
    }

    public void updateReputation(String partnerEmail, double reputationScore, int totalReviews) {
        partnerRepository.findByEmail(partnerEmail.trim().toLowerCase()).ifPresent(profile -> {
            profile.setReputationScore(reputationScore);
            profile.setTotalReviews(totalReviews);
            partnerRepository.save(profile);
        });
    }

    public ServiceAreaView getServiceAreas(String email) {
        PartnerEntity profile = getOrCreateProfile(email);
        return new ServiceAreaView(profile.getEmail(), profile.getServiceAreas());
    }

    public ServiceAreaView updateServiceAreas(String email, List<String> zipCodes) {
        PartnerEntity profile = getOrCreateProfile(email);
        profile.setServiceAreas(new ArrayList<>(zipCodes));
        partnerRepository.save(profile);
        return new ServiceAreaView(profile.getEmail(), profile.getServiceAreas());
    }

    public AvailabilityView getAvailability(String email) {
        PartnerEntity profile = getOrCreateProfile(email);
        return new AvailabilityView(profile.getEmail(), toAvailabilitySlots(profile.getAvailabilitySlots()));
    }

    public AvailabilityView updateAvailability(String email, List<AvailabilitySlot> slots) {
        PartnerEntity profile = getOrCreateProfile(email);
        profile.setAvailabilitySlots(toAvailabilitySlotEntities(slots));
        partnerRepository.save(profile);
        return new AvailabilityView(profile.getEmail(), toAvailabilitySlots(profile.getAvailabilitySlots()));
    }

    public List<PartnerDocumentView> getDocuments(String email) {
        PartnerEntity profile = getOrCreateProfile(email);
        return toDocumentViews(profile.getDocuments());
    }

    public PartnerDocumentView uploadDocument(String email, String type, String fileName) {
        PartnerEntity profile = getOrCreateProfile(email);
        String docId = UUID.randomUUID().toString();
        PartnerDocumentEntity doc = new PartnerDocumentEntity(
                docId,
                type,
                fileName,
                "PENDING_VERIFICATION",
                null
        );
        profile.getDocuments().add(doc);
        partnerRepository.save(profile);
        return new PartnerDocumentView(docId, type, fileName, "PENDING_VERIFICATION", null);
    }

    public PartnerDocumentView verifyDocument(String email, String documentId, String status, String rejectionReason) {
        PartnerEntity profile = partnerRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partner profile not found"));
        
        PartnerDocumentEntity found = profile.getDocuments().stream()
                .filter(d -> d.getDocumentId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
        
        found.setVerificationStatus(status);
        found.setRejectionReason(rejectionReason);
        
        // If all uploaded documents are verified, update onboarding status to ACTIVE
        boolean allVerified = true;
        List<PartnerDocumentEntity> docs = profile.getDocuments();
        if (docs.isEmpty()) {
            allVerified = false;
        } else {
            for (PartnerDocumentEntity d : docs) {
                if (!"VERIFIED".equalsIgnoreCase(d.getVerificationStatus())) {
                    allVerified = false;
                    break;
                }
            }
        }
        
        if (allVerified) {
            profile.setOnboardingStatus("ACTIVE");
        } else if ("REJECTED".equalsIgnoreCase(status)) {
            profile.setOnboardingStatus("PENDING");
        }

        partnerRepository.save(profile);
        return new PartnerDocumentView(
                found.getDocumentId(),
                found.getDocumentType(),
                found.getFileName(),
                found.getVerificationStatus(),
                found.getRejectionReason()
        );
    }

    public PricingView getPricing(String email) {
        PartnerEntity profile = getOrCreateProfile(email);
        return new PricingView(profile.getEmail(), toRateCardItems(profile.getPricingRateCard()));
    }

    public PricingView updatePricing(String email, List<RateCardItem> rateCard) {
        PartnerEntity profile = getOrCreateProfile(email);
        profile.getPricingRateCard().clear();
        profile.getPricingRateCard().addAll(toRateCardItemEntities(rateCard));
        partnerRepository.save(profile);
        return new PricingView(profile.getEmail(), toRateCardItems(profile.getPricingRateCard()));
    }

    private PartnerEntity getOrCreateProfile(String email) {
        String normalized = email.trim().toLowerCase();
        return partnerRepository.findByEmail(normalized)
                .orElseGet(() -> {
                    PartnerEntity partner = new PartnerEntity(
                            normalized,
                            "New Laundry Partner",
                            "Please update business description.",
                            "Please update service hub address.",
                            "PENDING"
                    );
                    return partnerRepository.save(partner);
                });
    }

    private void seedDefaultPartner() {
        if (partnerRepository.findByEmail("partner@freshfold.example").isEmpty()) {
            PartnerEntity profile = new PartnerEntity(
                    "partner@freshfold.example",
                    "FreshFold Laundry",
                    "Premium laundry services including Wash & Fold, Dry Cleaning, and ironing.",
                    "102, Saket District Centre, New Delhi, 110017",
                    "ACTIVE"
            );

            profile.setOpeningTime("09:00");
            profile.setClosingTime("21:00");
            profile.setServiceSlaHours(6);
            profile.setDailyCapacityLimit(20);

            profile.setServiceAreas(new ArrayList<>(List.of("110017", "110016", "110020")));

            List<AvailabilitySlotEntity> slots = new ArrayList<>(List.of(
                    new AvailabilitySlotEntity("Monday", "09:00", "18:00", 20),
                    new AvailabilitySlotEntity("Wednesday", "09:00", "18:00", 20),
                    new AvailabilitySlotEntity("Friday", "09:00", "18:00", 20)
            ));
            profile.setAvailabilitySlots(slots);

            PartnerDocumentEntity license = new PartnerDocumentEntity(
                    "doc-lic-001",
                    "BUSINESS_LICENSE",
                    "license_copy.pdf",
                    "VERIFIED",
                    null
            );
            profile.setDocuments(new ArrayList<>(List.of(license)));

            List<RateCardItemEntity> rates = new ArrayList<>(List.of(
                    new RateCardItemEntity("SHIRT", "WASH_AND_FOLD", 40.0),
                    new RateCardItemEntity("SHIRT", "DRY_CLEAN", 80.0),
                    new RateCardItemEntity("PANTS", "WASH_AND_FOLD", 50.0),
                    new RateCardItemEntity("BLANKET", "DRY_CLEAN", 250.0)
            ));
            profile.setPricingRateCard(rates);

            partnerRepository.save(profile);
        } else {
            partnerRepository.findByEmail("partner@freshfold.example").ifPresent(profile -> {
                boolean updated = false;
                if (profile.getOpeningTime() == null) {
                    profile.setOpeningTime("09:00");
                    updated = true;
                }
                if (profile.getClosingTime() == null) {
                    profile.setClosingTime("21:00");
                    updated = true;
                }
                if (profile.getServiceSlaHours() <= 0) {
                    profile.setServiceSlaHours(6);
                    updated = true;
                }
                if (profile.getDailyCapacityLimit() <= 0) {
                    profile.setDailyCapacityLimit(20);
                    updated = true;
                }
                if (updated) {
                    partnerRepository.save(profile);
                }
            });
        }
    }

    private List<AvailabilitySlot> toAvailabilitySlots(List<AvailabilitySlotEntity> entities) {
        return entities.stream()
                .map(e -> new AvailabilitySlot(e.getDayOfWeek(), e.getStartTime(), e.getEndTime(), e.getMaxOrders()))
                .collect(Collectors.toList());
    }

    private List<AvailabilitySlotEntity> toAvailabilitySlotEntities(List<AvailabilitySlot> slots) {
        return slots.stream()
                .map(s -> new AvailabilitySlotEntity(s.dayOfWeek(), s.startTime(), s.endTime(), s.maxOrders()))
                .collect(Collectors.toList());
    }

    private List<PartnerDocumentView> toDocumentViews(List<PartnerDocumentEntity> entities) {
        return entities.stream()
                .map(e -> new PartnerDocumentView(e.getDocumentId(), e.getDocumentType(), e.getFileName(), e.getVerificationStatus(), e.getRejectionReason()))
                .collect(Collectors.toList());
    }

    private List<RateCardItem> toRateCardItems(List<RateCardItemEntity> entities) {
        return entities.stream()
                .map(e -> new RateCardItem(e.getItemCategory(), e.getServiceType(), e.getPrice()))
                .collect(Collectors.toList());
    }

    private List<RateCardItemEntity> toRateCardItemEntities(List<RateCardItem> items) {
        return items.stream()
                .map(i -> new RateCardItemEntity(i.itemCategory(), i.serviceType(), i.price()))
                .collect(Collectors.toList());
    }

    public int getMonthlyCancellationsCount(String email) {
        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(kolkata);
        java.time.ZonedDateTime startOfMonthIst = nowIst.toLocalDate().withDayOfMonth(1).atStartOfDay(kolkata);
        long startOfMonthEpoch = startOfMonthIst.toEpochSecond();

        int count = 0;
        List<OrderEntity> orders = orderRepository.findAll();
        for (OrderEntity o : orders) {
            if (o.getPartnerEmail().equalsIgnoreCase(email) && o.getHistory() != null) {
                for (StatusTransitionEntity transition : o.getHistory()) {
                    if (transition.getStatus() == OrderStatus.CANCELLED 
                            && transition.getTimestamp() >= startOfMonthEpoch
                            && transition.getNotes() != null
                            && transition.getNotes().startsWith("Cancelled by laundry partner:")) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    public double getCancellationPercentage(String email, int cancellationsCount) {
        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.time.ZonedDateTime nowIst = java.time.ZonedDateTime.now(kolkata);
        java.time.ZonedDateTime startOfMonthIst = nowIst.toLocalDate().withDayOfMonth(1).atStartOfDay(kolkata);
        long startOfMonthEpoch = startOfMonthIst.toEpochSecond();

        int totalAccepted = 0;
        List<OrderEntity> orders = orderRepository.findAll();
        for (OrderEntity o : orders) {
            if (o.getPartnerEmail().equalsIgnoreCase(email) && o.getHistory() != null) {
                for (StatusTransitionEntity transition : o.getHistory()) {
                    if (transition.getStatus() == OrderStatus.ACCEPTED 
                            && transition.getTimestamp() >= startOfMonthEpoch) {
                        totalAccepted++;
                        break;
                    }
                }
            }
        }
        int denominator = Math.max(totalAccepted, cancellationsCount);
        if (denominator == 0) return 0.0;
        return ((double) cancellationsCount / denominator) * 100.0;
    }

    public List<CancellationEvent> getCancellationHistory(String email, double penaltyPerOrder) {
        List<OrderEntity> orders = orderRepository.findAll();
        List<CancellationEventRaw> rawEvents = new ArrayList<>();

        for (OrderEntity o : orders) {
            if (o.getPartnerEmail().equalsIgnoreCase(email) && o.getHistory() != null) {
                for (StatusTransitionEntity transition : o.getHistory()) {
                    if (transition.getStatus() == OrderStatus.CANCELLED 
                            && transition.getNotes() != null
                            && transition.getNotes().startsWith("Cancelled by laundry partner:")) {
                        String reason = transition.getNotes().substring("Cancelled by laundry partner:".length()).trim();
                        rawEvents.add(new CancellationEventRaw(o.getOrderId(), transition.getTimestamp(), reason));
                    }
                }
            }
        }

        java.time.ZoneId kolkata = java.time.ZoneId.of("Asia/Kolkata");
        java.util.Map<java.time.YearMonth, List<CancellationEventRaw>> grouped = new java.util.HashMap<>();
        for (CancellationEventRaw raw : rawEvents) {
            java.time.Instant instant = java.time.Instant.ofEpochSecond(raw.timestamp);
            java.time.LocalDate date = instant.atZone(kolkata).toLocalDate();
            java.time.YearMonth ym = java.time.YearMonth.from(date);
            grouped.computeIfAbsent(ym, k -> new ArrayList<>()).add(raw);
        }

        List<CancellationEvent> history = new ArrayList<>();
        for (java.util.Map.Entry<java.time.YearMonth, List<CancellationEventRaw>> entry : grouped.entrySet()) {
            List<CancellationEventRaw> monthEvents = entry.getValue();
            monthEvents.sort(java.util.Comparator.comparingLong(e -> e.timestamp));
            for (int i = 0; i < monthEvents.size(); i++) {
                CancellationEventRaw raw = monthEvents.get(i);
                double penalty = (i >= 10) ? penaltyPerOrder : 0.0;
                history.add(new CancellationEvent(raw.orderId, raw.timestamp, raw.reason, penalty));
            }
        }

        history.sort((a, b) -> Long.compare(b.cancelledAt(), a.cancelledAt()));
        return history;
    }

    private static record CancellationEventRaw(String orderId, long timestamp, String reason) {}
}
