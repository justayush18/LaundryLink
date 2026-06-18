package com.laundrylink.laundrylink.api;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laundrylink.laundrylink.service.BlueprintCatalogService;

@RestController
@RequestMapping(path = "/api/v1", produces = MediaType.APPLICATION_JSON_VALUE)
public class BlueprintController {

    private final BlueprintCatalogService blueprintCatalogService;

    public BlueprintController(BlueprintCatalogService blueprintCatalogService) {
        this.blueprintCatalogService = blueprintCatalogService;
    }

    @GetMapping("/blueprint")
    public BlueprintResponse blueprint() {
        return new BlueprintResponse(
                "Velora",
                "Multi-vendor on-demand laundry aggregator platform",
                blueprintCatalogService.orderLifecycle(),
                blueprintCatalogService.serviceCatalog()
        );
    }

    public record BlueprintResponse(String projectName, String description, List<String> orderLifecycle,
            List<ServiceCatalogItem> services) {
    }
}