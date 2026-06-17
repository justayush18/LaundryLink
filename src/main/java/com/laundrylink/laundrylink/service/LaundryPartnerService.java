package com.laundrylink.laundrylink.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

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

@Service
public class LaundryPartnerService {

    private final Map<String, PartnerProfile> profilesByEmail = new ConcurrentHashMap<>();

    public LaundryPartnerService() {
        seedDefaultPartner();
    }

    public PartnerProfileView getProfile(String email) {
        PartnerProfile profile = getOrCreateProfile(email);
        return new PartnerProfileView(
                profile.getEmail(),
                profile.getBusinessName(),
                profile.getDescription(),
                profile.getServiceHubAddress(),
                profile.getOnboardingStatus()
        );
    }

    public PartnerProfileView updateProfile(String email, String businessName, String description, String serviceHubAddress) {
        PartnerProfile profile = getOrCreateProfile(email);
        profile.setBusinessName(businessName);
        profile.setDescription(description);
        profile.setServiceHubAddress(serviceHubAddress);
        return new PartnerProfileView(
                profile.getEmail(),
                profile.getBusinessName(),
                profile.getDescription(),
                profile.getServiceHubAddress(),
                profile.getOnboardingStatus()
        );
    }

    public ServiceAreaView getServiceAreas(String email) {
        PartnerProfile profile = getOrCreateProfile(email);
        return new ServiceAreaView(profile.getEmail(), profile.getServiceAreas());
    }

    public ServiceAreaView updateServiceAreas(String email, List<String> zipCodes) {
        PartnerProfile profile = getOrCreateProfile(email);
        profile.setServiceAreas(zipCodes);
        return new ServiceAreaView(profile.getEmail(), profile.getServiceAreas());
    }

    public AvailabilityView getAvailability(String email) {
        PartnerProfile profile = getOrCreateProfile(email);
        return new AvailabilityView(profile.getEmail(), profile.getAvailabilitySlots());
    }

    public AvailabilityView updateAvailability(String email, List<AvailabilitySlot> slots) {
        PartnerProfile profile = getOrCreateProfile(email);
        profile.setAvailabilitySlots(slots);
        return new AvailabilityView(profile.getEmail(), profile.getAvailabilitySlots());
    }

    public List<PartnerDocumentView> getDocuments(String email) {
        PartnerProfile profile = getOrCreateProfile(email);
        return profile.getDocuments();
    }

    public PartnerDocumentView uploadDocument(String email, String type, String fileName) {
        PartnerProfile profile = getOrCreateProfile(email);
        String docId = UUID.randomUUID().toString();
        PartnerDocumentView doc = new PartnerDocumentView(
                docId,
                type,
                fileName,
                "PENDING_VERIFICATION",
                null
        );
        profile.addDocument(doc);
        return doc;
    }

    public PartnerDocumentView verifyDocument(String email, String documentId, String status, String rejectionReason) {
        PartnerProfile profile = profilesByEmail.get(normalizeEmail(email));
        if (profile == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Partner profile not found");
        }
        
        boolean found = false;
        for (PartnerDocumentView doc : profile.getDocuments()) {
            if (doc.documentId().equals(documentId)) {
                found = true;
                break;
            }
        }
        
        if (!found) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found");
        }

        profile.updateDocumentStatus(documentId, status, rejectionReason);
        
        // If all uploaded documents are verified, update onboarding status to ACTIVE
        boolean allVerified = true;
        List<PartnerDocumentView> docs = profile.getDocuments();
        if (docs.isEmpty()) {
            allVerified = false;
        } else {
            for (PartnerDocumentView d : docs) {
                if (!"VERIFIED".equalsIgnoreCase(d.verificationStatus())) {
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

        for (PartnerDocumentView doc : profile.getDocuments()) {
            if (doc.documentId().equals(documentId)) {
                return doc;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch updated document");
    }

    public PricingView getPricing(String email) {
        PartnerProfile profile = getOrCreateProfile(email);
        return new PricingView(profile.getEmail(), profile.getPricingRateCard());
    }

    public PricingView updatePricing(String email, List<RateCardItem> rateCard) {
        PartnerProfile profile = getOrCreateProfile(email);
        profile.setPricingRateCard(rateCard);
        return new PricingView(profile.getEmail(), profile.getPricingRateCard());
    }

    private PartnerProfile getOrCreateProfile(String email) {
        String normalized = normalizeEmail(email);
        return profilesByEmail.computeIfAbsent(normalized, k -> new PartnerProfile(
                k,
                "New Laundry Partner",
                "Please update business description.",
                "Please update service hub address.",
                "PENDING"
        ));
    }

    private void seedDefaultPartner() {
        String email = "partner@freshfold.example";
        PartnerProfile profile = new PartnerProfile(
                email,
                "FreshFold Laundry",
                "Premium laundry services including Wash & Fold, Dry Cleaning, and ironing.",
                "102, Saket District Centre, New Delhi, 110017",
                "ACTIVE"
        );

        profile.setServiceAreas(List.of("110017", "110016", "110020"));

        List<AvailabilitySlot> slots = List.of(
                new AvailabilitySlot("Monday", "09:00", "18:00", 20),
                new AvailabilitySlot("Wednesday", "09:00", "18:00", 20),
                new AvailabilitySlot("Friday", "09:00", "18:00", 20)
        );
        profile.setAvailabilitySlots(slots);

        PartnerDocumentView license = new PartnerDocumentView(
                "doc-lic-001",
                "BUSINESS_LICENSE",
                "license_copy.pdf",
                "VERIFIED",
                null
        );
        profile.addDocument(license);

        List<RateCardItem> rates = List.of(
                new RateCardItem("SHIRT", "WASH_AND_FOLD", 40.0),
                new RateCardItem("SHIRT", "DRY_CLEAN", 80.0),
                new RateCardItem("PANTS", "WASH_AND_FOLD", 50.0),
                new RateCardItem("BLANKET", "DRY_CLEAN", 250.0)
        );
        profile.setPricingRateCard(rates);

        profilesByEmail.put(email, profile);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
