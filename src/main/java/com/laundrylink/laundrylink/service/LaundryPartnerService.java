package com.laundrylink.laundrylink.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.AvailabilitySlot;
import com.laundrylink.laundrylink.api.AvailabilityView;
import com.laundrylink.laundrylink.api.PartnerDocumentView;
import com.laundrylink.laundrylink.api.PartnerProfileView;
import com.laundrylink.laundrylink.api.PricingView;
import com.laundrylink.laundrylink.api.RateCardItem;
import com.laundrylink.laundrylink.api.ServiceAreaView;
import com.laundrylink.laundrylink.persistence.AvailabilitySlotEntity;
import com.laundrylink.laundrylink.persistence.PartnerDocumentEntity;
import com.laundrylink.laundrylink.persistence.PartnerEntity;
import com.laundrylink.laundrylink.persistence.PartnerRepository;
import com.laundrylink.laundrylink.persistence.RateCardItemEntity;

@Service
public class LaundryPartnerService {

    private final PartnerRepository partnerRepository;

    public LaundryPartnerService(PartnerRepository partnerRepository) {
        this.partnerRepository = partnerRepository;
        seedDefaultPartner();
    }

    public PartnerProfileView getProfile(String email) {
        PartnerEntity profile = getOrCreateProfile(email);
        return new PartnerProfileView(
                profile.getEmail(),
                profile.getBusinessName(),
                profile.getDescription(),
                profile.getServiceHubAddress(),
                profile.getOnboardingStatus(),
                profile.getReputationScore(),
                profile.getTotalReviews()
        );
    }

    public List<PartnerProfileView> getAllPartners() {
        return partnerRepository.findAll().stream()
                .map(profile -> new PartnerProfileView(
                        profile.getEmail(),
                        profile.getBusinessName(),
                        profile.getDescription(),
                        profile.getServiceHubAddress(),
                        profile.getOnboardingStatus(),
                        profile.getReputationScore(),
                        profile.getTotalReviews()
                ))
                .collect(Collectors.toList());
    }

    public PartnerProfileView updateProfile(String email, String businessName, String description, String serviceHubAddress) {
        PartnerEntity profile = getOrCreateProfile(email);
        profile.setBusinessName(businessName);
        profile.setDescription(description);
        profile.setServiceHubAddress(serviceHubAddress);
        partnerRepository.save(profile);
        return new PartnerProfileView(
                profile.getEmail(),
                profile.getBusinessName(),
                profile.getDescription(),
                profile.getServiceHubAddress(),
                profile.getOnboardingStatus(),
                profile.getReputationScore(),
                profile.getTotalReviews()
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
}
