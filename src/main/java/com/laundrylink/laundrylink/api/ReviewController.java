package com.laundrylink.laundrylink.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.security.AuthenticatedPrincipal;
import com.laundrylink.laundrylink.service.ReviewService;

@RestController
@RequestMapping(path = "/api/v1/reviews", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ReviewView submitReview(@RequestBody ReviewRequest request) {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Customers can submit reviews");
        }
        return reviewService.submitReview(principal.email(), request);
    }

    @GetMapping("/history")
    public List<ReviewView> getReviewHistory() {
        AuthenticatedPrincipal principal = currentPrincipal();
        if (principal.role() != UserRoleType.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Customers can access their review history");
        }
        return reviewService.getCustomerReviewHistory(principal.email());
    }

    @GetMapping("/partners/{partnerEmail}")
    public PartnerRatingSummary getPartnerReviews(@PathVariable String partnerEmail) {
        currentPrincipal(); // verify authenticated user
        return reviewService.getPartnerReviews(partnerEmail);
    }

    @GetMapping("/{reviewId}")
    public ReviewView getReview(@PathVariable String reviewId) {
        AuthenticatedPrincipal principal = currentPrincipal();
        return reviewService.getReview(reviewId, principal.email(), principal.role());
    }

    private AuthenticatedPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
