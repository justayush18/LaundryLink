package com.laundrylink.laundrylink.service;

public class Review {
    private final String reviewId;
    private final String orderId;
    private final String customerEmail;
    private final String partnerEmail;
    private final int rating;
    private final String comment;
    private final long createdAt;

    public Review(String reviewId, String orderId, String customerEmail, String partnerEmail, int rating, String comment) {
        this.reviewId = reviewId;
        this.orderId = orderId;
        this.customerEmail = customerEmail;
        this.partnerEmail = partnerEmail;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = System.currentTimeMillis() / 1000L;
    }

    public String getReviewId() {
        return reviewId;
    }

    public String getOrderId() {
        return orderId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getPartnerEmail() {
        return partnerEmail;
    }

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public long getCreatedAt() {
        return createdAt;
    }
}
