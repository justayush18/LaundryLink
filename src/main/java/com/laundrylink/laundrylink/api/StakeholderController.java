package com.laundrylink.laundrylink.api;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laundrylink.laundrylink.service.StakeholderCatalogService;

@RestController
@RequestMapping(path = "/api/v1", produces = MediaType.APPLICATION_JSON_VALUE)
public class StakeholderController {

    private final StakeholderCatalogService stakeholderCatalogService;

    public StakeholderController(StakeholderCatalogService stakeholderCatalogService) {
        this.stakeholderCatalogService = stakeholderCatalogService;
    }

    @GetMapping("/stakeholders")
    public List<StakeholderProfile> stakeholders() {
        return stakeholderCatalogService.stakeholders();
    }
}