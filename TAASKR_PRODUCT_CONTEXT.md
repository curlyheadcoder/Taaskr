# Taaskr Product Context

## Product Overview
**Taaskr** is an on-demand home-services platform initially operating in **Indore, Madhya Pradesh**. It connects customers needing home maintenance, repair, logistics, and cleaning services with verified local service partners in real-time.

---

## User Roles & Capabilities

### 1. Customer (User)
Customers use the platform to find, book, track, and pay for services.

**Key Capabilities:**
- **Discover Services**: Browse service categories (Plumbing, Electrical, Cleaning, Appliance Repair, Logistics/Transport, Auto Care, etc.) with transparent pricing.
- **Select Service Variants**: Choose specific options, service sub-types, or vehicle types for transport bookings.
- **Provide Location**: Set service address manually or automatically via GPS device location (restricted to Indore service area, pincodes 452xxx).
- **Schedule a Service**: Select preferred date and time windows (e.g. 09:00 AM, 11:00 AM, 02:00 PM).
- **Request Immediate Dispatch**: Choose ⚡ Immediate Dispatch mode for fastest partner assignment (~15 minutes).
- **Receive Provider**: Get auto-assigned verified local providers matching service category and geographic availability.
- **Track Booking**: Monitor real-time booking lifecycle status (`PENDING` → `ASSIGNED` → `ACCEPTED` → `IN_TRANSIT` → `IN_PROGRESS` → `COMPLETED`).
- **Track Provider**: View live GPS location of assigned service partner on an interactive map card with dynamic distance in KM and ETA countdown.
- **Complete Service**: Confirm completion of work and handle payment (Pay After Service / Online UPI).
- **Rate & Review**: Provide 1-5 star ratings and written reviews for completed bookings to build partner trust.

---

### 2. Service Partner (Provider)
Service partners accept leads, perform jobs, and update job progress.

**Key Capabilities:**
- **Maintain Availability**: Set daily availability slots, toggle online/offline dispatch status, and manage partner profiles.
- **Receive Tasks**: Receive incoming marketplace booking requests and direct customer leads in Indore.
- **Accept / Reject**: Review booking details (address, distance, service type, payout) and accept or reject lead assignments.
- **Navigate to Customer**: Access customer contact details, service address, and GPS navigation routes.
- **Update Task Status**: Transition task status step-by-step (`Start Journey` → `Mark Arrived` → `Start Work` → `Complete Work`).
- **Start Service**: Initiate work upon arriving at customer location.
- **Complete Service**: Record work completion, add additional charges if any, and record customer payment.
- **Share Live Location**: Stream real-time GPS coordinates while on an active task for customer map tracking.

---

### 3. Super Admin
Admins govern system performance, marketplace integrity, and platform policies.

**Capabilities (Operational & Roadmap):**
- **Manage Users**: Oversee customer accounts, verification status (Email & Phone OTP), and profile updates.
- **Manage Providers**: Review KYC documents, approve/reject provider applications, and handle partner onboarding.
- **Manage Services**: Manage service catalog, categories, pricing models, and service activation flags.
- **Manage Bookings**: View app-wide booking logs, force re-assignments, or process cancellations.
- **Pricing Management**: Configure base fares, distance-based pricing formulas (for transport/logistics), and promotional discounts.
- **Location & Service Areas**: Manage operational pincodes (Indore 452xxx expansion) and geofences.
- **Dispute Resolution**: Review customer complaints, failed bookings, and process payment refunds or payout adjustments.
- **Analytics & Reporting**: Access metrics on total bookings, gross volume, partner ratings, active tasks, and revenue trends.
