package com.laundrylink.laundrylink.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.laundrylink.laundrylink.api.ServiceCatalogItem;

@Service
public class BlueprintCatalogService {

    private static final List<String> ORDER_LIFECYCLE = List.of(
            "PLACED",
            "WAITING_FOR_PARTNER",
            "ACCEPTED",
            "PICKUP_ASSIGNED",
            "PICKED_UP",
            "WASHING",
            "DRYING",
            "IRONING",
            "QUALITY_CHECK",
            "OUT_FOR_DELIVERY",
            "DELIVERED");

    private static final List<ServiceCatalogItem> SERVICE_CATALOG = List.of(
            new ServiceCatalogItem("WASH", "Wash", "Laundry"),
            new ServiceCatalogItem("WASH_FOLD", "Wash & Fold", "Laundry"),
            new ServiceCatalogItem("DRY_CLEAN", "Dry Clean", "Special Care"),
            new ServiceCatalogItem("IRONING", "Ironing", "Finishing"),
            new ServiceCatalogItem("PREMIUM_CARE", "Premium Care", "Special Care"));

    public List<String> orderLifecycle() {
        return ORDER_LIFECYCLE;
    }

    public List<ServiceCatalogItem> serviceCatalog() {
        return SERVICE_CATALOG;
    }
}