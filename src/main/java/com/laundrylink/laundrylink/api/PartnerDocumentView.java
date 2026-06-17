package com.laundrylink.laundrylink.api;

public record PartnerDocumentView(
        String documentId,
        String documentType,
        String fileName,
        String verificationStatus,
        String rejectionReason
) {
}
