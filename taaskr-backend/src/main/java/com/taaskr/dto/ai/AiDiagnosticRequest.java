package com.taaskr.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AiDiagnosticRequest {

    @NotBlank(message = "Issue description cannot be empty")
    @Size(max = 300, message = "Description cannot exceed 300 characters")
    private String query;

    public AiDiagnosticRequest() {
    }

    public AiDiagnosticRequest(String query) {
        this.query = query;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }
}
