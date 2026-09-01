package com.taaskr.service;

import com.taaskr.dto.ai.AiDiagnosticRequest;
import com.taaskr.dto.ai.AiDiagnosticResponse;

public interface AiDiagnosticService {
    AiDiagnosticResponse diagnoseIssue(AiDiagnosticRequest request);
}
