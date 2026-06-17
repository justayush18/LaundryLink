package com.laundrylink.laundrylink.api;

public record PartnerDocumentRequest(
        String documentType,
        String fileName,
        String fileContentBase64
) {
}
