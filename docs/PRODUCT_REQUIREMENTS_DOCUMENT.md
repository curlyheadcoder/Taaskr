# Taaskr — Product Requirements Document (PRD)

**Document Version**: 2.0.0  
**Status**: Approved & Production Ready  
**Target Audience**: Executive Leadership, Investors, Product Engineering, QA  

---

## 1. Executive Summary & Vision

**Taaskr** is an on-demand, full-stack home services and urban logistics marketplace designed for rapid booking, verified partner dispatch, and transparent multi-channel fulfillment. 

The platform bridges the gap between urban households/businesses requiring timely, high-trust services and skilled independent service professionals (technicians, beauticians, cleaners, drivers, craftsmen).

### Core Value Propositions
- **For Customers**: Upfront transparent fixed pricing, verified background-checked service partners, real-time tracking, multiple payment modes (Online Razorpay Gateway or Cash/UPI after service), and service guarantees.
- **For Service Providers**: High-density local task feeds, automated route and dispatch tools, flexible slot availability scheduling, immediate post-service cash collection records, and performance analytics.
- **For Administrators**: Real-time observability, SLA monitoring, escalation resolution, service catalog lifecycle management, and fraud protection.

---

## 2. User Personas & Journey Maps

### 2.1 Customer (User)
- **Profile**: Urban resident or small business manager seeking dependable services (electrical, plumbing, appliances, logistics, beauty).
- **Core Goals**: Search available services in their locality, schedule immediate or future dispatch windows, monitor booking progress, and pay securely.
- **Key Journey**:
  $$\text{Browse/Search Catalog} \to \text{Select Slot/Route} \to \text{Authenticate/Verify} \to \text{Book (Online or Cash)} \to \text{Track Live} \to \text{Review & Rate}$$

### 2.2 Service Partner (Provider)
- **Profile**: Skilled technician, driver, or wellness specialist operating across urban zones.
- **Core Goals**: Claim available tasks from local dispatch feeds, manage weekly calendar availability, execute assigned work through standardized stages, and collect earnings.
- **Key Journey**:
  $$\text{Task Feed/Assigned} \to \text{Accept Job} \to \text{Start Work / Transit} \to \text{Mark Completed} \to \text{Collect Cash / Verify Payment}$$

### 2.3 Operations Administrator (Admin)
- **Profile**: Platform operations manager ensuring quality control, catalog health, financial reconciliation, and platform compliance.
- **Core Goals**: Audit provider verifications, manage service catalog categories & rates, oversee real-time booking statuses, and resolve partner escalations.

---

## 3. Product Features & Functional Requirements

### 3.1 Catalog & Multi-Category Hierarchy
The system supports 11 canonical service categories with dynamic keyword classification:
1. **Appliances & Electrical**: AC Repair, AC Installation, AC Maintenance, RO Purifier, Refrigerators, Washing Machines, Switchboards, Fans.
2. **Plumbing & Cleaning**: Tap Leakage & Valve Repair, Pipe Leaks, Drain Clearance, Deep Bathroom & Home Cleaning, Kitchen Degreasing.
3. **Pest Control**: General Pest & Cockroach, Termite & Wood Borer, Bed Bug Eradication, Mosquito Control.
4. **Salon & Massage / Wellness**: Haircuts, Beard Styling, Facials, Waxing, Spa Therapies, Bridal Makeovers.
5. **Civil & Property Maintenance**: Carpentry, Flatpack Furniture Assembly, Wall Mounting, Masonry & Brickwork, Waterproofing, Flooring & Tiling, Painting.
6. **Tech & Home Automation**: Laptop/PC Diagnostics, Wi-Fi Mesh Network Setup, Smart TV Wall Mounting, Printer Troubleshooting.
7. **Vehicle & Auto Care**: Doorstep Eco Car Foam Wash, Bike Detailing, Battery Jump-Start.
8. **Home Help & Errand Services**: On-demand Domestic Helpers, Cooks/Chefs, Laundry & Steam Ironing, Medicine/Grocery Pickup.
9. **Security Services**: CCTV Setup, Biometric Smart Locks, Video Doorbells, Security Guard Shifts.
10. **Diagnostic & Healthcare Services**: Doorstep Blood Sample Collection, Full Body Checkup, Compounder on Call, Senior Care Nurse.
11. **Logistics & On-Demand Transport**: Two-wheeler express courier, 3W Loading auto, Mini Truck (Tata Ace), Heavy Freight.

### 3.2 Dynamic Route & Freight Pricing Engine
For vehicle and freight logistics, the platform dynamically computes freight estimates:
- Inputs: Pickup coordinate/pincode, Drop-off coordinate/pincode, Estimated distance ($km$), Package weight ($kg$), Cargo type.
- Output: Dynamic fare calculation factoring base fare, per-km rate, payload tier, and vehicle availability.

### 3.3 Strict 4-Stage Provider Execution Workflow
To ensure auditability and prevent false completions, bookings strictly follow a sequential lifecycle:
1. **Stage 1 (ASSIGNED)**: Provider reviews task details and selects `Accept Job` or `Reject`.
2. **Stage 2 (ACCEPTED)**: Provider arrives on-site and initiates `Start Work` (or `Start Transit` for vehicle logistics), shifting status to `IN_PROGRESS` or `IN_TRANSIT`.
3. **Stage 3 (IN_PROGRESS / IN_TRANSIT)**: Real-time work execution. Once physical delivery is done, provider clicks `Mark as Completed`.
4. **Stage 4 (COMPLETED & COLLECT CASH)**: If payment was chosen as *After Service (Cash on Delivery)*, the provider records cash collection via modal confirmation to transition payment status to `PAID`.

### 3.4 Multi-Channel Authentication & Contact Verification
- JWT Bearer authentication with 24-hour token rotation.
- Dual-factor contact verification: Both **Email Verification** (OTP code) and **Phone Verification** (SMS code) required before booking or provider claiming.
- Simulation mode support for instant test validation and live integrations with Brevo, Resend, Fast2SMS, and Twilio.

### 3.5 Payment Processing & Escrow
- **Online Gateway**: Razorpay Checkout SDK with server-side signature verification (`HMAC SHA-256`).
- **After Service**: Cash on Delivery with provider confirmation modal and digital receipts.

---

## 4. Non-Functional Requirements (NFR)

| Parameter | Target Requirement |
| --- | --- |
| **P95 API Response Time** | $< 180\text{ ms}$ under regular load |
| **Availability / Uptime** | $99.9\%$ SLA |
| **Container Memory Footprint** | $\le 384\text{ MB}$ JVM heap constraint for cloud micro-instances |
| **Client Bundle Size** | $\le 320\text{ kB}$ gzip compressed JavaScript payload |
| **Data Integrity** | Strict ACID transactional booking creation and slot reservation |
| **CORS Isolation** | Locked to verified frontend origin in production (`https://taaskr.vercel.app`) |

---

## 5. Success Metrics & KPIs
- **Booking Conversion Rate**: $> 22\%$ from catalog view to confirmed booking.
- **Provider Fulfillment SLA**: Average time from assignment to `Start Work` under 30 minutes.
- **Payment Success Rate**: $> 98\%$ on online gateway checkout.
- **Zero Double-Booking Guarantee**: Availability slots locked atomically in database transactions.
