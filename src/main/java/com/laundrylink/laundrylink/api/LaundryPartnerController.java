package com.laundrylink.laundrylink.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.service.LaundryPartnerService;

@RestController
@RequestMapping(path = "/api/v1/partners", produces = MediaType.APPLICATION_JSON_VALUE)
public class LaundryPartnerController {

    private final LaundryPartnerService laundryPartnerService;

    public LaundryPartnerController(LaundryPartnerService laundryPartnerService) {
        this.laundryPartnerService = laundryPartnerService;
    }

    @GetMapping
    public List<PartnerProfileView> getAllPartners() {
        currentPrincipal();
        return laundryPartnerService.getAllPartners();
    }

    @GetMapping("/profile")
    public PartnerProfileView getOwnProfile() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can access their own profile");
        }
        return laundryPartnerService.getProfile(principal.email());
    }

    @PutMapping(value = "/profile", consumes = MediaType.APPLICATION_JSON_VALUE)
    public PartnerProfileView updateOwnProfile(@RequestBody PartnerProfileRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can update their profile");
        }
        return laundryPartnerService.updateProfile(
                principal.email(),
                request.businessName(),
                request.description(),
                request.serviceHubAddress(),
                request.openingTime(),
                request.closingTime(),
                request.serviceSlaHours(),
                request.dailyCapacityLimit()
        );
    }

    @GetMapping("/{email}/profile")
    public PartnerProfileView getProfile(@PathVariable String email) {
        currentPrincipal(); // verify authenticated user
        return laundryPartnerService.getProfile(email);
    }

    @GetMapping("/service-areas")
    public ServiceAreaView getOwnServiceAreas() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can access their own service areas");
        }
        return laundryPartnerService.getServiceAreas(principal.email());
    }

    @PutMapping(value = "/service-areas", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ServiceAreaView updateOwnServiceAreas(@RequestBody ServiceAreaRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can update their service areas");
        }
        return laundryPartnerService.updateServiceAreas(principal.email(), request.zipCodes());
    }

    @GetMapping("/{email}/service-areas")
    public ServiceAreaView getServiceAreas(@PathVariable String email) {
        currentPrincipal(); // verify authenticated user
        return laundryPartnerService.getServiceAreas(email);
    }

    @GetMapping("/availability")
    public AvailabilityView getOwnAvailability() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can access their own availability");
        }
        return laundryPartnerService.getAvailability(principal.email());
    }

    @PutMapping(value = "/availability", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AvailabilityView updateOwnAvailability(@RequestBody AvailabilityRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can update their availability");
        }
        return laundryPartnerService.updateAvailability(principal.email(), request.slots());
    }

    @GetMapping("/{email}/availability")
    public AvailabilityView getAvailability(@PathVariable String email) {
        currentPrincipal(); // verify authenticated user
        return laundryPartnerService.getAvailability(email);
    }

    @GetMapping("/documents")
    public List<PartnerDocumentView> getOwnDocuments() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can access their own documents");
        }
        return laundryPartnerService.getDocuments(principal.email());
    }

    @PostMapping(value = "/documents", consumes = MediaType.APPLICATION_JSON_VALUE)
    public PartnerDocumentView uploadDocument(@RequestBody PartnerDocumentRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can upload onboarding documents");
        }
        return laundryPartnerService.uploadDocument(principal.email(), request.documentType(), request.fileName());
    }

    @PutMapping(value = "/{email}/documents/{documentId}/verify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public PartnerDocumentView verifyDocument(
            @PathVariable String email,
            @PathVariable String documentId,
            @RequestBody DocumentVerifyRequest request) {
        requireAdmin();
        return laundryPartnerService.verifyDocument(email, documentId, request.status(), request.rejectionReason());
    }

    @GetMapping("/pricing")
    public PricingView getOwnPricing() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can access their own pricing");
        }
        return laundryPartnerService.getPricing(principal.email());
    }

    @PutMapping(value = "/pricing", consumes = MediaType.APPLICATION_JSON_VALUE)
    public PricingView updateOwnPricing(@RequestBody PricingRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.LAUNDRY_PARTNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Laundry Partners can update their pricing");
        }
        return laundryPartnerService.updatePricing(principal.email(), request.rateCard());
    }

    @GetMapping("/{email}/pricing")
    public PricingView getPricing(@PathVariable String email) {
        currentPrincipal(); // verify authenticated user
        return laundryPartnerService.getPricing(email);
    }

    private AuthenticatedPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }

    private void requireAdmin() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}
