# Taaskr — Engineering Feature Ticket List (Jira / Linear Backlog)

**Format**: Agile User Stories with Acceptance Criteria (AC) and Priority Tags.  
**Statuses**: `COMPLETED`, `IN_PROGRESS`, `BACKLOG`  

---

## Epic 1: Catalog & Marketplace Discovery

### [TSK-101] Dynamic Canonical Category Classification & Filtering
- **Priority**: P0 (High) | **Status**: `COMPLETED`
- **Description**: As a user browsing the homepage, I want services to be grouped under 11 canonical categories so that I can easily discover electrical, plumbing, civil, healthcare, and logistics services.
- **Acceptance Criteria**:
  1. Frontend dynamically maps raw backend services into canonical category IDs using multi-keyword matchers.
  2. Category pills display live count badges based on available database services.
  3. Clicking a category tile smoothly filters the catalog grid and scrolls to the top of the section.

### [TSK-102] Hero Canvas Physics with Dynamic Ambient Tints
- **Priority**: P2 (Medium) | **Status**: `COMPLETED`
- **Description**: As a prospective customer, I want an engaging hero section that illustrates the variety of services available in an interactive manner.
- **Acceptance Criteria**:
  1. Particle tiles bounce within container bounds with 2D elastic physics.
  2. Wall and tile collisions trigger rotation of featured service taglines.
  3. Page ambient background gradient subtly synchronizes with the active category color theme.

---

## Epic 2: Booking Engine & Route Logistics

### [TSK-201] Multi-Step Booking Flow with Online & Cash Options
- **Priority**: P0 (High) | **Status**: `COMPLETED`
- **Description**: As an authenticated customer, I want to book a service with custom date, time slot, and payment choice so that a technician can be dispatched.
- **Acceptance Criteria**:
  1. Form validates contact and address details.
  2. Supports **Pay Online** (Razorpay modal) and **Pay After Service** (Cash on Delivery).
  3. Atomically reserves provider availability slot in backend.
  4. Triggers confetti celebration on successful confirmation and redirects to booking details.

### [TSK-202] Intelligent Vehicle & Freight Estimation Engine
- **Priority**: P1 (High) | **Status**: `COMPLETED`
- **Description**: As a logistics customer, I want dynamic fare quotes based on pickup/drop coordinates and cargo weight so that I can choose the appropriate vehicle.
- **Acceptance Criteria**:
  1. Calculates distance between pickup and drop-off coordinates.
  2. Matches eligible vehicles (Courier Bike, 3W Loading, Mini Truck Tata Ace, Heavy Truck).
  3. Displays estimated arrival ETA, maximum payload, and total fare.

---

## Epic 3: Partner Operations & Workflow Execution

### [TSK-301] Strict 4-Stage Provider Workflow Progression
- **Priority**: P0 (Critical) | **Status**: `COMPLETED`
- **Description**: As a service provider, I must execute jobs in a strict sequence: Accept $\to$ Start Work $\to$ Complete $\to$ Collect Cash.
- **Acceptance Criteria**:
  1. In `ASSIGNED`: Show only `Accept Job` and `Reject` buttons.
  2. In `ACCEPTED`: Show only `Start Work` (or `Start Transit`). Direct completion is blocked.
  3. In `IN_PROGRESS` / `IN_TRANSIT`: Show `Mark as Completed`.
  4. In `COMPLETED` (Cash on Delivery): Show prominent `Collect Cash` button triggering confirmation modal.
  5. Backend state machine rejects invalid state transitions.

### [TSK-302] Weekly Availability Scheduler for Partners
- **Priority**: P1 (High) | **Status**: `COMPLETED`
- **Description**: As a provider, I want to manage my weekly working hours so that customers only book when I am available.
- **Acceptance Criteria**:
  1. Provider can create date-specific hourly availability windows.
  2. Slot status switches to `is_booked = true` upon customer checkout.
  3. Provider can delete unbooked slots.

---

## Epic 4: Security, Authentication & Verification

### [TSK-401] Mandatory Dual-Factor Contact Verification
- **Priority**: P0 (High) | **Status**: `COMPLETED`
- **Description**: As an admin, I want all users and providers to verify both email and phone number to prevent platform spam and fraud.
- **Acceptance Criteria**:
  1. 6-digit OTP verification for email (Brevo/Resend) and phone (Twilio/Fast2SMS).
  2. Unverified customers cannot submit booking requests.
  3. Unverified providers cannot claim dispatch tasks.

### [TSK-402] JWT Stateless Token Authentication & RBAC Guard
- **Priority**: P0 (High) | **Status**: `COMPLETED`
- **Description**: Secure all API endpoints with role-based JWT validation.
- **Acceptance Criteria**:
  1. JWT tokens generated on login with 24-hour expiration.
  2. `SecurityFilterChain` validates claims and enforces role access (`USER`, `PROVIDER`, `ADMIN`).
  3. Frontend automatically redirects expired sessions to `/login`.

---

## Epic 5: Observability & Cloud Performance

### [TSK-501] JVM Micro-Container Memory Tuning for Render
- **Priority**: P0 (Critical) | **Status**: `COMPLETED`
- **Description**: Optimize backend Docker image to run reliably within 512 MB cloud RAM limits.
- **Acceptance Criteria**:
  1. Configured JVM flags `-XX:+UseSerialGC -Xms64m -Xmx320m -XX:MaxMetaspaceSize=128m`.
  2. Tuned HikariCP connection pool (`maximum-pool-size=5`).
  3. Excluded redundant Redis repository scanning, reducing startup time to under 60 seconds.
