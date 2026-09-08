package com.taaskr.dto.payout;

import com.taaskr.enums.WalletTransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class WalletOverviewResponse {

    private BigDecimal currentBalance;
    private BigDecimal lifetimeEarnings;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalWithdrawn;
    private BigDecimal pendingPayouts;
    private List<TransactionItem> recentTransactions;
    private List<PayoutResponse> recentPayoutRequests;

    public WalletOverviewResponse() {
    }

    public WalletOverviewResponse(BigDecimal currentBalance, BigDecimal lifetimeEarnings, BigDecimal totalPlatformFees, BigDecimal totalWithdrawn, BigDecimal pendingPayouts, List<TransactionItem> recentTransactions, List<PayoutResponse> recentPayoutRequests) {
        this.currentBalance = currentBalance;
        this.lifetimeEarnings = lifetimeEarnings;
        this.totalPlatformFees = totalPlatformFees;
        this.totalWithdrawn = totalWithdrawn;
        this.pendingPayouts = pendingPayouts;
        this.recentTransactions = recentTransactions;
        this.recentPayoutRequests = recentPayoutRequests;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }

    public BigDecimal getLifetimeEarnings() {
        return lifetimeEarnings;
    }

    public void setLifetimeEarnings(BigDecimal lifetimeEarnings) {
        this.lifetimeEarnings = lifetimeEarnings;
    }

    public BigDecimal getTotalPlatformFees() {
        return totalPlatformFees;
    }

    public void setTotalPlatformFees(BigDecimal totalPlatformFees) {
        this.totalPlatformFees = totalPlatformFees;
    }

    public BigDecimal getTotalWithdrawn() {
        return totalWithdrawn;
    }

    public void setTotalWithdrawn(BigDecimal totalWithdrawn) {
        this.totalWithdrawn = totalWithdrawn;
    }

    public BigDecimal getPendingPayouts() {
        return pendingPayouts;
    }

    public void setPendingPayouts(BigDecimal pendingPayouts) {
        this.pendingPayouts = pendingPayouts;
    }

    public List<TransactionItem> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<TransactionItem> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }

    public List<PayoutResponse> getRecentPayoutRequests() {
        return recentPayoutRequests;
    }

    public void setRecentPayoutRequests(List<PayoutResponse> recentPayoutRequests) {
        this.recentPayoutRequests = recentPayoutRequests;
    }

    public static class TransactionItem {
        private Long id;
        private Long bookingId;
        private String bookingCode;
        private WalletTransactionType type;
        private BigDecimal amount;
        private BigDecimal balanceAfter;
        private String description;
        private LocalDateTime createdAt;

        public TransactionItem() {
        }

        public TransactionItem(Long id, Long bookingId, String bookingCode, WalletTransactionType type, BigDecimal amount, BigDecimal balanceAfter, String description, LocalDateTime createdAt) {
            this.id = id;
            this.bookingId = bookingId;
            this.bookingCode = bookingCode;
            this.type = type;
            this.amount = amount;
            this.balanceAfter = balanceAfter;
            this.description = description;
            this.createdAt = createdAt;
        }

        public Long getId() {
            return id;
        }

        public Long getBookingId() {
            return bookingId;
        }

        public String getBookingCode() {
            return bookingCode;
        }

        public WalletTransactionType getType() {
            return type;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public BigDecimal getBalanceAfter() {
            return balanceAfter;
        }

        public String getDescription() {
            return description;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
    }
}
