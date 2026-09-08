package com.taaskr.service;

import com.taaskr.dto.payout.PayoutResponse;
import com.taaskr.dto.payout.ProcessPayoutRequest;
import com.taaskr.dto.payout.RequestPayoutRequest;
import com.taaskr.dto.payout.WalletOverviewResponse;
import com.taaskr.entity.Booking;

import java.util.List;

public interface PayoutService {
    WalletOverviewResponse getWalletOverview(String providerEmail);
    PayoutResponse requestPayout(RequestPayoutRequest request, String providerEmail);
    List<PayoutResponse> getMyPayouts(String providerEmail);
    List<PayoutResponse> getAllPayoutsForAdmin();
    PayoutResponse processPayout(Long payoutId, ProcessPayoutRequest request, String adminEmail);
    void creditBookingEarnings(Booking booking);
}
