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
    private final com.taaskr.service.AppMetricsService appMetricsService;

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    public AiDiagnosticServiceImpl(ServiceRepository serviceRepository,
                                   com.taaskr.service.AppMetricsService appMetricsService) {
        this.serviceRepository = serviceRepository;
        this.appMetricsService = appMetricsService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    @Transactional(readOnly = true)
    public AiDiagnosticResponse diagnoseIssue(AiDiagnosticRequest request) {
        long startTime = System.currentTimeMillis();
        boolean success = false;
        try {
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
                        success = true;
                        return aiResponse;
                    }
                } catch (Exception e) {
                    log.warn("Gemini API invocation failed, falling back to semantic matching: {}", e.getMessage());
                }
            }

            // 2. High-precision semantic fallback matching algorithm
            AiDiagnosticResponse response = performSemanticMatching(query, activeServices);
            success = (response != null && response.getServiceId() != null);
            return response;
        } finally {
            long durationMs = System.currentTimeMillis() - startTime;
            appMetricsService.recordAiDiagnostic(success, java.time.Duration.ofMillis(durationMs));
        }
    }

    private AiDiagnosticResponse callGeminiApi(String query, List<Service> services) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String catalogSummary = services.stream()
                .map(s -> s.getId() + ":" + s.getName() + " (" + s.getCategory().getName() + ")")
                .collect(Collectors.joining(", "));

        String prompt = String.format(
                "Task: Pick the single most accurate service for user intent/issue: \"%s\".\n" +
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

    private boolean hasWord(String text, String... words) {
        for (String word : words) {
            String pattern = "(?i)\\b" + java.util.regex.Pattern.quote(word) + "\\b";
            if (java.util.regex.Pattern.compile(pattern).matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    private boolean isVehicleDomain(String text) {
        return text.contains("parcel") || text.contains("courier") || text.contains("package") || text.contains("send") ||
                text.contains("deliver") || text.contains("delivery") || text.contains("luggage") ||
                text.contains("goods") || text.contains("truck") || text.contains("tempo") || text.contains("vehicle") ||
                text.contains("shifting") || text.contains("moving") || text.contains("transport") || text.contains("freight") ||
                text.contains("loading") || text.contains("carton") || text.contains("dropoff") ||
                text.contains("pickup and drop") || text.contains("intra-city") || text.contains("porter") || text.contains("office move") ||
                text.contains("bike courier") || text.contains("mini truck") || hasWord(text, "box", "boxes", "haul", "van");
    }

    private boolean isAcDomain(String text) {
        return hasWord(text, "ac", "air condition", "air conditioner", "air conditioning", "cooling", "compressor", "warm air", "hvac");
    }

    private boolean isRoDomain(String text) {
        return hasWord(text, "ro", "water purifier", "purifier", "filter change", "drinking water", "aquaguard", "kent");
    }

    private boolean isPlumbingDomain(String text) {
        return hasWord(text, "leak", "leaking", "pipe", "pipes", "tap", "taps", "faucet", "drain", "drainage", "sink", "toilet", "flush", "water flow");
    }

    private boolean isElectricDomain(String text) {
        return hasWord(text, "spark", "sparking", "wire", "wiring", "switch", "switchboard", "fuse", "power", "shock", "trip", "tripped", "mcb", "short circuit", "fan", "light");
    }

    private boolean isCleaningDomain(String text) {
        return hasWord(text, "clean", "cleaning", "dust", "mop", "deep clean", "house clean", "kitchen clean", "bathroom clean", "carpet", "sofa clean");
    }

    private boolean isPestDomain(String text) {
        return hasWord(text, "pest", "cockroach", "termite", "bedbug", "ant", "rodent", "rat", "insect");
    }

    private boolean isSecurityDomain(String text) {
        return hasWord(text, "cctv", "camera", "doorbell", "smart lock", "guard", "security");
    }

    private boolean isDiagnosticDomain(String text) {
        return hasWord(text, "blood", "test", "checkup", "health", "sample", "doctor", "fever", "medical", "pathology");
    }

    private boolean isCivilDomain(String text) {
        return hasWord(text, "wall", "crack", "mason", "brick", "waterproof", "tile", "tiles", "flooring", "roof", "renovation", "plaster");
    }

    private boolean isLogisticsCategory(String catLower) {
        return catLower.contains("logistic") || catLower.contains("cargo") || catLower.contains("courier") ||
                catLower.contains("vehicle") || catLower.contains("transport") || catLower.contains("moving") ||
                catLower.contains("shifting") || catLower.contains("freight") || catLower.contains("delivery");
    }

    private AiDiagnosticResponse performSemanticMatching(String query, List<Service> services) {
        String lower = query.toLowerCase();

        // 1. Determine Urgency
        String urgency = "MEDIUM";
        if (hasWord(lower, "spark", "sparking", "smoke", "burst", "shock", "flood", "fire", "emergency", "danger")) {
            urgency = "EMERGENCY";
        } else if (hasWord(lower, "leak", "leaking", "broken", "stopped", "not working", "urgent", "overflow", "fault", "damaged")) {
            urgency = "HIGH";
        } else if (hasWord(lower, "routine", "check", "regular", "maintenance")) {
            urgency = "LOW";
        }

        // 2. Identify Intent & Domains
        boolean isVehicle = isVehicleDomain(lower);
        boolean isAc = !isVehicle && isAcDomain(lower);
        boolean isRo = !isVehicle && isRoDomain(lower);
        boolean isPlumb = !isVehicle && isPlumbingDomain(lower);
        boolean isElectric = !isVehicle && isElectricDomain(lower);
        boolean isPest = !isVehicle && isPestDomain(lower);
        boolean isClean = !isVehicle && isCleaningDomain(lower);
        boolean isSec = !isVehicle && isSecurityDomain(lower);
        boolean isDiag = !isVehicle && isDiagnosticDomain(lower);
        boolean isCivil = !isVehicle && isCivilDomain(lower);

        boolean isInstallIntent = hasWord(lower, "install", "installation", "setup", "mount", "fitting", "new");
        boolean isMaintenanceIntent = hasWord(lower, "maintenance", "servicing", "service", "cleaning", "filter");
        boolean isRepairIntent = !isVehicle && (hasWord(lower, "repair", "fix", "issue", "fault", "spark", "sparking", "leak", "leaking", "broken", "stopped") || (!isInstallIntent && !isMaintenanceIntent));

        // 3. Score services
        Service bestMatch = null;
        int bestScore = -100;

        for (Service s : services) {
            int score = 0;
            String nameLower = s.getName().toLowerCase();
            String catLower = s.getCategory().getName().toLowerCase();
            String descLower = s.getDescription() == null ? "" : s.getDescription().toLowerCase();

            // Word token matching
            for (String word : lower.split("[\\s,.]+")) {
                if (word.length() < 3) continue;
                if (word.equals("the") || word.equals("and") || word.equals("want") || word.equals("need") || word.equals("for")) continue;

                if (nameLower.contains(word)) score += 8;
                if (catLower.contains(word)) score += 4;
                if (descLower.contains(word)) score += 2;
            }

            // Strong Domain Affinity (+80 points)
            if (isVehicle) {
                if (isLogisticsCategory(catLower)) {
                    score += 80;
                }
                if (hasWord(lower, "parcel", "courier", "document", "small", "bag", "envelope", "across the city", "office")) {
                    if (nameLower.contains("bike") || nameLower.contains("courier") || nameLower.contains("two wheeler") || nameLower.contains("parcel")) {
                        score += 40;
                    }
                } else if (hasWord(lower, "furniture", "shifting", "house", "heavy", "sofa", "bed", "goods", "boxes")) {
                    if (nameLower.contains("mini truck") || nameLower.contains("truck") || nameLower.contains("tempo") || nameLower.contains("loading")) {
                        score += 40;
                    }
                }
            }

            if (isAc && (nameLower.contains("ac") || nameLower.contains("air condition"))) score += 60;
            if (isRo && (nameLower.contains("ro") || nameLower.contains("purifier"))) score += 60;
            if (isPlumb && (catLower.contains("plumb") || nameLower.contains("pipe") || nameLower.contains("tap") || nameLower.contains("leak"))) score += 60;
            if (isElectric && (catLower.contains("elect") || nameLower.contains("electric") || nameLower.contains("switch") || nameLower.contains("wire") || nameLower.contains("spark"))) score += 60;
            if (isPest && (catLower.contains("pest") || nameLower.contains("cockroach") || nameLower.contains("insect"))) score += 60;
            if (isClean && (catLower.contains("clean") || nameLower.contains("house"))) score += 60;
            if (isSec && (catLower.contains("security") || nameLower.contains("cctv") || nameLower.contains("lock"))) score += 60;
            if (isDiag && (catLower.contains("diagnostic") || nameLower.contains("blood") || nameLower.contains("checkup") || nameLower.contains("health"))) score += 60;
            if (isCivil && (catLower.contains("civil") || nameLower.contains("mason") || nameLower.contains("waterproof") || nameLower.contains("tile"))) score += 60;

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

        String reason = generateReason(query, bestMatch, urgency, isVehicle);

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

    private String generateReason(String query, Service service, String urgency, boolean isVehicle) {
        if (isVehicle) {
            return "Recommended " + service.getName() + " for fast intra-city transport and door-to-door delivery.";
        }
        if ("EMERGENCY".equals(urgency)) {
            return "Potential safety hazard detected. Professional " + service.getName() + " recommended immediately.";
        }
        return "Recommended " + service.getName() + " to resolve your reported issue.";
    }
}
