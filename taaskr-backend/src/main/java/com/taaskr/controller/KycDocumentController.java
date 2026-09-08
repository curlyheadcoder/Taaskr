package com.taaskr.controller;

import com.taaskr.dto.common.PageResponse;
import com.taaskr.dto.kyc.KycDocumentResponse;
import com.taaskr.dto.kyc.VerifyKycRequest;
import com.taaskr.enums.KycDocumentStatus;
import com.taaskr.enums.KycDocumentType;
import com.taaskr.service.KycDocumentService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class KycDocumentController {

    private final KycDocumentService kycDocumentService;

    public KycDocumentController(KycDocumentService kycDocumentService) {
        this.kycDocumentService = kycDocumentService;
    }

    @PostMapping(value = "/provider/kyc/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<KycDocumentResponse> uploadDocument(
            @RequestParam("documentType") KycDocumentType documentType,
            @RequestParam(value = "documentNumber", required = false) String documentNumber,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        KycDocumentResponse response = kycDocumentService.uploadDocument(authentication.getName(), documentType, documentNumber, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/provider/kyc/my-documents")
    @PreAuthorize("hasRole('PROVIDER')")
    public List<KycDocumentResponse> getMyDocuments(Authentication authentication) {
        return kycDocumentService.getMyDocuments(authentication.getName());
    }

    @GetMapping("/admin/kyc/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<KycDocumentResponse> getAllDocuments(
            @RequestParam(value = "status", required = false) KycDocumentStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return kycDocumentService.getAllDocuments(status, page, size);
    }

    @PatchMapping("/admin/kyc/documents/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public KycDocumentResponse verifyDocument(
            @PathVariable Long id,
            @Valid @RequestBody VerifyKycRequest request,
            Authentication authentication) {
        return kycDocumentService.verifyDocument(id, request, authentication.getName());
    }

    @GetMapping("/kyc/documents/{id}/view")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> viewDocument(@PathVariable Long id, Authentication authentication) {
        Resource resource = kycDocumentService.loadDocumentFile(id, authentication.getName());
        String contentType = kycDocumentService.getDocumentContentType(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
