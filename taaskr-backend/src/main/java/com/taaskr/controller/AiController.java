package com.taaskr.controller;

import com.taaskr.dto.ai.AiDiagnosticRequest;
import com.taaskr.dto.ai.AiDiagnosticResponse;
import com.taaskr.service.AiDiagnosticService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiDiagnosticService aiDiagnosticService;

    public AiController(AiDiagnosticService aiDiagnosticService) {
        this.aiDiagnosticService = aiDiagnosticService;
    }

    @PostMapping("/diagnose")
    public AiDiagnosticResponse diagnose(@Valid @RequestBody AiDiagnosticRequest request) {
        return aiDiagnosticService.diagnoseIssue(request);
    }
}
