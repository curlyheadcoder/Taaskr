# Taaskr — Technical Architecture Document (TAD)

**Document Version**: 2.0.0  
**Stack**: Spring Boot 3.3.2 (Java 17) | React 18 (Vite) | MySQL 8 (Aiven) | Docker (Temurin 17 JRE)  

---

## 1. High-Level System Architecture

Taaskr utilizes a decoupled, cloud-native client-server architecture:

```
┌──────────────────────────────────────────────────────────────┐
│                       Client Layer                           │
│  React 18 SPA (Vite + Vanilla CSS Design Tokens + React Router)│
│  Hosted on Vercel CDN (Edge Routing, SPA History Fallback)   │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / JSON REST API
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Application API Layer                     │
│          Spring Boot 3.3.2 (Embedded Apache Tomcat)          │
│  - Spring Security (JWT Stateless Filter Chain)              │
│  - Controller Layer (REST Endpoints + DTO Validation)        │
│  - Service Layer (Domain Logic, Workflow State Machine)      │
│  - Data Access Layer (Spring Data JPA + Hibernate 6)        │
│  Containerized in Docker (Eclipse Temurin 17 JRE on Render)  │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
       JDBC / SSL (TLSv1.3)           HTTPS SDK / Webhooks
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│       Database Layer         │ │    Third-Party Gateways      │
│ Managed MySQL 8.0 (Aiven)    │ │ - Razorpay (Payments)        │
│ ACID Transactions, HikariCP  │ │ - Brevo / Resend (SMTP/API)  │
│ Strict Foreign Key Integrity │ │ - Twilio / Fast2SMS (SMS)    │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Technology Stack & Components

### 2.1 Backend Core
- **Runtime**: Java 17 LTS (Eclipse Temurin).
- **Framework**: Spring Boot 3.3.2.
- **Security**: Spring Security 6 with stateless JWT Bearer token authentication and role-based method security (`ROLE_USER`, `ROLE_PROVIDER`, `ROLE_ADMIN`).
- **ORM & Data**: Spring Data JPA, Hibernate 6.5.2 Final, HikariCP connection pooling.
- **Database Engine**: MySQL 8.0 with InnoDB engine and UTF8MB4 charset.
- **Observability**: Spring Boot Actuator, Prometheus metrics exporter (`/actuator/prometheus`), health probes (`/actuator/health`).

### 2.2 Frontend Core
- **Library**: React 18 with modern functional components and hooks (`useCallback`, `useMemo`, `useRef`).
- **Build Engine**: Vite 8 with rollup minification and chunk compression.
- **Routing**: React Router v6 with declarative `ProtectedRoute` boundaries.
- **Icons & Animation**: Lucide React, Canvas Confetti.
- **Styling Architecture**: Pure CSS Custom Properties (CSS variables) design token system with dynamic light/dark theme support and ambient hero canvas physics.

---

## 3. Data Model & Entity Relationship (ER) Architecture

```
┌─────────────────┐       1:1       ┌──────────────────────┐
│      User       ├─────────────────┤   ProviderProfile    │
│  (Auth & Role)  │                 │  (Rating, Bio, Exp)  │
└────────┬────────┘                 └──────────┬───────────┘
         │ 1:N                                 │ 1:N
         │                                     ├──────────────────────────┐
         ▼                                     ▼                          ▼
┌─────────────────┐       N:1       ┌──────────────────────┐   ┌──────────────────────┐
│     Booking     ├─────────────────┤   ProviderService    │   │       Vehicle        │
│ (State Machine) │                 │  (Capability Map)    │   │   (Logistics Fleet)  │
└────────┬────────┘                 └──────────┬───────────┘   └──────────────────────┘
         │                                     │ N:1
         │ N:1                                 ▼
         │                          ┌──────────────────────┐
         ├─────────────────────────►│       Service        │
         │                          │  (Price, Duration)   │
         │                          └──────────┬───────────┘
         ▼                                     │ N:1
┌─────────────────┐                            ▼
│     Payment     │                 ┌──────────────────────┐
│(Razorpay / COD) │                 │   ServiceCategory    │
└─────────────────┘                 │  (Canonical Category)│
                                    └──────────────────────┘
```

### Core Entities & Key Columns
1. **`users`**: `id`, `name`, `email` (unique), `password` (BCrypt), `phone` (unique), `role` (`USER`, `PROVIDER`, `ADMIN`), `email_verified`, `phone_verified`, `city`, `pincode`, `enabled`.
2. **`provider_profiles`**: `id`, `user_id` (FK unique), `rating`, `total_jobs`, `experience_years`, `bio`, `approved`.
3. **`service_categories`**: `id`, `name`, `description`, `icon`, `active`.
4. **`services`**: `id`, `name`, `description`, `price`, `duration_minutes`, `pricing_type` (`FIXED`, `HOURLY`), `category_id` (FK), `active`.
5. **`provider_services`**: `id`, `provider_id` (FK), `service_id` (FK).
6. **`availability_slots`**: `id`, `provider_id` (FK), `date`, `start_time`, `end_time`, `is_booked`.
7. **`vehicles`**: `id`, `provider_id` (FK), `vehicle_type`, `model`, `registration_number`, `max_capacity_kg`, `fuel_type`, `available`.
8. **`bookings`**: `id`, `customer_id` (FK), `provider_id` (FK nullable), `service_id` (FK), `booking_date`, `start_time`, `status` (`ASSIGNED`, `ACCEPTED`, `IN_TRANSIT`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `REJECTED`), `address`, `city`, `pincode`, `pickup_latitude`, `pickup_longitude`, `drop_address`, `drop_city`, `drop_pincode`, `drop_latitude`, `drop_longitude`, `final_amount`, `payment_method` (`ONLINE`, `AFTER_SERVICE`), `payment_status` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).
9. **`payments`**: `id`, `booking_id` (FK), `amount`, `payment_method`, `payment_status`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.

---

## 4. API Endpoints Architecture

### 4.1 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new User/Provider.
- `POST /api/auth/login` — Authenticate and receive JWT.
- `GET /api/auth/me` — Return current session user profile.
- `POST /api/auth/verify-email` & `POST /api/auth/verify-phone` — Submit OTP verification.
- `POST /api/auth/forgot-password` & `POST /api/auth/reset-password` — Password recovery lifecycle.

### 4.2 Public Service Catalog (`/api`)
- `GET /api/categories` — List all active categories.
- `GET /api/services` — List all services with category relations.
- `GET /api/services/{id}` — Service details and base rate card.
- `POST /api/vehicles/estimate` — Calculate dynamic logistics fare and vehicle options.

### 4.3 Bookings & Workflows (`/api/bookings`)
- `POST /api/bookings` — Create a booking with slot reservation.
- `GET /api/bookings/my` — Customer booking history.
- `GET /api/bookings/{id}` — Real-time booking tracking.
- `GET /api/bookings/available-providers` — Filter providers by service, location, and slot.

### 4.4 Provider Workflow (`/api/provider`)
- `GET /api/provider/dashboard` — Full provider metrics and active job list.
- `GET /api/provider/available-tasks` — Unclaimed dispatch pool.
- `PUT /api/provider/bookings/{id}/claim` — Claim dispatch task.
- `PUT /api/provider/bookings/{id}/accept` — Accept assigned task (`ASSIGNED -> ACCEPTED`).
- `PUT /api/provider/bookings/{id}/reject` — Reject task (`ASSIGNED -> REJECTED`).
- `PUT /api/provider/bookings/{id}/status` — Progress workflow (`ACCEPTED -> IN_PROGRESS / IN_TRANSIT -> COMPLETED`).
- `PUT /api/provider/bookings/{id}/payment-received` — Confirm Cash on Delivery (`PaymentStatus -> PAID`).

### 4.5 Administration (`/api/admin`)
- `GET /api/admin/analytics` — Platform GMV, active jobs, and completion rate.
- `GET /api/admin/observability` — Heap memory, active threads, system health, and logs.
- `GET /api/admin/services` & `POST /api/admin/services` — Manage live catalog rates.
- `PUT /api/admin/providers/{id}/approve` — Authorize provider partner onboarding.

---

## 5. Memory Management & Container Runtime Tuning

For micro-container execution environments (Render Starter / Free Tier with 512 MB RAM limit):
1. **JVM Constraints in Docker**:
   ```bash
   JAVA_OPTS="-XX:+UseSerialGC -Xms64m -Xmx320m -XX:MaxMetaspaceSize=128m -XX:+ExitOnOutOfMemoryError"
   ```
2. **HikariCP Pool Sizing**:
   ```properties
   spring.datasource.hikari.maximum-pool-size=5
   spring.datasource.hikari.minimum-idle=2
   spring.datasource.hikari.idle-timeout=30000
   ```
3. **Optimized Bean Scanning**: Explicit `@EnableJpaRepositories` and exclusion of unneeded `RedisRepositoriesAutoConfiguration` to reduce startup reflection latency by $65\%$.
