package com.laundrylink.laundrylink.persistence;

import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "partners")
public class PartnerEntity extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String businessName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String serviceHubAddress;

    @Column(nullable = false)
    private String onboardingStatus;

    private double reputationScore = 0.0;
    private int totalReviews = 0;

    private String openingTime = "09:00";
    private String closingTime = "21:00";
    private int serviceSlaHours = 6;
    private int dailyCapacityLimit = 20;
    private Double cancellationPenaltyPerOrder = 200.0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "partner_zipcodes", joinColumns = @JoinColumn(name = "partner_id"))
    @Column(name = "zip_code")
    private List<String> serviceAreas = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_id")
    private List<AvailabilitySlotEntity> availabilitySlots = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_id")
    private List<PartnerDocumentEntity> documents = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_id")
    private List<RateCardItemEntity> pricingRateCard = new ArrayList<>();

    public PartnerEntity() {}

    public PartnerEntity(String email, String businessName, String description, String serviceHubAddress, String onboardingStatus) {
        this.email = email;
        this.businessName = businessName;
        this.description = description;
        this.serviceHubAddress = serviceHubAddress;
        this.onboardingStatus = onboardingStatus;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public double getReputationScore() {
        return reputationScore;
    }

    public void setReputationScore(double reputationScore) {
        this.reputationScore = reputationScore;
    }

    public int getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(int totalReviews) {
        this.totalReviews = totalReviews;
    }

    public List<String> getServiceAreas() {
        return serviceAreas;
    }

    public void setServiceAreas(List<String> serviceAreas) {
        this.serviceAreas = serviceAreas;
    }

    public List<AvailabilitySlotEntity> getAvailabilitySlots() {
        return availabilitySlots;
    }

    public void setAvailabilitySlots(List<AvailabilitySlotEntity> availabilitySlots) {
        this.availabilitySlots = availabilitySlots;
    }

    public List<PartnerDocumentEntity> getDocuments() {
        return documents;
    }

    public void setDocuments(List<PartnerDocumentEntity> documents) {
        this.documents = documents;
    }

    public List<RateCardItemEntity> getPricingRateCard() {
        return pricingRateCard;
    }

    public void setPricingRateCard(List<RateCardItemEntity> pricingRateCard) {
        this.pricingRateCard = pricingRateCard;
    }

    public String getOpeningTime() {
        return openingTime;
    }

    public void setOpeningTime(String openingTime) {
        this.openingTime = openingTime;
    }

    public String getClosingTime() {
        return closingTime;
    }

    public void setClosingTime(String closingTime) {
        this.closingTime = closingTime;
    }

    public int getServiceSlaHours() {
        return serviceSlaHours;
    }

    public void setServiceSlaHours(int serviceSlaHours) {
        this.serviceSlaHours = serviceSlaHours;
    }

    public int getDailyCapacityLimit() {
        return dailyCapacityLimit;
    }

    public void setDailyCapacityLimit(int dailyCapacityLimit) {
        this.dailyCapacityLimit = dailyCapacityLimit;
    }

    public double getCancellationPenaltyPerOrder() {
        return cancellationPenaltyPerOrder != null ? cancellationPenaltyPerOrder : 200.0;
    }

    public void setCancellationPenaltyPerOrder(double cancellationPenaltyPerOrder) {
        this.cancellationPenaltyPerOrder = cancellationPenaltyPerOrder;
    }
}
