package com.laundrylink.laundrylink.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.OrderStatus;
import com.laundrylink.laundrylink.api.OrderView;
import com.laundrylink.laundrylink.api.PartnerRatingSummary;
import com.laundrylink.laundrylink.api.ReviewRequest;
import com.laundrylink.laundrylink.api.ReviewView;
import com.laundrylink.laundrylink.api.UserRoleType;
import com.laundrylink.laundrylink.persistence.ReviewEntity;
import com.laundrylink.laundrylink.persistence.ReviewRepository;
import com.laundrylink.laundrylink.persistence.OrderEntity;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderService orderService;
    private final LaundryPartnerService laundryPartnerService;

    public ReviewService(ReviewRepository reviewRepository, OrderService orderService, LaundryPartnerService laundryPartnerService) {
        this.reviewRepository = reviewRepository;
        this.orderService = orderService;
        this.laundryPartnerService = laundryPartnerService;
    }

    public ReviewView submitReview(String customerEmail, ReviewRequest request) {
        OrderEntity orderEntity = orderService.findOrderByIdentifier(request.orderId());
        String actualOrderId = orderEntity.getOrderId();

        // Fetch order details. This ensures the customer owns the order.
        OrderView order = orderService.getOrder(actualOrderId, customerEmail, UserRoleType.CUSTOMER);

        // Validation 2: Must be DELIVERED
        if (order.status() != OrderStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reviews are only allowed for delivered orders");
        }

        // Validation 3: One review per order
        if (reviewRepository.findByOrderId(actualOrderId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order has already been reviewed");
        }

        // Validation 4: Rating range 1-5
        if (request.rating() < 1 || request.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5 stars");
        }

        ReviewEntity review = new ReviewEntity(
                actualOrderId,
                customerEmail,
                order.partnerEmail(),
                request.rating(),
                request.comment()
        );

        reviewRepository.save(review);

        // Auto-recalculate reputation score
        recalculateReputation(order.partnerEmail());

        return toView(review);
    }

    public List<ReviewView> getCustomerReviewHistory(String customerEmail) {
        return reviewRepository.findByCustomerEmail(customerEmail).stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    public PartnerRatingSummary getPartnerReviews(String partnerEmail) {
        List<ReviewEntity> partnerReviews = reviewRepository.findByPartnerEmail(partnerEmail);

        int total = partnerReviews.size();
        double avg = 0.0;
        int oneStar = 0;
        int twoStar = 0;
        int threeStar = 0;
        int fourStar = 0;
        int fiveStar = 0;

        if (total > 0) {
            double sum = 0.0;
            for (ReviewEntity r : partnerReviews) {
                sum += r.getRating();
                switch (r.getRating()) {
                    case 1 -> oneStar++;
                    case 2 -> twoStar++;
                    case 3 -> threeStar++;
                    case 4 -> fourStar++;
                    case 5 -> fiveStar++;
                }
            }
            avg = sum / total;
        }

        List<ReviewView> views = partnerReviews.stream()
                .map(this::toView)
                .collect(Collectors.toList());

        return new PartnerRatingSummary(
                partnerEmail,
                avg,
                total,
                oneStar,
                twoStar,
                threeStar,
                fourStar,
                fiveStar,
                views
        );
    }

    public ReviewView getReview(String reviewId, String email, UserRoleType role) {
        Long id = null;
        try {
            id = Long.parseLong(reviewId);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }

        ReviewEntity review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        boolean authorized = false;
        if (role == UserRoleType.ADMIN) {
            authorized = true;
        } else if (role == UserRoleType.CUSTOMER && review.getCustomerEmail().equalsIgnoreCase(email)) {
            authorized = true;
        } else if (role == UserRoleType.LAUNDRY_PARTNER && review.getPartnerEmail().equalsIgnoreCase(email)) {
            authorized = true;
        }

        if (!authorized) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not authorized to view this review");
        }

        return toView(review);
    }

    private void recalculateReputation(String partnerEmail) {
        PartnerRatingSummary summary = getPartnerReviews(partnerEmail);
        laundryPartnerService.updateReputation(partnerEmail, summary.averageRating(), summary.totalReviews());
    }

    private ReviewView toView(ReviewEntity r) {
        String displayOrderId = orderService.getDisplayOrderIdByOrderId(r.getOrderId());
        return new ReviewView(
                String.valueOf(r.getId()),
                displayOrderId,
                r.getCustomerEmail(),
                r.getPartnerEmail(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
