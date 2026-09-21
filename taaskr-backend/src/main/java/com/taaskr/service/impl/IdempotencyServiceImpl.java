package com.taaskr.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taaskr.entity.IdempotencyRecord;
import com.taaskr.entity.User;
import com.taaskr.exception.BadRequestException;
import com.taaskr.repository.IdempotencyRecordRepository;
import com.taaskr.service.IdempotencyService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class IdempotencyServiceImpl implements IdempotencyService {

    private final IdempotencyRecordRepository repository;
    private final ObjectMapper objectMapper;

    public IdempotencyServiceImpl(IdempotencyRecordRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<IdempotencyCheckResult> checkIdempotency(User user, String operation, String idempotencyKey, Object requestPayload) {
        if (user == null || idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }

        String currentHash = computeHash(requestPayload);
        Optional<IdempotencyRecord> recordOpt = repository.findByUserIdAndOperationAndIdempotencyKey(user.getId(), operation, idempotencyKey.trim());

        if (recordOpt.isEmpty()) {
            return Optional.of(new IdempotencyCheckResult(false, null, 0));
        }

        IdempotencyRecord record = recordOpt.get();
        if (!record.getRequestHash().equals(currentHash)) {
            throw new BadRequestException("Idempotency key '" + idempotencyKey + "' was previously used with a different request payload.");
        }

        return Optional.of(new IdempotencyCheckResult(true, record.getResponseBody(), record.getResponseStatus()));
    }

    @Override
    @Transactional
    public void saveIdempotencyRecord(User user, String operation, String idempotencyKey, Object requestPayload, Object responsePayload, int statusCode) {
        if (user == null || idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        String hash = computeHash(requestPayload);
        String responseJson = null;

        try {
            if (responsePayload != null) {
                responseJson = responsePayload instanceof String s ? s : objectMapper.writeValueAsString(responsePayload);
            }
        } catch (Exception e) {
            responseJson = "{}";
        }

        try {
            IdempotencyRecord record = new IdempotencyRecord();
            record.setUser(user);
            record.setOperation(operation);
            record.setIdempotencyKey(idempotencyKey.trim());
            record.setRequestHash(hash);
            record.setResponseBody(responseJson);
            record.setResponseStatus(statusCode);
            record.setExpiresAt(LocalDateTime.now().plusHours(24));
            repository.save(record);
        } catch (Exception e) {
            // Uniqueness collision safely handled by DB constraint
        }
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 * * * *") // Bounded hourly cleanup job
    public void cleanupExpiredRecords() {
        repository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    private String computeHash(Object payload) {
        if (payload == null) {
            return "EMPTY_PAYLOAD";
        }
        try {
            String json = objectMapper.writeValueAsString(payload);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (Exception e) {
            return String.valueOf(payload.hashCode());
        }
    }
}
