package com.taaskr.repository;

import com.taaskr.entity.KycDocument;
import com.taaskr.enums.KycDocumentStatus;
import com.taaskr.enums.KycDocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {

    List<KycDocument> findByProviderIdOrderByUploadedAtDesc(Long providerId);

    Optional<KycDocument> findByIdAndProviderId(Long id, Long providerId);

    Optional<KycDocument> findByProviderIdAndDocumentType(Long providerId, KycDocumentType documentType);

    List<KycDocument> findByStatusOrderByUploadedAtDesc(KycDocumentStatus status);

    Page<KycDocument> findByStatusOrderByUploadedAtDesc(KycDocumentStatus status, Pageable pageable);

    Page<KycDocument> findAllByOrderByUploadedAtDesc(Pageable pageable);

    long countByProviderIdAndStatus(Long providerId, KycDocumentStatus status);
}
