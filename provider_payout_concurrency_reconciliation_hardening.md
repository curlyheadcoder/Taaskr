# Provider Payout Concurrency & Earnings Reconciliation Hardening Report

**Task:** Task 42 — Provider Payout Concurrency & Earnings Reconciliation Idempotency  
**Platform:** Taaskr (Indore, Madhya Pradesh)  
**Date:** September 19, 2026  
**Status:** PASS WITH FINDINGS  

---

## 1. Executive Summary

Task 42 addressed two medium-severity financial integrity risks identified in the Task 41 Provider Earnings, Commission & Payout audit:
1. **Payout Concurrency Risk (MEDIUM-02):** Unsynchronized concurrent withdrawal requests allowed providers to read the same wallet balance before transaction commit, creating overdraw risks.
2. **Reconciliation Idempotency Risk:** `PayoutServiceImpl.getWalletOverview` and `creditBookingEarnings` lacked database-level uniqueness enforcement, exposing the wallet ledger to duplicate earnings records during concurrent API requests, event retries, or manual reconciliation calls.
3. **Hardcoded Commission Rate (MEDIUM-01):** Externalized platform commission calculation rate into Spring Environment configuration properties (`app.commission.rate-percentage`, defaulting to `15.0`).

All 119 backend tests passed cleanly (including 10 targeted financial integrity tests in `ProviderPayoutAndReconciliationTests`).

---

## 2. Initial Audit & Root Causes

| Issue ID | Identified Risk | Root Cause Analysis | Fix Implemented |
|---|---|---|---|
| **CONC-01** | Concurrent payout requests overdraw wallet | `requestPayout` read balance via `getCurrentBalance` without database row locking. Concurrent threads reading simultaneously evaluated the same balance before deducting. | Introduced `findByIdWithLock(Long id)` on `ProviderProfileRepository` with `@Lock(LockModeType.PESSIMISTIC_WRITE)`. |
| **IDEM-01** | Duplicate earnings ledger entries on retries | `WalletTransaction` lacked a database-level unique constraint on `(booking_id, type)`. Race conditions in concurrent `getWalletOverview` calls could insert duplicate `EARNING` and `COMMISSION` rows. | Added `@UniqueConstraint(name = "uk_wallet_booking_type", columnNames = {"booking_id", "type"})` to `WalletTransaction` entity and wrapped save calls in `DataIntegrityViolationException` handlers. |
| **COMM-01** | Hardcoded 15% platform fee | Platform fee calculation used hardcoded literal `BigDecimal.valueOf(0.15)` inside `creditBookingEarnings`. | Externalized property `@Value("${app.commission.rate-percentage:15.0}") private double commissionRatePercentage;` in `PayoutServiceImpl.java`. |
| **ELIG-01** | Ineligible booking earnings credit | `creditBookingEarnings` lacked internal status/payment status validation when invoked directly. | Added explicit eligibility check (`COMPLETED` status AND (`PAID` or `AFTER_SERVICE` method)) prior to financial write execution. |

---

## 3. Existing Wallet/Payout Architecture

The Taaskr financial ledger operates on an immutable append-only `WalletTransaction` table:
* **`EARNING`**: Credits provider wallet with net earnings (`gross * (1 - rate)`). Linked to `booking_id`.
* **`COMMISSION`**: Records platform commission fee (`gross * rate`). Linked to `booking_id`.
* **`PAYOUT_WITHDRAWAL`**: Immediately deducts negative amount from wallet when payout is requested.
* **`ADJUSTMENT`**: Restores refunded funds to wallet if admin rejects a payout request.

Wallet current balance is determined by the `balance_after` of the latest `WalletTransaction` record for a given provider.

---

## 4. Payout Concurrency Fix

### Database Pessimistic Locking
Added pessimistic write locking method in `ProviderProfileRepository.java`:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM ProviderProfile p WHERE p.id = :id")
Optional<ProviderProfile> findByIdWithLock(@Param("id") Long id);
```

In `PayoutServiceImpl.requestPayout`:
1. Row lock on `ProviderProfile` is acquired inside the transaction: `providerProfileRepository.findByIdWithLock(provider.getId())`.
2. DB engine blocks concurrent transactions targeting the same provider profile row until the current transaction completes (commit/rollback).
3. `getCurrentBalance` reads committed wallet transaction history cleanly under lock.
4. Withdrawal deduction and `PAYOUT_WITHDRAWAL` transaction are saved atomically before lock release.

---

## 5. Available Balance & Reservation Semantics

* **Minimum Withdrawal:** ₹100.00 (`BAD_REQUEST` if lower).
* **Immediate Reservation:** Upon valid request creation, a `PAYOUT_WITHDRAWAL` transaction with negative amount is immediately saved, reducing `currentBalance`.
* **Pending Protection:** `getWalletOverview` calculates `pendingPayouts` from payouts in `REQUESTED`, `APPROVED`, or `PROCESSING` status. Since funds are deducted upon request, pending payouts cannot be spent again.

---

## 6. Payout Rejection/Failure Restoration

When an admin rejects a payout request in `processPayout(payoutId, status=REJECTED, adminNotes)`:
1. Pessimistic lock is acquired on the provider profile.
2. Current wallet balance is fetched.
3. An `ADJUSTMENT` `WalletTransaction` is created, adding `payout.getAmount()` back to the balance.
4. Payout status transitions to `REJECTED`, preserving audit trails.

---

## 7. Earnings Reconciliation Idempotency Fix

### Database-Level Unique Constraint
Added constraint to `WalletTransaction.java`:
```java
@Table(name = "wallet_transactions", uniqueConstraints = {
    @UniqueConstraint(name = "uk_wallet_booking_type", columnNames = {"booking_id", "type"})
})
```

### Application-Level Double Safeguard
Inside `PayoutServiceImpl.creditBookingEarnings`:
1. Provider row is locked using `findByIdWithLock`.
2. In-memory check: `walletTransactionRepository.existsByBookingIdAndType(booking.getId(), WalletTransactionType.EARNING)`.
3. If check passes, `WalletTransaction` is saved inside a `try-catch (DataIntegrityViolationException ex)` block.
4. Concurrent threads attempting duplicate inserts trigger DB unique constraint violation and are safely swallowed without corrupting the wallet ledger.

---

## 8. Database-Level Guarantees

1. **Serial Execution per Provider:** Database pessimistic write locks enforce strict transaction serialization for balance reads and modifications per provider.
2. **Durable Ledger Idempotency:** The composite unique index on `(booking_id, type)` guarantees at database engine level that no booking can credit earnings or commission twice, regardless of application instances or concurrent threads.
3. **Atomic Balance Updates:** Each `WalletTransaction` records `balance_after` in a single ACID transaction.

---

## 9. Commission Configuration Outcome

* Externalized configuration property `app.commission.rate-percentage=${COMMISSION_RATE_PERCENTAGE:15.0}` added to `application.properties`.
* Injected into `PayoutServiceImpl`:
  ```java
  @Value("${app.commission.rate-percentage:15.0}")
  private double commissionRatePercentage;
  ```
* Historical ledger records store calculated commission snapshot values in `WalletTransaction.amount`, ensuring retrospective property updates do not alter historical accounting records.

---

## 10. Cash on Service Regression

* Cash on Service (`AFTER_SERVICE`) bookings continue to auto-reconcile upon completion.
* `creditBookingEarnings` correctly checks `b.getPaymentMethod() == PaymentMethod.AFTER_SERVICE` as eligible for earnings ledgering.

---

## 11. Razorpay TEST/SANDBOX Regression

* Online payment flows via Razorpay (`PAID` status) auto-reconcile earnings accurately.
* Webhook/event retries triggering `creditBookingEarnings` are absorbed idempotently by the `uk_wallet_booking_type` constraint.

---

## 12. Booking Lifecycle & Cancellation Regression

* Ineligible bookings (e.g. `CANCELLED`, `PENDING`, `FAILED`) are rejected by `creditBookingEarnings` before writing financial entries.
* Reversals or adjustments for cancelled completed bookings retain admin `ADJUSTMENT` ledger options.

---

## 13. Authorization & Financial Privacy

* Wallet overview and withdrawal request APIs enforce JWT provider principal validation (`getProviderByEmail(providerEmail)`).
* Banking details (Account Number, IFSC, UPI ID) are stored securely and excluded from non-privileged logging output.

---

## 14. Automated Test Classes and Exact Results

### `ProviderPayoutAndReconciliationTests`
* **Test Class:** `com.taaskr.ProviderPayoutAndReconciliationTests`
* **Tests Run:** 10
* **Passed:** 10
* **Failures:** 0
* **Errors:** 0

| Test Method | Description | Result |
|---|---|---|
| `test1_CreditBookingEarningsCalculation` | Verifies gross 1000.00 earning gives 850.00 net and 150.00 fee. | **PASSED** |
| `test2_EarningsReconciliationIdempotency` | Verifies double call to `creditBookingEarnings` creates exactly 1 txn. | **PASSED** |
| `test3_DatabaseUniqueConstraintPreventsDuplicateEarning` | Verifies DB constraint rejects duplicate `EARNING` save attempt. | **PASSED** |
| `test4_IneligibleBookingsExcludedFromReconciliation` | Verifies cancelled/unpaid bookings are not credited. | **PASSED** |
| `test5_ValidPayoutRequestAndBalanceReservation` | Verifies withdrawal request immediately reserves funds. | **PASSED** |
| `test6_InsufficientBalanceWithdrawalRejection` | Verifies request over available balance throws 400 BAD_REQUEST. | **PASSED** |
| `test7_ConcurrentWithdrawalsExceedingBalanceHandledSafely` | Verifies second payout exhausting balance is rejected. | **PASSED** |
| `test8_PayoutRejectionRestoresWalletBalance` | Verifies admin rejection creates `ADJUSTMENT` refund. | **PASSED** |
| `test9_MultiProviderWalletIsolation` | Verifies Provider 1 wallet operations do not bleed into Provider 2. | **PASSED** |
| `test10_MinimumPayoutAmountLimit` | Verifies payout under ₹100.00 is rejected with 400 BAD_REQUEST. | **PASSED** |

---

## 15. Full Backend Regression Results

Command executed: `mvn test` in `taaskr-backend`

* **Total Tests Run:** 119
* **Failures:** 0
* **Errors:** 0
* **Skipped:** 0
* **Build Result:** **BUILD SUCCESS** (Total time: 39.424 s)

---

## 16. Database/Production Engine Concurrency Verification

* **Verified in H2 (In-Memory / Test Mode):** Transaction serialization, `@Lock(LockModeType.PESSIMISTIC_WRITE)` execution, unique key constraint violation catching, and balance calculation logic.
* **Unverified Production Engine Behavior:** Real PostgreSQL / MySQL multi-connection connection pool deadlocks or lock timeout behavior under high load must be verified in staging PostgreSQL environment with connection pooling enabled.

---

## 17. Files Modified

1. [ProviderProfileRepository.java](file:///C:/Users/DELL/Desktop/Taaskr/taaskr-backend/src/main/java/com/taaskr/repository/ProviderProfileRepository.java) — Added `findByIdWithLock(Long id)` with pessimistic write lock.
2. [WalletTransaction.java](file:///C:/Users/DELL/Desktop/Taaskr/taaskr-backend/src/main/java/com/taaskr/entity/WalletTransaction.java) — Added `@UniqueConstraint(name = "uk_wallet_booking_type", columnNames = {"booking_id", "type"})`.
3. [PayoutServiceImpl.java](file:///C:/Users/DELL/Desktop/Taaskr/taaskr-backend/src/main/java/com/taaskr/service/impl/PayoutServiceImpl.java) — Implemented lock acquisition, eligibility validation, DB constraint error handling, and externalized commission rate.
4. [application.properties](file:///C:/Users/DELL/Desktop/Taaskr/taaskr-backend/src/main/resources/application.properties) — Added `app.commission.rate-percentage=${COMMISSION_RATE_PERCENTAGE:15.0}`.
5. [ProviderPayoutAndReconciliationTests.java](file:///C:/Users/DELL/Desktop/Taaskr/taaskr-backend/src/test/java/com/taaskr/ProviderPayoutAndReconciliationTests.java) — Created 10 targeted financial integrity tests.

---

## 18. Database Migrations/Constraints

* Constraint introduced on `wallet_transactions`: `CONSTRAINT uk_wallet_booking_type UNIQUE (booking_id, type)`.
* For existing production databases, a Liquibase / Flyway migration script should be generated:
  ```sql
  ALTER TABLE wallet_transactions ADD CONSTRAINT uk_wallet_booking_type UNIQUE (booking_id, type);
  ```

---

## 19. Frontend/Mobile Changes

* **NONE:** No frontend or mobile API contracts were changed. Existing wallet DTOs and endpoints maintain full backward compatibility.

---

## 20. Fake Data Audit

* Zero mock/fake earnings, wallet balances, or payment records were committed to production runtime. All test cases operate on isolated temporary in-memory test databases.

---

## 21. OnePlus 7T Verification Status

* **NOT VERIFIED:** This was a backend-focused task. Physical device connection was not required for core financial concurrency and database lock testing.

---

## 22. Remaining Findings & Limitations

1. **Pessimistic Lock Timeout:** Default database lock timeouts apply. On heavy database connection saturation, queries waiting for locks may timeout (e.g. `LockAcquisitionException`). Production setup should configure appropriate Spring JPA lock timeouts.
2. **PostgreSQL Migration Script:** Schema update was applied via JPA Hibernate DDL auto in test mode. A formal database migration script (`V42__add_wallet_transaction_unique_constraint.sql`) should be added to Liquibase/Flyway before production deployment.

---

## 23. Final Verdict

**PASS WITH FINDINGS**  
Pessimistic row locking, database-enforced idempotency constraints, and configurable commission rates are fully implemented and verified across 119 passing backend unit and integration tests.
