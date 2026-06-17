package com.laundrylink.laundrylink.persistence;

import jakarta.persistence.*;

@Entity
@Table(name = "partner_documents")
public class PartnerDocumentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String documentId;
    private String documentType;
    private String fileName;
    private String verificationStatus;
    private String rejectionReason;

    public PartnerDocumentEntity() {}

    public PartnerDocumentEntity(String documentId, String documentType, String fileName, String verificationStatus, String rejectionReason) {
        this.documentId = documentId;
        this.documentType = documentType;
        this.fileName = fileName;
        this.verificationStatus = verificationStatus;
        this.rejectionReason = rejectionReason;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
