package com.taaskr.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum PayoutStatus {
    REQUESTED,
    APPROVED,
    PROCESSING,
    PROCESSED,
    COMPLETED,
    REJECTED;

    @JsonCreator
    public static PayoutStatus fromString(String value) {
        if (value == null) return null;
        String val = value.trim().toUpperCase();
        if ("COMPLETED".equals(val) || "SUCCESS".equals(val) || "PAID".equals(val)) {
            return COMPLETED;
        }
        if ("PROCESSING".equals(val) || "IN_PROGRESS".equals(val)) {
            return PROCESSING;
        }
        for (PayoutStatus status : PayoutStatus.values()) {
            if (status.name().equalsIgnoreCase(val)) {
                return status;
            }
        }
        return REQUESTED;
    }
}
