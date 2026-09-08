package com.taaskr.controller;

import com.taaskr.dto.payout.PayoutResponse;
import com.taaskr.dto.payout.ProcessPayoutRequest;
import com.taaskr.dto.payout.RequestPayoutRequest;
import com.taaskr.dto.payout.WalletOverviewResponse;
import com.taaskr.service.PayoutService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PayoutController {

    private final PayoutService payoutService;

    public PayoutController(PayoutService payoutService) {
        this.payoutService = payoutService;
    }

    @GetMapping("/provider/wallet")
    @PreAuthorize("hasRole('PROVIDER')")
    public WalletOverviewResponse getWalletOverview(Authentication authentication) {
        return payoutService.getWalletOverview(authentication.getName());
    }

    @PostMapping("/provider/payouts/request")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<PayoutResponse> requestPayout(@Valid @RequestBody RequestPayoutRequest request, Authentication authentication) {
        PayoutResponse response = payoutService.requestPayout(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/provider/payouts")
    @PreAuthorize("hasRole('PROVIDER')")
    public List<PayoutResponse> getMyPayouts(Authentication authentication) {
        return payoutService.getMyPayouts(authentication.getName());
    }

    @GetMapping("/admin/payouts")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PayoutResponse> getAllPayoutsForAdmin() {
        return payoutService.getAllPayoutsForAdmin();
    }

    @PatchMapping("/admin/payouts/{id}/process")
    @PreAuthorize("hasRole('ADMIN')")
    public PayoutResponse processPayout(@PathVariable Long id, @Valid @RequestBody ProcessPayoutRequest request, Authentication authentication) {
        return payoutService.processPayout(id, request, authentication.getName());
    }
}
