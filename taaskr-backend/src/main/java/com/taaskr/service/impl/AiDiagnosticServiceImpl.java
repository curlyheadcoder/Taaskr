package com.taaskr.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taaskr.dto.ai.AiChatRequest;
import com.taaskr.dto.ai.AiChatResponse;
import com.taaskr.dto.ai.AiDiagnosticRequest;
import com.taaskr.dto.ai.AiDiagnosticResponse;
import com.taaskr.dto.booking.AvailableProviderResponse;
import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.service.AiDiagnosticService;
import com.taaskr.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class AiDiagnosticServiceImpl implements AiDiagnosticService {

    private static final Logger log = LoggerFactory.getLogger(AiDiagnosticServiceImpl.class);

    private final ServiceRepository serviceRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final BookingService bookingService;
    private final com.taaskr.service.AppMetricsService appMetricsService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    public AiDiagnosticServiceImpl(ServiceRepository serviceRepository,
                                   ServiceCategoryRepository categoryRepository,
                                   BookingService bookingService,
                                   com.taaskr.service.AppMetricsService appMetricsService) {
        this.serviceRepository = serviceRepository;
        this.categoryRepository = categoryRepository;
        this.bookingService = bookingService;
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

            String lower = query.toLowerCase();
            String urgency = "MEDIUM";
            if (hasWord(lower, "spark", "fire", "smoke", "burning", "electric shock", "gas leak", "burst", "short circuit")) {
                urgency = "EMERGENCY";
            } else if (hasWord(lower, "leak", "not working", "broken", "overflow", "urgent", "immediate", "emergency")) {
                urgency = "HIGH";
            }

            AiChatResponse chatRes = processIntentAndTools(null, query, activeServices, null);
            if (chatRes != null && chatRes.getServices() != null && !chatRes.getServices().isEmpty()) {
                ServiceResponse top = chatRes.getServices().get(0);
                success = true;
                return new AiDiagnosticResponse(
                        top.getId(),
                        top.getName(),
                        top.getCategoryId(),
                        top.getCategoryName(),
                        top.getPrice(),
                        top.getDurationMinutes(),
                        chatRes.getReply(),
                        urgency
                );
            }

            // Fallback matching
            Service best = findBestMatchingService(query, activeServices);
            if (best != null) {
                success = true;
                return new AiDiagnosticResponse(
                        best.getId(),
                        best.getName(),
                        best.getCategory() != null ? best.getCategory().getId() : null,
                        best.getCategory() != null ? best.getCategory().getName() : null,
                        best.getPrice(),
                        best.getDurationMinutes(),
                        "Recommended " + best.getName() + " for your request.",
                        urgency
                );
            }

            return new AiDiagnosticResponse(null, "No matching service", null, null, null, null,
                    "No exact service found in catalog. Please explore all categories.", "LOW");
        } finally {
            long durationMs = System.currentTimeMillis() - startTime;
            appMetricsService.recordAiDiagnostic(success, java.time.Duration.ofMillis(durationMs));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AiChatResponse chat(String userEmail, AiChatRequest request) {
        long startTime = System.currentTimeMillis();
        boolean success = false;
        try {
            String query = request.getMessage() == null ? "" : request.getMessage().trim();
            List<Service> activeServices = serviceRepository.findByActiveTrueOrderByNameAsc();

            // 1. Try Gemini API with Tool Grounding if API key is present
            if (geminiApiKey != null && !geminiApiKey.isBlank()) {
                try {
                    AiChatResponse geminiRes = callGeminiChat(userEmail, query, activeServices, request);
                    if (geminiRes != null) {
                        success = true;
                        return geminiRes;
                    }
                } catch (Exception e) {
                    log.warn("Gemini chat API call failed, falling back to real catalog intent engine: {}", e.getMessage());
                }
            }

            // 2. High-precision Grounded Catalog & Booking Engine
            AiChatResponse response = processIntentAndTools(userEmail, query, activeServices, request);
            success = true;
            return response;
        } finally {
            long durationMs = System.currentTimeMillis() - startTime;
            appMetricsService.recordAiDiagnostic(success, java.time.Duration.ofMillis(durationMs));
        }
    }

    private AiChatResponse processIntentAndTools(String userEmail, String query, List<Service> services, AiChatRequest request) {
        String lower = query.toLowerCase().trim();

        // 1. Intent: User asks about their bookings ("What bookings do I have?", "my bookings", "active orders")
        if (hasWord(lower, "my booking", "my bookings", "active booking", "booking status", "track booking", "what bookings", "show bookings", "my orders")) {
            if (userEmail == null || userEmail.isBlank() || "anonymousUser".equalsIgnoreCase(userEmail)) {
                AiChatResponse res = new AiChatResponse("Please log in to view and manage your active bookings.");
                res.setIntent("MY_BOOKINGS");
                res.setActionType("NAVIGATE");
                res.setQuickReplies(List.of("Log In", "Explore Services"));
                return res;
            }

            List<BookingResponse> myBookings = bookingService.getMyBookings(userEmail);
            AiChatResponse res = new AiChatResponse();
            res.setIntent("MY_BOOKINGS");
            res.setActionType("VIEW_BOOKINGS");
            res.setBookings(myBookings);

            if (myBookings.isEmpty()) {
                res.setReply("You currently have no active or past bookings on Taaskr. Would you like to book a service today?");
                res.setQuickReplies(List.of("AC Repair", "Send Parcel", "Full Home Cleaning", "Electrician"));
            } else {
                res.setReply("Here are your current bookings on Taaskr (" + myBookings.size() + " total):");
                res.setQuickReplies(List.of("Book Another Service", "Help with Booking"));
            }
            return res;
        }

        // 2. Intent: User asks to cancel booking ("Cancel my booking", "cancel order")
        if (hasWord(lower, "cancel booking", "cancel my booking", "cancel service", "cancel order")) {
            if (userEmail == null || userEmail.isBlank() || "anonymousUser".equalsIgnoreCase(userEmail)) {
                AiChatResponse res = new AiChatResponse("Please log in to manage or cancel your bookings.");
                res.setIntent("MY_BOOKINGS");
                res.setActionType("NAVIGATE");
                return res;
            }

            List<BookingResponse> myBookings = bookingService.getMyBookings(userEmail);
            List<BookingResponse> cancellable = myBookings.stream()
                    .filter(b -> b.getStatus() != com.taaskr.enums.BookingStatus.COMPLETED && b.getStatus() != com.taaskr.enums.BookingStatus.CANCELLED)
                    .toList();

            AiChatResponse res = new AiChatResponse();
            res.setIntent("CANCEL_CONFIRMATION");
            res.setBookings(cancellable);
            if (cancellable.isEmpty()) {
                res.setReply("You don't have any pending or active bookings that can be cancelled.");
            } else {
                res.setReply("Select which active booking you wish to cancel:");
            }
            return res;
        }

        // 3. Intent: Check availability ("Is AC repair available tomorrow?", "slots for plumbing", "available tomorrow")
        if (hasWord(lower, "available", "slots", "availability", "free tomorrow", "when can someone come")) {
            Service matched = findBestMatchingService(lower, services);
            if (matched != null) {
                LocalDate targetDate = LocalDate.now().plusDays(lower.contains("tomorrow") ? 1 : 0);
                String city = request != null && request.getCity() != null ? request.getCity() : "Indore";
                List<AvailableProviderResponse> slots = bookingService.getAvailableProviders(
                        matched.getId(), city, null, targetDate, LocalTime.of(9, 0)
                );

                AiChatResponse res = new AiChatResponse();
                res.setIntent("AVAILABILITY");
                res.setActionType("BOOK_SERVICE");
                res.setTargetServiceId(matched.getId());
                res.setServices(List.of(mapServiceToResponse(matched)));

                if (!slots.isEmpty()) {
                    res.setReply("Yes! " + matched.getName() + " (₹" + matched.getPrice() + ") is available in " + city + " for " + targetDate + " with " + slots.size() + " verified specialist(s) ready to dispatch.");
                } else {
                    res.setReply(matched.getName() + " is available for booking on " + targetDate + " (Starting ₹" + matched.getPrice() + "). Automated dispatch will match the nearest specialist.");
                }
                res.setQuickReplies(List.of("Book " + matched.getName(), "Check Another Date"));
                return res;
            }
        }

        // 4. Intent: Check price / details ("How much is AC repair?", "price of electrician", "cost for deep cleaning")
        if (hasWord(lower, "how much", "price", "cost", "rate", "charges", "fare")) {
            Service matched = findBestMatchingService(lower, services);
            if (matched != null) {
                AiChatResponse res = new AiChatResponse();
                res.setIntent("DETAILS");
                res.setActionType("BOOK_SERVICE");
                res.setTargetServiceId(matched.getId());
                res.setServices(List.of(mapServiceToResponse(matched)));
                res.setReply(matched.getName() + " is priced transparently at ₹" + matched.getPrice() + " (~" + matched.getDurationMinutes() + " mins). No hidden fees with pay-after-completion.");
                res.setQuickReplies(List.of("Book " + matched.getName(), "View Service Details"));
                return res;
            }
        }

        // 5. Intent: Booking direct action ("Book AC repair tomorrow", "Book electrician")
        if (hasWord(lower, "book", "schedule", "reserve", "hire") && !lower.contains("my bookings")) {
            Service matched = findBestMatchingService(lower, services);
            if (matched != null) {
                AiChatResponse res = new AiChatResponse();
                res.setIntent("BOOK_CONFIRMATION");
                res.setActionType("BOOK_SERVICE");
                res.setTargetServiceId(matched.getId());
                res.setServices(List.of(mapServiceToResponse(matched)));
                res.setReply("I found " + matched.getName() + " (₹" + matched.getPrice() + "). Would you like to proceed with booking?");
                res.setQuickReplies(List.of("Confirm Booking", "Check Details"));
                return res;
            }
        }

        // 6. Check for Unsupported / Out-of-Domain Requests ("spaceship repair", "flight booking", "car wash")
        if (isUnsupportedDomain(lower)) {
            List<ServiceCategory> cats = categoryRepository.findAll().stream().filter(c -> Boolean.TRUE.equals(c.getActive())).toList();
            String catList = cats.stream().map(ServiceCategory::getName).collect(Collectors.joining(", "));
            AiChatResponse res = new AiChatResponse("We currently do not offer this service on Taaskr. Our verified service domains include: " + catList + ". How else can we assist your home or logistics needs?");
            res.setIntent("UNSUPPORTED");
            res.setActionType("NONE");
            res.setQuickReplies(List.of("AC Repair", "Send Parcel", "Plumbing", "Electrical"));
            return res;
        }

        // 7. Standard Service Search & Discovery
        List<Service> matchedServices = searchCatalogServices(lower, services);
        if (!matchedServices.isEmpty()) {
            AiChatResponse res = new AiChatResponse();
            res.setIntent("SEARCH");
            res.setActionType("BOOK_SERVICE");
            res.setServices(matchedServices.stream().map(this::mapServiceToResponse).limit(4).toList());
            Service top = matchedServices.get(0);
            res.setTargetServiceId(top.getId());

            if (isVehicleQuery(lower)) {
                res.setReply("Here are our intra-city on-demand delivery and vehicle transport services for your parcel/goods:");
            } else {
                res.setReply("I found the following verified services matching your request:");
            }
            res.setQuickReplies(matchedServices.stream().map(Service::getName).limit(3).toList());
            return res;
        }

        // 8. Polite fallback if no match found
        AiChatResponse fallback = new AiChatResponse("I couldn't find a direct service matching \"" + query + "\" in our catalog. You can search by category or browse all available services below.");
        fallback.setIntent("UNSUPPORTED");
        fallback.setActionType("NONE");
        fallback.setQuickReplies(List.of("All Services", "AC Repair", "Send Parcel", "Cleaning"));
        return fallback;
    }

    private AiChatResponse callGeminiChat(String userEmail, String query, List<Service> services, AiChatRequest request) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String catalogSummary = services.stream()
                .map(s -> s.getId() + ":" + s.getName() + " (" + s.getCategory().getName() + " - ₹" + s.getPrice() + ")")
                .collect(Collectors.joining(", "));

        String prompt = String.format(
                "You are Taasky, the intelligent AI assistant for Taaskr on-demand home services.\n" +
                "Real Catalog: [%s].\n" +
                "User query: \"%s\".\n" +
                "Location: %s.\n" +
                "Rules:\n" +
                "- NEVER hallucinate services, prices, or fake statuses.\n" +
                "- If the user wants to send a parcel/package/goods, select an On-Demand Vehicle/Courier service (Electric Bike, Petrol Bike, Mini Truck, etc.).\n" +
                "- If the user asks about bookings, set intent to 'MY_BOOKINGS'.\n" +
                "- If service is completely outside home/logistics services, set intent to 'UNSUPPORTED' and serviceId to null.\n" +
                "- Output ONLY JSON: {\"intent\": \"SEARCH|DETAILS|AVAILABILITY|MY_BOOKINGS|CANCEL|UNSUPPORTED\", \"serviceId\": <number or null>, \"reply\": \"<helpful conversational message>\"}",
                catalogSummary, query, request != null && request.getCity() != null ? request.getCity() : "Indore"
        );

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "maxOutputTokens", 180,
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
                JsonNode parsed = objectMapper.readTree(textNode.asText());
                String intent = parsed.path("intent").asText("SEARCH");
                String reply = parsed.path("reply").asText("");
                Long serviceId = parsed.path("serviceId").isNull() ? null : parsed.path("serviceId").asLong(0);

                if ("MY_BOOKINGS".equalsIgnoreCase(intent) || "CANCEL".equalsIgnoreCase(intent)) {
                    return processIntentAndTools(userEmail, query, services, request);
                }

                if (serviceId != null && serviceId > 0) {
                    Optional<Service> sOpt = services.stream().filter(s -> s.getId().equals(serviceId)).findFirst();
                    if (sOpt.isPresent()) {
                        Service s = sOpt.get();
                        AiChatResponse res = new AiChatResponse();
                        res.setIntent(intent);
                        res.setReply(reply.isBlank() ? "I recommend " + s.getName() + " (₹" + s.getPrice() + ") for your request." : reply);
                        res.setServices(List.of(mapServiceToResponse(s)));
                        res.setTargetServiceId(s.getId());
                        res.setActionType("BOOK_SERVICE");
                        res.setQuickReplies(List.of("Book " + s.getName(), "Service Details"));
                        return res;
                    }
                } else if ("UNSUPPORTED".equalsIgnoreCase(intent)) {
                    AiChatResponse res = new AiChatResponse(reply.isBlank() ? "We currently do not offer this service on Taaskr." : reply);
                    res.setIntent("UNSUPPORTED");
                    res.setActionType("NONE");
                    res.setQuickReplies(List.of("AC Repair", "Send Parcel", "Plumbing", "Electrical"));
                    return res;
                }
            }
        }
        return null;
    }

    private boolean isVehicleQuery(String text) {
        return text.contains("parcel") || text.contains("courier") || text.contains("package") || text.contains("send") ||
                text.contains("deliver") || text.contains("delivery") || text.contains("luggage") ||
                text.contains("goods") || text.contains("truck") || text.contains("tempo") || text.contains("vehicle") ||
                text.contains("shifting") || text.contains("moving") || text.contains("transport") || text.contains("freight") ||
                text.contains("loading") || text.contains("bike courier") || text.contains("mini truck");
    }

    private boolean isUnsupportedDomain(String text) {
        return hasWord(text, "spaceship", "rocket", "supersonic", "jet engine", "airplane", "aeroplane", "aircraft", "helicopter", "submarine", "train", "passport", "visa", "flight ticket", "hotel booking", "astrology", "crypto", "stock market", "casino");
    }

    private List<Service> searchCatalogServices(String query, List<Service> services) {
        String lower = query.toLowerCase().trim();
        List<Service> results = new ArrayList<>();

        // Parcel / courier priority
        if (hasWord(lower, "parcel", "courier", "document", "small parcel", "send package", "across the city")) {
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                if (n.contains("bike") || n.contains("courier") || n.contains("rickshaw") || n.contains("parcel")) {
                    results.add(s);
                }
            }
            if (!results.isEmpty()) return results;
        }

        // Heavy moving / shifting priority
        if (hasWord(lower, "shifting", "furniture", "heavy", "sofa", "office move", "truck", "tempo")) {
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                if (n.contains("mini truck") || n.contains("truck") || n.contains("loading") || n.contains("tempo")) {
                    results.add(s);
                }
            }
            if (!results.isEmpty()) return results;
        }

        // 1. AC & Cooling domain with intent disambiguation
        if (hasWord(lower, "ac", "air condition", "air conditioner", "cooling", "warm air", "hvac", "split ac", "window ac")) {
            List<Service> acServices = new ArrayList<>();
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                // Ensure whole-word 'ac' or 'air condition' so words like 'machine' are NOT matched
                if (hasWord(n, "ac", "hvac") || n.contains("air condition") || n.contains("air conditioner") || (hasWord(n, "cooling") && !n.contains("machine"))) {
                    acServices.add(s);
                }
            }

            if (!acServices.isEmpty()) {
                if (hasWord(lower, "install", "installation", "mounting", "fit new", "new ac", "living room")) {
                    acServices.sort((a, b) -> {
                        boolean aMatch = a.getName().toLowerCase().contains("install");
                        boolean bMatch = b.getName().toLowerCase().contains("install");
                        return Boolean.compare(bMatch, aMatch);
                    });
                } else if (hasWord(lower, "maintenance", "servicing", "service", "filter", "routine", "checkup")) {
                    acServices.sort((a, b) -> {
                        boolean aMatch = a.getName().toLowerCase().contains("maintenance") || a.getName().toLowerCase().contains("service");
                        boolean bMatch = b.getName().toLowerCase().contains("maintenance") || b.getName().toLowerCase().contains("service");
                        return Boolean.compare(bMatch, aMatch);
                    });
                } else {
                    // Default repair priority for "not working", "warm air", "repair", "broken", "issue", "cooling"
                    acServices.sort((a, b) -> {
                        boolean aMatch = a.getName().toLowerCase().contains("repair");
                        boolean bMatch = b.getName().toLowerCase().contains("repair");
                        return Boolean.compare(bMatch, aMatch);
                    });
                }
                return acServices;
            }
        }

        // 2. Washing Machine & Laundry Appliances
        if (hasWord(lower, "washing machine", "washer", "dryer", "laundry", "spin", "drum")) {
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                if (n.contains("washing machine") || n.contains("dryer")) {
                    results.add(s);
                }
            }
            if (!results.isEmpty()) return results;
        }

        // 3. Refrigerator / Fridge
        if (hasWord(lower, "refrigerator", "fridge", "freezer", "ice maker")) {
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                if (n.contains("refrigerator") || n.contains("fridge")) {
                    results.add(s);
                }
            }
            if (!results.isEmpty()) return results;
        }

        // 4. Plumbing domain
        if (hasWord(lower, "plumb", "plumber", "pipe", "leak", "tap", "sink", "faucet", "drain", "toilet", "flush", "water tank", "seepage")) {
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                String c = s.getCategory().getName().toLowerCase();
                if (c.contains("plumb") || hasWord(n, "pipe", "tap", "leak", "sink", "drain", "toilet", "plumbing", "faucet")) {
                    results.add(s);
                }
            }
            if (!results.isEmpty()) return results;
        }

        // 5. Electric domain
        if (hasWord(lower, "electr", "electrician", "spark", "wire", "switch", "switchboard", "fuse", "fan", "short circuit", "mcb", "inverter")) {
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                String c = s.getCategory().getName().toLowerCase();
                if (c.contains("elect") || hasWord(n, "switch", "switchboard", "fan", "wire", "wiring", "spark", "circuit", "fuse", "mcb", "electrician")) {
                    results.add(s);
                }
            }
            if (!results.isEmpty()) return results;
        }

        // 6. Cleaning domain
        if (hasWord(lower, "clean", "cleaning", "maid", "mop", "housekeeping", "dust", "sofa cleaning", "bathroom cleaning")) {
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                String c = s.getCategory().getName().toLowerCase();
                if (c.contains("clean") || n.contains("clean")) {
                    results.add(s);
                }
            }
            if (!results.isEmpty()) return results;
        }

        // 7. Security / Smart Lock / CCTV
        if (hasWord(lower, "security", "guard", "cctv", "camera", "doorbell", "smart lock", "lock")) {
            for (Service s : services) {
                String n = s.getName().toLowerCase();
                String c = s.getCategory().getName().toLowerCase();
                if (c.contains("security") || hasWord(n, "security", "cctv", "camera", "lock", "guard", "doorbell")) {
                    results.add(s);
                }
            }
            if (!results.isEmpty()) return results;
        }

        // 8. General token matching across services
        for (Service s : services) {
            String nameLower = s.getName().toLowerCase();
            String catLower = s.getCategory().getName().toLowerCase();

            for (String word : lower.split("[\\s,.]+")) {
                if (word.length() < 4) continue;
                if (hasWord(nameLower, word) || hasWord(catLower, word)) {
                    if (!results.contains(s)) results.add(s);
                }
            }
        }

        return results;
    }

    private Service findBestMatchingService(String query, List<Service> services) {
        List<Service> matches = searchCatalogServices(query, services);
        return matches.isEmpty() ? null : matches.get(0);
    }

    private boolean hasWord(String text, String... words) {
        for (String word : words) {
            String pattern = "(?i)\\b" + Pattern.quote(word) + "\\b";
            if (Pattern.compile(pattern).matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    private ServiceResponse mapServiceToResponse(Service s) {
        Long categoryId = s.getCategory() != null ? s.getCategory().getId() : null;
        String categoryName = s.getCategory() != null ? s.getCategory().getName() : null;
        return new ServiceResponse(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getPrice(),
                s.getDurationMinutes(),
                categoryId,
                categoryName,
                s.getActive()
        );
    }
}
