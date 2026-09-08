package com.taaskr.controller;

import com.taaskr.dto.dispute.CreateDisputeRequest;
import com.taaskr.dto.dispute.DisputeResponse;
import com.taaskr.dto.dispute.ResolveDisputeRequest;
import com.taaskr.service.DisputeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping("/disputes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DisputeResponse> createDispute(@Valid @RequestBody CreateDisputeRequest request, Authentication authentication) {
        DisputeResponse response = disputeService.createDispute(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/disputes/my")
    @PreAuthorize("isAuthenticated()")
    public List<DisputeResponse> getMyDisputes(Authentication authentication) {
        return disputeService.getMyDisputes(authentication.getName());
    }

    @GetMapping("/disputes/provider")
    @PreAuthorize("hasRole('PROVIDER')")
    public List<DisputeResponse> getProviderDisputes(Authentication authentication) {
        return disputeService.getProviderDisputes(authentication.getName());
    }

    @GetMapping("/admin/disputes")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DisputeResponse> getAllDisputesForAdmin() {
        return disputeService.getAllDisputesForAdmin();
    }

    @GetMapping("/admin/disputes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DisputeResponse getDisputeById(@PathVariable Long id) {
        return disputeService.getDisputeById(id);
    }

    @PatchMapping("/admin/disputes/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public DisputeResponse resolveDispute(@PathVariable Long id, @Valid @RequestBody ResolveDisputeRequest request, Authentication authentication) {
        return disputeService.resolveDispute(id, request, authentication.getName());
    }
}
