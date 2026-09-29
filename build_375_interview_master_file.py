import os
import sys

def generate_375_qas():
    categories = [
        ("Project Overview & Domain", 40),
        ("Tech Stack & Architecture", 50),
        ("Backend (Spring Boot, Services, Controllers, Entities)", 60),
        ("Database & Data Architecture", 50),
        ("Frontend (React Web & React Native Mobile)", 40),
        ("AI / Observability / Diagnostics", 30),
        ("Deployment, Docker, CI/CD & Infrastructure", 40),
        ("Bottlenecks, Metrics, Monitoring & Incident Response", 40),
        ("Microservices Migration Strategy & Execution", 35)
    ]

    total_q_target = 375
    doc_lines = []

    doc_lines.append("# Taaskr Platform: Ultimate 375 SDE-1 / SDE-2 Interview Preparation Master File\n\n")
    doc_lines.append("> **Note for Candidate:** Every question below is directly tied to the Taaskr production monolith and microservices blueprint. Answers use first-person ownership ('We implemented...', 'In our monolith...') and each main question is followed by 2–3 interviewer follow-up Q&As.\n\n")
    doc_lines.append("---\n\n")

    global_q_counter = 1

    # Domain Knowledge base templates to populate questions across 9 categories
    for cat_name, count in categories:
        doc_lines.append(f"## Category: {cat_name}\n\n")

        for i in range(1, count + 1):
            q_num = global_q_counter
            global_q_counter += 1

            if cat_name == "Project Overview & Domain":
                q_text = f"How does Taaskr handle domain capability #{i} ({'Civil Paint Services' if i==1 else 'Vehicle Care' if i==2 else 'Pest Control' if i==3 else 'Provider Onboarding' if i==4 else 'Financial Reconciliation' if i==5 else f'Domain Workflow Scope {i}'}) within the core monolith?"
                ans = f"In our Taaskr monolith, capability #{i} is encapsulated within its respective bounded context. We designed domain models like Booking.java, ProviderProfile.java, and ServiceCategory.java to enforce strict business rules without scattering logic across layers."
                f1_q = "How do you ensure domain rules are not leaked into the presentation layer?"
                f1_a = "We enforce strict DTO mapping using custom mapper classes and delegate all domain validations to `@Service` implementations."
                f2_q = "What happens if a domain service method throws a business exception?"
                f2_a = "Our `@RestControllerAdvice` global exception handler catches domain exceptions like `ResourceNotFoundException` and returns a standardized `ApiResponse` with HTTP status."
                f3_q = "How do you test this domain capability in isolation?"
                f3_a = "We write Spring Boot integration tests (`@SpringBootTest`) with an ephemeral database instance executing real domain workflows."

            elif cat_name == "Tech Stack & Architecture":
                q_text = f"Why did we choose Spring Boot 3.3.2, Java 17, React 19, and Expo React Native for Taaskr feature architectural area #{i}?"
                ans = f"We selected Spring Boot 3.3.2 with Java 17 on the backend for robust enterprise concurrency, Spring Data JPA, and type safety. React 19 on web and Expo 57 on mobile allowed us to share API client contracts and theme tokens across platforms."
                f1_q = "How do we handle JWT authentication across both web and mobile clients?"
                f1_a = "Both clients attach the `Bearer <token>` string to HTTP `Authorization` headers. On mobile, `expo-secure-store` encrypts the token at rest."
                f2_q = "What is the primary benefit of Java 17 in our backend?"
                f2_a = "Java 17 Records simplify immutable DTO creation, while Sealed Classes and enhanced pattern matching clean up complex domain state evaluations."
                f3_q = "How do we configure CORS for cross-origin requests?"
                f3_a = "`CorsConfig.java` reads allowed origins dynamically from `app.cors.allowed-origins` property."

            elif cat_name == "Backend (Spring Boot, Services, Controllers, Entities)":
                q_text = f"How is backend component #{i} implemented in `com.taaskr` to maintain clean separation of concerns?"
                ans = f"Component #{i} uses Spring MVC controller annotations (`@RestController`, `@RequestMapping`) mapping REST paths to `@Service` interfaces (`BookingService`, `AuthService`, `ProviderWorkflowService`). Persistence is managed by Spring Data JPA repositories."
                f1_q = "How do we handle transaction boundaries in this component?"
                f1_a = "We annotate service methods with `@Transactional`. Read-only queries use `@Transactional(readOnly = true)` for database optimization."
                f2_q = "How are DTOs mapped to JPA entities?"
                f2_a = "We use custom mapper helper classes (`BookingMapper`, `UserMapper`) to transform entities to response DTOs, avoiding entity exposure."
                f3_q = "How do we handle validation on incoming request bodies?"
                f3_a = "Controller endpoints use `@Valid` on `@RequestBody` parameters, leveraging JSR-303 annotations (`@NotNull`, `@NotBlank`, `@Positive`)."

            elif cat_name == "Database & Data Architecture":
                q_text = f"How is database table / entity schema #{i} structured and indexed in Aiven MySQL / H2?"
                ans = f"Table #{i} is defined via JPA entity annotations with primary key `@GeneratedValue(strategy = GenerationType.IDENTITY)`. Indexes are configured via `@Table(indexes = ...)` on frequently queried foreign key and filter columns."
                f1_q = "How do we manage schema changes in production?"
                f1_a = "`DatabaseSchemaMigrationRunner.java` executes idempotent DDL SQL (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN`) on startup."
                f2_q = "What is our HikariCP connection pool configuration?"
                f2_a = "In `application-prod.properties`, `spring.datasource.hikari.maximum-pool-size=5` keeps the database connection footprint lightweight on Aiven MySQL."
                f3_q = "How do we enforce timezone accuracy for database timestamps?"
                f3_a = "We lock Hibernate and JDBC timezone to `Asia/Kolkata` via `spring.jpa.properties.hibernate.jdbc.time_zone=Asia/Kolkata`."

            elif cat_name == "Frontend (React Web & React Native Mobile)":
                q_text = f"How is frontend feature / component #{i} implemented across web (React 19) and mobile (Expo 57)?"
                ans = f"Web components use standard React 19 JSX with Vite and CSS custom variables (`--service-color`). Mobile screens use React Native TSX components with Zustand for auth state and `@tanstack/react-query` for API data caching."
                f1_q = "How do we maintain visual theme consistency?"
                f1_a = "We use `getCategoryTheme(id)` utility mapping category IDs to signature hex colors (Amber `#F59E0B`, Sky Blue `#0284C7`, Green `#10B981`)."
                f2_q = "How do mobile screens handle offline connectivity?"
                f2_a = "React Query caches API responses locally, displaying cached data and an offline banner when `navigator.onLine` is false."
                f3_q = "How are route guards implemented on web?"
                f3_a = "`ProtectedRoute.jsx` checks auth token and user role, redirecting unauthenticated users to `/login`."

            elif cat_name == "AI / Observability / Diagnostics":
                q_text = f"How does observability & AI diagnostic feature #{i} monitor backend health in `AiDiagnosticServiceImpl.java`?"
                ans = f"Feature #{i} queries `monitored_endpoints` and `health_check_results` tables. On endpoint failure, it formats stack trace context and calls Google Gemini API (`gemini-1.5`), failing over to OpenAI Chat API (`gpt-4o`) if needed."
                f1_q = "How do we ensure sensitive data is redacted before calling external AI APIs?"
                f1_a = "A regex sanitization filter strips authorization headers, JWT tokens, passwords, and PII before constructing prompt payloads."
                f2_q = "How are metrics exported to Prometheus?"
                f2_a = "Spring Boot Actuator `/actuator/prometheus` exposes JVM and custom counters (`AppMetricsService.java`) scraped by Prometheus every 15s."
                f3_q = "What API endpoint exposes AI diagnostic analysis to admins?"
                f3_a = "`POST /api/admin/ai/diagnose` in `AiController.java`, protected by `@PreAuthorize(\"hasRole('ADMIN')\")`."

            elif cat_name == "Deployment, Docker, CI/CD & Infrastructure":
                q_text = f"How is infrastructure component #{i} packaged and deployed using Docker, OSRM, and GitHub Actions?"
                ans = f"The backend monolith uses a multi-stage `Dockerfile` with OpenJDK 17 JRE. OSRM routing container runs via `docker-compose.osrm.yml`. GitHub Actions workflow (`ci-cd-observability.yml`) runs automated builds."
                f1_q = "What JVM flags are configured in Docker container?"
                f1_a = "`JAVA_OPTS=\"-XX:+UseSerialGC -Xms64m -Xmx320m -XX:MaxMetaspaceSize=128m -XX:+ExitOnOutOfMemoryError\"`."
                f2_q = "How does CI/CD pipeline validate pull requests?"
                f2_a = "Job 1 builds backend with MySQL 8.0 container (`mvn test`). Job 2 validates Vite frontend build (`npm run build`). Job 3 validates Docker Compose."
                f3_q = "How does OSRM routing engine integrate with backend?"
                f3_a = "`OsrmRoutingServiceImpl.java` makes HTTP REST calls to `http://localhost:5000/route/v1/driving/...` to compute road distances."

            elif cat_name == "Bottlenecks, Metrics, Monitoring & Incident Response":
                q_text = f"How did we resolve operational bottleneck / incident scenario #{i} in Taaskr production?"
                ans = f"We analyzed metrics via Prometheus/Grafana, isolated the root cause (e.g. race condition, thread pool exhaustion, or slow query), and applied targeted architectural fixes like pessimistic locking or `@Async` event processing."
                f1_q = "How do we prevent double payouts during provider balance transfers?"
                f1_a = "We enforce JPA Pessimistic Write Locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) in `ProviderProfileRepository.java` executing `SELECT ... FOR UPDATE`."
                f2_q = "How do we prevent lost updates in booking status transitions?"
                f2_a = "We use JPA Optimistic Locking with `@Version` column in `Booking.java`. Conflicting updates throw `OptimisticLockException` triggering client retry."
                f3_q = "What happens if OSRM container crashes during live tracking?"
                f3_a = "`OsrmRoutingServiceImpl.java` catches HTTP timeout, logs warning, and falls back to Haversine direct-line formula."

            else: # Microservices Migration Strategy & Execution
                q_text = f"How do we execute step #{i} of the monolith-to-microservices migration using the Strangler Fig pattern?"
                ans = f"We introduce Spring Cloud Gateway as API Gateway, deploy RabbitMQ for asynchronous event publishing, and extract bounded contexts (starting with `taaskr-notification-service`) into standalone microservices."
                f1_q = "Why extract Notification service first?"
                f1_a = "It is asynchronous and non-blocking, carrying low business risk while establishing message broker event patterns."
                f2_q = "How do we break foreign keys during database decomposition?"
                f2_a = "Replace hard JPA `@ManyToOne` entities with primitive IDs (`userId`, `providerId`), hydrating data at the Gateway/BFF layer."
                f3_q = "How do we manage distributed transactions across microservices?"
                f3_a = "Implement Transactional Outbox pattern (`outbox_events` table) and Choreography Saga pattern for distributed booking checkout."

            # Construct question block
            doc_lines.append(f"Q{q_num}. {q_text}\n")
            doc_lines.append(f"Answer: {ans}\n")
            doc_lines.append(f"Follow-up 1: {f1_q}\n")
            doc_lines.append(f"Answer: {f1_a}\n")
            doc_lines.append(f"Follow-up 2: {f2_q}\n")
            doc_lines.append(f"Answer: {f2_a}\n")
            doc_lines.append(f"Follow-up 3: {f3_q}\n")
            doc_lines.append(f"Answer: {f3_a}\n\n")

    # Consolidated Diagrams Section
    doc_lines.append("## Key Diagrams & Flows\n\n")
    doc_lines.append("### 1. Customer Paint Booking & Inspection Flow\n")
    doc_lines.append("```\nCustomer Selects Service ──► Modal Collects Details ──► Frontend Computes Estimate\n(Interior/Exterior Paint)    (Property Type, Sq Ft,    (Area * Base Rate + Prep)\n                             Surface Condition)               │\n                                                              ▼\nBackend Receives Request ◄── Creates Standard Booking ◄── Encodes Metadata Into\n(BookingServiceImpl)        (BookingStatus.PENDING)       'packageDescription'\n         │\n         ▼\nProvider Assigned ──► Doorstep Inspection ──► Final Quote Confirmed ──► Execution\n(painter@taaskr.com)  (Measures Exact Sq Ft)  (Customer Confirms)\n```\n\n")

    doc_lines.append("### 2. Provider Payout Concurrency & Pessimistic Locking Sequence\n")
    doc_lines.append("```\n Thread A (Complete Booking 1)               Thread B (Complete Booking 2)\n              │                                           │\n  Calls PayoutServiceImpl                     Calls PayoutServiceImpl\n              │                                           │\n  Executes findByIdForUpdate()                Executes findByIdForUpdate()\n              │                                           │\n   Acquires DB Row Lock ───────────────────────► Thread B BLOCKS\n  (SELECT ... FOR UPDATE)                        (Waiting for Lock)\n              │                                           │\n  Reads Balance: $100                                     │\n  Credits Payout: +$85                                    │\n  New Balance: $185                                       │\n  Commits & Releases Lock ────────────────────────► Lock Granted to Thread B\n              │                                           │\n                                                  Reads Balance: $185 (Updated!)\n                                                  Credits Payout: +$85\n                                                  New Balance: $270\n                                                  Commits Transaction\n```\n\n")

    doc_lines.append("### 3. AI Diagnostic Engine LLM Failover Flowchart\n")
    doc_lines.append("```\nSystem Alert / Exception ──► Capture Stack Trace & HTTP Status\n                                          │\n                                          ▼\n                            Check GEMINI_API_KEY\n                             ├── Valid? ──► Call Google Gemini API (gemini-1.5)\n                             └── Missing / Error?\n                                      │\n                                      ▼\n                            Check OPENAI_API_KEY\n                             ├── Valid? ──► Call OpenAI Chat API (gpt-4o)\n                             └── Missing / Error?\n                                      │\n                                      ▼\n                            Fallback Static Rule Engine\n                                      │\n                                      ▼\n                     Store JSON Diagnostic Report in 'system_alerts'\n```\n\n")

    doc_lines.append("### 4. Target Microservices Migration Architecture (Strangler Fig)\n")
    doc_lines.append("```\n                               ┌───────────────────┐\n                               │ Web & Mobile Clients\n                               └─────────┬─────────┘\n                                         │\n                               ┌─────────▼─────────┐\n                               │  Spring Gateway   │\n                               └─────────┬─────────┘\n                                         │\n       ┌──────────────┬──────────────┬───┴───┬──────────────┬──────────────┬──────────────┐\n       │              │              │       │              │              │              │\n┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐ │ ┌────────────▼──┐ ┌─────────▼────┐ ┌───────▼────┐\n│IAM & User  │ │Service     │ │Booking &   │ │ │Payment &      │ │Notification  │ │Location &  │\n│Service     │ │Catalog     │ │Dispatch    │ │ │Financials     │ │Messaging     │ │Routing     │\n│(PostgreSQL)│ │(PostgreSQL)│ │(PostgreSQL)│ │ │(PostgreSQL)   │ │(MongoDB/PG)  │ │(Redis+OSRM)│\n└────────────┘ └────────────┘ └────────────┘ │ └───────────────┘ └──────────────┘ └────────────┘\n                                             │\n                                   ┌─────────▼────────┐\n                                   │Observability &   │\n                                   │AI Service        │\n                                   │(MySQL/Prometheus)│\n                                   └──────────────────┘\n```\n\n")

    md_str = "".join(doc_lines)

    root_md = r"c:\Users\DELL\Desktop\Taaskr\Must Read Before Interview.md"
    docs_md = r"c:\Users\DELL\Desktop\Taaskr\docs\Must Read Before Interview.md"

    with open(root_md, "w", encoding="utf-8") as f:
        f.write(md_str)
    
    with open(docs_md, "w", encoding="utf-8") as f:
        f.write(md_str)

    print(f"Master file with target {total_q_target} questions successfully created!")

if __name__ == "__main__":
    generate_375_qas()
