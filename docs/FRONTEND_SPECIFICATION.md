# Taaskr — Frontend Specification Document

**Document Version**: 2.0.0  
**Framework**: React 18 (SPA) | Vite 8 | Pure CSS Design Tokens | React Router v6  

---

## 1. Frontend Architecture & Design Philosophy

The Taaskr client interface is built as a responsive Single Page Application (SPA) designed with a clean, modern glassmorphism aesthetic, high-contrast readability in dark and light modes, and kinetic micro-interactions.

### Key Architectural Guidelines
- **Zero Heavy UI Component Frameworks**: Uses curated pure CSS custom properties (`index.css`), avoiding Tailwind bloated utility classes and preserving high rendering performance.
- **Client-Side Routing with State Preservation**: React Router v6 with `ProtectedRoute` guards and location-state passing for multi-step checkout.
- **Dynamic Theming**: CSS custom properties for ambient background colors, glows, cards, borders, and typography variables.

---

## 2. Design System Tokens & Color Palette

### 2.1 Color Palette
- **Primary Brand**: `#0284C7` (Electric Sapphire) $\to$ `#2563EB` (Royal Blue)
- **Success / Paid**: `#10B981` (Emerald Green)
- **Warning / In-Progress**: `#F59E0B` (Amber Flame)
- **Error / Danger**: `#EF4444` (Crimson Rose)
- **Category Distinct Tints**:
  - *Appliances & Electrical*: `#F59E0B` (Amber)
  - *Plumbing & Cleaning*: `#06B6D4` (Cyan)
  - *Pest Control*: `#10B981` (Emerald)
  - *Salon & Wellness*: `#A855F7` (Violet)
  - *Civil & Property*: `#F97316` (Orange)
  - *Tech & Automation*: `#6366F1` (Indigo)
  - *Vehicle Care*: `#0284C7` (Sky Blue)
  - *Logistics*: `#3B82F6` (Blue)
  - *Diagnostics & Health*: `#F43F5E` (Rose)

### 2.2 Typography & Hierarchy
- **Primary Typeface**: Inter / System Sans-Serif (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu`)
- **Monospace Font**: JetBrains Mono / Fira Code (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`)
- **Tabular Numerals**: `fontFeatureSettings: 'tnum'` for prices, counters, and phone numbers.

---

## 3. Core Page Specifications

### 3.1 Home / Marketplace Discovery (`Home.jsx`)
- **Hero Canvas with Bouncing Physics**: 2D elastic collision particles that rotate and cycle featured service tags upon wall/tile impacts. Dynamically tints the page ambient gradient.
- **Dynamic Category Filter**: Horizontal sliding canonical categories with active item counts loaded from live backend data.
- **Multi-Token Autocomplete Search**: Global keyword matching across title, category, and scope text.
- **Service Catalog Grid**: Responsive 4-column cards with lazy-loaded images, base rate badges, scope snippets, and instant `Book` routing.
- **3-Step Workflow & Value Proposition Strip**: Visual guide explaining catalog discovery, doorstep arrival, and escrow payment.

### 3.2 Service Details & Logistics Configurator (`ServiceDetails.jsx`)
- **Dual Workflow Routing**:
  1. *Standard Home Services*: Shows base rates, duration, service guarantee badge, date picker, time slot selector, and verified provider availability.
  2. *Logistics & Freight Services*: Interactive route planner with Pickup / Drop-off location search, coordinate mapping, payload weight slider, and dynamic vehicle comparison cards (Mini Truck, 3W Loading, Courier Bike).

### 3.3 Seamless Checkout & Booking Flow (`BookingFlow.jsx`)
- **State Hydration**: Pre-fills customer address, coordinates, and contact details from user session.
- **Payment Mode Selection**:
  - *Pay After Service*: Cash on Delivery / UPI upon job completion.
  - *Pay Online*: Integrated Razorpay SDK checkout with real-time modal payment capture.
- **Celebration Confirmation**: Confetti celebration animation and instant redirect to live tracking in Customer Dashboard.

### 3.4 Provider Console (`ProviderDashboard.jsx`)
- **Strict 4-Step Job Lifecycle**:
  1. `ASSIGNED`: Shows `Accept Job` and `Reject` buttons.
  2. `ACCEPTED`: Shows only the `Start Work` (or `Start Transit`) button.
  3. `IN_PROGRESS` / `IN_TRANSIT`: Status badge updates to Amber/Indigo, action button transitions to `Mark as Completed`.
  4. `COMPLETED`: If Cash on Delivery, renders green `Collect Cash (₹...)` button triggering the `CollectCashModal`.
- **Fleet Manager Tab**: Add/edit transport vehicles with registration numbers, payload capacities, and fuel types.
- **Weekly Availability Scheduler**: Create, activate, and delete hourly dispatch slots.
- **Partner Analytics & Earnings**: Total completed tasks, customer rating average, active slots, and historical revenue.

### 3.5 Operations Admin Console (`AdminDashboard.jsx`)
- **System Observability Tab**: Real-time JVM heap memory metrics, active threads, system uptime, and server logs.
- **Analytics & GMV Tab**: Total revenue, platform take-rate, booking completion rate, and active worker count.
- **Service Catalog Manager**: Add new catalog services, update base rate cards, and toggle category active states.
- **Provider Approval Manager**: Audit partner applications and approve verified technicians.

---

## 4. Client Utilities & Integration Layer

- **`api.js` (HTTP Client)**: Centralized Axios-like `fetch` wrapper handling JWT injection, automatic 401 token clearing, and JSON error parsing.
- **`LocationPicker.jsx`**: Leaflet/OpenStreetMap interactive coordinate picker with autocomplete address geocoding.
- **`Pagination.jsx`**: Reusable zero-dependency page controller with smooth scrolling to container headers.
