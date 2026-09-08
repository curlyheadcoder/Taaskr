package com.taaskr.service;

import com.taaskr.dto.common.PageResponse;
import com.taaskr.dto.kyc.KycDocumentResponse;
import com.taaskr.dto.kyc.VerifyKycRequest;
import com.taaskr.enums.KycDocumentStatus;
import com.taaskr.enums.KycDocumentType;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface KycDocumentService {

    KycDocumentResponse uploadDocument(String username, KycDocumentType documentType, String documentNumber, MultipartFile file);

    List<KycDocumentResponse> getMyDocuments(String username);

    PageResponse<KycDocumentResponse> getAllDocuments(KycDocumentStatus status, int page, int size);

    KycDocumentResponse verifyDocument(Long documentId, VerifyKycRequest request, String adminUsername);

    Resource loadDocumentFile(Long documentId, String username);

    String getDocumentContentType(Long documentId);
}
