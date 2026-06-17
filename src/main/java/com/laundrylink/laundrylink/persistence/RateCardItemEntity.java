package com.laundrylink.laundrylink.persistence;

import jakarta.persistence.*;

@Entity
@Table(name = "partner_rate_card_items")
public class RateCardItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemCategory;
    private String serviceType;
    private double price;

    public RateCardItemEntity() {}

    public RateCardItemEntity(String itemCategory, String serviceType, double price) {
        this.itemCategory = itemCategory;
        this.serviceType = serviceType;
        this.price = price;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getItemCategory() { return itemCategory; }
    public void setItemCategory(String itemCategory) { this.itemCategory = itemCategory; }
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
}
