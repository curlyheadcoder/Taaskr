# Database Architecture: Taaskr Home Services Platform

---

## 1. Architectural Overview

Taaskr utilizes a relational database model designed to handle transactional ACID integrity, concurrency control, and relational consistency across on-demand home service bookings, provider payouts, and real-time operations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Taaskr Backend Monolith                         │
│                  Spring Data JPA / Hibernate 6 ORM                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │ HikariCP Connection Pool (Max=5)  │
                  └─────────────────┬─────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │                                               │
┌───────────▼────────────┐                     ┌────────────▼──────────┐
│ Production Environment │                     │ Local Dev / Test Env  │
│ Aiven Managed MySQL 8  │                     │ H2 Database Engine    │
│ (SSL Required, IST TZ) │                     │ (MySQL Dialect Mode)  │
└────────────────────────┘                     └───────────────────────┘
```

* **Production Engine:** Aiven Managed MySQL 8.0 (`spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect`).
* **Development / Test Engine:** Embedded H2 File Database (`jdbc:h2:file:./data/taaskr_dev;MODE=MySQL;DB_CLOSE_DELAY=-1`).
* **Timezone Synchronization:** Explicitly locked to `Asia/Kolkata` (`spring.jpa.properties.hibernate.jdbc.time_zone=Asia/Kolkata`) to guarantee exact `LocalDate` and `LocalTime` round-trip precision for scheduled customer service slots.

---

## 2. Complete Database Schema Topology (23 Tables)

The database schema is organized into 6 functional domain clusters:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA CLUSTERS                        │
├──────────────────┬─────────────────┬───────────────────┬──────────────────┤
│ IAM & Users      │ Service Catalog │ Booking Lifecycle │ Financials       │
├──────────────────┼─────────────────┼───────────────────┼──────────────────┤
│ users            │ service_cats    │ bookings          │ payments         │
│ addresses        │ services        │ avail_slots       │ payouts          │
│ device_tokens    │ vehicles        │ idempotency_recs  │ wallet_txns      │
│                  │ vehicle_rules   │ reviews           │                  │
│                  │ user_favorites  │ disputes          │                  │
├──────────────────┴─────────────────┴───────────────────┴──────────────────┤
│ Provider Management                │ Observability Platform               │
├────────────────────────────────────┼──────────────────────────────────────┤
│ provider_profiles, provider_cats,  │ monitored_endpoints                  │
│ provider_services, kyc_documents,  │ health_check_results                 │
│ partner_discussions, messages      │ system_alerts                        │
└────────────────────────────────────┴──────────────────────────────────────┘
```

### Table Inventory & Entity Ownership Map

| Table Name | Entity Class | Primary Key | Foreign Key References | Indexing Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `User.java` | `id` (BIGINT) | None | Unique Index on `email`, `phone` |
| `addresses` | `Address.java` | `id` (BIGINT) | `user_id` ➔ `users(id)` | Index on `user_id` |
| `device_push_tokens` | `DevicePushToken.java` | `id` (BIGINT) | `user_id` ➔ `users(id)` | Unique Index on `push_token` |
| `service_categories` | `ServiceCategory.java` | `id` (BIGINT) | None | Unique Index on `name` |
| `services` | `Service.java` | `id` (BIGINT) | `category_id` ➔ `service_categories(id)` | Composite Index on `category_id, active` |
| `vehicles` | `Vehicle.java` | `id` (BIGINT) | `user_id` ➔ `users(id)` | Index on `user_id` |
| `vehicle_pricing_rules` | `VehiclePricingRule.java` | `id` (BIGINT) | `category_id` ➔ `service_categories(id)` | Unique Index on `category_id, vehicle_type` |
| `user_favorite_services` | `UserFavoriteService.java` | `id` (BIGINT) | `user_id`, `service_id` | Unique Composite Index on `user_id, service_id` |
| `provider_profiles` | `ProviderProfile.java` | `id` (BIGINT) | `user_id` ➔ `users(id)` | Unique Index on `user_id` |
| `provider_categories` | `ProviderCategory.java` | `id` (BIGINT) | `provider_id`, `category_id` | Composite Index on `provider_id, category_id` |
| `provider_services` | `ProviderService.java` | `id` (BIGINT) | `provider_id`, `service_id` | Composite Index on `provider_id, service_id` |
| `kyc_documents` | `KycDocument.java` | `id` (BIGINT) | `provider_id` ➔ `provider_profiles(id)` | Index on `provider_id, status` |
| `bookings` | `Booking.java` | `id` (BIGINT) | `user_id`, `service_id`, `provider_id` | Indexes on `user_id, status`, `provider_id, status`, `bookingCode` |
| `availability_slots` | `AvailabilitySlot.java` | `id` (BIGINT) | `provider_id` ➔ `provider_profiles(id)` | Composite Index on `provider_id, date` |
| `idempotency_records` | `IdempotencyRecord.java` | `id` (BIGINT) | `user_id` ➔ `users(id)` | Unique Index on `idempotency_key` |
| `payments` | `Payment.java` | `id` (BIGINT) | `booking_id` ➔ `bookings(id)` | Unique Index on `razorpay_order_id` |
| `payouts` | `Payout.java` | `id` (BIGINT) | `provider_id` ➔ `provider_profiles(id)` | Composite Index on `provider_id, status` |
| `wallet_transactions` | `WalletTransaction.java` | `id` (BIGINT) | `user_id` ➔ `users(id)` | Index on `user_id, created_at` |
| `reviews` | `Review.java` | `id` (BIGINT) | `booking_id`, `user_id`, `provider_id` | Unique Index on `booking_id` |
| `disputes` | `Dispute.java` | `id` (BIGINT) | `booking_id` ➔ `bookings(id)` | Index on `booking_id, status` |
| `partner_discussions` | `PartnerDiscussion.java` | `id` (BIGINT) | `author_id` ➔ `users(id)` | Index on `created_at` |
| `discussion_messages` | `DiscussionMessage.java` | `id` (BIGINT) | `discussion_id`, `sender_id` | Index on `discussion_id, created_at` |
| `monitored_endpoints` | `MonitoredEndpoint.java` | `id` (BIGINT) | None | Unique Index on `url_path, http_method` |

---

## 3. Concurrency Control & Database Locking Strategies

To prevent race conditions during high-volume booking updates and financial reconciliation, Taaskr implements a dual-locking architecture:

```
                          DATABASE CONCURRENCY CONTROL
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
   JPA OPTIMISTIC LOCKING                          PESSIMISTIC WRITE LOCKING
  (@Version Column Check)                         (SELECT ... FOR UPDATE)
  - Booking status transitions                     - Wallet balance credits/debits
  - Provider profile updates                       - Provider payout reconciliation
  - Wallet balance mutations                       - Financial batch processing
```

### 1. Optimistic Locking (@Version)
High-frequency entities (`Booking.java`, `ProviderProfile.java`, `WalletTransaction.java`) enforce optimistic concurrency checks via an explicit `@Version private Long version = 0L;` column. If two threads attempt concurrent status updates, Hibernate throws `ObjectOptimisticLockingFailureException`, preventing lost updates.

### 2. Pessimistic Write Locking (`FOR UPDATE`)
Financial reconciliation in `PayoutServiceImpl` uses raw SQL pessimistic locks to serialize concurrent wallet balance mutations:
```java
// Pessimistic Write Lock in ProviderProfileRepository.java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM ProviderProfile p WHERE p.id = :providerId")
Optional<ProviderProfile> findByIdForUpdate(@Param("providerId") Long providerId);
```

---

## 4. Schema Migration & Master Data Seeding

Database migrations and data population are executed programmatically during Spring Boot application startup via ordered runners:

```
Spring Boot Startup
 ├── Order(1): DatabaseSchemaMigrationRunner.java  (DDL Migration Execution)
 └── Order(2): DataSeeder.java                     (Catalog & Demo Data Seeding)
```

1. **`DatabaseSchemaMigrationRunner.java` (Order 1):** Executes idempotent DDL SQL (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) via Spring `JdbcTemplate` to harmonize database tables across deployment environments.
2. **`DataSeeder.java` (Order 2):** Controlled by property `@ConditionalOnProperty(name = "app.seed.demo-data", havingValue = "true")`. Populates the 11 core categories (*Civil & Property Maintenance*, *Vehicle Care*, *Appliances & Electrical*, *Pest Control*, etc.), sub-service items, initial provider accounts, and default pricing rules.

---

## 5. Microservices Database Decomposition Plan

When decomposing the monolith into microservices, the shared MySQL instance will be split into **Database-per-Service** databases:

```
Target Database-per-Service Topology
├── iam_db             (users, addresses)
├── catalog_db         (service_categories, services, vehicles, vehicle_pricing_rules)
├── booking_db         (bookings, availability_slots, idempotency_records, reviews, disputes)
├── payment_db         (payments, payouts, wallet_transactions)
├── notification_db    (device_push_tokens)
├── provider_db        (provider_profiles, provider_categories, provider_services, kyc_documents)
└── observability_db   (monitored_endpoints, health_check_results, system_alerts)
```

To maintain atomic updates without distributed 2PC transactions, extracted services will implement the **Transactional Outbox Pattern** alongside **Debezium Change Data Capture (CDC)** to stream database updates to RabbitMQ topics.
