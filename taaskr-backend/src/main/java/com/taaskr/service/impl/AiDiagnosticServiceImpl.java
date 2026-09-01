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

        // 2. Semantic fallback matching algorithm
        return performSemanticMatching(query, activeServices);
    }

    private AiDiagnosticResponse callGeminiApi(String query, List<Service> services) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        // Compact catalog: "1:AC Repair (AC), 2:Leak Fix (Plumbing)"
        String catalogSummary = services.stream()
                .map(s -> s.getId() + ":" + s.getName() + " (" + s.getCategory().getName() + ")")
                .collect(Collectors.joining(", "));

        String prompt = String.format(
                "Task: Pick the best matching service for customer issue: \"%s\".\n" +
                "Available services: [%s].\n" +
                "Respond ONLY with a JSON object: {\"serviceId\": <number>, \"reason\": \"<brief 1-sentence reason>\", \"urgency\": \"<LOW|MEDIUM|HIGH|EMERGENCY>\"}",
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
        
        // Determine urgency
        String urgency = "MEDIUM";
        if (lower.contains("spark") || lower.contains("smoke") || lower.contains("burst") || lower.contains("shock") || lower.contains("flood") || lower.contains("emergency")) {
            urgency = "EMERGENCY";
        } else if (lower.contains("leak") || lower.contains("broken") || lower.contains("stopped") || lower.contains("urgent")) {
            urgency = "HIGH";
        } else if (lower.contains("routine") || lower.contains("check") || lower.contains("regular")) {
            urgency = "LOW";
        }

        // Score services
        Service bestMatch = null;
        int bestScore = -1;

        for (Service s : services) {
            int score = 0;
            String nameLower = s.getName().toLowerCase();
            String catLower = s.getCategory().getName().toLowerCase();
            String descLower = s.getDescription() == null ? "" : s.getDescription().toLowerCase();

            for (String word : lower.split("\\s+")) {
                if (word.length() < 3) continue;
                if (nameLower.contains(word)) score += 5;
                if (catLower.contains(word)) score += 4;
                if (descLower.contains(word)) score += 2;
            }

            // Keyword boosts
            if (matchesPlumbing(lower) && catLower.contains("plumb")) score += 10;
            if (matchesElectric(lower) && (catLower.contains("elect") || nameLower.contains("electric") || nameLower.contains("wire"))) score += 10;
            if (matchesAc(lower) && (catLower.contains("ac") || nameLower.contains("ac") || catLower.contains("appliance"))) score += 10;
            if (matchesCleaning(lower) && (catLower.contains("clean") || nameLower.contains("clean"))) score += 10;
            if (matchesPest(lower) && (catLower.contains("pest") || nameLower.contains("pest"))) score += 10;

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

    private boolean matchesPlumbing(String text) {
        return text.contains("leak") || text.contains("pipe") || text.contains("tap") || text.contains("faucet") ||
                text.contains("drain") || text.contains("sink") || text.contains("toilet") || text.contains("water") || text.contains("flush");
    }

    private boolean matchesElectric(String text) {
        return text.contains("spark") || text.contains("wire") || text.contains("switch") || text.contains("board") ||
                text.contains("light") || text.contains("fan") || text.contains("fuse") || text.contains("power") || text.contains("shock");
    }

    private boolean matchesAc(String text) {
        return text.contains("ac") || text.contains("air condition") || text.contains("cooling") || text.contains("gas") ||
                text.contains("filter") || text.contains("warm air") || text.contains("compressor");
    }

    private boolean matchesCleaning(String text) {
        return text.contains("clean") || text.contains("dust") || text.contains("mop") || text.contains("kitchen") ||
                text.contains("bathroom") || text.contains("deep clean") || text.contains("sofa") || text.contains("stain");
    }

    private boolean matchesPest(String text) {
        return text.contains("pest") || text.contains("cockroach") || text.contains("termite") || text.contains("bedbug") ||
                text.contains("ant") || text.contains("rodent") || text.contains("rat") || text.contains("insect");
    }

    private String generateReason(String query, Service service, String urgency) {
        if ("EMERGENCY".equals(urgency)) {
            return "Potential safety/damage hazard detected. Professional service recommended immediately.";
        }
        return "Matched your reported issue with our " + service.getName() + " in " + service.getCategory().getName() + ".";
    }
}
