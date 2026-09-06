# Taaskr — Security & Access Control Document

**Document Version**: 2.0.0  
**Compliance Standard**: OWASP Top 10 | Role-Based Access Control (RBAC) | JWT Standards  

---

## 1. Authentication Architecture

Taaskr implements stateless authentication via JSON Web Tokens (JWT) using the `HS256` signature algorithm.

```
┌──────────────┐             1. Credentials (Email + Password)           ┌──────────────┐
│    Client    ├────────────────────────────────────────────────────────►│  Auth Server │
│   Browser    │◄────────────────────────────────────────────────────────┤ Spring Sec 6 │
│              │        2. Returns JWT Token + User Role Profile         │              │
│              │                                                         │              │
│              │             3. API Request with Auth Header:            │              │
│              │            `Authorization: Bearer <JWT_TOKEN>`          │              │
│              ├────────────────────────────────────────────────────────►│              │
│              │◄────────────────────────────────────────────────────────┤              │
│              │           4. Validates Token, Extracts Claims,          │              │
│              │              Populates SecurityContextHolder            └──────────────┘
└──────────────┘
```

### 1.1 Token Configuration & Expiry
- **Secret Key**: Injected via environment variable `JWT_SECRET` (256+ bit high-entropy secret). Never checked into source control.
- **Expiration Policy**: 24 Hours ($86,400,000\text{ ms}$).
- **Claims Payload**:
  - `sub`: User Email address (e.g. `user@taaskr.com`).
  - `role`: Granted authority (`ROLE_USER`, `ROLE_PROVIDER`, `ROLE_ADMIN`).
  - `iat`: Issued-at timestamp.
  - `exp`: Expiration timestamp.

### 1.2 Password Hashing
- Stored using `BCryptPasswordEncoder` with a cost work factor of $10$ (salted and resistant to rainbow table attacks). Plaintext passwords are never logged or stored.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Method | Endpoint Path | Unauthenticated | `ROLE_USER` | `ROLE_PROVIDER` | `ROLE_ADMIN` |
| --- | --- | --- | :---: | :---: | :---: | :---: |
| **Catalog Listing** | `GET` | `/api/categories`, `/api/services/**` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Vehicle Fare Quote** | `POST` | `/api/vehicles/estimate` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Register & Sign In** | `POST` | `/api/auth/register`, `/api/auth/login` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Create Booking** | `POST` | `/api/bookings` | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **View My Bookings** | `GET` | `/api/bookings/my` | ❌ 401 | ✅ Allowed | ❌ 403 | ✅ Allowed |
| **Claim Dispatch Task** | `PUT` | `/api/provider/bookings/{id}/claim` | ❌ 401 | ❌ 403 | ✅ (Verified Only) | ❌ 403 |
| **Update Work Status** | `PUT` | `/api/provider/bookings/{id}/status` | ❌ 401 | ❌ 403 | ✅ (Assigned Only) | ❌ 403 |
| **Confirm Cash Collection**| `PUT` | `/api/provider/bookings/{id}/payment-received` | ❌ 401 | ❌ 403 | ✅ (Assigned Only) | ❌ 403 |
| **Platform Analytics** | `GET` | `/api/admin/analytics` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Allowed |
| **Observability & Health** | `GET` | `/api/admin/observability` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Allowed |
| **Modify Catalog Rates** | `PUT` | `/api/admin/services/{id}` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Allowed |

---

## 3. Account Verification & Fraud Prevention

### 3.1 Mandatory Dual Contact Verification
To prevent fraudulent accounts, bogus task claims, and dispatch spam:
- **Email Verification**: OTP 6-digit cryptographic verification code sent via Brevo / Resend SMTP gateway.
- **Phone Verification**: OTP 6-digit SMS verification code sent via Fast2SMS / Twilio.
- **Enforcement Rules**:
  - Customers cannot submit a booking checkout until both email and phone are verified.
  - Providers cannot claim tasks from the available dispatch feed or update task progression until both contact methods are verified.

### 3.2 Provider Approval Governance
- Newly registered partners are marked with `approved = false`.
- Only approved providers can be assigned to bookings or appear in customer provider availability searches.
- Administrators review provider background, certifications, and vehicle registration before setting `approved = true`.

---

## 4. Network Security & Data Protection

### 4.1 Cross-Origin Resource Sharing (CORS)
- In local development: Proxied through Vite dev server (`http://localhost:5173`).
- In production: Strict whitelist configuration via `CORS_ALLOWED_ORIGINS` (e.g. `https://taaskr.vercel.app`). All wildcard `*` origins are rejected in production.

### 4.2 Database Security & TLS
- Database transport is encrypted via `TLSv1.3` (`sslMode=REQUIRED`) connecting to Aiven Managed MySQL.
- SQL injection prevention through Spring Data JPA parameterized prepared statements and Criteria API.

### 4.3 Payment Gateway Verification (Razorpay)
- Online transaction capture requires verifying the `razorpay_signature` using HMAC SHA-256:
  $$\text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
- Payment status cannot be spoofed by client payload manipulation.
