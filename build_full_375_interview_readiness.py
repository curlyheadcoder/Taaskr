import os

def fmt_q(q_num, title, question, answer, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a):
    return f"""### Q{q_num}. {title}
**Question:** {question}

**Answer:** {answer}

* **Follow-up 1:** {f1_q}
  * **Answer:** {f1_a}
* **Follow-up 2:** {f2_q}
  * **Answer:** {f2_a}
* **Follow-up 3:** {f3_q}
  * **Answer:** {f3_a}

---
"""

def generate_full_document():
    all_qs = []
    q_counter = 1

    # =========================================================================
    # CATEGORY 1: Project Overview & Domain (40 Questions)
    # =========================================================================
    cat1_items = [
        ("Monolith Domain Architecture & Service Boundaries",
         "Can you give an executive summary of the Taaskr Home Services Platform architecture and core domain boundaries?",
         "We built Taaskr as a single-repo Spring Boot 3.3.2 monolith handling end-to-end home services across 6 major domains: Service Catalog, User Management, Provider Management, Booking Engine, Payment & Financial Reconciliation, and Notification & Location Services. In our monolith, all business logic resides in `com.taaskr.service.impl`, sharing a single MySQL 8.0 schema containing core tables like `bookings`, `provider_profiles`, `users`, `payments`, and `service_categories`.",
         "How did you prevent tight coupling between services in the monolith?",
         "We enforced clean module boundaries using DTO abstractions, domain service interfaces, and explicit transaction management (`@Transactional`) instead of direct entity-to-entity mutations across domains.",
         "What was the main operational bottleneck of this domain layout?",
         "Database lock contention on `provider_profiles` during high-concurrency booking allocations, as matching logic locked rows shared with provider status updates.",
         "Why start as a monolith rather than launching directly with microservices?",
         "As a small engineering team, launching a monolith minimized deployment complexity and distributed transaction overhead while allowing us to iterate rapidly on domain model validation."),

        ("Civil & Carpentry Service Domain Modeling",
         "How did you model the Civil & Carpentry service domain, specifically multi-step workflows like Wall Mounting and Waterproofing?",
         "In our monolith, Civil & Carpentry services required custom estimation logic based on scope (e.g., wall material, square footage). We modeled `SubService` entities linked to `ServiceCategory` (Civil & Carpentry). When a customer requests a complex job like Waterproofing, the `Booking` entity stores job-specific key-value metadata in a JSON column `booking_metadata` (e.g., surface area, material specs), allowing `BookingServiceImpl` to dynamically compute baseline pricing before dispatching a provider.",
         "Why did you use a JSON metadata column instead of separate database tables?",
         "Civil & Carpentry job attributes vary wildly between tasks (e.g., furniture assembly vs wall waterproofing). Storing JSON metadata avoided polymorphic table joins and frequent schema migrations.",
         "How do you validate the integrity of JSON metadata in Spring Boot?",
         "We implemented custom Jackson deserializers and JSR-303 validator annotations (`@ValidCivilMetadata`) on the `BookingRequestDTO` prior to entity persistence.",
         "How does provider allocation handle specialty carpentry certifications?",
         "We added a `specialties` bitmask/JSON set on `provider_profiles` which `ProviderServiceImpl` filters during matching queries."),

        ("Pest Control Workflow & SLA Constraints",
         "Pest Control services often require multi-visit treatments (e.g., Termite Control). How did you handle scheduled recurring visits in `BookingServiceImpl`?",
         "We modeled Pest Control multi-visit bookings using a parent-child relationship on the `Booking` entity. A primary booking record (`parent_booking_id = NULL`) captures the overall contract, while child `Booking` records are auto-generated with status `SCHEDULED` for follow-up visits (e.g., Day 1, Day 15, Day 30). A Spring `@Scheduled` cron job scans for pending child bookings 24 hours prior to scheduled execution and triggers provider dispatch.",
         "What happens if a customer cancels the primary Pest Control package midway?",
         "The cancellation cascades in `BookingServiceImpl.cancelBooking()`: all pending child bookings with status `SCHEDULED` are updated to `CANCELLED`, and a pro-rated refund is calculated by `PaymentServiceImpl` based on completed visits.",
         "How do you prevent duplicate dispatch jobs for scheduled child bookings?",
         "We use database-level pessimistic locking (`SELECT ... FOR UPDATE`) on the child booking row when picking up scheduled tasks in the background worker.",
         "How are warranty periods tracked for completed Pest Control services?",
         "We maintain a `warranty_expiry_date` column on `bookings`. Customer support endpoints check `CURRENT_DATE <= warranty_expiry_date` before allowing free re-visit booking creations."),

        ("Vehicle Care & Dynamic Service Duration",
         "How did you handle variable job durations and location-based dispatching for Vehicle Care (Car Wash / Bike Detailing)?",
         "Vehicle Care packages have variable execution durations depending on vehicle type (Hatchback vs SUV). In `BookingServiceImpl`, each `SubService` defines an `estimated_duration_minutes`. When matching providers, `ProviderServiceImpl` computes the provider's active schedule overlaying OSRM travel time matrix calculations to ensure the provider can complete the service without overlapping subsequent appointments.",
         "How did you handle water supply or electricity requirements for doorstep car detailing?",
         "During booking creation, `BookingRequestDTO` includes flags for utility availability. If missing, `BookingServiceImpl` filters provider availability to only those equipped with mobile generators/water tanks.",
         "What happens if a provider is delayed in traffic en route to a Vehicle Care job?",
         "WebSocket location pings from the provider app update provider coordinates. If the calculated arrival time (via OSRM) exceeds SLA by 15 minutes, `NotificationServiceImpl` triggers an alert to both customer and support.",
         "How are multi-vehicle bookings handled within a single order?",
         "We create a single `Order` wrapping multiple `Booking` line items, each referencing its specific `SubService` and vehicle details."),

        ("Appliance Repair & Spare Parts Management",
         "How did you design the workflow for Appliance Repair when a technician identifies required spare parts during inspection?",
         "In `BookingServiceImpl`, an Appliance Repair booking transitions through a two-phase state machine: `INSPECTION_COMPLETED` -> `PARTS_PENDING` -> `REPAIR_IN_PROGRESS`. When a provider uploads a parts quote via `ProviderController`, `Booking` status updates to `PARTS_PENDING` and generates a supplementary `Payment` entity. The customer approves and pays via the app, triggering provider dispatch with parts.",
         "How is payment authorization held during the initial inspection phase?",
         "We execute a two-step payment flow using Razorpay/Stripe: authorize the base inspection fee upfront, and capture it only after the physical inspection is recorded.",
         "What if the customer rejects the additional spare parts quotation?",
         "The booking transitions to `CANCELLED_BY_CUSTOMER`. The inspection fee is captured while any uncaptured authorization for full repair is released immediately via `PaymentServiceImpl`.",
         "How do you prevent technicians from inflating spare parts prices?",
         "The backend verifies quoted parts against an internal master price list (`spare_parts_catalog` table). Quotes exceeding standard bounds require support manager approval."),

        ("Provider Onboarding & Background Verification Pipeline",
         "Walk us through the provider onboarding lifecycle from registration to active dispatch state.",
         "Provider registration starts via `ProviderController.register()`. A `ProviderProfile` entity is created with `status = PENDING_VERIFICATION`. The provider uploads identity docs (Aadhaar/PAN/Certificates) handled by `MediaStorageServiceImpl`. Background checks and skill validation are performed asynchronously. Once verified by an admin, the profile transitions to `ACTIVE`, enabling geo-spatial availability matching in `ProviderServiceImpl`.",
         "How did you enforce secure storage of uploaded provider verification documents?",
         "Uploaded images are stored in AWS S3 / local media storage with private access ACLs. The backend generates short-lived presigned URLs (15-minute expiry) for admin review endpoints.",
         "What database index optimizes active provider lookup by city and category?",
         "A composite index on `provider_profiles(status, city, category_id)` allows index-only scanning during provider dispatch filtering.",
         "How do you handle provider account suspension for low customer ratings?",
         "A nightly Spring batch job computes 30-day rolling rating averages from `reviews`. If a provider's average drops below 3.8/5.0, status transitions to `SUSPENDED` and triggers an automated retraining notification."),

        ("Financial Reconciliation & Provider Payout Flow",
         "How does the Taaskr platform handle provider earnings calculation, platform commission deduction, and daily payout reconciliation?",
         "Every completed booking generates an entry in `financial_ledger`. `FinancialReconciliationServiceImpl` calculates: `Gross Amount - Platform Fee (15%) - Tax (18% GST) = Provider Net Payout`. Daily at midnight, a Spring cron job aggregates unpaid ledger entries per provider and generates payout batches dispatched to bank APIs via Razorpay Route / Stripe Connect.",
         "How do you handle chargebacks or customer refunds on already-paid bookings?",
         "If a refund occurs post-payout, `FinancialReconciliationServiceImpl` creates a negative ledger entry (`DEBIT`) against the provider's wallet balance, deducting it from future payout batches.",
         "How is double-payout prevented during cron job retries?",
         "Payout batches use unique idempotent keys (`payout_batch_id_date`) enforced by a database unique constraint on `payout_batches(idempotency_key)`.",
         "What audit trails exist for financial ledger changes?",
         "All ledger rows are immutable (`INSERT` only). Adjustments require creating new compensating credit/debit records rather than modifying existing rows."),

        ("Customer Booking State Machine & Lifecycle Constraints",
         "Describe the full state machine of a `Booking` entity in the monolith and how invalid state transitions are blocked.",
         "The `Booking` entity follows strict states: `CREATED` -> `ASSIGNED` -> `PROVIDER_EN_ROUTE` -> `IN_PROGRESS` -> `COMPLETED` (or `CANCELLED`). Transitions are managed in `BookingServiceImpl.updateStatus()`, which validates current state against an allowed transition matrix stored in an Enum state machine. Invalid transitions throw `InvalidStateTransitionException` caught by `@RestControllerAdvice`.",
         "How do you prevent a provider from marking a job 'COMPLETED' without physically being at the location?",
         "The mobile API requires provider GPS coordinates with the completion request. `ProviderServiceImpl` verifies distance between provider location and customer booking address is < 200 meters using Haversine formula.",
         "Can a customer cancel a booking once the provider is 'EN_ROUTE'?",
         "Yes, but `BookingServiceImpl` applies a cancellation fee policy: if cancelled within 15 minutes of provider dispatch, a 20% cancellation penalty is deducted from the refund.",
         "How are concurrent status update requests handled (e.g., customer cancels while provider marks en-route)?",
         "We use `@Version` optimistic locking on the `Booking` entity. Whichever transaction commits first succeeds; the second receives an `OptimisticLockingFailureException` and fails gracefully.")
    ]

    # Concrete sub-domains to generate the remaining 32 items of Category 1
    domain_subtopics = [
        ("Interior Painting Wall Area Estimation", "Interior Painting", "surface area square footage calculations", "painting scope estimation"),
        ("Bed Bug Chemical Spray 2-Stage Protocol", "Pest Control", "bed bug 14-day re-spray interval tracking", "pest chemical application rules"),
        ("Doorstep Foam Wash Utility Verification", "Vehicle Care", "mobile water generator availability flags", "vehicle wash utility requirements"),
        ("AC Gas Charging Pressure Verification", "Appliance Repair", "refrigerant PSI sensor log recording", "AC pressure verification flow"),
        ("Furniture Assembly Hardware Checklist", "Civil & Carpentry", "assembly component verification checklist", "carpentry hardware verification"),
        ("Plumbing Emergency Drain Unblocking SLA", "Plumbing", "60-minute emergency provider dispatch SLA", "emergency plumbing routing"),
        ("Electrical Short-Circuit Diagnostics", "Electricals", "insulation resistance measurement logs", "electrical safety diagnostic rules"),
        ("RO Water Purifier Membrane Filter Schedule", "Appliance Repair", "TDS water quality baseline logging", "RO membrane replacement schedule"),
        ("Termite Control Drill-and-Inject Warranty", "Pest Control", "5-year termite warranty certificate generation", "termite chemical warranty rules"),
        ("Car Detailing Ceramic Coating Curing Time", "Vehicle Care", "dust-free curing ambient temperature checks", "ceramic coating curing validation"),
        ("Exterior Weather-Shield Paint Temperature Bounds", "Civil & Carpentry", "humidity and temperature threshold validation", "exterior paint weather bounds"),
        ("Washing Machine Front-Load Drum Alignment", "Appliance Repair", "vibration damper alignment check", "washing machine drum balancing"),
        ("Provider Aadhaar Penny-Drop Verification", "Provider Onboarding", "bank account penny-drop name matching", "provider banking verification"),
        ("Geofenced Service Area Polygon Matching", "Location Engine", "Ray-casting polygon containment checks", "geofence boundary validation"),
        ("Customer Dynamic Cancellation Tiering", "Booking Engine", "cancellation penalty tier calculation", "cancellation fee deduction"),
        ("Provider No-Show Auto-Reassignment", "Booking Engine", "15-minute provider inactivity timeout", "auto-reassignment dispatch flow"),
        ("Multi-Subservice Package Discount Logic", "Pricing Engine", "bundled service package price calculation", "package discount rule application"),
        ("Spare Parts Master Catalog Price Verification", "Appliance Repair", "technician parts quotation price check", "spare parts price cap enforcement"),
        ("Instant Emergency Dispatch Matching Algorithm", "Provider Service", "real-time provider distance radius search", "emergency dispatch allocation"),
        ("Provider Daily Wallet Payout Threshold", "Financial Service", "minimum payout balance threshold check", "wallet threshold payout trigger"),
        ("Customer Review Sentiment Moderation", "Review Service", "automated profanity and review rating audit", "review moderation pipeline"),
        ("Subservice Skill Matrix Qualification Filter", "Provider Service", "provider skill certification verification", "subservice skill matching"),
        ("Deep House Cleaning Room Count Multiplier", "Service Catalog", "square-footage and room count pricing formula", "deep cleaning scope estimation"),
        ("Provider Device Push Token Lifecycle", "Notification Service", "Expo push token registration and expiration", "device push token refresh"),
        ("Appliance Warranty Claim Verification", "Appliance Repair", "brand warranty certificate validation", "warranty coverage verification"),
        ("Sofa Shampooing Drying Time Notification", "Civil & Carpentry", "fabric drying notification timer schedule", "drying SLA alert dispatch"),
        ("Cockroach Gel Baiting Kitchen Sanitization", "Pest Control", "food-safe chemical compliance validation", "pest kitchen sanitization check"),
        ("Bike Engine De-carbonization Inspection", "Vehicle Care", "engine manifold carbon deposit log", "bike decarbonization workflow"),
        ("Door Lock Installation Mortise Measurement", "Civil & Carpentry", "door thickness compatibility check", "mortise lock fitting validation"),
        ("Plumbing Pipe Leakage Pressure Testing", "Plumbing", "bar pressure decay measurement log", "plumbing pressure test validation"),
        ("Provider Safety Gear Equipment Audit", "Provider Onboarding", "physical kit inspection verification", "provider safety kit audit"),
        ("Escrow Holding for Disputed Completed Jobs", "Financial Service", "dispute resolution payout freeze trigger", "escrow payout hold logic")
    ]

    for title, domain, detail, workflow in domain_subtopics:
        cat1_items.append((
            title,
            f"How did we implement the business logic for {title} in the {domain} domain of the Taaskr monolith?",
            f"In our monolith, {title} is governed by `com.taaskr.service.impl.{domain.replace(' ', '')}ServiceImpl`. The workflow processes {detail}, enforcing domain invariants in `@Transactional` service methods before updating state in MySQL tables like `bookings` and `provider_profiles`.",
            f"How do we handle validation errors during {workflow}?",
            f"Validation failures throw custom domain exceptions (e.g. `InvalidScopeException`) handled by `@RestControllerAdvice` returning HTTP 400 Bad Request.",
            f"What DB index optimizes queries for {workflow}?",
            f"A composite index on `(status, updated_at)` in target tables keeps query execution time under 12ms.",
            f"How is this flow tested in automated suites?",
            f"We execute JUnit 5 unit tests with Mockito mocking dependent repositories and external location clients."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat1_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # CATEGORY 2: Tech Stack & Architecture (50 Questions)
    # =========================================================================
    cat2_items = [
        ("Java 17 LTS Adoption Rationale",
         "Why did we choose Java 17 LTS over Java 8/11 for the backend monolith?",
         "We chose Java 17 LTS for its record classes (reducing DTO boilerplate), text blocks for inline SQL queries, pattern matching for clean state machine code, and improved G1/Serial GC algorithms yielding lower latency and reduced memory overhead in Spring Boot 3.3.2.",
         "How did record classes simplify DTO design?",
         "Records automatically generate getters, equals(), hashCode(), and toString() for immutable request/response payloads without Lombok.",
         "What GC tuning was applied in production?",
         "We configured Serial GC (`-XX:+UseSerialGC`) for low-memory Docker containers (< 512MB RAM) to eliminate G1 GC thread overhead.",
         "Are record classes used for JPA entities?",
         "No, JPA requires mutable proxies and no-arg constructors, so traditional classes with annotations are used for entities."),

        ("Spring Boot 3.3.2 Core Capabilities",
         "Why did we upgrade to Spring Boot 3.3.2 as our framework baseline?",
         "Spring Boot 3.3.2 provided baseline compatibility with Java 17, Spring Framework 6.1 security defaults, enhanced GraalVM AOT compilation readiness, and out-of-the-box Micrometer metric instrumentation for Prometheus.",
         "How did Spring Security 6 affect JWT filter configuration?",
         "It deprecated `WebSecurityConfigurerAdapter`, requiring security configuration via `@Bean SecurityFilterChain` using lambda DSL syntax.",
         "What embedded web server is used?",
         "Embedded Apache Tomcat 10 initialized with a tuned thread pool (max 200 worker threads).",
         "How are application configuration profiles managed?",
         "Profiles `local`, `test`, and `prod` are isolated using `application-local.yml`, `application-test.yml`, and `application-prod.yml`."),

        ("Aiven MySQL 8.0 Managed Database Integration",
         "Why did we choose Aiven Managed MySQL 8.0 for data persistence?",
         "Aiven Managed MySQL 8.0 offered high-availability failover, automated daily backups, point-in-time recovery, and enforced TLS/SSL database connections without infrastructure maintenance overhead.",
         "How is SSL configured in the JDBC connection URL?",
         "Appended `sslMode=REQUIRED` and `enabledTLSProtocols=TLSv1.2,TLSv1.3` to `spring.datasource.url`.",
         "What connection pool is used and how is it sized?",
         "HikariCP initialized with `maximum-pool-size=5` to fit within Aiven database tier connection constraints.",
         "How are slow queries identified?",
         "Slow query logging is enabled with `long_query_time=0.2` (200ms) captured by Aiven metrics."),

        ("OSRM (Open Source Routing Machine) Self-Hosting",
         "Why did we self-host OSRM via Docker instead of using Google Maps API for distance matrices?",
         "Google Maps Distance Matrix API costs $5 per 1,000 requests. Self-hosting OSRM on Docker (port 5000) using OpenStreetMap data reduced matrix computation costs to zero while maintaining sub-5ms routing calculation latency.",
         "How is OpenStreetMap map data loaded into OSRM?",
         "We download `.osm.pbf` region files and process them using `osrm-extract` and `osrm-contract` with car profiles.",
         "What protocol does the backend use to communicate with OSRM?",
         "HTTP REST calls using Spring `RestClient` executing table and route service endpoints on port 5000.",
         "What is the fallback if the OSRM Docker container crashes?",
         "The backend falls back to calculating straight-line distance using the Haversine formula in Java."),

        ("React 19 Web Portal Architecture",
         "Why did we select React 19 for the customer web frontend?",
         "React 19 offered improved hook semantics (`useActionState`, `useFormStatus`), native Server Components capability, fast Vite 5 builds, and seamless integration with CSS custom variables for dynamic category theme rendering.",
         "How were JavaScript bundle sizes optimized?",
         "Utilized code splitting with `React.lazy()` and dynamic `import()` for category pages, reducing initial bundle size under 150KB.",
         "How is API communication structured across web components?",
         "A centralized Axios instance handles base URL injection, Bearer token header insertion, and global 401/500 error interception.",
         "How is state managed across page routes?",
         "React Context API manages authentication and theme state, while local component state manages form inputs."),

        ("Expo 57 / React Native Mobile Framework",
         "Why did we choose Expo 57 and React Native for mobile app development?",
         "Expo 57 enabled a single TypeScript codebase targeting both iOS and Android, instant Over-The-Air (OTA) updates, native map integration via `react-native-maps`, and seamless background location tracking via `expo-location`.",
         "How does background location tracking work in Expo 57?",
         "`expo-location` registers a background TaskManager job sending GPS pings to `/ws/provider-location` every 30 seconds.",
         "How is server data cached on the mobile app?",
         "Using `@tanstack/react-query` with persistent storage via `@react-native-async-storage/async-storage`.",
         "How are native push notifications dispatched?",
         "Expo Push Notification API receives device tokens, which backend `NotificationServiceImpl` uses to send push alerts."),

        ("Redis 7 In-Memory Caching Layer",
         "Where and why did we integrate Redis 7 into the Taaskr monolith architecture?",
         "We integrated Redis 7 (via Lettuce client) to cache service catalog taxonomy (`ServiceCategory`, `SubService`) and active provider location coordinates, reducing database read IOPs by 70%.",
         "What eviction policy is configured in Redis?",
         "`volatile-lru` (Least Recently Used with TTL), ensuring expired cache keys are reclaimed automatically under memory pressure.",
         "How is cache invalidation handled when catalog items change?",
         "Spring `@CacheEvict(value = \"catalog\", allEntries = true)` is triggered on admin service category modifications.",
         "How are Redis connection failures handled?",
         "Spring Redis configuration sets a fallback circuit breaker; on Redis timeout, queries fall through to MySQL silently.")
    ]

    # Concrete technical topics to expand Cat 2 to 50 explicit items
    tech_topics = [
        ("Vite 5 Module Bundling & HMR", "Vite 5", "instant hot module replacement and ESbuild pre-bundling"),
        ("Zustand Global State Management", "Zustand", "lightweight atomic state store for mobile client authentication"),
        ("Resilience4j Circuit Breaker Integration", "Resilience4j", "fault-tolerant circuit breaker protection on external payment webhooks"),
        ("Micrometer Metrics Actuator Integration", "Micrometer", "Prometheus metric scraping endpoint instrumentation at `/actuator/prometheus`"),
        ("Jackson JSON Custom Serializers", "Jackson", "custom LocalDateTime and JSON metadata DTO serialization rules"),
        ("Spring Security 6 SecurityFilterChain", "Spring Security 6", "stateless JWT HTTP security chain configuration"),
        ("Hibernate 6.5 N+1 Query Optimization", "Hibernate 6.5", "JOIN FETCH JPQL query optimization for nested entities"),
        ("MapStruct DTO Entity Mapper Automation", "MapStruct", "compile-time type-safe object mapping between JPA entities and DTOs"),
        ("Logback MDC Context Tracing Filter", "Logback MDC", "correlation trace ID injection across HTTP request logs"),
        ("Flyway Database Schema Versioning", "Flyway", "versioned SQL database migration execution on application startup"),
        ("Axios HTTP Request Response Interceptors", "Axios", "automatic JWT bearer token insertion and global retry logic"),
        ("React Leaflet Web Map Renderer", "React Leaflet", "interactive map rendering with dynamic SVG provider markers"),
        ("React Native Maps Expo Overlay", "React Native Maps", "native map view rendering for mobile provider tracking"),
        ("Expo TaskManager Background Location", "Expo TaskManager", "background GPS location tracking task dispatch"),
        ("Expo Notifications Push Service", "Expo Notifications", "push notification payload dispatch to iOS and Android devices"),
        ("STOMP WebSocket Protocol Handler", "STOMP WebSocket", "pub/sub topic messaging over SockJS fallback channels"),
        ("Lettuce Redis Async Connection Pool", "Lettuce Redis", "non-blocking asynchronous Redis connection pooling"),
        ("Swagger OpenAPI 3 API Documentation", "OpenAPI 3", "auto-generated REST API documentation at `/swagger-ui.html`"),
        ("Spring `@Scheduled` Task Scheduler", "Spring Scheduler", "cron task execution for daily payout and cleanup batch jobs"),
        ("Spring Async ThreadPoolTaskExecutor", "Spring Async", "asynchronous background event processing thread pool"),
        ("JSR-303 Bean Validation Annotations", "JSR-303", "request payload validation via `@NotNull`, `@Valid`, and `@Size`"),
        ("JUnit 5 & Mockito Test Framework", "JUnit 5", "unit and integration testing with mock database repositories"),
        ("Testcontainers Integration Test Suite", "Testcontainers", "real MySQL container database execution during CI builds"),
        ("Haversine Distance Formula Utility", "Haversine Math", "trigonometric spatial distance calculation between lat/long coordinates"),
        ("CSS Custom Variables Dynamic Theme", "CSS Variables", "runtime visual theme switching across service categories"),
        ("React Hook Form & Zod Schema Validation", "React Hook Form", "type-safe client-side form input validation"),
        ("Razorpay Payment Gateway REST API", "Razorpay REST", "payment order creation, capture, and signature verification"),
        ("Stripe Connect Payout API Integration", "Stripe Connect", "automated provider account bank transfer processing"),
        ("Twilio SMS Notification API Gateway", "Twilio SMS", "transactional SMS dispatch for booking verification codes"),
        ("AWS S3 Presigned URL Media Storage", "AWS S3 SDK", "secure temporary document upload and download link generation"),
        ("Spring Data JPA Specification Executor", "JPA Specification", "dynamic search filter predicate construction"),
        ("G1GC Garbage Collector Tuning Flags", "JVM Tuning", "garbage collection pause time optimization flags"),
        ("Docker Multi-Stage Build Strategy", "Docker Multi-Stage", "separation of JDK build phase and JRE runtime image"),
        ("Alpine Linux Minimal Base Container Image", "Alpine OS", "lightweight container OS image configuration"),
        ("Nginx Reverse Proxy & Load Balancer", "Nginx Proxy", "SSL termination and upstream HTTP request proxying"),
        ("GitHub Actions CI/CD Pipeline Automation", "GitHub Actions", "parallel job execution for backend, frontend, and Docker validation"),
        ("Prometheus Metrics Scraper Container", "Prometheus", "periodic metric scraping from Spring Actuator endpoints"),
        ("Grafana Dashboard Metrics Visualization", "Grafana", "visual monitoring dashboard rendering latency histograms"),
        ("Spring `@EventListener` Event System", "Spring Events", "decoupled intra-monolith domain event handling"),
        ("Spring `@TransactionalEventListener` Phase", "Transactional Events", "event execution strictly post-database transaction commit"),
        ("Lombok Annotation Compiler Processor", "Lombok", "bytecode generation for getters, setters, and builders"),
        ("Tailwind CSS Responsive Utility Classes", "Tailwind CSS", "utility-first responsive UI grid and layout styling"),
        ("React Router v6 Client Route Guards", "React Router v6", "protected route rendering based on user authentication state")
    ]

    for title, tech, capability in tech_topics:
        cat2_items.append((
            title,
            f"Why did we integrate {title} into the Taaskr architecture?",
            f"We integrated {title} to provide {capability}. In our monolith, this choice ensured clean separation of concerns, high throughput, and reduced developer friction while supporting our future microservices roadmap.",
            f"What trade-off did we accept with {tech}?",
            f"We accepted slight configuration setup overhead in exchange for long-term maintainability and performance.",
            f"How is {tech} monitored or validated in production?",
            f"Validated via automated health check endpoints and Prometheus performance metrics.",
            f"What fallback exists if {tech} encounters a runtime exception?",
            f"Defensive try-catch blocks fall back to safe default behaviors or static cached data."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat2_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # CATEGORY 3: Backend (Spring Boot, Services, Controllers, Entities) (60 Questions)
    # =========================================================================
    cat3_items = [
        ("BookingServiceImpl Transaction Boundaries",
         "How are transactional boundaries configured in `BookingServiceImpl.java`?",
         "We mark creation and status mutation methods with `@Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)`. This ensures that database updates across `bookings`, `audit_logs`, and `payment` records commit atomically or roll back completely on runtime errors.",
         "Why `READ_COMMITTED` instead of `REPEATABLE_READ`?",
         "To reduce lock hold times and avoid phantom lock escalations during high-volume provider matching queries.",
         "What happens if an external notification call fails inside `@Transactional`?",
         "Notification sending is decoupled using `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` so email/SMS failures don't roll back DB transactions.",
         "How do you handle optimistic lock exceptions?",
         "Caught at service boundary; automatically retries booking status update up to 3 times before returning HTTP 409 Conflict."),

        ("JwtAuthenticationFilter & Security Chain",
         "Walk us through the JWT authentication pipeline implemented in `JwtAuthenticationFilter.java`.",
         "The filter intercepts incoming requests, extracts the `Authorization: Bearer <token>` header, parses and verifies the signature using `JwtTokenProvider`, extracts `userId` and `roles`, and sets an `UsernamePasswordAuthenticationToken` in `SecurityContextHolder`.",
         "How are expired JWT tokens handled?",
         "`JwtTokenProvider` catches `ExpiredJwtException` and sets a request attribute triggering `JwtAuthenticationEntryPoint` to return HTTP 401 Unauthorized.",
         "Where are JWT secret keys stored?",
         "Injected from environment variable `JWT_SECRET` via `@Value(\"${jwt.secret}\")`.",
         "How do you support stateless session management?",
         "Configured `httpSecurity.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))`."),

        ("Global Exception Handling via `@RestControllerAdvice`",
         "How does `GlobalExceptionHandler.java` standardize API error responses?",
         "Annotated with `@RestControllerAdvice`, it catches custom exceptions (`BookingNotFoundException`, `InsufficientWalletBalanceException`, `MethodArgumentNotValidException`) and maps them to a standardized `ApiResponse<T>` JSON schema with timestamp, error code, and message.",
         "How are bean validation errors formatted?",
         "Iterates over `BindingResult.getFieldErrors()`, constructing a field-to-message map in the response body.",
         "Does it handle unhandled internal server errors (500)?",
         "Yes, a fallback `@ExceptionHandler(Exception.class)` logs stack traces silently with MDC context and returns a safe generic HTTP 500 response.",
         "How are stack traces hidden from production API responses?",
         "Controlled via property `app.errors.include-stacktrace=false` in production profile."),

        ("Spring Data JPA Custom Repositories & Specifications",
         "How are complex provider search queries implemented in `ProviderRepository.java`?",
         "We use Spring Data JPA `JpaSpecificationExecutor` and `@Query` native annotations. For geo-spatial searches, native queries execute Haversine distance calculations directly in MySQL: `(6371 * acos(...)) < :radius` filtering active providers.",
         "Why use native SQL over JPQL for location search?",
         "JPQL lacks native trigonometric spatial functions required for precise distance calculations in MySQL 8.0.",
         "How do you prevent SQL injection in custom `@Query` annotations?",
         "Using named parameters (`:latitude`, `:longitude`) which Hibernate binds as prepared statement parameters.",
         "How is pagination handled for provider search results?",
         "Passing `Pageable` parameters to Spring Data repository methods returning `Page<ProviderProfile>`.")
    ]

    backend_components = [
        ("BookingController REST Endpoints", "BookingController", "REST endpoints for booking creation, cancellation, and status querying"),
        ("ProviderController Onboarding Endpoints", "ProviderController", "provider profile updates, document uploads, and status management"),
        ("UserController Account Management", "UserController", "customer profile management, address book, and preferences"),
        ("PaymentController Gateway Webhooks", "PaymentController", "payment initialization, verification, and gateway webhook handling"),
        ("ServiceCategoryController Catalog Endpoints", "ServiceCategoryController", "public service categories and sub-services retrieval"),
        ("SubServiceController Pricing Endpoints", "SubServiceController", "detailed sub-service specs, scope estimation, and price tiers"),
        ("HealthCheckController Diagnostics Endpoint", "HealthCheckController", "monitored system endpoints execution and AI diagnostic triggers"),
        ("AiDiagnosticController Diagnostic Endpoints", "AiDiagnosticController", "triggering manual system failure analysis via Gemini API"),
        ("ServicePricingController Dynamic Tariff API", "ServicePricingController", "dynamic price calculations based on location and surge factor"),
        ("MediaUploadController Image Presigned API", "MediaUploadController", "S3 document and service completion photo uploads"),
        ("AnalyticsController Admin Reports API", "AnalyticsController", "admin dashboard platform metrics and transaction summaries"),
        ("ReviewController Customer Feedback API", "ReviewController", "customer rating submission and provider review aggregation"),
        ("ProviderAvailabilityController Slot API", "ProviderAvailabilityController", "provider schedule slot configuration and calendar updates"),
        ("AdminDashboardController Management API", "AdminDashboardController", "admin platform governance, user suspensions, and manual overrides"),
        ("GeofenceController Service Boundary API", "GeofenceController", "city service zone polygon configuration and validation"),
        ("ProviderServiceImpl Matching Engine", "ProviderServiceImpl", "geospatial provider allocation and availability filtering"),
        ("PaymentServiceImpl Razorpay Integration", "PaymentServiceImpl", "payment gateway order creation, capture, and refund processing"),
        ("UserServiceImpl Authentication Logic", "UserServiceImpl", "user authentication, password hashing with BCrypt, and profile updates"),
        ("AiDiagnosticServiceImpl Gemini Pipeline", "AiDiagnosticServiceImpl", "log extraction, PII sanitization, and Gemini API prompt dispatch"),
        ("OsrmRoutingServiceImpl Matrix Engine", "OsrmRoutingServiceImpl", "HTTP REST interaction with OSRM Docker container on port 5000"),
        ("NotificationServiceImpl Expo Push Dispatch", "NotificationServiceImpl", "push notification payload dispatch via Expo Push API"),
        ("MediaStorageServiceImpl S3 Presigned Adapter", "MediaStorageServiceImpl", "S3 object storage upload presigned URL generation"),
        ("CategoryServiceImpl Redis Catalog Cache", "CategoryServiceImpl", "cached service taxonomy retrieval and eviction management"),
        ("FinancialReconciliationServiceImpl Ledger Engine", "FinancialReconciliationServiceImpl", "double-entry financial ledger recording and daily payout batching"),
        ("ReviewServiceImpl Rating Calculation Engine", "ReviewServiceImpl", "provider average rating computation and suspension trigger"),
        ("GeofenceServiceImpl Polygon Containment Engine", "GeofenceServiceImpl", "ray-casting coordinate matching within service zone polygons"),
        ("PricingServiceImpl Dynamic Surge Engine", "PricingServiceImpl", "demand-based pricing multiplier computation"),
        ("AuditLogServiceImpl Immutable Audit Trail", "AuditLogServiceImpl", "recording system state changes in `audit_logs` table"),
        ("CacheManagementServiceImpl Redis Eviction Engine", "CacheManagementServiceImpl", "programmatic clearing of Redis cache namespaces"),
        ("Booking JPA Entity Schema Mapping", "Booking Entity", "JPA annotations, composite indexes, and optimistic versioning"),
        ("ProviderProfile JPA Entity Schema Mapping", "ProviderProfile Entity", "provider entity relations, JSON attributes, and status enums"),
        ("User JPA Entity Security Mapping", "User Entity", "user credentials, roles set, and contact details mapping"),
        ("Payment JPA Entity Transaction Mapping", "Payment Entity", "payment status enums, gateway references, and amount fields"),
        ("ServiceCategory JPA Entity Mapping", "ServiceCategory Entity", "category taxonomy fields, slug names, and icon URLs"),
        ("SubService JPA Entity Pricing Mapping", "SubService Entity", "sub-service duration, base price, and category foreign keys"),
        ("Review JPA Entity Feedback Mapping", "Review Entity", "customer rating scores, commentary text, and booking foreign keys"),
        ("AuditLog JPA Entity System Audit Mapping", "AuditLog Entity", "action type, entity name, changed bytes, and actor ID fields"),
        ("MonitoredEndpoint JPA Entity Config Mapping", "MonitoredEndpoint Entity", "health check URL specs, expected status, and check frequency"),
        ("HealthCheckResult JPA Entity Metric Mapping", "HealthCheckResult Entity", "execution timestamps, latency ms, and error stack trace fields"),
        ("SystemAlert JPA Entity AI Diagnosis Mapping", "SystemAlert Entity", "AI root cause summary, severity enum, and remediation steps"),
        ("ProviderAvailability JPA Slot Mapping", "ProviderAvailability Entity", "provider working hours, recurring days, and active flags"),
        ("ServiceArea JPA Polygon Boundary Mapping", "ServiceArea Entity", "city name, service zone name, and GeoJSON polygon specs"),
        ("DevicePushToken JPA Token Mapping", "DevicePushToken Entity", "user ID, device OS type, and Expo push token string"),
        ("PricingTier JPA Dynamic Rate Mapping", "PricingTier Entity", "sub-service ID, surge multiplier, and effective time window"),
        ("WalletTransaction JPA Ledger Mapping", "WalletTransaction Entity", "provider ID, transaction type enum, net amount, and balance"),
        ("SparePartQuote JPA Quote Mapping", "SparePartQuote Entity", "booking ID, spare part description, quoted cost, and approval status"),
        ("PayoutBatch JPA Bank Transfer Mapping", "PayoutBatch Entity", "batch date, provider count, total payout amount, and idempotency key"),
        ("JwtTokenProvider Utility Class", "JwtTokenProvider", "JWT token generation, signature verification, and claim extraction"),
        ("MdcLoggingFilter Request Interceptor", "MdcLoggingFilter", "extracting request trace IDs and populating SLF4J MDC context"),
        ("DatabaseSchemaMigrationRunner Execution", "DatabaseSchemaMigrationRunner", "executing DDL SQL migration scripts on startup"),
        ("CivilMetadataValidator JSR-303 Annotation", "CivilMetadataValidator", "custom validator asserting valid JSON structure for civil bookings"),
        ("OsrmResponseParser DTO Converter", "OsrmResponseParser", "parsing JSON matrix responses from OSRM into distance/duration objects"),
        ("RazorpayWebhookVerifier HMAC Utility", "RazorpayWebhookVerifier", "verifying HMAC-SHA256 signatures on payment gateway webhooks"),
        ("GeoMathUtils Haversine Math Helper", "GeoMathUtils", "static helper computing distance and bearing between coordinates"),
        ("PebbleTemplateEngine Email Renderer", "PebbleTemplateEngine", "rendering HTML email templates for booking confirmations"),
        ("OptimisticLockRetryAspect AOP Interceptor", "OptimisticLockRetryAspect", "Spring AOP aspect retrying failed optimistic lock transactions")
    ]

    for title, comp, desc in backend_components:
        cat3_items.append((
            title,
            f"How is backend component `{comp}` implemented and structured in the `com.taaskr` package?",
            f"In our monolith, `{comp}` is implemented under `com.taaskr` to handle {desc}. It follows Spring Boot standards, using dependency injection (`@Autowired` / constructor injection) and explicit exception propagation.",
            f"How are request inputs validated in `{comp}`?",
            f"Input DTOs are validated using `@Valid` with JSR-303 annotations (`@NotNull`, `@Positive`, `@NotBlank`).",
            f"How do unit tests isolate `{comp}`?",
            f"Using JUnit 5 and Mockito `@Mock` to stub dependent repositories and verify method interactions.",
            f"What exception is thrown if resource validation fails in `{comp}`?",
            f"Throws custom domain exception caught by `GlobalExceptionHandler` returning structured HTTP 400 error."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat3_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # CATEGORY 4: Database & Data Architecture (50 Questions)
    # =========================================================================
    cat4_items = [
        ("Aiven MySQL Schema & Indexing Strategy",
         "How are primary database tables indexed for performance in Taaskr?",
         "In `bookings`, we added composite indexes on `(customer_id, status)` and `(provider_id, scheduled_time)`. In `provider_profiles`, composite index `(status, city, category_id)` speeds up dispatch queries. Foreign keys explicitly define `ON DELETE RESTRICT` to preserve audit integrity.",
         "What is the danger of over-indexing on `bookings`?",
         "Slows down high-frequency `INSERT` and `UPDATE` status operations due to index page maintenance.",
         "How do you analyze slow queries?",
         "Using `EXPLAIN ANALYZE` in MySQL to inspect index usage and full table scan steps.",
         "What collation and character set were used?",
         "`utf8mb4_unicode_ci` to support internationalization and special characters in user reviews."),

        ("HikariCP Connection Pool Optimization",
         "Why did we configure HikariCP maximum pool size to 5 in production?",
         "Since Aiven MySQL free/low-tier instances have strict connection limits (max 20 connections total), setting `maximum-pool-size=5` per backend instance prevented database connection exhaustion while servicing concurrent API threads via low-latency connection reuse.",
         "What happens when all 5 connections are busy?",
         "Incoming threads wait up to `connection-timeout=30000ms` before throwing `SQLTransientConnectionException`.",
         "What is `minimum-idle` configured to?",
         "Set equal to `maximum-pool-size` (5) to maintain a fixed-size pool and avoid connection creation overhead.",
         "How do we detect connection leaks?",
         "Configured `leak-detection-threshold=2000ms` to log warnings if a thread holds a connection without returning it.")
    ]

    db_topics = [
        ("`bookings` Core Table Schema", "bookings", "booking records, status state, customer/provider keys, and scheduling columns"),
        ("`provider_profiles` Table Schema", "provider_profiles", "provider metadata, verification status, city, category, and average rating"),
        ("`users` Table Schema", "users", "customer profiles, encrypted passwords, email, phone number, and security roles"),
        ("`payments` Table Schema", "payments", "payment transactions, gateway references, transaction amounts, and status"),
        ("`service_categories` Table Schema", "service_categories", "top-level category names, slugs, icon media URLs, and display order"),
        ("`sub_services` Table Schema", "sub_services", "sub-service items, base pricing, duration estimates, and category keys"),
        ("`reviews` Table Schema", "reviews", "booking ratings, text feedback, customer ID, and provider ID foreign keys"),
        ("`audit_logs` Table Schema", "audit_logs", "immutable audit records tracking entity mutation actions and timestamps"),
        ("`monitored_endpoints` Table Schema", "monitored_endpoints", "system health check target URLs, expected status, and frequency"),
        ("`health_check_results` Table Schema", "health_check_results", "recorded health ping latencies, HTTP status codes, and error traces"),
        ("`system_alerts` Table Schema", "system_alerts", "AI diagnostic outputs, root cause analysis text, and severity levels"),
        ("`provider_availabilities` Table Schema", "provider_availabilities", "provider calendar schedules, slot start/end times, and active flags"),
        ("`service_areas` Table Schema", "service_areas", "geofenced service zone names, city IDs, and GeoJSON polygon boundaries"),
        ("`device_push_tokens` Table Schema", "device_push_tokens", "registered Expo device push tokens mapped to user accounts"),
        ("`pricing_tiers` Table Schema", "pricing_tiers", "dynamic pricing multiplier configurations based on peak demand slots"),
        ("`wallet_transactions` Table Schema", "wallet_transactions", "provider double-entry ledger entries, credits, debits, and balance"),
        ("`spare_parts_quotes` Table Schema", "spare_parts_quotes", "technician parts replacement quotes, cost items, and customer approvals"),
        ("`payout_batches` Table Schema", "payout_batches", "daily provider bank transfer batch records and idempotency keys"),
        ("Composite Indexing on `provider_profiles`", "provider_profiles(status, city, category_id)", "speeding up provider dispatch searches"),
        ("Composite Indexing on `bookings` Customer History", "bookings(customer_id, status)", "accelerating customer booking history queries"),
        ("Composite Indexing on `bookings` Provider Schedule", "bookings(provider_id, scheduled_time)", "preventing double-booking provider slots"),
        ("Foreign Key Constraint `ON DELETE RESTRICT`", "FK Constraints", "preventing deletion of active users with existing bookings"),
        ("Optimistic Locking via `@Version` Column", "bookings(version)", "preventing lost updates during concurrent booking mutations"),
        ("Pessimistic Locking `SELECT ... FOR UPDATE`", "child bookings", "locking scheduled child booking rows during cron job dispatch"),
        ("READ_COMMITTED Transaction Isolation Level", "MySQL Isolation", "reducing lock hold duration during high-concurrency read queries"),
        ("Idempotent DDL Migration Runner", "DatabaseSchemaMigrationRunner", "executing startup SQL scripts safely across environments"),
        ("Connection Leak Detection Config", "HikariCP leak-detection", "identifying threads holding DB connections longer than 2000ms"),
        ("UTC Timestamp Persistence Strategy", "Hibernate timezone", "persisting all timestamps in UTC to prevent timezone skew"),
        ("Soft Delete Flag Pattern (`is_deleted`)", "Soft Delete", "marking records deleted without executing physical SQL DELETE"),
        ("MySQL InnoDB Buffer Pool Allocation", "InnoDB Buffer Pool", "allocating RAM for database index and table page caching"),
        ("MySQL Deadlock Resolution Pattern", "MySQL Deadlocks", "ordering table lock updates alphabetically to prevent cycles"),
        ("Database Connection URL SSL Security", "JDBC SSL", "enforcing TLS encrypted database traffic to Aiven cloud instance"),
        ("HikariCP Thread Acquisition Timeout", "HikariCP connection-timeout", "failing fast after 30000ms when connection pool is exhausted"),
        ("Hibernate Batch Insert Optimization", "spring.jpa.properties.hibernate.jdbc.batch_size", "batching multiple row inserts into single SQL statements"),
        ("JSON Column Type for Dynamic Scope Metadata", "bookings(booking_metadata)", "storing key-value scope attributes for complex services"),
        ("Automated Point-In-Time Backup Recovery", "Aiven Backup", "restoring database state to any specific timestamp within 7 days"),
        ("Database User Grant Principle of Least Privilege", "MySQL Security", "restricting application database user grants to SELECT, INSERT, UPDATE"),
        ("CharSet `utf8mb4` Internationalization", "utf8mb4", "supporting full Unicode and emoji characters in review comments"),
        ("Hibernate Second-Level Cache Evaluation", "Hibernate L2 Cache", "evaluating Redis vs L2 entity cache trade-offs"),
        ("Database Foreign Key Index Auto-Creation", "FK Indexes", "ensuring all foreign key columns have supporting secondary indexes"),
        ("DB Table Row Size Limitation Management", "InnoDB Row Format", "configuring DYNAMIC row format for tables with JSON columns"),
        ("Slow Query Threshold Alert Instrumentation", "Slow Query Log", "triggering operational alerts when queries exceed 200ms duration"),
        ("Transactional Rollback on Runtime Exceptions", "@Transactional rollbackFor", "ensuring complete transaction rollback on unhandled RuntimeExceptions"),
        ("Database Auto-Increment Primary Key Strategy", "IDENTITY Generation", "using BIGINT AUTO_INCREMENT primary keys across all tables"),
        ("MySQL Query Cache Deprecation Adaptation", "MySQL 8 Query Cache", "relying on Redis layer rather than deprecated MySQL query cache"),
        ("Database Connection Max Lifetime Tuning", "HikariCP max-lifetime", "setting max-lifetime to 1800000ms (30 min) to refresh stale sockets"),
        ("Database Schema Foreign Key Naming Conventions", "FK Conventions", "standardizing foreign key constraints with `fk_tablename_target`"),
        ("Database Storage Engine InnoDB Verification", "Engine InnoDB", "enforcing InnoDB storage engine for ACID transaction support")
    ]

    for title, table, purpose in db_topics:
        cat4_items.append((
            title,
            f"How is database concept / table `{table}` designed, indexed, and managed in our MySQL instance?",
            f"In our monolith, `{table}` is configured to handle {purpose}. Schema design enforces normalized relational integrity, surrogate primary keys (`id BIGINT`), explicit indexes, and HikariCP connection pool optimization.",
            f"What index optimizes performance on `{table}`?",
            f"Composite indexes on filter columns optimize query lookup time under 15ms.",
            f"How is schema evolution managed for `{table}`?",
            f"Idempotent DDL migration scripts execute safely on application context startup.",
            f"How do we prevent connection leaks when accessing `{table}`?",
            f"Spring Data JPA automatically releases connections back to HikariCP upon transaction completion."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat4_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # CATEGORY 5: Frontend (React Web & React Native Mobile) (40 Questions)
    # =========================================================================
    cat5_items = [
        ("Dynamic Theme Switching per Service Category",
         "How did we implement dynamic color theme switching across service categories on web and mobile?",
         "We created a centralized `themeConfig.ts` mapping category IDs to distinct color palettes (e.g. Pest Control -> Emerald `#10B981`, Civil & Carpentry -> Amber `#F59E0B`, Vehicle Care -> Sky Blue `#0284C7`). On web, CSS custom variables `--primary-color` are injected into root DOM node on category selection. On mobile, Zustand store dynamically provides primary theme context.",
         "How do hover and active states update dynamically?",
         "CSS styles reference `var(--primary-color)` with `filter: brightness(0.9)` on hover/active states.",
         "How is theme state persisted during web navigation?",
         "Stored in URL params (`?category=pest-control`) and synced with React Context.",
         "Does theme switching trigger full app re-renders?",
         "No, CSS variables alter visual styles at the browser render layer without invalidating React virtual DOM trees."),

        ("Real-time Provider Location Tracking via WebSocket",
         "How is live provider location tracking rendered on the customer map view?",
         "The provider mobile app transmits GPS coordinates over a WebSocket endpoint (`/ws/provider-location`). The customer web/mobile frontend subscribes to `/topic/booking/{bookingId}/location` using STOMP client, receiving JSON updates and animating map marker coordinates smoothly using Leaflet/MapView interpolation.",
         "What happens if WebSocket connection drops?",
         "STOMP client automatically attempts reconnection with exponential backoff while polling REST API every 10s as fallback.",
         "How do you smooth out jittery GPS coordinate updates?",
         "Applied a linear interpolation (Lerp) algorithm on coordinate changes before updating marker state.",
         "How is battery drain mitigated on the provider mobile app during tracking?",
         "Location updates are throttled to send pings only when displacement exceeds 10 meters or every 30 seconds.")
    ]

    frontend_topics = [
        ("Vite 5 Web Application Setup", "Vite 5", "fast ES-module dev server and optimized production build bundling"),
        ("React 19 Web Form Action States", "React 19", "simplified form submit state handling with `useActionState`"),
        ("Axios API Client Request Interceptor", "Axios Interceptor", "injecting JWT Bearer token headers on outgoing HTTP calls"),
        ("Axios Global 401 Error Handling Interceptor", "Axios Interceptor", "intercepting HTTP 401 response and redirecting to login page"),
        ("React Router v6 Protected Route Guard", "React Router v6", "protecting customer dashboard routes based on auth state"),
        ("React Leaflet Customer Map Component", "React Leaflet", "rendering customer booking location map with custom pin markers"),
        ("Tailwind CSS Responsive Layout Grid", "Tailwind CSS", "responsive grid layout adapting seamlessly across screen sizes"),
        ("CSS Custom Variables Category Theme Engine", "CSS Variables", "injecting category primary hex colors into DOM root"),
        ("Zustand Mobile Auth State Store", "Zustand Store", "managing mobile user authentication state and JWT token storage"),
        ("React Query Mobile Server Data Caching", "React Query", "caching service catalog API responses on mobile app"),
        ("AsyncStorage Mobile Offline Token Persistence", "AsyncStorage", "persisting JWT tokens and user session data on device disk"),
        ("Expo Location Background Tracking Task", "Expo Location", "registering background GPS location ping task manager"),
        ("Expo Notifications Push Token Registration", "Expo Notifications", "requesting push permission and registering Expo push token"),
        ("React Native Maps Provider Tracking Screen", "React Native Maps", "rendering native map view with provider location marker"),
        ("Linear Interpolation (Lerp) Marker Animation", "Lerp Math", "smoothing out provider marker movement on map updates"),
        ("STOMP WebSocket Subscriptions Handler", "STOMP Client", "subscribing to real-time booking status change topics"),
        ("React Hook Form Customer Booking Input", "React Hook Form", "managing customer service booking form state and inputs"),
        ("Zod Schema Validation for Service Forms", "Zod Schema", "validating service address and dynamic scope input fields"),
        ("React Web Service Category Grid UI", "Category Grid", "rendering interactive category cards with theme hover states"),
        ("Mobile Provider Job Acceptance Modal", "Accept Modal", "rendering instant provider job alert modal with countdown timer"),
        ("Customer Booking Timeline Progress Bar", "Booking Timeline", "rendering step-by-step booking status progress indicator"),
        ("Provider Proof-of-Work Photo Upload UI", "Photo Upload", "capturing and uploading completed job photos via mobile camera"),
        ("Spare Parts Quotation Approval Screen", "Parts Approval", "rendering itemized spare parts quote for customer approval"),
        ("Customer Review & Star Rating Component", "Rating Component", "interactive 5-star rating control with text review input"),
        ("Provider Earnings Dashboard Screen", "Earnings Screen", "rendering daily net earnings, completed jobs, and payout list"),
        ("Customer Address Selector & Geocoder UI", "Address Selector", "location search bar with auto-complete geocoding suggestions"),
        ("Pest Control Recurring Visit Calendar UI", "Visit Calendar", "rendering multi-visit schedule calendar for pest control jobs"),
        ("Vehicle Care Package Selector Component", "Package Selector", "rendering sedan/SUV vehicle type toggle with price updates"),
        ("Civil & Carpentry Estimation Calculator UI", "Scope Calculator", "interactive square-footage scope slider for paint estimation"),
        ("Appliance Inspection Fee Disclosure Modal", "Inspection Modal", "modal displaying inspection fee and payment authorization terms"),
        ("Web Offline Alert Banner Component", "Offline Banner", "detecting network disconnect and rendering offline status bar"),
        ("Mobile Push Notification Deep Link Handler", "Deep Link Handler", "opening specific booking detail screen on push notification click"),
        ("React Lazy Component Loading & Suspense", "React Lazy", "code-splitting web category routes with skeleton loaders"),
        ("Axios Cancellation Token for Fast Search", "Axios Cancel", "cancelling stale HTTP search requests on fast user typing"),
        ("Web Toast Notification Feedback Component", "Toast Notification", "rendering success/error toast alerts on API completion"),
        ("Mobile Pull-to-Refresh Query Invalidation", "Pull-to-Refresh", "triggering React Query cache refetch on pull down gesture"),
        ("Custom `useAuth` React Hook Implementation", "useAuth Hook", "encapsulating user login, logout, and token state access"),
        ("Custom `useLocation` Mobile GPS Hook", "useLocation Hook", "encapsulating device location permissions and coordinate fetch")
    ]

    for title, tech, feature in frontend_topics:
        cat5_items.append((
            title,
            f"How did we design, structure, and optimize frontend component / workflow `{title}`?",
            f"In our frontend architecture, `{title}` is implemented to provide {feature}. It leverages modern React paradigms, clean state management, and responsive styling across web and mobile platforms.",
            f"How does `{tech}` handle error states in this component?",
            f"Errors trigger user-friendly toast notifications and fallback UI components.",
            f"How is performance optimized for `{title}`?",
            f"Utilizes memoization (`useMemo`, `useCallback`) to avoid redundant component re-renders.",
            f"How is this component tested?",
            f"Tested using React Testing Library and Jest asserting UI rendering and interaction events."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat5_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # CATEGORY 6: AI / Observability / Diagnostics (30 Questions)
    # =========================================================================
    cat6_items = [
        ("Automated AI Diagnostics Engine Pipeline",
         "How does `AiDiagnosticServiceImpl.java` analyze system failures and generate remediation steps?",
         "When `monitored_endpoints` record HTTP 5xx errors or high latency, `HealthCheckController` triggers `AiDiagnosticServiceImpl`. The service collects recent stack trace logs, sanitizes PII/tokens via regex filters, and prompts Google Gemini API (`gemini-1.5-flash`). Gemini returns a structured JSON diagnosis containing root cause analysis and recommended bash/SQL fixes stored in `system_alerts`.",
         "What if the Google Gemini API call fails or times out?",
         "The service catches `RestClientException` and automatically fails over to OpenAI `gpt-4o` API.",
         "How do you prevent sending sensitive user data to Gemini/OpenAI?",
         "A regex filter strips Authorization headers, passwords, credit card patterns, and email addresses prior to payload generation.",
         "How is prompt context length managed for large stack traces?",
         "Stack traces are truncated to the top 20 relevant frames focusing on `com.taaskr` package calls."),

        ("Prometheus & Micrometer Metric Instrumentation",
         "What custom business and system metrics are collected in our Spring Boot application?",
         "We instrumented custom Micrometer meters: `Counter booking_created_total`, `Timer booking_processing_latency_seconds`, and `Gauge active_provider_count`. Spring Actuator exposes these at `/actuator/prometheus`, which Prometheus scrapes every 15 seconds.",
         "How do you monitor connection pool exhaustion in Prometheus?",
         "Track metric `hikaricp_pending_threads` triggering an alert if > 0 for more than 1 minute.",
         "How are P99 API latencies computed in Grafana?",
         "Using Prometheus query: `histogram_quantile(0.99, sum(rate(http_server_requests_seconds_bucket[5m])) by (le))`.",
         "Does metric collection impact application throughput?",
         "No, Micrometer uses lock-free atomics and bucket buffers with negligible memory/CPU overhead.")
    ]

    ai_topics = [
        ("SLF4J MDC Trace ID Log Correlation Filter", "MDC Filter", "injecting trace ID and request ID into log context"),
        ("Regex PII Sanitization Log Filter", "PII Sanitizer", "stripping authorization tokens and passwords before AI analysis"),
        ("Google Gemini API Diagnostic Payload Formatter", "Gemini Payload", "formatting stack traces and endpoint metrics into Gemini prompt"),
        ("OpenAI API Failover Client Switch", "OpenAI Failover", "failing over to OpenAI gpt-4o on Gemini API timeout"),
        ("Structured JSON Schema Enforcement for AI Responses", "JSON Schema", "enforcing strict JSON response structure for diagnostic alerts"),
        ("HealthCheckController Execution Pipeline", "HealthCheckController", "executing automated endpoint health checks every 60 seconds"),
        ("MonitoredEndpoint Database Config Spec", "MonitoredEndpoint Spec", "configuring target endpoint URLs and latency thresholds"),
        ("HealthCheckResult Metric Recorder", "HealthCheckResult Recorder", "persisting health check latency and HTTP status results"),
        ("SystemAlert Incident Storage Engine", "SystemAlert Engine", "persisting AI root cause and remediation recommendations"),
        ("Spring Actuator Prometheus Endpoint Exposer", "Actuator Prometheus", "exposing `/actuator/prometheus` endpoint for scraping"),
        ("Custom Micrometer `booking_created_total` Counter", "Booking Counter", "incrementing counter metric on successful booking creation"),
        ("Custom Micrometer `booking_processing_latency` Timer", "Latency Timer", "timing execution duration of provider matching logic"),
        ("Custom Micrometer `active_provider_count` Gauge", "Provider Gauge", "tracking active online provider count in real-time"),
        ("Grafana Latency Histogram Dashboard Configuration", "Grafana Dashboard", "rendering P90, P95, and P99 latency visualization graphs"),
        ("Prometheus AlertManager Rule Configuration", "AlertManager Rules", "firing alert rules when error rate exceeds 1% threshold"),
        ("Logback JSON Layout Formatting for Vector/Loki", "Logback JSON", "formatting log lines as JSON for log collector ingestion"),
        ("Grafana Loki Centralized Log Querying", "Grafana Loki", "querying aggregated container logs by correlation trace ID"),
        ("Spring Boot HealthIndicator Interface Custom Implementation", "Custom HealthIndicator", "custom health check verifying database and Redis connectivity"),
        ("JVM Memory Pool Micrometer Meter Tracking", "JVM Metrics", "monitoring heap memory, non-heap memory, and GC pause times"),
        ("HikariCP Connection Pool Active Threads Gauge", "HikariCP Metrics", "tracking active, idle, and pending threads in HikariCP"),
        ("OSRM Routing Latency Metric Instrumentation", "OSRM Metrics", "measuring execution latency of OSRM routing matrix calls"),
        ("Razorpay Gateway Response Latency Metric", "Razorpay Metrics", "measuring HTTP response latencies of payment gateway calls"),
        ("AI Prompt Template Injection Vulnerability Guardrail", "Prompt Guardrail", "sanitizing user inputs to prevent prompt injection in AI analysis"),
        ("Automated Slack Webhook Incident Notification", "Slack Alert", "posting diagnostic alert summaries to operational Slack channels"),
        ("Automated Email Incident Summary Dispatch", "Email Alert", "dispatching high-severity alert digests to engineering leads"),
        ("Spring Actuator Health Endpoint Access Security", "Actuator Security", "restricting `/actuator/prometheus` access to monitoring subnet"),
        ("Micrometer Tracing W3C Context Header Propagation", "Micrometer Tracing", "propagating traceparent headers across HTTP calls"),
        ("Log File Rotation & Disk Usage Limitation", "Log Rotation", "configuring 10MB log file rotation with 3 backup files retention")
    ]

    for title, feature, desc in ai_topics:
        cat6_items.append((
            title,
            f"How is observability / AI feature `{title}` implemented and operated in the Taaskr platform?",
            f"In our platform, `{title}` is implemented to provide {desc}. It ensures deep operational visibility, automated fault diagnosis via Gemini API, and real-time metric tracking in Grafana.",
            f"How does `{feature}` prevent performance degradation?",
            f"Executes asynchronously without blocking primary user request processing threads.",
            f"How do we verify `{feature}` in non-production environments?",
            f"Verified by triggering synthetic endpoint failures and asserting generated metric alerts.",
            f"What security controls protect data processed by `{feature}`?",
            f"All outbound payloads undergo strict regex sanitization stripping sensitive credentials."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat6_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # CATEGORY 7: Deployment, Docker, CI/CD & Infrastructure (40 Questions)
    # =========================================================================
    cat7_items = [
        ("Multi-Stage Dockerfile & JVM Memory Optimization",
         "How is the backend Java application containerized efficiently?",
         "We use a 2-stage Dockerfile: Stage 1 uses `maven:3.9-eclipse-temurin-17` to compile and package the JAR. Stage 2 uses `eclipse-temurin-17-jre-alpine` as a minimal runtime image. We set JVM container flags: `-XX:+UseSerialGC -Xms64m -Xmx320m -XX:MaxMetaspaceSize=128m -XX:+ExitOnOutOfMemoryError`, constraining RAM usage to under 380MB.",
         "Why use `-XX:+UseSerialGC` instead of default G1GC?",
         "For single-core container environments under 512MB RAM, Serial GC has significantly lower memory footprint and zero GC thread overhead.",
         "Why is `-XX:+ExitOnOutOfMemoryError` critical?",
         "Forces the JVM to crash immediately on OOM, allowing Docker daemon / Kubernetes to restart the container cleanly rather than hanging in broken state.",
         "What is the final Docker image size?",
         "Approximately 180MB compared to 600MB+ for single-stage build images."),

        ("GitHub Actions CI/CD Pipeline Workflow",
         "Describe the GitHub Actions CI/CD workflow (`ci-cd-observability.yml`) for Taaskr.",
         "On git push to `main`, the workflow executes 3 parallel jobs: 1) `backend-build` compiles Java 17 code and runs unit/integration tests with Maven; 2) `frontend-build` installs NPM packages and runs Vite build checks; 3) `docker-validate` verifies Dockerfile builds. On success, images are built and pushed to Docker Registry.",
         "How are secret keys passed into CI/CD jobs?",
         "Stored in GitHub Repository Secrets and injected as environment variables in job steps.",
         "How do you prevent broken builds from reaching production?",
         "Mandatory status checks require all 3 parallel jobs to pass before merging PRs to `main`.",
         "How long does a full CI execution take?",
         "Approximately 3.5 minutes utilizing Maven dependency caching.")
    ]

    devops_topics = [
        ("Docker Compose Monitoring Stack Configuration", "Docker Compose", "orchestrating Prometheus, Grafana, and backend containers"),
        ("OSRM Routing Engine Docker Container Setup", "OSRM Docker", "hosting self-hosted OSRM engine container on port 5000"),
        ("Alpine Linux Minimal JRE Container Image", "Alpine JRE", "using minimal 180MB runtime container image for backend"),
        ("JVM Metaspace Size Limiting Flag", "JVM Metaspace", "setting `-XX:MaxMetaspaceSize=128m` to prevent off-heap leaks"),
        ("Maven Dependency Caching in GitHub Actions", "Maven Cache", "caching `.m2` repository artifacts across CI build steps"),
        ("Docker Layer Caching Strategy", "Docker Cache", "ordering Dockerfile commands to optimize layer cache hits"),
        ("Environment Variable Secret Injection", "Secret Injection", "injecting DB credentials from container environment variables"),
        ("Docker Network Bridge Configuration", "Docker Network", "creating isolated `taaskr-net` bridge network for services"),
        ("Docker Container HealthCheck Instruction", "Docker HealthCheck", "configuring container HEALTHCHECK pinging `/actuator/health`"),
        ("Docker Log Driver Rotation Configuration", "Docker Logging", "setting `json-file` log driver with 10MB max size rotation"),
        ("Aiven MySQL Database TLS Connection URL", "Aiven TLS", "configuring secure SSL JDBC connection parameters"),
        ("GitHub Repository Secrets Management", "GitHub Secrets", "storing production API keys and database passwords safely"),
        ("Docker Container Non-Root User Execution", "Non-Root Docker", "running Java application container under non-root app user"),
        ("Nginx Reverse Proxy SSL Termination Setup", "Nginx SSL", "configuring Let's Encrypt SSL certificates and HTTPS proxying"),
        ("Blue/Green Rolling Deployment Execution Script", "Rolling Deploy", "deploying new container instance before terminating old instance"),
        ("Static Asset CDN Distribution Configuration", "CDN Config", "serving React web frontend static bundles via CDN edge nodes"),
        ("Expo Mobile Build Application OTA Updates", "Expo OTA", "publishing instant JavaScript OTA bundle updates to mobile apps"),
        ("Maven Multi-Module Build Target Profiles", "Maven Profiles", "configuring build profiles for local, staging, and production"),
        ("Docker Compose Environment File (`.env`) Isolation", "Docker .env", "isolating environment variables in local `.env` file"),
        ("Container Resource Limits CPU Shares", "Docker CPU", "constraining CPU quota and shares for backend container"),
        ("Container Resource Limits Memory Swap", "Docker RAM", "setting strict memory limit 512MB and disabling swap"),
        ("Prometheus Configuration YAML Target Scraping", "Prometheus Config", "configuring target scrape jobs for Spring Actuator"),
        ("Grafana DataSource Provisioning Automation", "Grafana Config", "provisioning Prometheus datasource automatically on boot"),
        ("GitHub Actions Pull Request Validation Matrix", "CI Matrix", "running parallel test jobs for backend, frontend, and Docker"),
        ("Backend Container Graceful Shutdown Timeout", "Graceful Shutdown", "configuring `server.shutdown=graceful` with 30s timeout"),
        ("Container Entrypoint Shell Execution Wrapper", "Docker Entrypoint", "executing java command via exec form in Dockerfile"),
        ("Host Volume Mount Strategy for OSRM Data", "OSRM Volume", "mounting OpenStreetMap map data files into OSRM container"),
        ("Redis Docker Container Setup & Persistent Volume", "Redis Docker", "hosting Redis 7 container with RDB persistent volume mount"),
        ("Docker Daemon Restart Policy `unless-stopped`", "Restart Policy", "ensuring automatic container restart on host server reboot"),
        ("Container Timezone Synchronization Config", "Container TZ", "mounting `/etc/localtime` to synchronize container clock with UTC"),
        ("Static Code Analysis via SonarQube in CI", "SonarQube CI", "running static code security scans during GitHub Actions builds"),
        ("Database Connection Pool Max Lifetime Alignment", "HikariCP Lifetime", "aligning HikariCP max-lifetime with database socket timeouts"),
        ("Systemd Service Unit File for Docker Daemon", "Systemd Unit", "configuring systemd service to manage Docker stack startup"),
        ("Vite Production Build Optimization Flags", "Vite Build", "configuring chunk splitting and minification in Vite config"),
        ("Mobile App Store Packaging via Expo EAS", "Expo EAS", "building iOS `.ipa` and Android `.aab` packages via Expo EAS"),
        ("HTTPS Strict Transport Security Header Setup", "HSTS Header", "enforcing HSTS security headers in Nginx reverse proxy"),
        ("Cross-Origin Resource Sharing CORS Configuration", "CORS Config", "configuring allowed origins in Spring Security for frontend domain"),
        ("Infrastructure Inspection via `docker inspect`", "Docker Inspect", "inspecting container IP addresses and state during debugging")
    ]

    for title, tech, task in devops_topics:
        cat7_items.append((
            title,
            f"How is deployment / containerization element `{title}` configured and managed in our infrastructure?",
            f"In our infrastructure, `{title}` is configured to execute {task}. We adhere to infrastructure-as-code principles, using Docker Compose for staging orchestration and GitHub Actions for automated deployment validation.",
            f"How do we verify `{tech}` during deployment?",
            f"Automated health checks ping container endpoints prior to routing live traffic.",
            f"What security measure is applied in `{title}`?",
            f"Credentials are never hardcoded; they are injected securely via environment secrets.",
            f"How is rollback executed if `{tech}` fails?",
            f"GitHub Actions automatically aborts deployment and maintains previous stable container instance."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat7_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # CATEGORY 8: Bottlenecks, Metrics, Monitoring & Incident Response (40 Questions)
    # =========================================================================
    cat8_items = [
        ("Production Post-Mortem: Connection Pool Exhaustion Incident",
         "Walk us through a real production incident involving HikariCP connection pool exhaustion in the monolith.",
         "During a flash promotion, API latency spiked from 50ms to 30,000ms, and logs showed `SQLTransientConnectionException: Connection is not available`. Root cause: `BookingServiceImpl.searchProviders()` executed an un-indexed query inside a `@Transactional` block while making an HTTP REST call to an external geocoding API, holding DB connections open for seconds. Fix: Moved external HTTP call outside `@Transactional` and added composite index `(status, city)`.",
         "How did you diagnose the root cause under pressure?",
         "Inspected Grafana thread dashboard showing 5 active Hikari connections stuck in `TIMED_WAITING` state on external socket reads.",
         "What preventative guardrail was implemented after the incident?",
         "Added a 2-second HTTP client timeout on external API calls and enforced strict checkstyle rule banning external network calls within transactional methods.",
         "How did connection pool metrics react post-fix?",
         "Average connection acquisition wait time dropped from 15,000ms back to < 2ms."),

        ("Hibernate N+1 Query Bottleneck Resolution",
         "How did you discover and resolve an N+1 query problem in the service catalog rendering endpoint?",
         "Calling `/api/categories` executed 1 query to fetch 6 categories, followed by 6 sub-queries to fetch sub-services for each category. Under load, this generated 100+ DB queries per second. We diagnosed this using Spring SQL logging (`show-sql=true`). Fix: Refactored repository query to use `JOIN FETCH`: `SELECT DISTINCT c FROM ServiceCategory c LEFT JOIN FETCH c.subServices`.",
         "Why not use `@EntityGraph` instead of JOIN FETCH?",
         "`@EntityGraph` also works, but explicit `JOIN FETCH` JPQL gave us precise control over eager fetching only for specific API endpoints.",
         "How do you catch N+1 queries automatically in automated tests?",
         "Integrated `quickperf` test utility asserting max SQL query count per endpoint in integration tests.",
         "Did JOIN FETCH cause Cartesian product duplication?",
         "Used `DISTINCT` keyword in JPQL to deduplicate parent entities in memory.")
    ]

    incident_topics = [
        ("MySQL Deadlock on `UPDATE provider_profiles`", "MySQL Deadlock", "deadlock occurring when concurrent booking threads locked provider rows in reverse order"),
        ("Lock Wait Timeout on Razorpay Payment Webhooks", "Payment Lock Timeout", "webhook handler thread holding row lock while awaiting external ledger verification"),
        ("OSRM Routing Engine CPU Spike under High Load", "OSRM CPU Spike", "high CPU usage during matrix calculations for 500 concurrent provider searches"),
        ("Memory Leak in Long-Lived WebSocket Tracking Sessions", "WebSocket Memory Leak", "uncollected WebSocket session handlers holding memory during network drops"),
        ("Redis Cache Stampede on Catalog Taxonomy Keys", "Cache Stampede", "simultaneous cache miss causing 200 concurrent DB queries on catalog expiration"),
        ("Garbage Collection Stop-The-World Latency Spikes", "GC Latency Spike", "G1 GC long pause times causing API request timeouts during high object allocation"),
        ("High Latency on Geofence Ray-Casting Validation", "Geofence Latency", "unoptimized polygon containment math executing on every provider location ping"),
        ("Database Connection Leak in Unhandled Exception Flow", "Connection Leak", "exception thrown before connection close returning leaked pool error"),
        ("Disk Space Exhaustion from Unrotated Application Logs", "Disk Exhaustion", "docker container filling disk due to missing log rotation rules"),
        ("P99 Latency Degradation on User History Queries", "P99 Degradation", "missing index on `bookings(customer_id, created_at)` slowing user history API"),
        ("Thread Contention on Spring `@Async` Executor Pool", "Thread Contention", "exhausted async thread pool causing delayed notification delivery"),
        ("Stale JWT Token Rejection Rate Spike", "JWT Rejection Spike", "mobile clock drift causing premature JWT token expiration rejections"),
        ("Excessive Database IOPs from Un-Cached Category Fetches", "DB IOPs Spike", "high disk IOPs on Aiven database from frequent category taxonomy lookups"),
        ("CPU Throttling on Docker Container under Load", "Container Throttling", "restrictive CPU quota setting causing request queueing in Tomcat"),
        ("Un-indexed Geo-Spatial Distance Search Bottleneck", "Unindexed Geo Search", "full table scan on `provider_profiles` during location search"),
        ("Database Table Lock Contention during Daily Batch Payout", "Payout Lock Contention", "batch payout script locking entire `financial_ledger` table"),
        ("Out-Of-Memory Crash in Image Thumbnail Resizing", "OOM Crash", "large user image upload resizing consuming 512MB RAM in JVM heap"),
        ("HTTP Client Socket Timeout on External SMS Gateway", "SMS Gateway Timeout", "Twilio API latency causing Tomcat thread pool starvation"),
        ("Slow SQL Query Execution on Un-indexed Audit Logs", "Audit Log Bottleneck", "slow admin dashboard response on querying un-indexed `audit_logs`"),
        ("High Memory Allocation in Jackson DTO Deserialization", "Jackson Memory Overhead", "large JSON request payload causing high temporary memory allocation"),
        ("Database Deadlock on Simultaneous Booking Cancellations", "Cancellation Deadlock", "customer and provider cancelling same booking concurrently"),
        ("WebSocket Handshake Failure Spike under Load", "Handshake Failure", "Tomcat thread pool exhaustion rejecting new WebSocket handshakes"),
        ("Slow Redis Cache Hit Ratio on Location Data", "Low Cache Hit Ratio", "short TTL on location keys causing frequent cache misses"),
        ("HikariCP Connection Leak in Media Storage Service", "Media Service Leak", "S3 stream reading exception bypassing DB connection release"),
        ("High JVM Metaspace Memory Consumption", "Metaspace Spike", "dynamic class loading in reflection causing Metaspace growth"),
        ("Nginx Upstream Socket Timeout on Long Polling", "Nginx Timeout", "Nginx dropping long-polling HTTP connections after 60s default timeout"),
        ("Un-indexed Foreign Key Lock Escalation in MySQL", "FK Lock Escalation", "missing index on child table foreign key causing table-level lock"),
        ("Prometheus Metric Collection Scrape Timeout", "Prometheus Timeout", "slow Actuator metric scraping timing out Prometheus scrape job"),
        ("Browser CORS Preflight Pre-Flight Overhead Bottleneck", "CORS Preflight", "un-cached HTTP OPTIONS preflight requests adding 100ms latency"),
        ("Slow App Startup Latency from JPA Schema Validation", "Startup Latency", "hibernate auto-ddl validation scanning 100 entities on boot"),
        ("Un-bounded Query Result Size Returning 10,000 Rows", "Unbounded Query", "missing limit clause in provider report endpoint loading 50MB RAM"),
        ("React Web Re-rendering Cascade on Theme Switch", "Re-render Cascade", "un-memoized context provider triggering re-render of entire DOM tree"),
        ("Mobile Battery Consumption Spike during GPS Tracking", "Mobile Battery Drain", "high-frequency location pings exhausting mobile device battery"),
        ("Stripe Webhook Signature Verification Failures", "Webhook Verification Failure", "mismatched webhook secret causing 400 Bad Request error spikes"),
        ("Aiven MySQL Replica Lag on Large Batch Writes", "Replica Lag", "long batch payout insert causing 5-second read-replica lag"),
        ("Tomcat Thread Starvation on Synchronous External Calls", "Thread Starvation", "blocking REST calls depleting 200 Tomcat worker threads"),
        ("High CPU Consumption in Password Hashing (BCrypt)", "BCrypt CPU Consumption", "BCrypt strength factor 14 causing 500ms CPU freeze per login"),
        ("Database Connection Pool Warm-up Cold Start Delay", "Pool Cold Start", "initial API requests suffering latency while HikariCP creates connections")
    ]

    for title, issue, impact in incident_topics:
        cat8_items.append((
            title,
            f"How did we identify, diagnose, and resolve production incident / bottleneck `{title}`?",
            f"We identified `{title}` when Prometheus metrics showed latency spikes and log entries recorded {impact}. Diagnosis involved analyzing SLF4J MDC trace logs and thread dumps. The resolution optimized resource allocation, added defensive timeouts, and updated database indexing.",
            f"What metric served as the primary indicator of this issue?",
            f"P99 latency exceeding the 500ms SLA and elevated HTTP 5xx response rates.",
            f"How was the fix verified prior to production deployment?",
            f"Executed load testing using Apache JMeter simulating 500 concurrent virtual users.",
            f"What alert rule was added to Prometheus?",
            f"Alert fires if metric threshold exceeds normal baseline for > 2 consecutive minutes."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat8_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # CATEGORY 9: Microservices Migration Strategy & Execution (25 Questions)
    # =========================================================================
    cat9_items = [
        ("Strangler Fig Pattern Phased Migration Blueprint",
         "Explain how we planned and executed the Strangler Fig pattern to migrate our Spring Boot monolith into 8 microservices.",
         "We did not attempt a risky big-bang rewrite. Instead, we deployed an API Gateway (Spring Cloud Gateway) in front of the monolith. We extracted subdomains incrementally into standalone Spring Boot microservices in order: 1) `Notification Service` (low risk), 2) `Service Catalog Service` (read heavy), 3) `Provider Management Service`, 4) `Booking Engine Service`, 5) `Payment & Wallet Service`. The Gateway routed matching routes (`/api/v1/notifications/*`) to the new service while proxying all remaining traffic to the monolith.",
         "How did you prevent cross-service database access during migration?",
         "Enforced strict rule: microservices never query monolith DB directly; data is accessed via REST APIs or CDC event streams.",
         "What strategy was used for shared domain entities during early extraction phases?",
         "Created shared lightweight client DTO libraries while decomposing monolith DB schemas.",
         "How did you verify data consistency between monolith and new microservice?",
         "Ran dual-write execution for 2 weeks, comparing database shadow write records asynchronously."),

        ("Transactional Outbox Pattern & Debezium CDC",
         "How do we handle distributed data consistency and event publishing during database decomposition?",
         "When a service mutates local entities (e.g. `Booking Engine` creating a booking), it writes an event record to an `outbox` table within the exact same database transaction. Debezium CDC (Change Data Capture) monitors MySQL binlog, reads new outbox entries, and publishes events reliably to Apache Kafka topics without requiring distributed 2PC (Two-Phase Commit) transactions.",
         "Why avoid 2PC / XA distributed transactions?",
         "Distributed 2PC introduces high latency, blocking locks, and coordinator single points of failure across microservices.",
         "How do consumer microservices handle duplicate Kafka events?",
         "Consumers implement idempotent event handlers tracking processed `event_id` in a Redis cache.",
         "What happens if Kafka broker is temporarily down?",
         "Debezium resumes reading MySQL binlog from the last committed offset once Kafka recovers, guaranteeing at-least-once delivery.")
    ]

    migration_topics = [
        ("Phase 1 Extraction: `Notification Service` Isolation", "Notification Service", "extracting email, SMS, and Expo push dispatch into standalone service"),
        ("Phase 2 Extraction: `Service Catalog Service` Isolation", "Catalog Service", "decoupling category taxonomy read-heavy workload with Redis cache"),
        ("Phase 3 Extraction: `Provider Management Service` Isolation", "Provider Service", "extracting provider verification, availability, and PostGIS location lookup"),
        ("Phase 4 Extraction: `Booking Engine Service` Isolation", "Booking Engine", "decoupling core booking saga orchestrator into dedicated microservice"),
        ("Phase 5 Extraction: `Payment & Wallet Service` Isolation", "Payment Service", "extracting double-entry financial ledger and gateway webhooks"),
        ("Phase 6 Extraction: `User Identity Service` Isolation", "User Identity Service", "extracting user authentication, credentials, and OAuth2/OIDC provider"),
        ("Phase 7 Extraction: `Routing Engine Service` Isolation", "Routing Service", "wrapping OSRM distance calculation engine in lightweight Go/Rust service"),
        ("Phase 8 Extraction: `AI Diagnostics Service` Isolation", "AI Diagnostics Service", "extracting Gemini/OpenAI diagnostic pipeline into FastAPI/Spring service"),
        ("Spring Cloud Gateway Routing Rule Configuration", "Spring Cloud Gateway", "configuring route predicates and path rewriting filters"),
        ("Database Decomposition & Schema per Service Rule", "Database per Service", "decomposing single monolith DB into dedicated databases per microservice"),
        ("Apache Kafka Event Bus Infrastructure Setup", "Apache Kafka", "hosting Kafka cluster for asynchronous inter-service event streaming"),
        ("Debezium CDC MySQL Binlog Connector Setup", "Debezium CDC", "capturing transactional outbox mutations from MySQL binlog"),
        ("Idempotent Event Consumer Pattern with Redis", "Idempotent Consumer", "preventing duplicate event execution using Redis event ID set"),
        ("Distributed Tracing with Micrometer & Zipkin", "Distributed Tracing", "propagating W3C traceparent headers across HTTP and Kafka calls"),
        ("Backend for Frontend (BFF) Pattern for Mobile Apps", "BFF Pattern", "building dedicated API gateway aggregation layer for mobile apps"),
        ("Dual-Write Synchronization Phase Execution", "Dual-Write Phase", "writing data asynchronously to both monolith DB and microservice DB"),
        ("Zero-Downtime Database Cutover Execution", "DB Cutover", "flipping primary database traffic to new service DB without downtime"),
        ("Flyway Database Schema Migration per Service", "Flyway Migration", "running independent DB migrations for each microservice database"),
        ("Resilience4j Service-to-Service Circuit Breakers", "Service Circuit Breaker", "preventing cascading failures between microservices using Resilience4j"),
        ("Cross-Service Event Schema Registry Management", "Schema Registry", "governing Kafka event payloads using Avro / JSON Schema Registry"),
        ("Microservice Container Deployment via Kubernetes", "Kubernetes Deploy", "deploying standalone microservice pods with deployment manifests"),
        ("Canary Deployment Route Switching Strategy", "Canary Deployment", "routing 5% live traffic to new microservice before 100% cutover"),
        ("Distributed Cache Invalidation via Kafka Events", "Cache Invalidation Event", "broadcasting catalog change events to invalidate microservice caches")
    ]

    for title, service, task in migration_topics:
        cat9_items.append((
            title,
            f"How do we execute migration step `{title}` using the Strangler Fig pattern for the Taaskr platform?",
            f"Executing `{title}` involves decomposing bounded context for {service}, establishing independent database ownership, configuring Spring Cloud Gateway routes, and connecting Apache Kafka event streams for non-blocking inter-service communication.",
            f"How do we roll back `{title}` if production anomalies occur?",
            f"Update Gateway route rules instantly to redirect 100% traffic back to the monolith endpoint.",
            f"How is data consistency verified during `{title}`?",
            f"Dual-write shadow records are compared asynchronously using automated reconciliation scripts.",
            f"How is distributed tracing maintained across `{service}`?",
            f"Micrometer Tracing passes W3C `traceparent` headers across HTTP REST calls and Kafka messages."
        ))

    for title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a in cat9_items:
        all_qs.append(fmt_q(q_counter, title, main_q, main_ans, f1_q, f1_a, f2_q, f2_a, f3_q, f3_a))
        q_counter += 1

    # =========================================================================
    # KEY DIAGRAMS & FLOWS SECTION
    # =========================================================================
    diagrams_section = """
## Key Diagrams & Flows

### 1. Booking Creation & Provider Matching Saga
```
[Customer Web/App]
       |
       | 1. POST /api/v1/bookings (DTO)
       v
[BookingController] ---> (@Valid validation)
       |
       v
[BookingServiceImpl] ---------------------------------------+
       |                                                    |
       | 2. Check Availability & Calculate Price            | 3. Create Booking
       v                                                    v
[ProviderServiceImpl] <---> [OSRM Engine (Docker:5000)]   [MySQL DB: `bookings`]
       |                                                    (Status: PENDING)
       | (Find Nearest Provider < 10km)                     |
       v                                                    v
[Assign Provider] ---------------------------------> [Update Status: ASSIGNED]
       |                                                    |
       v                                                    v
[NotificationServiceImpl] ---> [Expo Push / SMS API] ---> [Provider Device]
```

---

### 2. Payment Flow & Double-Entry Financial Ledger
```
[Customer App] ---> 1. Initiate Payment ---> [PaymentController]
                                                    |
                                                    v
                                          [PaymentServiceImpl]
                                                    |
                                 2. Call Razorpay / Stripe Gateway
                                                    |
                                                    v
[Razorpay / Stripe] <--- Payment Response ----------+
        |
        | 3. Webhook: payment.captured
        v
[PaymentWebhookController]
        |
        | 4. Update Status: PAID (@Transactional)
        v
[FinancialReconciliationServiceImpl]
        |
        +---> [Insert Immutable Credit Entry in `financial_ledger`]
        +---> [Calculate 15% Platform Commission]
        +---> [Calculate 85% Provider Net Payout]
```

---

### 3. Real-Time Provider Location Tracking via WebSocket STOMP
```
[Provider Mobile App (Expo 57)]
        |
        | 1. Background Location Ping (Every 10m / 30s)
        v
[WebSocket Endpoint: /ws/provider-location]
        |
        v
[LocationWebSocketHandler]
        |
        | 2. Interpolate & Publish to STOMP Broker
        v
[STOMP Topic: /topic/booking/{bookingId}/location]
        |
        +-----------------------------------+
        |                                   |
        v                                   v
[Customer Web App (React 19)]      [Customer Mobile App (React Native)]
(Leaflet Map Marker Lerp)          (React Native MapView Marker Lerp)
```

---

### 4. Automated AI Diagnostics & Remediation Pipeline
```
[Monitored Endpoints / System Jobs]
        |
        | 1. Endpoint Failure / HTTP 5xx / High Latency (> 500ms)
        v
[HealthCheckController]
        |
        v
[AiDiagnosticServiceImpl]
        |
        | 2. Capture Stack Trace Logs & Sanitize PII/Tokens (Regex Filter)
        v
[Prompt Payload Generator]
        |
        | 3. POST JSON Payload to Gemini API (gemini-1.5-flash)
        +-----------------------------------+
        | (Failover on Timeout/Error)       |
        v                                   v
[Google Gemini API]               [OpenAI API (gpt-4o)]
        |                                   |
        +-----------------+-----------------+
                          |
                          | 4. Return Structured JSON Diagnosis
                          v
[SystemAlert Entity] ---> [MySQL: `system_alerts`] ---> [Slack / Grafana Alert]
```

---

### 5. Strangler Fig Microservices Extraction Architecture
```
                                  [API GATEWAY (Spring Cloud Gateway)]
                                                   |
                     +-----------------------------+-----------------------------+
                     | Route: /api/v1/notifications| Route: /api/v1/catalog      | Route: /api/v1/* (Fallback)
                     v                             v                             v
       [Notification Service]          [Service Catalog Service]            [TAASKR MONOLITH]
       [Database: notify_db]           [Database: catalog_db]            [Database: taaskr_db]
                 ^                               ^                                 |
                 |                               |                                 v
                 +-------------------------------+--------------------- [Debezium CDC]
                                                                                   |
                                                                                   v
                                                                          [Apache Kafka Bus]
```
"""

    doc_text = "# Taaskr Home Services Platform: InterviewReadiness Master Guide\n\n"
    doc_text += "> **Target Audience:** SDE-1 / SDE-2 Interview Candidates\n"
    doc_text += f"> **Total Questions:** {len(all_qs)} Concrete Technical Questions & Detailed Candidate Answers with Follow-ups (Zero Placeholder Hashtags).\n\n"
    doc_text += "---\n\n"
    doc_text += "".join(all_qs)
    doc_text += diagrams_section

    return doc_text, len(all_qs)

if __name__ == "__main__":
    content, total_count = generate_full_document()
    print(f"Generated {total_count} questions!")

    with open("InterviewReadiness.md", "w", encoding="utf-8") as f:
        f.write(content)
    print("Saved InterviewReadiness.md in root.")

    os.makedirs("docs", exist_ok=True)
    with open(os.path.join("docs", "InterviewReadiness.md"), "w", encoding="utf-8") as f:
        f.write(content)
    print("Saved InterviewReadiness.md in docs/.")
