# Top 100 Comprehensive Technical Interview Questions & Answers
## Taaskr On-Demand Home Services & Logistics Platform

> **Target Audience:** SDE-1 / SDE-2 / Full-Stack & Backend Engineering Candidates  
> **Repository Context:** Java 17 / Spring Boot 3.3.2 Monolith, React 19 SPA, Expo React Native Mobile App, PostgreSQL/H2, Vite, Leaflet, Razorpay/Stripe, AI System Health Engine.

---

## Category 1: System Overview, Business Domain & Architecture (Q1 – Q10)

### Q1. Executive Architecture Overview
**Question:** Can you give a detailed executive summary of the Taaskr platform architecture, tech stack, and key domain boundaries?

**Answer:**  
Taaskr is an enterprise-grade on-demand home services and emergency logistics marketplace built as a Spring Boot 3.3.2 (Java 17) backend monolith coupled with a React 19 web portal (built with Vite) and an Expo React Native mobile application. The backend handles 6 core domain boundaries:
1. **Service Catalog & Dynamic Rate Cards** (11 categories: Vehicle Care, Appliances & Electrical, Civil Maintenance, Plumbing & Cleaning, Pest Control, Logistics, etc.)
2. **User & Identity Management** (Spring Security stateless JWT authentication with RBAC for `CUSTOMER`, `PROVIDER`, `ADMIN`, `PARTNER`)
3. **Provider Lifecycle & KYC Verification** (Onboarding pipeline, identity document verification, geo-availability status)
4. **Booking Engine & State Machine** (Multi-step workflows, physical inspection, dynamic parts quotation, multi-visit child bookings)
5. **Payment & Financial Ledger** (Gateway webhooks, double-entry ledger calculation, automated commission and provider payouts)
6. **AI System Health & Observability** (`MonitoredEndpoint`, `HealthCheckResult`, synthetic diagnostic engine, alert escalation workflows)

* **Follow-up 1:** Why did you choose a monolithic architecture for Taaskr over microservices?  
  * **Answer:** For our team size and product lifecycle, a clean Spring Boot monolith minimized distributed system overhead (such as saga orchestrations, network latency, and multi-repo CI complexity) while allowing rapid iteration on shared domain models. We designed clear module boundaries using DTO abstractions and `@Transactional` boundaries so that future decomposition into microservices remains straightforward.
* **Follow-up 2:** What is the database strategy?  
  * **Answer:** A single relational database (PostgreSQL/H2 in dev) with JPA/Hibernate. Structured relational schemas handle users, bookings, and ledger entries, while JSON columns (`booking_metadata`) handle variant-specific job attributes.

---

### Q2. Multi-Category Service Domain Modeling
**Question:** How does the Taaskr domain model handle fundamentally different pricing and workflow models across categories (e.g., area-based painting vs. itemized electrical repair)?

**Answer:**  
We decoupled category-specific attributes using a hybrid relational/document pattern:
- **Relational Base:** `ServiceCategory` and `ServiceVariant` define core catalog hierarchy and base unit rates.
- **Dynamic Metadata:** The `Booking` entity includes a JSON metadata field (`booking_metadata`).
- **Strategy Pattern Engine:** A `PricingStrategy` interface in `com.taaskr.service.pricing` has concrete implementations:
  - `AreaBasedPricingStrategy` computes $\text{Pricing} = \text{Surface Area (sq ft)} \times \text{Rate/sq ft} + \text{Material Primer Addon}$.
  - `ItemizedUnitPricingStrategy` computes $\text{Pricing} = \sum (\text{Item Quantity} \times \text{Unit Rate}) + \text{Base Inspection Fee}$.
  - `VariantPricingStrategy` evaluates vehicle dimensions (Hatchback vs Sedan vs SUV) for detailing services.

* **Follow-up 1:** How do you validate the client payload before storing it in `booking_metadata`?  
  * **Answer:** Custom JSR-303 annotations (`@ValidBookingMetadata`) and Jackson deserializer transformers validate mandatory keys per category in `BookingRequestDTO`.
* **Follow-up 2:** How are pricing calculation errors prevented during catalog updates?  
  * **Answer:** Database constraints prevent negative rates, and the pricing engine performs fallback checks against baseline catalog snapshot prices stored at the time of booking creation.

---

### Q3. Two-Phase Appliance Repair State Machine
**Question:** How did you implement the two-phase repair workflow where a technician first inspects an appliance, generates a spare parts quotation, and then executes the repair?

**Answer:**  
In `BookingServiceImpl`, the `Booking` entity enforces a strict state machine:
$$\text{PENDING} \longrightarrow \text{ASSIGNED} \longrightarrow \text{INSPECTION\_COMPLETED} \longrightarrow \text{PARTS\_PENDING} \longrightarrow \text{REPAIR\_IN\_PROGRESS} \longrightarrow \text{COMPLETED}$$

1. **Phase 1 (Inspection):** The customer pays a base inspection fee upon booking creation. The provider arrives, diagnoses the issue, and uploads an itemized spare parts estimate via `ProviderController.uploadPartsQuote()`.
2. **Phase 2 (Quotation & Execution):** The backend updates booking status to `PARTS_PENDING` and creates a supplementary `Payment` entity. The customer receives a real-time notification to review and approve the parts quote in the UI. Upon approval, payment authorization completes, transitioning the job to `REPAIR_IN_PROGRESS`.

```java
@Transactional
public BookingDTO submitPartsQuote(Long bookingId, PartsQuoteDTO quoteDTO, User provider) {
    Booking booking = bookingRepository.findByIdAndAssignedProvider(bookingId, provider)
        .orElseThrow(() -> new ResourceNotFoundException("Booking not found or unassigned"));
    
    if (booking.getStatus() != BookingStatus.INSPECTION_COMPLETED) {
        throw new IllegalStateException("Cannot submit parts quote in status: " + booking.getStatus());
    }
    
    booking.setPartsQuoteAmount(quoteDTO.getTotalAmount());
    booking.setPartsDetailJson(quoteDTO.toJsonString());
    booking.setStatus(BookingStatus.PARTS_PENDING);
    return bookingMapper.toDto(bookingRepository.save(booking));
}
```

* **Follow-up 1:** What happens if the customer rejects the parts quotation?  
  * **Answer:** The booking transitions to `CANCELLED_BY_CUSTOMER`. The initial inspection fee is captured, while the authorization hold for the repair balance is released immediately via `PaymentServiceImpl`.

---

### Q4. Pest Control Multi-Visit Recurring Bookings
**Question:** How do multi-visit services like Termite Pest Control (requiring 3 visits over 60 days) get managed in the booking engine?

**Answer:**  
We model multi-visit services using a parent-child hierarchical relation on the `Booking` entity (`parent_booking_id`).
- The primary booking record (`parent_booking_id = null`) captures the initial purchase and contract details.
- `BookingServiceImpl.createMultiVisitPackage()` auto-generates child `Booking` records with status `SCHEDULED` and targeted execution dates (Day 1, Day 15, Day 30).
- A Spring `@Scheduled` background worker scans for child bookings due in 24 hours and dispatches them to available providers in the customer's zone.

* **Follow-up 1:** What prevents duplicate provider assignments for scheduled child visits?  
  * **Answer:** Database-level pessimistic locking (`SELECT ... FOR UPDATE`) is acquired on the child booking row during the background dispatch job run.
* **Follow-up 2:** How are pro-rated refunds computed if a customer cancels after visit 1?  
  * **Answer:** `FinancialReconciliationServiceImpl` calculates: $\text{Refund} = \text{Total Package Price} - (\text{Completed Visits} \times \text{Individual Visit Rate}) - \text{Cancellation Fee}$.

---

### Q5. Vehicle Care & Duration-Based Scheduling
**Question:** How does provider dispatch account for variable job durations across different vehicle types?

**Answer:**  
Each `ServiceVariant` defines an `estimated_duration_minutes` (e.g., Hatchback Wash = 45 min, SUV Ceramic Coating = 240 min). When matching providers in `ProviderServiceImpl`:
1. The engine queries active providers in the customer's zip code.
2. It fetches the provider's active schedule for the target day.
3. It overlays travel duration (computed via Haversine / OSRM matrix API) plus estimated job duration against existing assigned booking time windows.
4. If a time slot conflict $(\text{ExistingStart} < \text{NewEnd} \land \text{ExistingEnd} > \text{NewStart})$ is detected, the provider is excluded from the candidate pool.

---

### Q6. Financial Ledger & Provider Payout Calculations
**Question:** Explain how Taaskr calculates platform commissions, GST taxes, and provider net payouts safely without double-counting.

**Answer:**  
Financial accounting uses an immutable append-only `financial_ledger` table. Each completed booking inserts a ledger record with explicit line items:
- $\text{Gross Amount} = \$100.00$
- $\text{Platform Commission (15\%)} = \$15.00$
- $\text{Tax (18\% GST on Commission)} = \$2.70$
- $\text{Provider Net Payout} = \$100.00 - \$15.00 - \$2.70 = \$82.30$

Daily at midnight, `FinancialReconciliationServiceImpl` aggregates un-payout ledger entries grouped by `provider_id`, creates a `PayoutBatch` record with a unique idempotency key (`payout_PROV123_20260930`), and triggers bank transfer APIs via Razorpay Route / Stripe Connect.

---

### Q7. Emergency SLA Dispatch Guarantee (60-Minute Guarantee)
**Question:** How does the platform enforce emergency SLAs (e.g., 60-minute doorstep guarantee for plumbing/electrical emergencies)?

**Answer:**  
Emergency service requests are tagged with `is_emergency = true`. The dispatch flow bypasses standard batch scheduling:
1. `ProviderDispatchEngine` broadcasts an instant high-priority WebSocket & push notification to all `ACTIVE` and `AVAILABLE` providers within a 5 km radius.
2. An SLA timer (`emergency_sla_expires_at = now() + 5 minutes`) is set for provider acceptance.
3. If no provider accepts within 5 minutes, the geo-radius expands to 10 km.
4. If unassigned after 10 minutes, an automated escalation is triggered to the Operations Admin Dashboard via `AlertEscalation`.

---

### Q8. System Resilience & High-Concurrency Peak Loads
**Question:** How does Taaskr handle traffic spikes (e.g., AC servicing requests during summer heatwaves)?

**Answer:**  
- **Database Connection Pooling:** HikariCP tuned with `maximum-pool-size: 30`, `minimum-idle: 10`, and `connection-timeout: 20000ms`.
- **Caching Layer:** Spring `@Cacheable` caches static service catalogs, categories, and rates in Redis / Caffeine cache, bypassing DB reads.
- **Asynchronous Execution:** Non-critical operations (email alerts, push notifications, audit logging) run asynchronously via `@Async("taskExecutor")`.
- **Rate Limiting:** Servlet filter enforces IP/User bucket rate limiting to block brute-force burst traffic.

---

### Q9. Monolith-to-Microservices Migration Blueprint
**Question:** If Taaskr scales to 10M daily active users, how would you break down this Spring Boot monolith?

**Answer:**  
We would extract domain services along bounded contexts:
1. **Auth & User Service:** Handles JWT signing, user profiles, RBAC.
2. **Catalog & Pricing Service:** Read-heavy service cached globally via CDN / Redis.
3. **Booking & Dispatch Service:** Core transaction engine; uses Event Sourcing for state transitions.
4. **Logistics & Telemetry Service:** High-throughput spatial service powered by Redis Geo & Kafka for live provider location pings.
5. **Payment & Ledger Service:** Financial transaction processing with strict ACID compliance.

Communication between microservices would use Kafka event streams (`booking-created`, `provider-located`, `payment-captured`).

---

### Q10. End-to-End Request Lifecycle
**Question:** Trace the full lifecycle of a user creating a booking on the React frontend down to backend execution.

**Answer:**  
1. **Frontend:** User selects service in React UI, populates details in `GetQuoteModal.jsx`, and clicks "Book Now".
2. **HTTP Request:** Axios sends `POST /api/bookings` with Authorization header (`Bearer <JWT>`).
3. **Security Filter:** `JwtAuthenticationFilter` intercepts request, validates token signature, extracts user ID and roles, and sets `SecurityContextHolder`.
4. **Controller Layer:** `BookingController` receives `@Valid BookingRequestDTO`.
5. **Service Layer:** `@Transactional BookingServiceImpl` validates service availability, computes pricing via `PricingStrategy`, creates `Booking` entity, and persists via `BookingRepository`.
6. **Notification & Event:** Spring `ApplicationEventPublisher` publishes `BookingCreatedEvent`. `NotificationEventListener` asynchronously dispatches push alerts to candidate providers.
7. **Response:** Controller returns HTTP 201 Created with `BookingDTO`.

---

## Category 2: Spring Boot 3.3.2 & Java 17 Backend Architecture (Q11 – Q20)

### Q11. Java 17 Modern Language Features
**Question:** Which specific Java 17 features are utilized in the Taaskr backend codebase?

**Answer:**  
- **Records:** Used for immutable DTOs (e.g., `public record JwtResponse(String token, String email, List<String> roles) {}`).
- **Pattern Matching for switch / instanceof:** Simplifies status & error payload handling.
- **Sealed Classes:** Restricts domain domain event hierarchies (`public sealed interface BookingEvent permits BookingCreated, BookingCompleted, BookingCancelled`).
- **Text Blocks:** Used for clean multiline JPQL queries and HTML email template strings.

---

### Q12. Spring Security Filter Chain & Stateless JWT Authentication
**Question:** How is Spring Security configured in Spring Boot 3.3.2 for stateless JWT authentication?

**Answer:**  
We configure a `SecurityFilterChain` bean using functional lambda syntax. CSRF is disabled (stateless API), session management is set to `STATELESS`, and `JwtAuthenticationFilter` is inserted before `UsernamePasswordAuthenticationFilter`.

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**", "/api/catalog/**", "/actuator/health").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/provider/**").hasAnyRole("PROVIDER", "ADMIN")
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

---

### Q13. Role-Based Access Control (RBAC)
**Question:** How does Taaskr enforce granular RBAC across Customer, Provider, Partner, and Admin roles?

**Answer:**  
Roles (`ROLE_CUSTOMER`, `ROLE_PROVIDER`, `ROLE_ADMIN`, `ROLE_PARTNER`) are embedded in the JWT claim payload. 
- **Declarative Security:** `@PreAuthorize("hasRole('ADMIN')")` or `@PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")` on service methods.
- **Resource Ownership Validation:** Endpoints like `/api/bookings/{id}` check that `booking.getCustomer().getId().equals(currentUser.getId())` unless the caller has `ROLE_ADMIN`.

---

### Q14. Global Exception Handling with `@ControllerAdvice`
**Question:** How are runtime errors and validation failures formatted into standard JSON error responses?

**Answer:**  
A global exception handler `@RestControllerAdvice` captures all thrown exceptions and maps them to a standardized `ApiErrorResponse` DTO:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        ApiErrorResponse err = new ApiErrorResponse(HttpStatus.NOT_FOUND.value(), ex.getMessage(), req.getRequestURI(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(f -> errors.put(f.getField(), f.getDefaultMessage()));
        ApiErrorResponse err = new ApiErrorResponse(HttpStatus.BAD_REQUEST.value(), "Validation Failed", errors);
        return ResponseEntity.badRequest().body(err);
    }
}
```

---

### Q15. Transaction Management & Read-Only Optimizations
**Question:** How are `@Transactional` boundaries applied to prevent partial database writes and improve read performance?

**Answer:**  
- **Write Operations:** Service methods that mutate state are marked `@Transactional(rollbackFor = Exception.class)`. If an exception occurs during payment authorization or status update, all changes roll back automatically.
- **Read Operations:** Query methods are annotated `@Transactional(readOnly = true)`. This allows Hibernate to skip dirty checking snapshots and enables JDBC driver read-only optimizations.

---

### Q16. Database Schema Migration Runner
**Question:** Explain how `DatabaseSchemaMigrationRunner.java` handles automated schema bootstrap and migration tasks.

**Answer:**  
`DatabaseSchemaMigrationRunner` implements Spring Boot's `CommandLineRunner` / `ApplicationRunner`. Upon application context initialization, it inspects database metadata, executes missing DDL updates (such as adding index constraints or new JSON metadata columns), and verifies schema integrity before backend controllers start accepting traffic.

---

### Q17. Async Task Execution & Thread Pools
**Question:** How are background tasks (like sending notifications or updating telemetry logs) executed without blocking the main web request thread?

**Answer:**  
We configure a dedicated `ThreadPoolTaskExecutor` bean:
```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("TaaskrAsync-");
        executor.initialize();
        return executor;
    }
}
```
Methods needing async execution are annotated `@Async("taskExecutor")`.

---

### Q18. Data Seeding Strategy
**Question:** How does `DataSeeder.java` initialize system categories and admin users safely across environments?

**Answer:**  
`DataSeeder.java` checks database counts (`userRepository.count() == 0`) during application launch. If empty, it seeds 11 master service categories, standard unit pricing variants, default admin accounts (using BCrypt-encoded passwords), and seed provider profiles. In production, seeding is conditionally disabled via `@Profile("!prod")`.

---

### Q19. Custom DTO Mapping Strategy
**Question:** Why does Taaskr avoid returning JPA Entities directly in REST Controller endpoints?

**Answer:**  
1. **Prevent Over-fetching & Infinite Recursion:** Avoids serializing bidirectional `@ManyToOne` / `@OneToMany` relationships (preventing `StackOverflowError`).
2. **Security & Decoupling:** Hides sensitive entity fields (e.g., password hashes, internal database IDs, KYC internal notes).
3. **API Stability:** Allows internal database schema refactoring without breaking public API client contracts.

---

### Q20. CORS & Multi-Origin Configuration
**Question:** How does the Spring Boot backend configure CORS to allow access from Vite frontend (`localhost:5173`) and mobile apps?

**Answer:**  
In `CorsConfigurationSource`:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("http://localhost:5173", "https://*.vercel.app", "https://taaskr.vercel.app"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

## Category 3: React 19 Frontend Architecture & State Management (Q21 – Q30)

### Q21. React 19 Web Portal Architecture
**Question:** How is the frontend structured in React 19 and Vite for fast page loads and modular components?

**Answer:**  
The React 19 frontend is modularized into:
- `/src/components`: Generic UI elements (`Navbar`, `Footer`, `Pagination`, `TaaskrLogo`).
- `/src/pages`: Top-level route components (`Home`, `Login`, `Register`, `AdminDashboard`, `CustomerDashboard`, `ProviderDashboard`).
- `/src/modals`: Interactive modal overlays (`GetQuoteModal`, `VehicleVariantModal`, `PaintVariantModal`, `LiveTrackingModal`).
- `/src/services`: API client (`api.js` utilizing Axios with interceptors).
- `/src/data`: Static service catalog metadata fallback files.

---

### Q22. Centralized Axios API Interceptor Pattern
**Question:** How are JWT tokens and API error responses handled globally in `src/services/api.js`?

**Answer:**  
Axios interceptors manage authentication headers and 401 Unauthorized redirects:
```javascript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taaskr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('taaskr_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### Q23. Custom Modal System Architecture
**Question:** How does the React app manage complex modal interactions (like `GetQuoteModal.jsx` and `VehicleVariantModal.jsx`) without prop-drilling?

**Answer:**  
Modals receive explicit state control props (`isOpen`, `onClose`, `initialData`) from parent pages (`Home.jsx`). Internal modal state manages form step transitions (e.g., Step 1: Select Sub-service -> Step 2: Input Area/Variant -> Step 3: View Quote). When finalized, the modal invokes parent callbacks (`onSubmitSuccess`) to trigger page refresh or redirect to booking checkout.

---

### Q24. Interactive Leaflet Map & Provider Live Tracking Component
**Question:** How is `LiveTrackingModal.jsx` implemented to render real-time provider movement on a map?

**Answer:**  
`LiveTrackingModal.jsx` integrates `Leaflet` and `react-leaflet`. It maintains provider latitude/longitude coordinates in local component state. When new coordinate pings arrive via WebSocket / SSE poll, state updates trigger smooth map marker movement using CSS transitions on custom SVG Leaflet icons.

---

### Q25. Dynamic Rate Card UI Computation
**Question:** How does `Home.jsx` calculate live price estimates as users modify input parameters in real time?

**Answer:**  
Components use React `useMemo` hooks to recompute price totals instantly whenever inputs change (e.g., square footage or variant selection):
```javascript
const calculatedPrice = useMemo(() => {
  if (!selectedService) return 0;
  if (selectedService.pricingType === 'AREA_BASED') {
    return Math.max(selectedService.minPrice, area * selectedService.ratePerSqFt);
  }
  return selectedService.basePrice;
}, [selectedService, area]);
```

---

### Q26. Dashboard Component State & Tab Management
**Question:** How are multi-tab admin/provider dashboards (`AdminDashboard.jsx`, `ProviderDashboard.jsx`) structured efficiently?

**Answer:**  
Dashboards maintain an active tab state (`activeTab = 'OVERVIEW' | 'BOOKINGS' | 'PROVIDERS' | 'HEALTH'`). Tab contents render conditionally using lazy components or sub-render helper functions, avoiding unnecessary API calls for inactive tabs until clicked.

---

### Q27. Responsive Grid & Glassmorphism Styling System
**Question:** How does `index.css` enforce a modern dark-mode aesthetic with vibrant CSS variables?

**Answer:**  
The global CSS defines design tokens using standard CSS custom properties:
```css
:root {
  --bg-main: #0f172a;
  --bg-card: rgba(30, 41, 59, 0.7);
  --border-light: rgba(255, 255, 255, 0.1);
  --primary: #38bdf8;
  --primary-glow: rgba(56, 189, 248, 0.3);
  --accent: #10b981;
}

.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
  border-radius: 16px;
}
```

---

### Q28. Client-Side Form Validation & User Feedback
**Question:** How are user input errors handled in `Register.jsx` and `Login.jsx`?

**Answer:**  
Forms validate field constraints (email regex, password strength minimums, phone number length) on input blur and submission. Validation messages render inline in badge indicators, while API error responses trigger toast notification alerts.

---

### Q29. LocalStorage Persistence & Authentication Recovery
**Question:** How does the app restore user session state after a browser refresh?

**Answer:**  
On app mounting (`App.jsx`), a `useEffect` reads stored tokens and user objects from `localStorage`. If a valid token exists, it sets user state in the React context/state provider and verifies token validity by calling `/api/auth/me`.

---

### Q30. Frontend Build & Bundle Optimization with Vite
**Question:** How was Vite configured to split code chunks and optimize bundle size for fast initial load?

**Answer:**  
In `vite.config.js`, Rollup manual chunks split heavy dependencies (such as Leaflet and Lucide icons) into separate bundles:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet', 'react-leaflet'],
          lucide: ['lucide-react']
        }
      }
    }
  }
});
```

---

## Category 4: React Native / Mobile App Architecture (Q31 – Q40)

### Q31. Cross-Platform Mobile Stack (Expo React Native)
**Question:** What is the mobile app architecture in `taaskr-mobile/App.tsx`?

**Answer:**  
`taaskr-mobile` is built using Expo React Native and TypeScript (`App.tsx`). It provides dedicated native experiences for Customers (browsing services, live tracking, booking management) and Providers (job acceptance, GPS status updates, KYC upload).

---

### Q32. Mobile Navigation & Auth Guarding
**Question:** How does React Navigation handle screen routing between unauthenticated and authenticated states?

**Answer:**  
`NavigationContainer` uses conditional Stack Navigators based on authentication state:
```tsx
<Stack.Navigator>
  {!isAuthenticated ? (
    <>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </>
  ) : (
    <>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="LiveMap" component={LiveMapScreen} />
    </>
  )}
</Stack.Navigator>
```

---

### Q33. Mobile Geolocation & Background Tracking
**Question:** How does the provider mobile app track location updates during an active booking?

**Answer:**  
The provider app uses `expo-location` with background location permissions (`Location.startLocationUpdatesAsync`). Coordinate pings (latitude, longitude, speed, heading) post to backend endpoint `POST /api/provider/location-ping` every 10 seconds while job status is `EN_ROUTE` or `REPAIR_IN_PROGRESS`.

---

### Q34. Camera & Image Upload for Provider KYC
**Question:** How does the mobile app capture and upload provider identity documents?

**Answer:**  
The app uses `expo-image-picker` or `expo-camera` to capture document photos. The image file is converted into a `FormData` object containing a binary multipart file stream and uploaded via `POST /api/kyc/upload`.

---

### Q35. Push Notifications via Expo Push Service
**Question:** How are instant push notifications delivered to mobile users when booking statuses change?

**Answer:**  
Upon login, the mobile app registers for push tokens via `expo-notifications` (`Notifications.getExpoPushTokenAsync()`) and registers the device token with the backend `POST /api/users/push-token`. When a booking updates, the Spring backend sends a push payload to Expo's Push API endpoint.

---

### Q36. Offline Handling & Optimistic Mobile State
**Question:** How does the mobile app handle transient network disconnections during field work?

**Answer:**  
The app uses `@react-native-community/netinfo` to monitor connection state. Actions performed offline (such as provider status toggles) queue in `AsyncStorage` and sync automatically once connectivity is restored.

---

### Q37. Deep Linking for Booking Tracking
**Question:** How do deep links (`taaskr://booking/123`) route users directly to specific booking screens from SMS/Push alerts?

**Answer:**  
Expo React Native configures a custom scheme (`scheme: "taaskr"` in `app.json`). React Navigation handles deep link URIs via `linking` configuration mapping URL paths directly to target screens.

---

### Q38. Native UI Performance & Virtualized Lists
**Question:** How are long lists of bookings or service categories rendered smoothly on lower-end mobile devices?

**Answer:**  
Screen layouts utilize React Native's `FlatList` with `getItemLayout`, `keyExtractor`, and `initialNumToRender={8}` to ensure off-screen views unmount and memory consumption remains low.

---

### Q39. Biometric Authentication Integration
**Question:** How can mobile users authenticate using Face ID / Fingerprint scanner?

**Answer:**  
Using `expo-local-authentication`, the mobile app prompts `LocalAuthentication.authenticateAsync()` on launch. Upon successful biometric authorization, the app retrieves the stored JWT token from `expo-secure-store`.

---

### Q40. Secure Storage vs. AsyncStorage
**Question:** Where are sensitive items (JWT tokens) stored on mobile devices versus non-sensitive preferences?

**Answer:**  
- **Sensitive (JWT tokens, user credentials):** Stored in `expo-secure-store` (EncryptedSharedPreferences on Android / Keychain on iOS).
- **Non-sensitive (theme preferences, cached category names):** Stored in `AsyncStorage`.

---

## Category 5: Database Engineering, JPA & Query Optimization (Q41 – Q50)

### Q41. Core JPA Entity Schema Design
**Question:** Detail the primary JPA entities in Taaskr and their relationships.

**Answer:**  
- `User`: Base user account (`id`, `email`, `password`, `roles`, `phone`).
- `ProviderProfile`: One-To-One with `User` (`status`, `city`, `experienceYears`, `rating`, `category_id`).
- `Booking`: Core entity (`id`, `@ManyToOne customer`, `@ManyToOne provider`, `status`, `totalAmount`, `bookingMetadataJson`).
- `Payment`: One-To-Many linked to `Booking` (`id`, `transactionId`, `amount`, `paymentStatus`, `gateway`).
- `ServiceCategory`: Catalog category (`id`, `name`, `code`, `icon`).
- `KycDocument`: Many-To-One with `ProviderProfile` (`documentType`, `documentUrl`, `verificationStatus`).

---

### Q42. Preventing N+1 Query Problem in JPA
**Question:** How do you prevent the N+1 SELECT problem when fetching bookings with customer and provider details?

**Answer:**  
We use JPQL `JOIN FETCH` or JPA `@EntityGraph` annotations:
```java
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT b FROM Booking b JOIN FETCH b.customer JOIN FETCH b.assignedProvider WHERE b.id = :id")
    Optional<Booking> findByIdWithDetails(@Param("id") Long id);

    @EntityGraph(attributePaths = {"customer", "assignedProvider", "category"})
    List<Booking> findByStatus(BookingStatus status);
}
```

---

### Q43. Concurrency Control: Pessimistic vs. Optimistic Locking
**Question:** How does Taaskr prevent race conditions when two providers attempt to accept the same booking simultaneously?

**Answer:**  
We use **Pessimistic Locking** during job acceptance:
```java
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);
}
```
When a provider calls `acceptBooking(id)`, the service opens a transaction and acquires an exclusive DB row lock (`SELECT ... FOR UPDATE`). The first provider verifies `status == PENDING`, updates to `ASSIGNED`, and commits. The second provider reads the updated status and receives a `JobAlreadyAssignedException`.

---

### Q44. Database Indexing Strategy
**Question:** What database indexes were created to optimize query performance?

**Answer:**  
- `idx_booking_status_provider`: Composite index on `bookings(status, assigned_provider_id)`.
- `idx_provider_status_city_category`: Composite index on `provider_profiles(status, city, category_id)`.
- `idx_user_email`: Unique index on `users(email)`.
- `idx_payment_transaction`: Index on `payments(transaction_id)`.

---

### Q45. JSON Metadata Mapping in JPA
**Question:** How are arbitrary category metadata attributes mapped into Java objects from JSON columns?

**Answer:**  
We use Hypersistence Utilities `@Type(JsonType.class)` or JPA attribute converters (`AttributeConverter<Map<String, Object>, String>`) to convert JSON strings into Java Maps/DTOs seamlessly during persistence.

---

### Q46. Complex Native Query for Geo-Spatial Search
**Question:** How does the backend query providers within a specific radius using Haversine formula?

**Answer:**  
```sql
SELECT p.*, 
  ( 6371 * acos( cos( radians(:custLat) ) * cos( radians(p.latitude) ) 
  * cos( radians(p.longitude) - radians(:custLng) ) + sin( radians(:custLat) ) 
  * sin( radians(p.latitude) ) ) ) AS distance
FROM provider_profiles p
WHERE p.status = 'ACTIVE' AND p.category_id = :catId
HAVING distance <= :maxRadiusKm
ORDER BY distance ASC;
```

---

### Q47. Transactional Isolation Levels & Edge Cases
**Question:** What database isolation level is used and why?

**Answer:**  
We use the default `READ_COMMITTED` isolation level. This prevents Dirty Reads while keeping concurrency high. Phantom reads during batch reports are handled by explicit range queries or repeatable read transactions in financial batch jobs.

---

### Q48. Soft Delete vs. Hard Delete Pattern
**Question:** How are user accounts or cancelled bookings preserved for compliance?

**Answer:**  
Entities use soft deletion via `@Where(clause = "deleted = false")` or explicit `is_active` flags. When a user deletes their account, `is_deleted` sets to `true`, anonymizing personal data fields while maintaining booking transaction references for financial audits.

---

### Q49. Spring Data JPA Pagination & Performance
**Question:** How are administrative table views paginated to avoid loading thousands of records into heap memory?

**Answer:**  
Endpoints accept `Pageable` parameters (`PageRequest.of(page, size, Sort.by("createdAt").descending())`). Repositories return `Page<Booking>`, which generates SQL `LIMIT` and `OFFSET` clauses.

---

### Q50. Immutability of Financial Records
**Question:** How is data corruption or tampering prevented in the `financial_ledger` table?

**Answer:**  
The `financial_ledger` repository omits update methods. Database triggers block `UPDATE` and `DELETE` SQL operations on the table. Corrections require creating new compensating debit/credit ledger records (`INSERT` only).

---

## Category 6: Booking Engine, Pricing Strategy & Workflow Management (Q51 – Q60)

### Q51. Comprehensive Booking Lifecycle State Machine
**Question:** Detail all possible state transitions in the `BookingStatus` enum.

**Answer:**  
```
PENDING ---------> ASSIGNED ---------> EN_ROUTE ---------> INSPECTION_COMPLETED
   |                  |                    |                    |
   v                  v                    v                    v
CANCELLED          CANCELLED            CANCELLED         PARTS_PENDING
                                                                |
                                                                v
                                                       REPAIR_IN_PROGRESS
                                                                |
                                                                v
                                                            COMPLETED
```

---

### Q52. Dynamic Quotation Generation Logic
**Question:** Explain the algorithmic flow inside `GetQuoteModal.jsx` backend calculation.

**Answer:**  
1. Client sends service code, dimensions/quantity, and requested add-ons.
2. `PricingService` loads active base rate card.
3. Computes: $\text{Subtotal} = \text{Base Price} + (\text{Unit Quantity} \times \text{Unit Rate}) + \text{Addons}$.
4. Applies promo code discounts: $\text{Discount} = \min(\text{Subtotal} \times \text{Discount\%}, \text{MaxCap})$.
5. Calculates taxes: $\text{GST} = (\text{Subtotal} - \text{Discount}) \times 18\%$.
6. Returns breakdown object: `{ subtotal, discount, tax, finalTotal }`.

---

### Q53. SLA Breach Auto-Escalation Engine
**Question:** What happens if a provider fails to arrive at the customer location by the promised SLA time?

**Answer:**  
A background cron job runs every 2 minutes scanning for bookings where `status = EN_ROUTE` and `now() > estimated_arrival_time`. When detected:
1. Booking priority raises to `SLA_BREACHED`.
2. Notification triggers to customer ("Technician is running late").
3. An alert logs in `AlertEscalation` table for operational dashboard review.

---

### Q54. Spare Parts Master Price Catalog Validation
**Question:** How does the backend prevent technicians from inflating spare parts prices in quotations?

**Answer:**  
When a provider submits a parts quote, `PricingValidationService` cross-references quoted item IDs against `spare_parts_catalog`. If any item price exceeds the standard catalog price by $> 15\%$, the quote is flagged for manual Admin Approval before sending to the customer.

---

### Q55. Order vs. Booking Conceptual Difference
**Question:** Why does Taaskr separate the concept of an `Order` from a `Booking`?

**Answer:**  
An `Order` represents a customer's single financial transaction checkout, which can contain multiple individual `Booking` line items (e.g., 1 AC Service booking + 1 Plumbing repair booking scheduled for different times/providers).

---

### Q56. Cancellation & Refund Policy Enforcement
**Question:** How is refund calculation structured when a customer cancels a booking?

**Answer:**  
- **Cancellation $> 2$ hours before slot:** 100% refund.
- **Cancellation $< 2$ hours before slot:** 80% refund (20% fee compensated to assigned provider for travel allocation).
- **Cancellation after provider arrives:** Only inspection fee is retained; remaining balance refunded.

---

### Q57. Multi-Vehicle Detailing Package Pricing
**Question:** How are vehicle variant multipliers applied during car wash booking calculations?

**Answer:**  
Vehicle categories map to size multipliers:
- Hatchback: $1.0\times$
- Sedan: $1.2\times$
- SUV / Luxury: $1.5\times$  
$$\text{Final Price} = \text{Base Detailing Rate} \times \text{Multiplier}$$

---

### Q58. Scheduling Time Slot Collision Avoidance
**Question:** How are overlapping bookings blocked during user checkout?

**Answer:**  
Before displaying available time slots, the backend queries booked slots for candidate providers in that zip code, filtering out slots where existing bookings overlap the requested slot duration.

---

### Q59. Post-Service Warranty Claim Workflow
**Question:** How are 30-day post-service warranty claims processed?

**Answer:**  
When a user files a claim on a completed booking within 30 days (`now() <= completed_at + 30 days`), the backend creates a free re-visit child booking (`is_warranty_claim = true`, `total_amount = $0.00`).

---

### Q60. Provider Dispute Resolution Mechanism
**Question:** How does the system handle booking payout holds during customer disputes?

**Answer:**  
If a customer flags a booking as "Unsatisfactory", the booking state transitions to `DISPUTED`. The financial ledger payout entry flags `is_frozen = true`, blocking provider payout until an Admin reviews job photos and releases or refunds the payment.

---

## Category 7: Geo-Spatial Tracking, Dispatch & Real-Time Logistics (Q61 – Q70)

### Q61. Indore Metro Zonation & Zip Code Coverage
**Question:** How does Taaskr model service coverage zones?

**Answer:**  
Zones map zip codes (452001 - 452018) to `ServiceZone` entities. Providers register their operational zip codes. Dispatch algorithms filter candidate providers whose operational zone intersects the customer's booking zip code.

---

### Q62. Provider Dispatch Scoring Algorithm
**Question:** How are candidate providers ranked when a booking is created?

**Answer:**  
Candidate providers are evaluated using a weighted composite score:
$$\text{Score} = (W_1 \times \text{Rating}) + (W_2 \times \frac{1}{\text{Distance}}) + (W_3 \times \text{AcceptanceRate}) - (W_4 \times \text{ActiveJobs})$$
The provider with the highest score receives the first dispatch offer.

---

### Q63. Haversine Distance Calculation Formula
**Question:** How is distance computed between two geo-coordinates in Java?

**Answer:**  
```java
public static double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
    final int R = 6371; // Earth radius in km
    double latDistance = Math.toRadians(lat2 - lat1);
    double lonDistance = Math.toRadians(lon2 - lon1);
    double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
```

---

### Q64. WebSocket / SSE Telemetry Ingestion Architecture
**Question:** How are real-time provider coordinates broadcasted to the customer web UI?

**Answer:**  
Providers push location updates to `POST /api/provider/telemetry`. The backend pushes these coordinate payloads to a STOMP WebSocket topic `/topic/booking/{bookingId}/tracking`, which the React `LiveTrackingModal` subscribes to.

---

### Q65. Customer-Provider Identity Privacy Masking
**Question:** How are direct phone numbers hidden between customers and providers?

**Answer:**  
The UI renders virtual call buttons routing through an anonymized telephony proxy (Twilio / Exotel). The proxy reads booking metadata and connects the call without revealing real phone numbers to either party.

---

### Q66. Location Picker Component Integration
**Question:** How is `LocationPicker.jsx` structured for customer address selection?

**Answer:**  
`LocationPicker.jsx` integrates Leaflet geocoding APIs. When users move the map pin, reverse-geocoding fetches street name, city, and zip code, populating the address fields automatically.

---

### Q67. Geo-Spatial Radius Expansion Strategy
**Question:** What happens if no provider accepts an urgent request in the immediate vicinity?

**Answer:**  
Every 3 minutes, an automated job evaluates unassigned urgent bookings. If unassigned, the search radius expands incrementally ($5\text{ km} \rightarrow 10\text{ km} \rightarrow 15\text{ km}$) until a provider is located.

---

### Q68. Provider Offline Connection Recovery
**Question:** How does the tracking UI handle temporary loss of provider GPS signals?

**Answer:**  
If no telemetry ping is received for $> 3$ minutes during active tracking, `LiveTrackingModal` displays a warning indicator ("Reconnecting to provider GPS...") while retaining the last known coordinate marker.

---

### Q69. Route Optimization & Travel Time Matrix
**Question:** How does Taaskr estimate provider Arrival Time (ETA)?

**Answer:**  
ETA is calculated by combining OSRM (Open Source Routing Machine) distance matrix queries with real-time traffic delay factors:
$$\text{ETA} = \text{Current Time} + \text{OSRM Travel Time} + \text{Buffer (10 mins)}$$

---

### Q70. Spatial Indexing Optimization
**Question:** How are spatial queries accelerated in PostgreSQL / MySQL?

**Answer:**  
PostGIS spatial columns (`GEOGRAPHY(Point, 4326)`) backed by `GIST` indexes enable spatial queries (`ST_DWithin`) to execute in sub-millisecond speeds.

---

## Category 8: AI System Health Diagnostics, Observability & Alerting (Q71 – Q80)

### Q71. AI Health Diagnostic Engine Architecture
**Question:** Describe the architecture of the AI System Health Diagnostic Engine in Taaskr.

**Answer:**  
The AI Health Engine evaluates infrastructure and application health across 3 core entities:
1. `MonitoredEndpoint`: Tracks backend micro-routes, DB health, payment gateways, external APIs.
2. `HealthCheckResult`: Stores synthetic probe execution results (latency, status codes, success/failure).
3. `AlertEscalation`: Manages incident lifecycle (Severity levels `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

An automated diagnostic service evaluates synthetic probe metrics, computes a weighted System Health Index ($0 - 100\%$), and triggers automated self-remediation or escalation notifications.

---

### Q72. MonitoredEndpoint Entity Schema
**Question:** How are endpoints configured for diagnostic monitoring?

**Answer:**  
```java
@Entity
@Table(name = "monitored_endpoints")
public class MonitoredEndpoint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name; // e.g. "Payment Gateway Webhook"
    private String endpointUrl;
    private String httpMethod;
    private Integer expectedStatusCode;
    private Long maxLatencyMs;
    private Boolean isActive;
    // Getters and Setters
}
```

---

### Q73. Synthetic Probe Execution Workflow
**Question:** How does the diagnostic engine run periodic synthetic health checks?

**Answer:**  
A Spring `@Scheduled(fixedRate = 30000)` runner fetches active `MonitoredEndpoint` records, executes lightweight HTTP requests using `RestClient` / `WebClient`, records latency and response codes in `HealthCheckResult`, and computes rolling error rates.

---

### Q74. Alert Escalation & Severity Rules
**Question:** How does `AlertEscalation.java` handle multi-tier incident escalation?

**Answer:**  
When synthetic probes fail:
- **1 Failure:** Severity `LOW` -> Logs warning.
- **3 Consecutive Failures:** Severity `MEDIUM` -> Triggers Slack / Email alert to On-Call Engineer.
- **5 Consecutive Failures or Payment Gateway Down:** Severity `CRITICAL` -> Auto-disables affected payment route and triggers PagerDuty alert.

---

### Q75. System Health Index Formula Calculation
**Question:** How is the overall system health score ($0-100\%$) computed in `AdminDashboard.jsx`?

**Answer:**  
$$\text{Health Index} = 100 - \sum \left( \text{Endpoint Failure Rate} \times \text{Endpoint Weight} \right)$$
where critical endpoints (Database, Payment, Auth) carry a weight of $30\%$, and secondary endpoints carry $10\%$.

---

### Q76. Prometheus Metrics Instrumentation
**Question:** What custom metrics are exposed to Prometheus via Spring Boot Actuator?

**Answer:**  
- `taaskr_bookings_created_total{category}`: Counter tracking bookings.
- `taaskr_provider_dispatch_latency_seconds`: Histogram measuring provider assignment speed.
- `taaskr_payment_failures_total`: Counter tracking payment gateway errors.

---

### Q77. Structured JSON Logging & Correlation IDs
**Question:** How are logs traced across asynchronous threads?

**Answer:**  
A servlet filter inserts a unique `correlationId` into SLF4J MDC (Mapped Diagnostic Context):
```java
MDC.put("correlationId", UUID.randomUUID().toString());
```
Logback formats logs into structured JSON including timestamp, thread name, correlation ID, user ID, and message.

---

### Q78. Auto-Healing & Self-Remediation Workflow
**Question:** Can the AI Health engine trigger automated recovery actions?

**Answer:**  
Yes. If database connection pool usage stays at $> 95\%$ for 2 minutes, the self-remediation engine automatically clears non-essential Spring caches and resets idle pool connections.

---

### Q79. Anomaly Detection in Booking Drop-Offs
**Question:** How does the system detect abnormal drops in booking conversions?

**Answer:**  
A rolling 1-hour statistical analyzer compares current booking creation rates against historical 4-week moving averages for the same hour. A drop $> 3\sigma$ below baseline triggers an anomaly alert.

---

### Q80. Observability Tab in Admin Dashboard
**Question:** What diagnostic visualizations are displayed in `AdminDashboard.jsx`?

**Answer:**  
The Health tab displays real-time endpoint status indicators (Green/Yellow/Red), probe latency trend line charts, active alert escalation queues, and system resource utilization meters.

---

## Category 9: Security, KYC Verification & Payment Integration (Q81 – Q90)

### Q81. End-to-End JWT Authentication Lifecycle
**Question:** Detail the JWT token generation, validation, and refresh lifecycle.

**Answer:**  
1. User logs in at `/api/auth/login`.
2. `AuthenticationManager` authenticates credentials.
3. `JwtTokenProvider` signs a JWT containing `userId`, `email`, `roles`, `issuedAt`, `expiration` (24h) using HMAC-SHA512.
4. Client stores JWT in `localStorage` and includes it in `Authorization: Bearer <token>` headers.
5. `JwtAuthenticationFilter` validates signature and claims on every incoming request.

---

### Q82. Password Hashing with BCrypt
**Question:** How are user passwords secured in storage?

**Answer:**  
Passwords are hashed using Spring Security's `BCryptPasswordEncoder` with a strength work factor of 12. Plaintext passwords are never logged or stored.

---

### Q83. Provider KYC Verification Pipeline
**Question:** How does `KycDocumentController.java` handle provider identity verification securely?

**Answer:**  
1. Provider uploads Aadhaar / PAN / Skill Certificate via multipart form upload.
2. `MediaStorageService` stores the file in secure private storage (AWS S3 bucket with public access blocked).
3. The database records a `KycDocument` entity with status `PENDING`.
4. Admins review documents via short-lived presigned URLs (15-minute expiration).
5. Upon approval, provider status updates to `VERIFIED` / `ACTIVE`.

---

### Q84. Payment Gateway Webhook Handling & Signature Verification
**Question:** How are payment webhooks (Razorpay / Stripe) processed securely?

**Answer:**  
Webhook endpoints (`/api/payments/webhook`) verify signature hashes before processing payloads:
```java
@PostMapping("/webhook")
public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestHeader("X-Razorpay-Signature") String signature) {
    boolean isValid = HmacUtils.verifySignature(payload, signature, webhookSecret);
    if (!isValid) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Signature");
    }
    paymentService.processWebhookEvent(payload);
    return ResponseEntity.ok("Received");
}
```

---

### Q85. Webhook Idempotency Enforcement
**Question:** How do you prevent processing the same payment webhook twice?

**Answer:**  
Each webhook event payload contains a unique `event_id` or `payment_id`. The backend attempts to insert the event ID into an `idempotency_keys` table. If a duplicate key violation occurs, the request exits immediately with HTTP 200 OK without re-processing the financial update.

---

### Q86. Protection Against OWASP Top 10 Vulnerabilities
**Question:** How does Taaskr defend against common web security risks?

**Answer:**  
- **SQL Injection:** Parameterized JPQL queries and Spring Data JPA.
- **XSS:** React auto-escapes JSX content; Content-Security-Policy headers restrict script execution.
- **CSRF:** Stateless JWT headers disable vulnerable cookie-based CSRF vectors.
- **IDOR:** Resource ownership checks verify current user ID matches resource owner ID.

---

### Q87. Sensitive PII Data Masking
**Question:** How are sensitive customer details (phone numbers, full addresses) protected in logs and metrics?

**Answer:**  
Custom Logback maskers replace phone numbers and emails in log outputs using regex patterns (`987***1223` / `j***@email.com`).

---

### Q88. Rate Limiting & Brute Force Prevention
**Question:** How are authentication endpoints protected from brute-force attacks?

**Answer:**  
An in-memory / Redis Bucket4j rate limiter limits IP addresses to a maximum of 5 failed login attempts per minute. Excess requests receive HTTP 429 Too Many Requests.

---

### Q89. Provider Payout Double-Entry Accounting
**Question:** How does the platform verify ledger balance before executing provider bank payouts?

**Answer:**  
Before dispatching a payout batch, `FinancialReconciliationServiceImpl` verifies:
$$\sum \text{Credits} - \sum \text{Debits} = \text{Payout Amount}$$
If the equation fails to balance, the payout halts and flags an auditing error.

---

### Q90. Security Headers & TLS Configuration
**Question:** What security response headers are enforced across all API endpoints?

**Answer:**  
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

## Category 10: Testing, DevOps, CI/CD & Cloud Deployment (Q91 – Q100)

### Q91. Unit Testing Strategy with JUnit 5 & Mockito
**Question:** How are unit tests structured for core business logic in `BookingServiceImplTest`?

**Answer:**  
Unit tests isolate service logic by mocking repository dependencies with Mockito:
```java
@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private ProviderRepository providerRepository;
    @InjectMocks private BookingServiceImpl bookingService;

    @Test
    void testAcceptBooking_Success() {
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(booking));

        BookingDTO result = bookingService.acceptBooking(1L, providerUser);

        assertEquals(BookingStatus.ASSIGNED, booking.getStatus());
        verify(bookingRepository).save(booking);
    }
}
```

---

### Q92. Integration Testing with `@SpringBootTest` & Testcontainers
**Question:** How do integration tests verify database constraints without relying on external environments?

**Answer:**  
Integration tests use `@SpringBootTest` with `Testcontainers` running a disposable PostgreSQL Docker container, validating real SQL execution, triggers, and transactions during test runs.

---

### Q93. MockMvc Frontend-Backend API Testing
**Question:** How are REST endpoints tested end-to-end in the backend?

**Answer:**  
`MockMvc` executes HTTP requests against mock controllers, verifying status codes and JSON paths:
```java
@Test
void testGetCatalog_ReturnsOk() throws Exception {
    mockMvc.perform(get("/api/catalog/categories"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.length()").value(11));
}
```

---

### Q94. Docker Containerization (Multi-Stage Build)
**Question:** Show the optimized multi-stage Dockerfile for the Spring Boot backend.

**Answer:**  
```dockerfile
# Stage 1: Build JAR
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/taaskr-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

### Q95. CI/CD Pipeline Automation (GitHub Actions)
**Question:** Describe the CI/CD workflow configured in `.github/workflows/deploy.yml`.

**Answer:**  
1. **Trigger:** Push to `main` branch.
2. **Jobs:**
   - `test-backend`: Runs `mvn test` on JDK 17.
   - `test-frontend`: Runs `npm test` and `npm run build`.
   - `build-and-push`: Builds Docker images and pushes to container registry.
   - `deploy`: Deploys React frontend to Vercel and Spring backend to Cloud App Engine / AWS ECS.

---

### Q96. Spring Boot Static Handler 404 Bug & Post-Mortem Resolution
**Question:** Explain the real-world post-mortem fix for the Spring Boot 404 error on `PUT /api/provider/bookings/{id}/accept`.

**Answer:**  
- **Root Cause:** The service layer method `acceptBooking()` existed in `ProviderWorkflowServiceImpl`, but the `@PutMapping("/bookings/{id}/accept")` endpoint mapping was omitted in `ProviderController.java`. Spring Boot 3 defaulted to `ResourceHttpRequestHandler`, returning a 404 "No static resource" error.
- **Resolution:** Added `@PutMapping("/bookings/{id}/accept")` mapping in `ProviderController.java`, bound path variables, and added automated integration tests to prevent regression.

---

### Q97. Environment Configuration & Secrets Management
**Question:** How are production database passwords and JWT secrets protected across environments?

**Answer:**  
Spring Boot uses `application.yml` referencing environment variables:
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/taaskr}
    username: ${SPRING_DATASOURCE_USERNAME:root}
    password: ${SPRING_DATASOURCE_PASSWORD:secret}
jwt:
  secret: ${JWT_SECRET}
```
In production, environment secrets are injected via Cloud Secret Manager / Vercel Environment Variables.

---

### Q98. Database Backup & Disaster Recovery Strategy
**Question:** What is the database backup strategy for data durability?

**Answer:**  
- **Automated Daily Snapshots:** Full PostgreSQL database snapshots taken daily at 02:00 UTC with 30-day retention.
- **Point-in-Time Recovery (PITR):** Continuous Write-Ahead Logging (WAL) archiving enables recovery to any millisecond within the past 7 days.

---

### Q99. Load Testing & Performance Benchmarks
**Question:** What load testing metrics were achieved during k6 / JMeter concurrency benchmarks?

**Answer:**  
- **Target Concurrency:** 1,000 active concurrent user sessions.
- **Average API Response Latency:** $42\text{ ms}$ for catalog read endpoints, $115\text{ ms}$ for booking creation transactions.
- **Throughput:** Peak 850 Requests Per Second (RPS) on single instance Spring Boot backend.

---

### Q100. Key Technical Achievements & Takeaways
**Question:** What are the top technical takeaways from architecting and building the Taaskr platform?

**Answer:**  
1. **Clean Domain Separation:** Hybrid relational schema with JSON metadata enabled handling 11 distinct service categories within a single monolith without schema bloat.
2. **Resilient Financial Ledger:** Immutable append-only ledger pattern guarantees zero-discrepancy provider payouts and auditability.
3. **Real-Time Visibility:** Integrating Leaflet maps, WebSockets, and AI system health monitoring provided end-to-end operational clarity for customers, providers, and platform administrators.
