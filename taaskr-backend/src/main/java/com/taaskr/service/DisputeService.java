package com.taaskr.service;

import com.taaskr.dto.dispute.CreateDisputeRequest;
import com.taaskr.dto.dispute.DisputeResponse;
import com.taaskr.dto.dispute.ResolveDisputeRequest;

import java.util.List;

public interface DisputeService {
    DisputeResponse createDispute(CreateDisputeRequest request, String userEmail);
    List<DisputeResponse> getMyDisputes(String userEmail);
    List<DisputeResponse> getProviderDisputes(String providerEmail);
    List<DisputeResponse> getAllDisputesForAdmin();
    DisputeResponse getDisputeById(Long id);
    DisputeResponse resolveDispute(Long id, ResolveDisputeRequest request, String adminEmail);
    DisputeResponse replyToDispute(Long id, String message, String userEmail);
}

