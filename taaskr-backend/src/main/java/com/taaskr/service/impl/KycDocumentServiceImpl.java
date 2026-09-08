package com.taaskr.service.impl;

import com.taaskr.dto.common.PageResponse;
import com.taaskr.dto.kyc.KycDocumentResponse;
import com.taaskr.dto.kyc.VerifyKycRequest;
import com.taaskr.entity.KycDocument;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.User;
import com.taaskr.enums.KycDocumentStatus;
import com.taaskr.enums.KycDocumentType;
import com.taaskr.enums.NotificationType;
import com.taaskr.enums.Role;
import com.taaskr.repository.KycDocumentRepository;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.KycDocumentService;
import com.taaskr.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class KycDocumentServiceImpl implements KycDocumentService {

    private final KycDocumentRepository kycDocumentRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${app.upload.kyc-dir:uploads/kyc}")
    private String uploadBaseDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf", "jpg", "jpeg", "png", "webp");

    public KycDocumentServiceImpl(KycDocumentRepository kycDocumentRepository,
                                  ProviderProfileRepository providerProfileRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService) {
        this.kycDocumentRepository = kycDocumentRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    private ProviderProfile getProviderByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Provider profile not found"));
    }

    @Override
    public KycDocumentResponse uploadDocument(String username, KycDocumentType documentType, String documentNumber, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must not be empty");
        }
        if (documentType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document type is required");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "document"));
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file type. Allowed formats: PDF, JPG, PNG, WEBP");
        }

        if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds 10MB limit");
        }

        ProviderProfile provider = getProviderByEmail(username);

        try {
            Path targetDirectory = Paths.get(uploadBaseDir, String.valueOf(provider.getId())).toAbsolutePath().normalize();
            Files.createDirectories(targetDirectory);

            String storedFileName = UUID.randomUUID() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
            Path targetFilePath = targetDirectory.resolve(storedFileName);

            Files.copy(file.getInputStream(), targetFilePath, StandardCopyOption.REPLACE_EXISTING);

            // Check if document of this type already exists for provider
            KycDocument doc = kycDocumentRepository.findByProviderIdAndDocumentType(provider.getId(), documentType)
                    .orElse(new KycDocument());

            // If replacing existing, try to delete old file
            if (doc.getId() != null && doc.getFilePath() != null) {
                try {
                    Files.deleteIfExists(Paths.get(doc.getFilePath()));
                } catch (Exception ignored) {
                }
            }

            doc.setProvider(provider);
            doc.setDocumentType(documentType);
            if (documentNumber != null && !documentNumber.trim().isEmpty()) {
                doc.setDocumentNumber(documentNumber.trim());
            }
            doc.setOriginalFileName(originalFilename);
            doc.setFilePath(targetFilePath.toString());
            doc.setContentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            doc.setFileSize(file.getSize());
            doc.setStatus(KycDocumentStatus.PENDING);
            doc.setRejectionReason(null);
            doc.setVerifiedBy(null);
            doc.setVerifiedAt(null);

            KycDocument saved = kycDocumentRepository.save(doc);

            notificationService.sendNotification(
                    provider.getUser(),
                    "KYC Document Submitted",
                    "Your " + documentType.name().replace('_', ' ') + " has been uploaded and is under verification.",
                    NotificationType.INFO,
                    "KYC_DOCUMENT",
                    saved.getId()
            );

            return mapToResponse(saved);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store document file: " + ex.getMessage(), ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<KycDocumentResponse> getMyDocuments(String username) {
        ProviderProfile provider = getProviderByEmail(username);
        return kycDocumentRepository.findByProviderIdOrderByUploadedAtDesc(provider.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<KycDocumentResponse> getAllDocuments(KycDocumentStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KycDocument> docPage;
        if (status != null) {
            docPage = kycDocumentRepository.findByStatusOrderByUploadedAtDesc(status, pageable);
        } else {
            docPage = kycDocumentRepository.findAllByOrderByUploadedAtDesc(pageable);
        }
        return PageResponse.of(docPage, this::mapToResponse);
    }

    @Override
    public KycDocumentResponse verifyDocument(Long documentId, VerifyKycRequest request, String adminUsername) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "KYC Document not found with id: " + documentId));

        User adminUser = userRepository.findByEmail(adminUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));

        if (request.getStatus() == KycDocumentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot update status back to PENDING");
        }

        doc.setStatus(request.getStatus());
        doc.setVerifiedBy(adminUser);
        doc.setVerifiedAt(LocalDateTime.now());

        if (request.getStatus() == KycDocumentStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required when rejecting KYC document");
            }
            doc.setRejectionReason(request.getRejectionReason().trim());

            notificationService.sendNotification(
                    doc.getProvider().getUser(),
                    "KYC Document Rejected",
                    "Your " + doc.getDocumentType().name().replace('_', ' ') + " was rejected: " + doc.getRejectionReason(),
                    NotificationType.ALERT,
                    "KYC_DOCUMENT",
                    doc.getId()
            );
        } else if (request.getStatus() == KycDocumentStatus.VERIFIED) {
            doc.setRejectionReason(null);

            notificationService.sendNotification(
                    doc.getProvider().getUser(),
                    "KYC Document Verified",
                    "Your " + doc.getDocumentType().name().replace('_', ' ') + " has been successfully verified by administration.",
                    NotificationType.INFO,
                    "KYC_DOCUMENT",
                    doc.getId()
            );
        }

        KycDocument updated = kycDocumentRepository.save(doc);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadDocumentFile(Long documentId, String username) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "KYC Document not found"));

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // User must be ADMIN or the provider owner
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOwner = doc.getProvider().getUser().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view this document");
        }

        try {
            Path filePath = Paths.get(doc.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on storage");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error reading document file: " + ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getDocumentContentType(Long documentId) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "KYC Document not found"));
        return doc.getContentType() != null ? doc.getContentType() : "application/octet-stream";
    }

    private KycDocumentResponse mapToResponse(KycDocument doc) {
        String providerName = doc.getProvider() != null && doc.getProvider().getUser() != null
                ? doc.getProvider().getUser().getName()
                : "Provider #" + (doc.getProvider() != null ? doc.getProvider().getId() : "N/A");

        String verifiedByName = doc.getVerifiedBy() != null ? doc.getVerifiedBy().getName() : null;
        String viewUrl = "/api/kyc/documents/" + doc.getId() + "/view";

        return new KycDocumentResponse(
                doc.getId(),
                doc.getProvider() != null ? doc.getProvider().getId() : null,
                providerName,
                doc.getDocumentType(),
                doc.getStatus(),
                doc.getDocumentNumber(),
                doc.getOriginalFileName(),
                viewUrl,
                doc.getContentType(),
                doc.getFileSize(),
                doc.getRejectionReason(),
                verifiedByName,
                doc.getVerifiedAt(),
                doc.getUploadedAt(),
                doc.getUpdatedAt()
        );
    }
}
