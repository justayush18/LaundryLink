package com.laundrylink.laundrylink.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import com.laundrylink.laundrylink.api.AvailabilitySlot;
import com.laundrylink.laundrylink.api.PartnerDocumentView;
import com.laundrylink.laundrylink.api.RateCardItem;

public class PartnerProfile {
    private final String email;
    private volatile String businessName;
    private volatile String description;
    private volatile String serviceHubAddress;
    private volatile String onboardingStatus;
    
    private final List<String> serviceAreas = new CopyOnWriteArrayList<>();
    private final List<AvailabilitySlot> availabilitySlots = new CopyOnWriteArrayList<>();
    private final List<PartnerDocumentView> documents = new CopyOnWriteArrayList<>();
    private final List<RateCardItem> pricingRateCard = new CopyOnWriteArrayList<>();

    public PartnerProfile(String email, String businessName, String description, String serviceHubAddress, String onboardingStatus) {
        this.email = email;
        this.businessName = businessName;
        this.description = description;
        this.serviceHubAddress = serviceHubAddress;
        this.onboardingStatus = onboardingStatus;
    }

    public String getEmail() {
        return email;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getServiceHubAddress() {
        return serviceHubAddress;
    }

    public void setServiceHubAddress(String serviceHubAddress) {
        this.serviceHubAddress = serviceHubAddress;
    }

    public String getOnboardingStatus() {
        return onboardingStatus;
    }

    public void setOnboardingStatus(String onboardingStatus) {
        this.onboardingStatus = onboardingStatus;
    }

    public List<String> getServiceAreas() {
        return Collections.unmodifiableList(serviceAreas);
    }

    public void setServiceAreas(List<String> zipCodes) {
        this.serviceAreas.clear();
        if (zipCodes != null) {
            this.serviceAreas.addAll(zipCodes);
        }
    }

    public List<AvailabilitySlot> getAvailabilitySlots() {
        return Collections.unmodifiableList(availabilitySlots);
    }

    public void setAvailabilitySlots(List<AvailabilitySlot> slots) {
        this.availabilitySlots.clear();
        if (slots != null) {
            this.availabilitySlots.addAll(slots);
        }
    }

    public List<PartnerDocumentView> getDocuments() {
        return Collections.unmodifiableList(documents);
    }

    public void addDocument(PartnerDocumentView doc) {
        if (doc != null) {
            this.documents.add(doc);
        }
    }

    public void updateDocumentStatus(String documentId, String status, String rejectionReason) {
        for (int i = 0; i < documents.size(); i++) {
            PartnerDocumentView doc = documents.get(i);
            if (doc.documentId().equals(documentId)) {
                documents.set(i, new PartnerDocumentView(
                        doc.documentId(),
                        doc.documentType(),
                        doc.fileName(),
                        status,
                        rejectionReason
                ));
                return;
            }
        }
    }

    public List<RateCardItem> getPricingRateCard() {
        return Collections.unmodifiableList(pricingRateCard);
    }

    public void setPricingRateCard(List<RateCardItem> rateCard) {
        this.pricingRateCard.clear();
        if (rateCard != null) {
            this.pricingRateCard.addAll(rateCard);
        }
    }
}
