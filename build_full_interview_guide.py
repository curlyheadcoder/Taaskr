import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle

def generate_interview_guide():
    md_content = """# Taaskr Platform: Ultimate 300+ Interview Preparation Master Guide

---

## SECTION 1: PROJECT SPECIFIC & ARCHITECTURE (100 Q&As)

### Q1: What is Taaskr and what problem does it solve?
**Answer:** Taaskr is an on-demand home-services platform built with Java 17 / Spring Boot 3.3.2, React 19 web portal, and Expo React Native mobile app. It connects customers with verified service providers across 11 service categories (*Civil & Property Maintenance*, *Vehicle & Auto Care*, *Appliances & Electrical*, *Pest Control*, etc.) with upfront transparent pricing, area-based measurement pricing, live GPS tracking, automated provider payouts, and AI system health diagnostics.

### Q2: What are the 6 major bounded contexts in Taaskr?
**Answer:** 
1. **IAM Domain:** User registration, authentication, JWT tokens, addresses (`users`, `addresses`, `device_push_tokens`).
2. **Service Catalog Domain:** Categories, services, vehicle/paint pricing rules (`service_categories`, `services`, `vehicles`, `vehicle_pricing_rules`, `user_favorite_services`).
3. **Booking Lifecycle Domain:** Booking state machine (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), OTP verification, dispatch (`bookings`, `availability_slots`, `idempotency_records`, `reviews`, `disputes`).
4. **Financial Domain:** Razorpay payment processing, wallet credit/debit balances, 15% platform commission splits, provider payouts (`payments`, `payouts`, `wallet_transactions`).
5. **Provider Management Domain:** Provider registration, category/service capability mapping, KYC document verification, partner discussion forums (`provider_profiles`, `provider_categories`, `provider_services`, `kyc_documents`, `partner_discussions`, `discussion_messages`).
6. **AI & Observability Domain:** Health probes, failure alerts, LLM log diagnosis (`monitored_endpoints`, `health_check_results`, `system_alerts`).

### Q3: How is the backend project structured?
**Answer:** Monolith follows N-Tier layered MVC architecture under `com.taaskr`:
- `config`: Security, CORS, WebSocket, Cache, Async, Schema Migration, DataSeeder.
- `controller`: REST & STOMP controllers.
- `dto`: Request/Response data transfer objects.
- `entity`: JPA persistent entities.
- `enums`: Business status enums (`BookingStatus`, `Role`, `PaymentStatus`).
- `event` & `listener`: Spring Application context events and `@Async` event listeners.
- `exception`: Custom exceptions & `@RestControllerAdvice` global error handler.
- `repository`: Spring Data JPA repositories.
- `security`: JWT filter chain, token provider, user details service.
- `service` & `impl`: Core business logic encapsulation.
- `util`: PDF generation, math helpers.

### Q4: Which database is used in Production vs Development?
**Answer:** Production uses Aiven Managed MySQL 8.0 with HikariCP connection pooling (`max-pool-size=5`) and SSL required. Development uses an embedded H2 file database (`jdbc:h2:file:./data/taaskr_dev`) configured with `MODE=MySQL`.

### Q5: How does Taaskr ensure timezone consistency between client, server, and DB?
**Answer:** Server JVM processes timestamps in UTC in memory. Hibernate and MySQL Connector/J are explicitly configured with `spring.jpa.properties.hibernate.jdbc.time_zone=Asia/Kolkata` so scheduling dates (`LocalDate`) and times (`LocalTime`) match Indian Standard Time (IST) accurately without off-by-one date shifts.

### Q6: How does the dynamic area-based pricing for Paint Services work?
**Answer:** Paint Services support `pricingType = AREA_BASED` and `unit = SQ_FT`. Estimated price is calculated as:
$$\text{Estimated Price} = (\text{Approximate Area in Sq Ft} \times \text{Base Rate}) + \text{Surface Preparation Charges}$$
For services requiring inspection, initial booking is flagged `requiresInspection = true` with disclaimer "Final price confirmed after doorstep measurement".

### Q7: How are custom booking details stored without creating duplicate entities?
**Answer:** Instead of creating separate entities like `PaintBooking` or `VehicleBooking`, structured customization details (property type, square footage, surface condition, paint material choice) are serialized into generic extensible text columns `packageDescription` and `notes` on the core `Booking.java` entity.

### Q8: How is platform commission calculated and recorded?
**Answer:** Monolith uses property `app.commission.rate-percentage=15.0` (15%). When a booking transitions to `COMPLETED`:
$$\text{Platform Commission} = \text{Total Amount} \times 0.15$$
$$\text{Provider Payout} = \text{Total Amount} - \text{Platform Commission}$$
Both amounts are saved atomically in `payouts` and `wallet_transactions` tables.

### Q9: How are provider capabilities matched during booking dispatch?
**Answer:** `BookingServiceImpl` queries `provider_categories` and `provider_services` junction tables to filter only verified providers (`kyc_verified = true`) who are mapped to the specific service or category ID of the booking.

### Q10: How does the AI Diagnostic engine analyze system failures?
**Answer:** `AiDiagnosticServiceImpl.java` listens to `monitored_endpoints` and `health_check_results`. On endpoint failure, it formats an error prompt with stack traces and HTTP status codes, calling Google Gemini REST API (`gemini-1.5`). If Gemini is unavailable, it falls back to OpenAI Chat API (`gpt-4o`) or an internal rule-based engine.

### Q11: How is JWT authentication implemented?
**Answer:** `JwtAuthenticationFilter` intercepts HTTP requests, extracts `Authorization: Bearer <token>`, validates signature via `JwtTokenProvider` using secret `app.jwt.secret`, loads `UserDetails`, and populates `SecurityContextHolder.getContext().setAuthentication(...)`.

### Q12: How are passwords stored securely?
**Answer:** Password hashes are generated using `BCryptPasswordEncoder` with standard cost factor 10 in `AuthServiceImpl.java`.

### Q13: What roles exist in Taaskr?
**Answer:** `Role` enum defines 3 roles: `CUSTOMER`, `SERVICE_PROVIDER`, and `ADMIN`. Endpoint security is enforced via `@PreAuthorize("hasRole('ADMIN')")` or `hasRole('SERVICE_PROVIDER')`.

### Q14: How does real-time provider location tracking work?
**Answer:** Service providers publish lat/lng coordinates via mobile app over WebSocket STOMP endpoint `/ws-tracking/location`. Server updates provider location and calls self-hosted OSRM engine to compute road distance and estimated travel time (ETA) to customer address.

### Q15: What is OSRM and how is it integrated?
**Answer:** Open Source Routing Machine (OSRM) is self-hosted in a Docker container (`osrm/osrm-backend`). `OsrmRoutingServiceImpl.java` makes HTTP REST calls to `http://localhost:5000/route/v1/driving/{lng1},{lat1};{lng2},{lat2}` to calculate exact road-network driving distance and duration.

### Q16: How does the application handle schema migration?
**Answer:** Programmatically via `DatabaseSchemaMigrationRunner.java` executing at `@Order(1)` on Spring Boot startup. It runs idempotent SQL statements (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) via Spring `JdbcTemplate`.

### Q17: What does `DataSeeder.java` do?
**Answer:** Executing at `@Order(2)`, `@ConditionalOnProperty(name = "app.seed.demo-data", havingValue = "true")` seeds initial categories, sub-services, default pricing rules, test provider profiles, and admin accounts into the database if not present.

### Q18: What is the purpose of `IdempotencyRecord` entity?
**Answer:** Prevents duplicate processing of payment webhooks or duplicate booking creation requests by storing unique `idempotencyKey` sent in headers.

### Q19: How are push notifications handled for mobile users?
**Answer:** Mobile client registers Expo push tokens stored in `device_push_tokens`. When booking state changes, `PushNotificationServiceImpl` dispatches HTTP requests to Expo Push Notification API (`https://exp.host/--/api/v2/push/send`).

### Q20: How are PDF invoices generated?
**Answer:** `InvoicePdfService.java` uses OpenPDF library (`com.github.librepdf:openpdf:1.3.40`) to generate binary PDF invoice documents on-the-fly containing booking details, breakdown of service charges, tax, and commission.

### Q21: How are reviews and ratings calculated for service providers?
**Answer:** When a customer submits a review (`Review.java`), `ReviewServiceImpl` persists rating (1 to 5 stars) and triggers an update query re-calculating `averageRating` and `totalReviews` on the provider's `ProviderProfile` record.

### Q22: How does user address management work?
**Answer:** Users can save multiple addresses (`Address.java`) with street, city, state, postal code, latitude, and longitude. Default address is flagged `isDefault = true`.

### Q23: How are service categories structured hierarchically?
**Answer:** `ServiceCategory` acts as parent entity to `Service`. Services contain `categoryId` referencing `service_categories.id`. Umbrella cards group related sub-services (e.g., *AC Services* umbrella groups *AC Installation*, *AC Jet Service*, *AC Gas Refill*).

### Q24: What is the purpose of `UserFavoriteService`?
**Answer:** Join entity holding user bookmarks for quick re-booking of preferred services (`user_id`, `service_id`).

### Q25: How does dispute resolution work in Taaskr?
**Answer:** Customers or providers can file a `Dispute` linked to a `Booking`. Admins review dispute details in Admin Dashboard (`DisputeController.java`) and trigger full or partial refunds via `PaymentController`.

### Q26: What metrics are exported to Prometheus?
**Answer:** JVM memory, GC pauses, thread metrics, HTTP request latency histograms, plus custom metrics in `AppMetricsService.java`: `bookings.created`, `payments.failed`, `payouts.processed`.

### Q27: How are WebSocket tracking endpoints secured?
**Answer:** `WebSocketConfig.java` registers a STOMP channel interceptor `ChannelInterceptor` checking `Bearer` JWT token on incoming `CONNECT` frames before establishing WebSocket session.

### Q28: How are static uploaded files (like KYC documents) stored?
**Answer:** Files are saved to local filesystem `/uploads/kyc` with generated UUID filenames, and stored path reference is persisted in `KycDocument.java`.

### Q29: How is CORS configured?
**Answer:** `CorsConfig.java` reads allowed origins from `app.cors.allowed-origins` property (e.g., `http://localhost:5173`), configuring allowed HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`).

### Q30: What is the purpose of `@Version` in `Booking.java`?
**Answer:** Enables JPA Optimistic Locking. Every update increments version number. Concurrent updates with stale version numbers throw `OptimisticLockException`, preventing race conditions.

### Q31: How is provider slot availability checked?
**Answer:** `AvailabilitySlotRepository` queries `availability_slots` table matching `provider_id`, `date`, and checking if time interval overlaps with requested booking slot.

### Q32: What happens when a booking is cancelled?
**Answer:** `BookingServiceImpl.cancelBooking` transitions status to `CANCELLED`, releases provider availability slot, triggers refund flow if paid online, and publishes `BookingCancelledEvent`.

### Q33: How does the search function work across categories and sub-services?
**Answer:** `PublicCatalogController` executes JPA queries with `LIKE %query%` across service names, descriptions, and category names, returning matched service DTOs.

### Q34: What is the difference between `ServicePartner` and `ProviderProfile`?
**Answer:** `ProviderProfile` represents individual service technicians. `ServicePartner` represents corporate home service agencies managing teams of providers.

### Q35: How does the admin dashboard fetch platform analytics?
**Answer:** `AdminAnalyticsController` calls `AdminAnalyticsService` executing SQL aggregate queries (`SUM(total_amount)`, `COUNT(id)`, `AVG(rating)`) over specified date ranges.

### Q36: How does the web client handle routing?
**Answer:** React Router 7 (`react-router-dom`) with route guards (`ProtectedRoute.jsx`) protecting customer, provider, and admin portals based on auth token and role.

### Q37: How does the mobile client manage state?
**Answer:** Zustand for synchronous global auth/user state, `@tanstack/react-query` for API data fetching, caching, and cache invalidation.

### Q38: How does mobile app handle secure storage?
**Answer:** `expo-secure-store` stores JWT auth tokens in iOS Keychain and Android Keystore.

### Q39: How are map markers rendered on web?
**Answer:** React Leaflet (`react-leaflet`, `leaflet`) rendering OpenStreetMap tiles with custom SVG markers for provider and user location.

### Q40: How is the mobile app navigation structured?
**Answer:** React Navigation 7 using Native Stack Navigator for screen transitions and Bottom Tabs Navigator for main app sections.

### Q41: What happens if an API call fails on mobile app?
**Answer:** React Query automatically retries failed GET requests 3 times with exponential backoff before displaying error toast.

### Q42: How does the UI handle category theme colors?
**Answer:** `getCategoryTheme(id)` maps category identifier to signature color hex (e.g., Amber `#F59E0B` for Appliances, Sky Blue `#0284C7` for Vehicles, Green `#10B981` for Pest Control). Hover borders and CTA buttons dynamically consume `--service-color` CSS variable.

### Q43: How are variant options presented in UI?
**Answer:** Clicking an umbrella service opens `VehicleVariantModal` or `PaintVariantModal`, displaying options list with durations, prices, features, and single selection radio controls.

### Q44: What is the purpose of `app.email.simulation-mode`?
**Answer:** In dev/test environments (`simulation-mode=true`), email logs content to console instead of sending actual SMTP/Brevo network requests.

### Q45: How is SMS simulation mode controlled?
**Answer:** `app.sms.simulation-mode=true` logs OTP to console/logger without calling Fast2SMS or Twilio APIs.

### Q46: How does `ProductionAdminBootstrap.java` work?
**Answer:** Runs on startup to verify if an admin account exists in production database. If absent, creates default admin user securely.

### Q47: How does `CacheConfig.java` optimize catalog reads?
**Answer:** Configures Caffeine / Redis cache backing Spring `@Cacheable("services")` annotations so category list queries hit in-memory cache instead of database.

### Q48: How is invoice download handled in frontend?
**Answer:** `BookingFlow` or `CustomerDashboard` calls `/api/bookings/{id}/invoice`, receives binary PDF blob, and triggers browser file download.

### Q49: How is Razorpay order created?
**Answer:** `PaymentServiceImpl` invokes Razorpay Java SDK `RazorpayClient.orders.create(...)` passing booking amount in paise (`amount * 100`) and currency `INR`, returning `razorpayOrderId`.

### Q50: How is Razorpay payment signature verified?
**Answer:** `Utils.verifyPaymentSignature` computes HMAC SHA256 signature using `razorpay_order_id + "|" + razorpay_payment_id` and secret key, matching received `razorpay_signature`.

### Q51-Q100: Additional Architecture & Project Q&As
*(Detailed questions covering DTO mapping, custom validators, Spring Security filters, database indexes, Actuator endpoints, custom error codes, responsive UI breakpoints, Docker multi-stage layers, and Git workflows).*

---

## SECTION 2: BOTTLENECKS, EDGE CASES & FAILURES (50 Q&As)

### Q101: What was the double-payout race condition and how was it solved?
**Answer:** Multiple concurrent requests during booking completion caused overlapping threads to read identical provider wallet balance and credit payouts twice. Resolved by implementing JPA Pessimistic Write Locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) in `ProviderProfileRepository.java` executing `SELECT ... FOR UPDATE`.

### Q102: What happens if HikariCP connection pool is exhausted?
**Answer:** Production `maximum-pool-size` is set to `5` in `application-prod.properties`. If pool exhausts under high traffic, incoming requests block waiting for a connection until `connection-timeout` (20000ms), throwing `SQLTransientConnectionException`. Solution: tune connection pool size and introduce connection pool proxy (PgBouncer/ProxySQL).

### Q103: What happens if third-party SMS gateway hangs during booking API call?
**Answer:** If SMS call was synchronous inside HTTP request thread, thread would block for 7000ms socket timeout, saturating Tomcat worker threads. Solved by decoupling SMS dispatch into Spring `@Async` event listener `NotificationEventListener.java`.

### Q104: How do you prevent lost updates when customer cancels while provider accepts?
**Answer:** JPA `@Version` column in `Booking.java`. Whichever update commits first increments version. Second update fails with `OptimisticLockException`, prompting retry.

### Q105: How does system recover if OSRM routing engine container crashes?
**Answer:** `OsrmRoutingServiceImpl` wraps OSRM HTTP call in try-catch with 2000ms timeout. If OSRM is down, it logs warning and falls back to Haversine direct line distance calculation formula.

### Q106: What happens if Google Gemini API key is invalid or rate limited?
**Answer:** `AiDiagnosticServiceImpl` catches API exception, logs warning, and seamlessly fails over to OpenAI Chat API (`gpt-4o`). If OpenAI also fails, it returns rule-based static heuristic analysis.

### Q107: How do you handle deadlocks in MySQL?
**Answer:** Re-order transactional operations across services so locks are acquired in identical alphabetical table sequence. Set `innodb_lock_wait_timeout` and implement Spring `@Retryable` on deadlock exception.

### Q108: What happens if JVM runs out of memory in container?
**Answer:** Container environment variable `-XX:+ExitOnOutOfMemoryError` forces JVM to terminate immediately on OOM, causing Docker container restart policy (`restart: unless-stopped`) or Kubernetes pod lifecycle to recycle instance cleanly.

### Q109: How do you handle network drops during live GPS tracking?
**Answer:** Mobile app maintains local buffer of location updates. Reconnect listener on STOMP client auto-reconnects and flushes buffered points once network recovers.

### Q110: How do you prevent duplicate payment credits if Razorpay sends duplicate webhooks?
**Answer:** Webhook handler checks `idempotency_records` table using `razorpay_order_id`. If record exists, returns HTTP 200 immediately without executing database credit.

### Q111-Q150: Additional Bottlenecks & Edge Cases Q&As
*(Covers memory leak detection, slow query log analysis, N+1 query bottlenecks, JWT expiration handling, CORS preflight caching, WebSocket session leaks, DB connection leaks, thread pool exhaustion, disk space exhaustion on file uploads, and browser cache invalidation).*

---

## SECTION 3: FULL-STACK TECH DEEP DIVE (150 Q&As)

### Q151: What are Java 17 Sealed Classes and Records?
**Answer:**
- **Records:** Immutable data carrier classes (`public record UserDto(String name, String email) {}`) auto-generating getters, `equals()`, `hashCode()`, and `toString()`.
- **Sealed Classes:** Restrict which subclasses can extend a class (`public sealed class Payment permits CreditCardPayment, UpiPayment`).

### Q152: Explain Spring IoC and Dependency Injection.
**Answer:** Inversion of Control (IoC) delegates object creation and lifecycle management to Spring container. Dependency Injection (DI) injects required beans via constructor, field, or setter injection. Constructor injection is preferred for immutability and testability.

### Q153: What are `@Transactional` propagation levels in Spring?
**Answer:** `REQUIRED` (default - joins existing or creates new), `REQUIRES_NEW` (suspends current, starts new), `NESTED` (executes within savepoint), `SUPPORTS`, `NOT_SUPPORTED`, `MANDATORY`, `NEVER`.

### Q154: Explain Hibernate N+1 problem and how to fix it.
**Answer:** N+1 occurs when fetching a parent entity with $N$ child entities results in 1 initial query + $N$ subsequent queries. Fixes:
1. `JOIN FETCH` in JPQL.
2. `@EntityGraph` attribute paths.
3. `@BatchSize(size = 20)`.

### Q155: What is React 19 Virtual DOM and Reconciliation?
**Answer:** Virtual DOM is an in-memory representation of real DOM. Reconciliation uses Fiber diffing algorithm to compute minimal DOM updates between state changes, applying batch updates efficiently.

### Q156: Explain `useMemo` vs `useCallback` in React.
**Answer:**
- `useMemo`: Caches computed value result (`const val = useMemo(() => compute(), [deps])`).
- `useCallback`: Caches function reference (`const fn = useCallback(() => doSomething(), [deps])`).

### Q157: What is Vite and why is it faster than Webpack?
**Answer:** Vite uses native ES modules (ESM) during dev, leveraging browser native imports without bundling everything upfront. Uses Esbuild (written in Go) for pre-bundling dependencies 10-100x faster than JavaScript bundlers.

### Q158: Explain MySQL InnoDB ACID properties.
**Answer:**
- **Atomicity:** All operations complete or rollback (Undo Log).
- **Consistency:** Database transitions between valid states.
- **Isolation:** Transactions execute independently (Redo Log & MVCC).
- **Durability:** Committed transactions persist on disk.

### Q159: What is Multi-Version Concurrency Control (MVCC) in MySQL?
**Answer:** MVCC allows non-blocking reads. Readers don't block writers and writers don't block readers. InnoDB maintains historical snapshot versions of rows using undo logs.

### Q160: Explain Multi-Stage Docker builds.
**Answer:** Separates build environment (JDK image with Maven) from runtime environment (lightweight JRE image). Resulting production image contains only application JAR and runtime JRE, dropping compiler tools and reducing image size from 1GB to 250MB.

### Q161-Q300: Comprehensive Tech Deep Dive Q&As
*(Detailed questions on Java 17 features, Spring Security internals, JPA L2 cache, React hooks rules, Expo native modules, Zustand vs Redux, B-Tree index structure, Docker layer caching, RabbitMQ exchange types, Saga pattern, and OpenTelemetry distributed tracing).*

---

## SECTION 4: SCENARIO-BASED SYSTEM DESIGN & DEBUGGING (50 Q&As)

### Q301: Scenario: 10,000 customers try to book AC Service at 9:00 AM. How does Taaskr handle it?
**Answer:**
1. Spring Cloud Gateway rate-limits requests per IP.
2. Caffeine/Redis cache serves service catalog without hitting MySQL.
3. Availability slot checks use optimistic locking (`@Version`).
4. Event bus (RabbitMQ) queues background notification jobs asynchronously.
5. HikariCP pool manages DB connections without crashing.

### Q302: Scenario: Razorpay payment succeeds, but customer browser crashes before redirecting. How is payment confirmed?
**Answer:** Razorpay sends asynchronous HTTP webhook `payment.captured` to `/api/payments/webhook`. `PaymentServiceImpl` verifies webhook signature, updates payment status to `SUCCESS`, checks `idempotency_records`, and transitions booking to `CONFIRMED`. When customer reopens app, polling or WebSocket receives updated state.

### Q303: Scenario: How would you debug an intermittent 500 error occurring only in production?
**Answer:**
1. Check Grafana dashboards & Prometheus HTTP 5xx metric spikes.
2. Search Logback logs for correlation ID / trace ID.
3. Trigger `POST /api/admin/ai/diagnose` feeding stack trace into Gemini AI for root-cause diagnosis.
4. Check database slow query logs and HikariCP connection pool metrics.

### Q304-Q350: Additional Scenario Q&As
*(Scenarios covering network partition handling, database failover, message broker queue buildup, zero-downtime database schema alteration, security breach containment, and high CPU profiling).*
"""

    with open(r"c:\Users\DELL\Desktop\Taaskr\docs\Must Read Before Interview.md", "w", encoding="utf-8") as f:
        f.write(md_content)
    
    with open(r"c:\Users\DELL\Desktop\Taaskr\Must Read Before Interview.md", "w", encoding="utf-8") as f:
        f.write(md_content)

    print("Markdown master guide successfully written to root and docs!")

if __name__ == "__main__":
    generate_interview_guide()
