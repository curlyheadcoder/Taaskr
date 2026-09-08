# Taaskr — Production Modernization & Feature Tracker

**Document Version**: 1.0.0  
**Target Milestone**: Production Launch Readiness  
**Architecture Guardrail**: Zero regressions on existing bookings, payments, auth, catalog, logistics, and dispatch workflows.

---

## 1. Overview & Execution Principles

This tracking document outlines the full roadmap to transition Taaskr from a working application into a production-grade service marketplace.

### Non-Negotiable Engineering Principles:
1. **Zero Downtime / Zero Functional Regression**: Every change must preserve existing core capabilities (Auth, Catalog, Auto-Dispatch, Bookings, Cash/Razorpay Payments, Provider Actions, Vehicle Logistics).
2. **True Database Persistence**: No mock/ephemeral state for user data. Everything flows through validated DTOs, service layer transactions, and MySQL tables.
3. **Defense-in-Depth Security**: Strict role checks (`ROLE_USER`, `ROLE_PROVIDER`, `ROLE_ADMIN`), rate limiting on public endpoints, sanitized inputs, and zero committed secrets.
4. **Incremental Migration**: Execute in prioritized phases ($P0 \to P1 \to P2 \to P3$), running automated verification tests at the end of each step.

---

## 2. Priority Phase Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MODERNIZATION ROADMAP                           │
├─────────┬──────────────────────────────────────────────┬───────────────┤
│ Tier    │ Scope & Objective                            │ Complexity    │
├─────────┼──────────────────────────────────────────────┼───────────────┤
│ 🚨 P0   │ Critical Security, Secret Hygiene & Flyway   │ Medium        │
│ 🚀 P1   │ Core Production Entities & Persistence Gaps  │ Large         │
│ ⚡ P2   │ Performance, Pagination, Redis & Telemetry   │ Medium        │
│ 🌟 P3   │ Real-time WebSockets & KYC Documents         │ Large         │
└─────────┴──────────────────────────────────────────────┴───────────────┘
```

---

## 3. Detailed Feature Tickets & Acceptance Criteria

### Phase 0: Security Hardening, Secret Hygiene & Database Versioning (P0)

#### [TSK-MOD-001] Secret Sanitization & Environment Hygiene
- **Priority**: P0 (Critical) | **Status**: `COMPLETED` ✅
- **Scope**: Backend Config (`application-local.properties`, `application-prod.properties`)
- **Description**: Remove plaintext Gmail App password from `application-local.properties`. Ensure all secrets (`JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `MAIL_PASSWORD`, `FAST2SMS_API_KEY`) default strictly to environment variables.
- **Acceptance Criteria**:
  1. No hardcoded passwords or API keys exist anywhere in the repository. (Verified)
  2. Local environment falls back to simulated email if SMTP credentials are not provided in environment variables. (Verified)

#### [TSK-MOD-002] Public Test Relay Endpoint Removal / Lockdown
- **Priority**: P0 (Critical) | **Status**: `COMPLETED` ✅
- **Scope**: `AuthController.java`, `SecurityConfig.java`
- **Description**: Secure or remove unauthenticated endpoints `GET /api/auth/test-email` and `GET /api/auth/test-sms`.
- **Acceptance Criteria**:
  1. Test endpoints are restricted strictly to `ROLE_ADMIN` (`@PreAuthorize("hasRole('ADMIN')")`). (Verified)
  2. Unauthenticated callers receive `401 Unauthorized` or `404 Not Found`. (Verified)

#### [TSK-MOD-003] AI Endpoint Protection & Rate Limiting
- **Priority**: P0 (Critical) | **Status**: `COMPLETED` ✅
- **Scope**: `AiController.java`, `SecurityConfig.java`, `AiRateLimitingFilter.java`
- **Description**: Prevent API abuse and quota exhaustion on `/api/ai/chat` and `/api/ai/diagnose`.
- **Acceptance Criteria**:
  1. `/api/ai/**` guarded by in-memory token bucket sliding window rate limiting (20 requests/minute per client IP). (Verified)
  2. Requests exceeding rate limits receive `429 Too Many Requests`. (Verified)

#### [TSK-MOD-004] Database Schema Integrity & Entity Validation Baseline
- **Priority**: P0 (Critical) | **Status**: `COMPLETED` ✅
- **Scope**: Entity models, indexing, relationship constraints
- **Description**: Establish comprehensive schema entities with database constraints, indices, foreign keys, and DTO validations.
- **Acceptance Criteria**:
  1. Complete entity models created for `Review`, `Notification`, `Address`, `Payout`, `WalletTransaction`, `Dispute`. (Verified)
  2. Spring Boot application starts cleanly and runs test suite without DDL/DML failures. (Verified)

#### [TSK-MOD-005] Frontend Auth Storage Key Normalization
- **Priority**: P0 (High) | **Status**: `COMPLETED` ✅
- **Scope**: `Home.jsx`, `ServiceDetails.jsx`, `api.js`
- **Description**: Standardize `localStorage` user key to `taaskr_current_user` across all pages to prevent session sync bugs on home page navigation.
- **Acceptance Criteria**:
  1. `Home.jsx` and `ServiceDetails.jsx` read `taaskr_current_user`. (Verified)
  2. Logging in immediately reflects authenticated state on the Home page without requiring a page refresh. (Verified)

---

### Phase 1: Core Marketplace Persistence & Entity Expansion (P1)

#### [TSK-MOD-006] Standalone Review & Rating Entity
- **Priority**: P1 (High) | **Status**: `COMPLETED` ✅
- **Scope**: `entity/Review.java`, `repository/ReviewRepository.java`, `service/ReviewService.java`, `controller/ReviewController.java`, `CustomerDashboard.jsx`, `ServiceDetails.jsx`, `ProviderDashboard.jsx`
- **Description**: Full `Review` entity with multi-criteria ratings, provider reply flow, and live display.
- **Acceptance Criteria**:
  1. Customers can submit multi-criteria ratings (Quality, Punctuality) and comments for completed bookings. (Verified)
  2. Public service and provider pages display verified reviews fetched from DB. (Verified)
  3. Providers can post one public response to a customer review. (Verified)
  4. Prevents duplicate reviews for the same booking ID. (Verified)

#### [TSK-MOD-007] Persistent Notification Inbox
- **Priority**: P1 (High) | **Status**: `COMPLETED` ✅
- **Scope**: `entity/Notification.java`, `repository/NotificationRepository.java`, `service/NotificationService.java`, `controller/NotificationController.java`, `Navbar.jsx`, `BookingEventListener.java`
- **Description**: Database-backed persistent notification system triggered by domain events (`BookingCreated`, `StatusChanged`, `PaymentReceived`, `DisputeRaised`, `PayoutUpdate`).
- **Acceptance Criteria**:
  1. Notifications are stored in `notifications` DB table with `is_read` boolean. (Verified)
  2. Navbar bell icon displays live unread notification badge count. (Verified)
  3. Clicking a notification marks it as read; support 1-click "Mark all as read". (Verified)

#### [TSK-MOD-008] Saved Customer Address Book
- **Priority**: P1 (High) | **Status**: `COMPLETED` ✅
- **Scope**: `entity/Address.java`, `repository/AddressRepository.java`, `service/AddressService.java`, `controller/AddressController.java`, `CustomerDashboard.jsx`
- **Description**: Allow customers to save and manage multiple addresses (`Home`, `Work`, `Other`) with coordinates.
- **Acceptance Criteria**:
  1. Customer can add, edit, set default, and delete saved addresses in Profile settings. (Verified)
  2. Addresses persist in `addresses` database table with user relationship. (Verified)

#### [TSK-MOD-009] Provider Payouts & Commission Financial Ledger
- **Priority**: P1 (High) | **Status**: `COMPLETED` ✅
- **Scope**: `entity/Payout.java`, `entity/WalletTransaction.java`, `repository/PayoutRepository.java`, `repository/WalletTransactionRepository.java`, `service/PayoutService.java`, `controller/PayoutController.java`, `ProviderDashboard.jsx`, `AdminDashboard.jsx`
- **Description**: Track gross booking earnings, 15% platform commission deductions, and payout withdrawal requests with admin approval.
- **Acceptance Criteria**:
  1. Provider views Net Earnings, Platform Commission, and Available Wallet Balance. (Verified)
  2. Provider can submit payout withdrawal requests with bank account / UPI details. (Verified)
  3. Admin can approve, process with transaction reference ID, or reject with automatic wallet refund. (Verified)

#### [TSK-MOD-010] Customer Dispute & Support Ticket Management
- **Priority**: P1 (High) | **Status**: `COMPLETED` ✅
- **Scope**: `entity/Dispute.java`, `repository/DisputeRepository.java`, `service/DisputeService.java`, `controller/DisputeController.java`, `CustomerDashboard.jsx`, `AdminDashboard.jsx`
- **Description**: Enable customers to file disputes on unsatisfactory bookings with admin arbitration.
- **Acceptance Criteria**:
  1. Customer can raise a dispute with issue description and desired resolution. (Verified)
  2. Admin console lists all open disputes with arbitration actions (`Resolve`, `Refund`, notes). (Verified)

---

### Phase 2: Performance, Pagination & Scalability (P2)

#### [TSK-MOD-011] Spring Data Pageable APIs for Admin & Provider Lists
- **Priority**: P2 (Medium) | **Status**: `COMPLETED` ✅
- **Scope**: `AdminController.java`, `BookingController.java`, `ReviewController.java`, `NotificationController.java`, `PageResponse.java`
- **Description**: Standardized `PageResponse<T>` wrapper and Spring Data `Pageable` query methods for bookings, users, providers, reviews, and notifications.
- **Acceptance Criteria**:
  1. Admin and Customer endpoints support `page`, `size`, and `sort` query parameters. (Verified)
  2. Total page count, total items, and page elements are accurately returned in response payload. (Verified)

#### [TSK-MOD-012] Compound Indexing & Query Optimization
- **Priority**: P2 (Medium) | **Status**: `COMPLETED` ✅
- **Scope**: JPA `@Index` annotations on `Booking`, `Service`, `User`, `ProviderProfile`, `Review`, `Notification`, `Payout`, `Dispute`, `Address`
- **Description**: Add composite database indices for high-frequency filter combinations (`(user_id, status)`, `(category_id, active)`, `(user_id, is_read)`, `(email)`, `(phone)`).
- **Acceptance Criteria**:
  1. All database entity models declare `@Table(indexes = { ... })`. (Verified)
  2. Queries execute efficiently without full table scans on large volume tables. (Verified)

#### [TSK-MOD-013] Downloadable PDF Invoices / Receipts
- **Priority**: P2 (Medium) | **Status**: `COMPLETED` ✅
- **Scope**: Backend `InvoicePdfService.java` (OpenPDF), `BookingController.java`, `CustomerDashboard.jsx`, `api.js`
- **Description**: OpenPDF service generating official branded tax invoices with line items, tax disclosures, fulfillment details, and payment verification.
- **Acceptance Criteria**:
  1. `GET /api/bookings/{id}/invoice` streams valid PDF document bytes with `application/pdf` header. (Verified)
  2. Customer Dashboard includes 1-click "Download PDF Invoice" button on table and summary modal. (Verified)

---

### Phase 3: Real-Time Communication & Media Storage (P3)

#### [TSK-MOD-014] Real-Time WebSockets (STOMP) for Live Dispatch & GPS
- **Priority**: P3 | **Status**: `COMPLETED` ✅
- **Scope**: Spring WebSocket (`@EnableWebSocketMessageBroker`), `WebSocketConfig.java`, `TrackingWebSocketController.java`, `TrackingServiceImpl.java`, `LiveTrackingModal.jsx`
- **Description**: Real-time STOMP messaging broker over `/ws-taaskr` broadcasting live GPS provider coordinates on `/topic/bookings/{bookingId}/location` with automatic 5s background polling fallback.
- **Acceptance Criteria**:
  1. STOMP endpoint registered at `/ws-taaskr` with SockJS fallback. (Verified)
  2. Provider location updates are broadcast to subscribed clients on `/topic/bookings/{bookingId}/location`. (Verified)
  3. `LiveTrackingModal.jsx` connects via `@stomp/stompjs` + `sockjs-client` with graceful polling fallback. (Verified)

#### [TSK-MOD-015] Provider KYC Document Upload & Verification Console
- **Priority**: P3 | **Status**: `COMPLETED` ✅
- **Scope**: `entity/KycDocument.java`, `enums/KycDocumentType.java`, `enums/KycDocumentStatus.java`, `repository/KycDocumentRepository.java`, `service/KycDocumentService.java`, `controller/KycDocumentController.java`, `ProviderDashboard.jsx`, `AdminDashboard.jsx`
- **Description**: Multipart file upload service storing encrypted KYC documents (`AADHAAR_FRONT`, `AADHAAR_BACK`, `PAN_CARD`, `DRIVING_LICENSE`, `TRADE_CERTIFICATE`, `OTHER`), secure streaming viewer endpoint, and Admin audit & verification workflow with rejection feedback.
- **Acceptance Criteria**:
  1. Provider can upload PDF, PNG, JPG, WEBP documents up to 10MB. (Verified)
  2. Documents are indexed and stored per provider in `kyc_documents` table with status `PENDING`. (Verified)
  3. Admin console includes a dedicated "KYC Verifications" tab with inline document viewer, approve, and reject actions with custom feedback. (Verified)
  4. Unit/integration tests pass with 100% success rate. (Verified)

---

## 4. Verification & Regression Test Matrix

| Test Case ID | Workflow Area | Expected Result | Verified? |
| :--- | :--- | :--- | :---: |
| `TC-AUTH-01` | Customer Registration & OTP Verify | User created in DB, email & phone verified, JWT returned | [x] |
| `TC-CAT-01` | Public Catalog Browsing & Filter | 11 canonical categories filter services with correct price/duration | [x] |
| `TC-BOOK-01` | Create Booking with Pay Online | Razorpay order generated, HMAC signature verified, booking marked `PAID` | [x] |
| `TC-BOOK-02` | Create Booking with Pay After Service | Booking created as `PENDING`/`ASSIGNED` with payment status `PENDING` | [x] |
| `TC-PROV-01` | Provider Accept $\to$ Transit $\to$ Complete | Strict state transition enforced; Cash collection updates status to `PAID` | [x] |
| `TC-VEH-01` | On-Demand Vehicle Transport Booking | Distance calculated from lat/lng, vehicle assigned, live coordinates tracked | [x] |
| `TC-ADM-01` | Admin Console Analytics & Provider Approval | KPIs reflect real DB aggregates, provider approval updates status | [x] |
| `TC-NOTIF-01`| Persistent Notification Delivery | Event triggers notification in DB, bell badge increments, marks read on click | [x] |
| `TC-REV-01` | Review Submission & Display | Customer rating persists in `reviews` table, updates provider average rating | [x] |
| `TC-WAL-01` | Provider Financial Ledger & Payouts | 15% platform commission deducted, wallet credited, admin payout processed | [x] |
| `TC-DISP-01` | Customer Dispute Arbitration | Dispute filed, admin resolves with resolution and refund amount | [x] |
| `TC-ADDR-01` | Customer Address Book Management | Add, update, set default, and delete saved addresses | [x] |
| `TC-PAGE-01` | Spring Data Pageable APIs | Paginated query results with total items, pages, and sorted content | [x] |
| `TC-INV-01`  | Downloadable PDF Invoice Generation | Branded PDF receipts generated on backend and downloadable from customer UI | [x] |
| `TC-WS-01`   | Real-Time STOMP WebSockets | Live location broadcasts over `/topic/bookings/{bookingId}/location` with UI map updates | [x] |
| `TC-KYC-01`  | Provider KYC Upload & Admin Verification | Multipart upload, secure streaming view, and admin approval/rejection audit trail | [x] |
