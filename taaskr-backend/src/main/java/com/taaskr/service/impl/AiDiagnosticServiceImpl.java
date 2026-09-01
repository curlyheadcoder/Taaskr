package com.taaskr.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taaskr.dto.ai.AiDiagnosticRequest;
import com.taaskr.dto.ai.AiDiagnosticResponse;
import com.taaskr.entity.Service;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.service.AiDiagnosticService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class AiDiagnosticServiceImpl implements AiDiagnosticService {

    private static final Logger log = LoggerFactory.getLogger(AiDiagnosticServiceImpl.class);

    private final ServiceRepository serviceRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    public AiDiagnosticServiceImpl(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    @Transactional(readOnly = true)
    public AiDiagnosticResponse diagnoseIssue(AiDiagnosticRequest request) {
        String query = request.getQuery() == null ? "" : request.getQuery().trim();
        List<Service> activeServices = serviceRepository.findByActiveTrueOrderByNameAsc();

        if (activeServices.isEmpty()) {
            return new AiDiagnosticResponse(null, "No Services Available", null, null, null, null,
                    "Our catalog is currently being updated.", "LOW");
        }

        // 1. If Gemini API Key is provided, attempt ultra-low-token AI diagnosis
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                AiDiagnosticResponse aiResponse = callGeminiApi(query, activeServices);
                if (aiResponse != null) {
                    return aiResponse;
                }
            } catch (Exception e) {
                log.warn("Gemini API invocation failed, falling back to semantic matching: {}", e.getMessage());
            }
        }

        // 2. High-precision semantic fallback matching algorithm
        return performSemanticMatching(query, activeServices);
    }

    private AiDiagnosticResponse callGeminiApi(String query, List<Service> services) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String catalogSummary = services.stream()
                .map(s -> s.getId() + ":" + s.getName() + " (" + s.getCategory().getName() + ")")
                .collect(Collectors.joining(", "));

        String prompt = String.format(
                "Task: Pick the single most accurate service for issue: \"%s\".\n" +
                "Catalog: [%s].\n" +
                "Respond ONLY in JSON: {\"serviceId\": <number>, \"reason\": \"<brief 1-sentence reason>\", \"urgency\": \"<LOW|MEDIUM|HIGH|EMERGENCY>\"}",
                query, catalogSummary
        );

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "maxOutputTokens", 120,
                        "responseMimeType", "application/json"
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode textNode = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            if (!textNode.isMissingNode()) {
                JsonNode parsedResult = objectMapper.readTree(textNode.asText());
                Long serviceId = parsedResult.path("serviceId").asLong();
                String reason = parsedResult.path("reason").asText("Recommended based on your reported issue.");
                String urgency = parsedResult.path("urgency").asText("MEDIUM");

                Optional<Service> matchedService = services.stream().filter(s -> s.getId().equals(serviceId)).findFirst();
                if (matchedService.isPresent()) {
                    Service s = matchedService.get();
                    return new AiDiagnosticResponse(
                            s.getId(),
                            s.getName(),
                            s.getCategory().getId(),
                            s.getCategory().getName(),
                            s.getPrice(),
                            s.getDurationMinutes(),
                            reason,
                            urgency
                    );
                }
            }
        }
        return null;
    }

    private AiDiagnosticResponse performSemanticMatching(String query, List<Service> services) {
        String lower = query.toLowerCase();

        // 1. Determine Urgency
        String urgency = "MEDIUM";
        if (lower.contains("spark") || lower.contains("smoke") || lower.contains("burst") || lower.contains("shock") ||
                lower.contains("flood") || lower.contains("fire") || lower.contains("emergency") || lower.contains("danger")) {
            urgency = "EMERGENCY";
        } else if (lower.contains("leak") || lower.contains("broken") || lower.contains("stopped") || lower.contains("not working") ||
                lower.contains("urgent") || lower.contains("overflow") || lower.contains("fault") || lower.contains("damaged")) {
            urgency = "HIGH";
        } else if (lower.contains("routine") || lower.contains("check") || lower.contains("regular") || lower.contains("maintenance")) {
            urgency = "LOW";
        }

        // 2. Identify Intent
        boolean isInstallIntent = lower.contains("install") || lower.contains("setup") || lower.contains("mount") || lower.contains("fitting") || lower.contains("new ");
        boolean isMaintenanceIntent = lower.contains("maintenance") || lower.contains("servicing") || lower.contains("cleaning") || lower.contains("filter");
        boolean isRepairIntent = lower.contains("not working") || lower.contains("repair") || lower.contains("broken") || lower.contains("fix") ||
                lower.contains("stopped") || lower.contains("issue") || lower.contains("fault") || lower.contains("spark") || lower.contains("leak") || (!isInstallIntent && !isMaintenanceIntent);

        // 3. Domain Detection
        boolean isAc = isAcDomain(lower);
        boolean isRo = isRoDomain(lower);
        boolean isPlumb = isPlumbingDomain(lower);
        boolean isElectric = isElectricDomain(lower);
        boolean isPest = isPestDomain(lower);
        boolean isClean = isCleaningDomain(lower);
        boolean isSec = isSecurityDomain(lower);
        boolean isDiag = isDiagnosticDomain(lower);
        boolean isCivil = isCivilDomain(lower);

        // 4. Score services
        Service bestMatch = null;
        int bestScore = -100;

        for (Service s : services) {
            int score = 0;
            String nameLower = s.getName().toLowerCase();
            String catLower = s.getCategory().getName().toLowerCase();
            String descLower = s.getDescription() == null ? "" : s.getDescription().toLowerCase();

            // Word token matching
            for (String word : lower.split("[\\s,.]+")) {
                if (word.length() < 2) continue;
                if (word.equals("is") || word.equals("the") || word.equals("and") || word.equals("in") || word.equals("to") || word.equals("my")) continue;

                if (nameLower.contains(word)) score += 6;
                if (catLower.contains(word)) score += 3;
                if (descLower.contains(word)) score += 2;
            }

            // Strong Domain Affinity (+50 points)
            if (isAc && (nameLower.contains("ac") || nameLower.contains("air condition"))) score += 50;
            if (isRo && (nameLower.contains("ro ") || nameLower.startsWith("ro") || nameLower.contains("purifier"))) score += 50;
            if (isPlumb && (catLower.contains("plumb") || nameLower.contains("pipe") || nameLower.contains("tap") || nameLower.contains("leak"))) score += 50;
            if (isElectric && (catLower.contains("elect") || nameLower.contains("electric") || nameLower.contains("switch") || nameLower.contains("wire") || nameLower.contains("spark"))) score += 50;
            if (isPest && (catLower.contains("pest") || nameLower.contains("pest") || nameLower.contains("insect"))) score += 50;
            if (isClean && (catLower.contains("clean") || nameLower.contains("clean") || nameLower.contains("house"))) score += 50;
            if (isSec && (catLower.contains("security") || nameLower.contains("cctv") || nameLower.contains("lock"))) score += 50;
            if (isDiag && (catLower.contains("diagnostic") || nameLower.contains("blood") || nameLower.contains("checkup") || nameLower.contains("health"))) score += 50;
            if (isCivil && (catLower.contains("civil") || nameLower.contains("mason") || nameLower.contains("waterproof") || nameLower.contains("tile"))) score += 50;

            // Intent Modifiers
            if (isInstallIntent) {
                if (nameLower.contains("install") || nameLower.contains("setup")) score += 30;
                if (nameLower.contains("repair")) score -= 20;
            } else if (isMaintenanceIntent) {
                if (nameLower.contains("maintenance") || nameLower.contains("service") || nameLower.contains("clean")) score += 30;
                if (nameLower.contains("install")) score -= 20;
            } else if (isRepairIntent) {
                if (nameLower.contains("repair") || nameLower.contains("fix") || nameLower.contains("spark") || nameLower.contains("leak")) score += 30;
                if (nameLower.contains("install")) score -= 30;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = s;
            }
        }

        if (bestMatch == null) {
            bestMatch = services.get(0);
        }

        String reason = generateReason(query, bestMatch, urgency);

        return new AiDiagnosticResponse(
                bestMatch.getId(),
                bestMatch.getName(),
                bestMatch.getCategory().getId(),
                bestMatch.getCategory().getName(),
                bestMatch.getPrice(),
                bestMatch.getDurationMinutes(),
                reason,
                urgency
        );
    }

    private boolean isAcDomain(String text) {
        return text.contains("ac") || text.contains("air condition") || text.contains("cooling") || text.contains("cool") ||
                text.contains("compressor") || text.contains("warm air");
    }

    private boolean isRoDomain(String text) {
        return text.contains("ro ") || text.startsWith("ro") || text.contains("water purifier") || text.contains("purifier") ||
                text.contains("filter change") || text.contains("drinking water");
    }

    private boolean isPlumbingDomain(String text) {
        return text.contains("leak") || text.contains("pipe") || text.contains("tap") || text.contains("faucet") ||
                text.contains("drain") || text.contains("sink") || text.contains("toilet") || text.contains("flush") || text.contains("water flow");
    }

    private boolean isElectricDomain(String text) {
        return text.contains("spark") || text.contains("wire") || text.contains("switch") || text.contains("board") ||
                text.contains("light") || text.contains("fan") || text.contains("fuse") || text.contains("power") || text.contains("shock") || text.contains("trip");
    }

    private boolean isCleaningDomain(String text) {
        return text.contains("clean") || text.contains("dust") || text.contains("mop") || text.contains("kitchen clean") ||
                text.contains("bathroom clean") || text.contains("deep clean") || text.contains("sofa") || text.contains("carpet");
    }

    private boolean isPestDomain(String text) {
        return text.contains("pest") || text.contains("cockroach") || text.contains("termite") || text.contains("bedbug") ||
                text.contains("ant") || text.contains("rodent") || text.contains("rat") || text.contains("insect");
    }

    private boolean isSecurityDomain(String text) {
        return text.contains("cctv") || text.contains("camera") || text.contains("doorbell") || text.contains("smart lock") ||
                text.contains("guard") || text.contains("security");
    }

    private boolean isDiagnosticDomain(String text) {
        return text.contains("blood") || text.contains("test") || text.contains("checkup") || text.contains("health") ||
                text.contains("sample") || text.contains("doctor") || text.contains("fever") || text.contains("medical");
    }

    private boolean isCivilDomain(String text) {
        return text.contains("wall") || text.contains("crack") || text.contains("mason") || text.contains("brick") ||
                text.contains("waterproof") || text.contains("tile") || text.contains("flooring") || text.contains("roof") ||
                text.contains("renovation") || text.contains("plaster");
    }

    private String generateReason(String query, Service service, String urgency) {
        if ("EMERGENCY".equals(urgency)) {
            return "Potential safety hazard detected. Professional " + service.getName() + " recommended immediately.";
        }
        return "Recommended " + service.getName() + " to resolve your reported issue.";
    }
}
