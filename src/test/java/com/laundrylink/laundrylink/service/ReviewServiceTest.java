package com.laundrylink.laundrylink.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.laundrylink.laundrylink.api.*;
import com.laundrylink.laundrylink.persistence.*;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private OrderService orderService;

    @Mock
    private LaundryPartnerService laundryPartnerService;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    public void testSubmitReview_Success() {
        ReviewRequest req = new ReviewRequest("order-123", 5, "Great service!");

        OrderEntity orderEntity = new OrderEntity();
        orderEntity.setOrderId("order-123");
        orderEntity.setDisplayOrderId("order-123");

        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.DELIVERED, List.of(),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of(), false, null, null
        );

        ReviewEntity review = new ReviewEntity("order-123", "customer@example.com", "partner@example.com", 5, "Great service!");

        when(orderService.findOrderByIdentifier("order-123")).thenReturn(orderEntity);
        when(orderService.getOrder("order-123", "customer@example.com", UserRoleType.CUSTOMER)).thenReturn(orderView);
        when(orderService.getDisplayOrderIdByOrderId("order-123")).thenReturn("order-123");
        when(reviewRepository.findByOrderId("order-123")).thenReturn(Optional.empty());
        when(reviewRepository.findByPartnerEmail("partner@example.com")).thenReturn(List.of(review));

        ReviewView view = reviewService.submitReview("customer@example.com", req);

        assertNotNull(view);
        assertEquals("order-123", view.orderId());
        assertEquals("customer@example.com", view.customerEmail());
        assertEquals("partner@example.com", view.partnerEmail());
        assertEquals(5, view.rating());
        assertEquals("Great service!", view.comment());

        verify(reviewRepository, times(1)).save(any(ReviewEntity.class));
        verify(laundryPartnerService, times(1)).updateReputation("partner@example.com", 5.0, 1);
    }

    @Test
    public void testSubmitReview_NotDelivered() {
        ReviewRequest req = new ReviewRequest("order-123", 5, "Great service!");

        OrderEntity orderEntity = new OrderEntity();
        orderEntity.setOrderId("order-123");

        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.PROCESSING, List.of(),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of(), false, null, null
        );

        when(orderService.findOrderByIdentifier("order-123")).thenReturn(orderEntity);
        when(orderService.getOrder("order-123", "customer@example.com", UserRoleType.CUSTOMER)).thenReturn(orderView);

        assertThrows(ResponseStatusException.class, () -> {
            reviewService.submitReview("customer@example.com", req);
        });
    }

    @Test
    public void testSubmitReview_AlreadyReviewed() {
        ReviewRequest req = new ReviewRequest("order-123", 5, "Great service!");

        OrderEntity orderEntity = new OrderEntity();
        orderEntity.setOrderId("order-123");

        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.DELIVERED, List.of(),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of(), false, null, null
        );

        when(orderService.findOrderByIdentifier("order-123")).thenReturn(orderEntity);
        when(orderService.getOrder("order-123", "customer@example.com", UserRoleType.CUSTOMER)).thenReturn(orderView);
        when(reviewRepository.findByOrderId("order-123")).thenReturn(Optional.of(new ReviewEntity()));

        assertThrows(ResponseStatusException.class, () -> {
            reviewService.submitReview("customer@example.com", req);
        });
    }

    @Test
    public void testSubmitReview_InvalidRating() {
        ReviewRequest req = new ReviewRequest("order-123", 6, "Great service!");

        OrderEntity orderEntity = new OrderEntity();
        orderEntity.setOrderId("order-123");

        OrderView orderView = new OrderView(
                "order-123", "customer@example.com", "partner@example.com", null, null,
                OrderStatus.DELIVERED, List.of(),
                100.0, "Pickup", "Slot1", "Delivery", "Slot2", "Notes", 0L, 0L, List.of(), false, null, null
        );

        when(orderService.findOrderByIdentifier("order-123")).thenReturn(orderEntity);
        when(orderService.getOrder("order-123", "customer@example.com", UserRoleType.CUSTOMER)).thenReturn(orderView);
        when(reviewRepository.findByOrderId("order-123")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> {
            reviewService.submitReview("customer@example.com", req);
        });
    }

    @Test
    public void testGetCustomerReviewHistory() {
        ReviewEntity review = new ReviewEntity("order-123", "customer@example.com", "partner@example.com", 5, "Good");
        when(reviewRepository.findByCustomerEmail("customer@example.com")).thenReturn(List.of(review));
        when(orderService.getDisplayOrderIdByOrderId("order-123")).thenReturn("order-123");

        List<ReviewView> history = reviewService.getCustomerReviewHistory("customer@example.com");

        assertNotNull(history);
        assertEquals(1, history.size());
        assertEquals("order-123", history.get(0).orderId());
    }

    @Test
    public void testGetPartnerReviews() {
        ReviewEntity r1 = new ReviewEntity("order-1", "c1@example.com", "partner@example.com", 5, "Good");
        ReviewEntity r2 = new ReviewEntity("order-2", "c2@example.com", "partner@example.com", 3, "Okay");
        when(reviewRepository.findByPartnerEmail("partner@example.com")).thenReturn(List.of(r1, r2));
        when(orderService.getDisplayOrderIdByOrderId("order-1")).thenReturn("order-1");
        when(orderService.getDisplayOrderIdByOrderId("order-2")).thenReturn("order-2");

        PartnerRatingSummary summary = reviewService.getPartnerReviews("partner@example.com");

        assertNotNull(summary);
        assertEquals("partner@example.com", summary.partnerEmail());
        assertEquals(4.0, summary.averageRating());
        assertEquals(2, summary.totalReviews());
        assertEquals(1, summary.fiveStarCount());
        assertEquals(1, summary.threeStarCount());
    }
}
