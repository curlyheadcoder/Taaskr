# Taaskr: Project Engineering Challenges, Post-Mortems, Loopholes & Interview Master Guide

This comprehensive guide documents all technical architecture challenges, production bugs, loophole remediations, concurrency models, and system design decisions implemented in **Taaskr**. Use this as your primary technical reference and interview preparation cheat sheet.

---

## Table of Contents
1. [Project Overview & Core Architecture](#1-project-overview--core-architecture)
2. [Critical Technical Challenges & Post-Mortems](#2-critical-technical-challenges--post-mortems)
3. [Business Logic Loopholes & Security Mitigations](#3-business-logic-loopholes--security-mitigations)
4. [Full-Stack Concurrency, State Machines & Data Integrity](#4-full-stack-concurrency-state-machines--data-integrity)
5. [Frontend Performance, React Lifecycles & Production Build Traps](#5-frontend-performance-react-lifecycles--production-build-traps)
6. [Top Interview Questions & STAR-Formatted Responses](#6-top-interview-questions--star-formatted-responses)

---

## 1. Project Overview & Core Architecture

### What is Taaskr?
**Taaskr** is an enterprise-grade, on-demand home maintenance and emergency logistics marketplace connecting customers with verified service providers across categorized service zones (e.g., Indore Metro).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React / Vite)                         │
│   • Role-Driven Layouts: Customer Portal | Provider Console | Admin Console │
│   • JWT Auth Interceptors, Real-Time Discussion Sync, Dynamic Theming       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST / JSON (JWT Bearer)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       BACKEND (Spring Boot 3 / Java 17)                     │
│   • Spring Security 6 + Stateless JWT Filter Chain                          │
│   • Strict Domain State Machine (Assigned -> Accepted -> In-Transit -> ...) │
│   • Admin Governance, Discussion Subsystems, Vehicle Fleet Validation       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ JPA / Hibernate ORM
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       DATABASE & INFRASTRUCTURE                             │
│   • PostgreSQL / MySQL Schema with foreign-key constraints & unique indices │
│   • Actuator / Micrometer Observability & Metrics Endpoints                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Breakdown
- **Frontend**: React 18, Vite, React Router 6, Lucide Icons, Vanilla CSS Design System with dark/light themes.
- **Backend**: Spring Boot 3.x, Java 17, Spring Data JPA, Spring Security 6, Hibernate, JJWT (JSON Web Token).
- **Database**: MySQL / PostgreSQL with transactional integrity.
- **Deployment**: Vercel (Frontend SPA) + Render / AWS (Backend Spring Boot JAR).

---

## 2. Critical Technical Challenges & Post-Mortems

### Post-Mortem 1: Spring Boot 3 "No Static Resource" 404 on Provider Action
- **Symptom**: When a provider clicked "Accept Job" on an assigned booking, the frontend showed `Action failed: No static resource api/provider/bookings/72/accept`.
- **Root Cause**: The service layer method `acceptBooking(...)` was implemented in `ProviderWorkflowServiceImpl`, but the `@PutMapping("/bookings/{bookingId}/accept")` endpoint mapping was omitted in `ProviderController.java`. Spring Boot 3's dispatcher routes unmatched URLs to its `ResourceHttpRequestHandler` (static content resolver), producing a "No static resource" 404.
- **Resolution**:
  1. Added `@PutMapping("/bookings/{bookingId}/accept")` in `ProviderController.java`.
  2. Verified input authorization ensuring only the assigned provider can transition a booking from `ASSIGNED` to `ACCEPTED`.
- **Interview Takeaway**: *"In Spring Boot 3, unmapped API routes fall through to the static resource handler. We enforce end-to-end contract testing between API gateway definitions and controller route declarations."*

---

### Post-Mortem 2: Temporal Dead Zone (TDZ) ReferenceError in Production Bundles
- **Symptom**: Admin Console crashed on page load with `Something went wrong: Cannot access 'le' before initialization`.
- **Root Cause**: An event listener / `useEffect` hook near the top of the component referenced a derived variable `activeDiscussion` in its dependency array. However, `const activeDiscussion = ...` was declared *below* a conditional `if (loading) return ...` guard. In production, minification renamed `activeDiscussion` to `le`, and JavaScript threw a TDZ `ReferenceError` during initial render.
- **Resolution**:
  1. Moved all state hooks and derived variables to the very top of the functional component scope before any lifecycle hooks or early conditional returns.
  2. Adhered strictly to the **Rules of Hooks** and JavaScript declaration ordering.
- **Interview Takeaway**: *"Never declare derived state used in hook dependency arrays below early return guards. In production bundles, minification obfuscates variable names, making TDZ errors appear as single-letter failures."*

---

### Post-Mortem 3: Viewport Hijacking via `scrollIntoView()` in Chat Polling
- **Symptom**: Every 3 seconds during live discussion polling, the entire webpage viewport forcefully jumped/scrolled down to the footer.
- **Root Cause**: When polling fetched updated messages, `element.scrollIntoView({ behavior: 'smooth' })` was executed. Unlike container scrolling, `scrollIntoView()` scrolls the entire browser `window` viewport to align the target element with the visible screen area.
- **Resolution**:
  1. Replaced `scrollIntoView()` with container-scoped scrolling:
     ```javascript
     messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
     ```
  2. Switched from continuous polling triggers to **event-driven scrolling** (scrolling strictly on user thread selection or when a new message is sent).
- **Interview Takeaway**: *"Never use `scrollIntoView()` inside auto-polling intervals. Scoping scroll changes directly to `element.scrollTop` on the scrollable container guarantees zero page-level viewport jumps."*

---

## 3. Business Logic Loopholes & Security Mitigations

| Vulnerability / Loophole | Attack Vector / Business Risk | Technical Fix Implemented |
| :--- | :--- | :--- |
| **Premature Cash Collection** | Provider could mark cash as received *before* job completion, leading to customer disputes and unpaid cancellations. | Added `PaymentRestrictionModal` UI guard and backend validation requiring status to be `COMPLETED` before payment transitions. |
| **Spurious Payment Disputes** | New providers with 0 jobs raised payment dispute tickets, creating admin backlog. | Enforced backend validation in `PartnerDiscussionServiceImpl` and frontend booking selectors requiring an active/completed booking. |
| **Double Booking / Time Slot Overlap** | Multiple customers booking the same provider for overlapping time windows. | Enforced database overlap query: `existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(...)`. |
| **Unapproved Provider Exploitation** | Unverified providers accepting jobs and collecting customer payments. | Strict state check `provider.isApproved()` in `ProviderWorkflowService` and admin feedback remark system. |
| **Cross-Provider Booking Hijacking** | A provider claiming/modifying another provider's private booking. | Scoped all update queries by `findByIdAndProviderId(bookingId, providerId)`. |

---

## 4. Full-Stack Concurrency, State Machines & Data Integrity

### Strict Booking State Machine
```
   [CREATED / UNASSIGNED] ──► [ASSIGNED] ──► [ACCEPTED] ──► [IN_TRANSIT] ──► [IN_PROGRESS] ──► [COMPLETED] ──► [PAID]
                                 │
                                 └──► [REJECTED] ──► (Re-enters Dispatch Pool)
```

1. **State Invariance**: Transitioning between states is validated in Java enum sets (e.g., only `ASSIGNED` bookings can be `ACCEPTED` or `REJECTED`).
2. **ACID Transactions**: Core workflow transitions use Spring's `@Transactional(isolation = Isolation.READ_COMMITTED)` to prevent race conditions during concurrent bookings.
3. **Optimistic Locking**: Vehicle availability and booking status transitions check entity versions to prevent dirty writes.

---

## 5. Frontend Performance, React Lifecycles & Production Build Traps

### Key Optimizations
1. **Lightweight Delta Polling**:
   - Implemented a 3000ms polling interval active **only** when the user is on the discussions tab (`activeTab === 'discussions'`), stopping immediately when switching away.
2. **Decoupled Event Broadcasting**:
   - Used `window.dispatchEvent(new CustomEvent('provider-tab-changed'))` to synchronize top navigation badges without causing full tree re-renders or prop-drilling.
3. **Production Tree Shaking & Minification Guardrails**:
   - Cleaned up duplicate state declarations and ensured strict JSX tag closures to pass Vite/Rolldown production builds in under 1.3 seconds.

---

## 6. Top Interview Questions & STAR-Formatted Responses

### Q1: "Describe a challenging bug you encountered in production and how you debugged it."
> **Situation**: After pushing a new build of Taaskr to production, providers reported that clicking "Accept Job" resulted in an unexpected "No static resource" 404 error toast.
> **Task**: Identify why a functional backend service was rejecting the frontend's API request and resolve the issue without downtime.
> **Action**: I inspected the network trace and saw a `PUT /api/provider/bookings/72/accept`. In the Spring Boot backend, I checked `ProviderWorkflowServiceImpl` and confirmed `acceptBooking()` was implemented, but cross-checked `ProviderController.java` and discovered the `@PutMapping` endpoint mapping was omitted. Spring Boot 3 had fallen back to the static resource handler. I added the route mapping, compiled and ran integration tests, and pushed a hotfix.
> **Result**: Job acceptance was restored immediately with zero data corruption.

---

### Q2: "How did you prevent fraudulent disputes and premature payments in the provider workflow?"
> **Situation**: In on-demand services, providers might mark a job as paid before doing the work, or flood support with disputes for tasks they never completed.
> **Task**: Design and enforce strict validation guards on both the backend and frontend.
> **Action**: 
> 1. For cash payments, I built a state-checking modal in React and an invariant check in Spring Boot ensuring `booking.status == COMPLETED` before `markAfterServicePaymentReceived()` can execute.
> 2. For support tickets, I updated `PartnerDiscussionServiceImpl` to require a valid `bookingId` for `PAYMENT_DISPUTE` categories and verified ownership via `findByIdAndProviderId()`. In the UI, the freeform text input was replaced with a dynamic `<select>` of the provider's actual completed bookings.
> **Result**: Eliminated erroneous payment dispute tickets and prevented false payment confirmations.

---

### Q3: "How did you implement real-time communication between Providers and Admin?"
> **Situation**: Providers needed to communicate with administrators regarding job queries or location issues, but required real-time message updates without complex WebSocket infrastructure overhead for low-frequency chats.
> **Task**: Build a resilient, lightweight real-time chat and support portal with zero UI jitter.
> **Action**: I implemented a delta-polling mechanism with a 3-second heartbeat that activates only when the user is actively viewing a discussion thread. To prevent the entire webpage viewport from scrolling to the footer during polling, I scoped the auto-scrolling directly to the message container's `scrollTop` property triggered exclusively on message creation or thread switching.
> **Result**: Delivered seamless real-time messaging with instant UI updates and zero layout shifts.

---

### Q4: "How is security and multi-tenancy enforced across different roles?"
> **Situation**: The platform handles three distinct personas: Customers, Service Providers, and Admins.
> **Task**: Ensure bulletproof authorization so providers cannot inspect admin controls or other providers' customer data.
> **Action**: 
> 1. Implemented Spring Security 6 with stateless JWT authentication.
> 2. Configured role-based URL security matchers: `/api/admin/**` (`hasRole('ADMIN')`), `/api/provider/**` (`hasRole('PROVIDER')`), `/api/customer/**` (`hasRole('USER')`).
> 3. Enforced tenant isolation in database queries using authenticated `UserPrincipal` IDs rather than trusting client-supplied IDs.
> **Result**: Achieved 100% authorization isolation across all marketplace operations.
