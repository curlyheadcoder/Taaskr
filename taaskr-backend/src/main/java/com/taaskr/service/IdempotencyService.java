package com.taaskr.service;

import com.taaskr.entity.User;
import java.util.Optional;

public interface IdempotencyService {

    Optional<IdempotencyCheckResult> checkIdempotency(User user, String operation, String idempotencyKey, Object requestPayload);

    void saveIdempotencyRecord(User user, String operation, String idempotencyKey, Object requestPayload, Object responsePayload, int statusCode);

    void cleanupExpiredRecords();

    record IdempotencyCheckResult(boolean isDuplicate, String cachedResponseBody, int statusCode) {}
}
