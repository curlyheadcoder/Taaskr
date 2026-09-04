package com.taaskr.service;

import com.taaskr.dto.ai.AiChatRequest;
import com.taaskr.dto.ai.AiChatResponse;
import com.taaskr.dto.ai.AiDiagnosticRequest;
import com.taaskr.dto.ai.AiDiagnosticResponse;

public interface AiDiagnosticService {
    AiDiagnosticResponse diagnoseIssue(AiDiagnosticRequest request);
    AiChatResponse chat(String userEmail, AiChatRequest request);
}
