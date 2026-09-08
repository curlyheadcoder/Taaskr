package com.taaskr.dto.kyc;

import com.taaskr.enums.KycDocumentStatus;
import com.taaskr.enums.KycDocumentType;
import java.time.LocalDateTime;

public class KycDocumentResponse {

    private Long id;
    private Long providerId;
    private String providerName;
    private KycDocumentType documentType;
    private KycDocumentStatus status;
    private String documentNumber;
    private String originalFileName;
    private String viewUrl;
    private String contentType;
    private Long fileSize;
    private String rejectionReason;
    private String verifiedByName;
    private LocalDateTime verifiedAt;
    private LocalDateTime uploadedAt;
    private LocalDateTime updatedAt;

    public KycDocumentResponse() {
    }

    public KycDocumentResponse(Long id, Long providerId, String providerName, KycDocumentType documentType,
                               KycDocumentStatus status, String documentNumber, String originalFileName,
                               String viewUrl, String contentType, Long fileSize, String rejectionReason,
                               String verifiedByName, LocalDateTime verifiedAt, LocalDateTime uploadedAt,
                               LocalDateTime updatedAt) {
        this.id = id;
        this.providerId = providerId;
        this.providerName = providerName;
        this.documentType = documentType;
        this.status = status;
        this.documentNumber = documentNumber;
        this.originalFileName = originalFileName;
        this.viewUrl = viewUrl;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.rejectionReason = rejectionReason;
        this.verifiedByName = verifiedByName;
        this.verifiedAt = verifiedAt;
        this.uploadedAt = uploadedAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProviderId() {
        return providerId;
    }

    public void setProviderId(Long providerId) {
        this.providerId = providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public KycDocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(KycDocumentType documentType) {
        this.documentType = documentType;
    }

    public KycDocumentStatus getStatus() {
        return status;
    }

    public void setStatus(KycDocumentStatus status) {
        this.status = status;
    }

    public String getDocumentNumber() {
        return documentNumber;
    }

    public void setDocumentNumber(String documentNumber) {
        this.documentNumber = documentNumber;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getViewUrl() {
        return viewUrl;
    }

    public void setViewUrl(String viewUrl) {
        this.viewUrl = viewUrl;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getVerifiedByName() {
        return verifiedByName;
    }

    public void setVerifiedByName(String verifiedByName) {
        this.verifiedByName = verifiedByName;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
