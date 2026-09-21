package com.taaskr.enums;

public enum PushDeliveryStatus {
    PENDING,
    SENDING,
    SENT_ACCEPTED,
    DELIVERED,
    FAILED_RETRYABLE,
    FAILED_PERMANENT,
    INVALID_TOKEN
}
