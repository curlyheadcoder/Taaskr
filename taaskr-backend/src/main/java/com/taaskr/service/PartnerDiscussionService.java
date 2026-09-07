package com.taaskr.service;

import com.taaskr.dto.discussion.CreateDiscussionRequest;
import com.taaskr.dto.discussion.DiscussionResponse;
import com.taaskr.dto.discussion.ReplyDiscussionRequest;
import com.taaskr.dto.discussion.UpdateDiscussionStatusRequest;
import com.taaskr.enums.DiscussionStatus;

import java.util.List;

public interface PartnerDiscussionService {

    DiscussionResponse createDiscussion(String providerEmail, CreateDiscussionRequest request);

    List<DiscussionResponse> getProviderDiscussions(String providerEmail);

    DiscussionResponse getDiscussionByIdForProvider(String providerEmail, Long discussionId);

    DiscussionResponse replyDiscussionByProvider(String providerEmail, Long discussionId, ReplyDiscussionRequest request);

    List<DiscussionResponse> getAllDiscussionsForAdmin(DiscussionStatus statusFilter);

    DiscussionResponse getDiscussionByIdForAdmin(Long discussionId);

    DiscussionResponse replyDiscussionByAdmin(String adminEmail, Long discussionId, ReplyDiscussionRequest request);

    DiscussionResponse updateDiscussionStatus(Long discussionId, UpdateDiscussionStatusRequest request);
}
