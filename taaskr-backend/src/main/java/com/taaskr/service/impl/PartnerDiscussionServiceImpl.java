package com.taaskr.service.impl;

import com.taaskr.dto.discussion.CreateDiscussionRequest;
import com.taaskr.dto.discussion.DiscussionMessageResponse;
import com.taaskr.dto.discussion.DiscussionResponse;
import com.taaskr.dto.discussion.ReplyDiscussionRequest;
import com.taaskr.dto.discussion.UpdateDiscussionStatusRequest;
import com.taaskr.entity.DiscussionMessage;
import com.taaskr.entity.PartnerDiscussion;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.User;
import com.taaskr.enums.DiscussionStatus;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.PartnerDiscussionRepository;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.PartnerDiscussionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PartnerDiscussionServiceImpl implements PartnerDiscussionService {

    private final PartnerDiscussionRepository discussionRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;

    public PartnerDiscussionServiceImpl(PartnerDiscussionRepository discussionRepository,
                                       ProviderProfileRepository providerProfileRepository,
                                       UserRepository userRepository) {
        this.discussionRepository = discussionRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public DiscussionResponse createDiscussion(String providerEmail, CreateDiscussionRequest request) {
        ProviderProfile provider = getProviderByEmail(providerEmail);

        PartnerDiscussion discussion = new PartnerDiscussion();
        discussion.setProvider(provider);
        discussion.setSubject(request.getSubject());
        discussion.setCategory(request.getCategory());
        discussion.setPriority(request.getPriority());
        discussion.setBookingId(request.getBookingId());
        discussion.setStatus(DiscussionStatus.OPEN);

        DiscussionMessage initialMessage = new DiscussionMessage(
                discussion,
                "PROVIDER",
                provider.getUser().getName(),
                request.getMessage()
        );
        discussion.addMessage(initialMessage);

        PartnerDiscussion saved = discussionRepository.save(discussion);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiscussionResponse> getProviderDiscussions(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        return discussionRepository.findByProviderIdOrderByUpdatedAtDesc(provider.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DiscussionResponse getDiscussionByIdForProvider(String providerEmail, Long discussionId) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        PartnerDiscussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion not found with ID: " + discussionId));

        if (!discussion.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("Access denied to this discussion thread.");
        }

        return mapToResponse(discussion);
    }

    @Override
    @Transactional
    public DiscussionResponse replyDiscussionByProvider(String providerEmail, Long discussionId, ReplyDiscussionRequest request) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        PartnerDiscussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion not found with ID: " + discussionId));

        if (!discussion.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("Access denied to this discussion thread.");
        }

        DiscussionMessage reply = new DiscussionMessage(
                discussion,
                "PROVIDER",
                provider.getUser().getName(),
                request.getMessage()
        );
        discussion.addMessage(reply);

        // If previously closed or resolved, reopen if provider continues discussion
        if (discussion.getStatus() == DiscussionStatus.RESOLVED || discussion.getStatus() == DiscussionStatus.CLOSED) {
            discussion.setStatus(DiscussionStatus.IN_REVIEW);
        }

        PartnerDiscussion updated = discussionRepository.save(discussion);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiscussionResponse> getAllDiscussionsForAdmin(DiscussionStatus statusFilter) {
        List<PartnerDiscussion> discussions = (statusFilter != null)
                ? discussionRepository.findByStatusOrderByUpdatedAtDesc(statusFilter)
                : discussionRepository.findAllByOrderByUpdatedAtDesc();

        return discussions.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DiscussionResponse getDiscussionByIdForAdmin(Long discussionId) {
        PartnerDiscussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion not found with ID: " + discussionId));
        return mapToResponse(discussion);
    }

    @Override
    @Transactional
    public DiscussionResponse replyDiscussionByAdmin(String adminEmail, Long discussionId, ReplyDiscussionRequest request) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        PartnerDiscussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion not found with ID: " + discussionId));

        DiscussionMessage reply = new DiscussionMessage(
                discussion,
                "ADMIN",
                admin.getName() != null ? admin.getName() : "Taaskr Support Admin",
                request.getMessage()
        );
        discussion.addMessage(reply);

        if (discussion.getStatus() == DiscussionStatus.OPEN) {
            discussion.setStatus(DiscussionStatus.IN_REVIEW);
        }

        PartnerDiscussion updated = discussionRepository.save(discussion);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public DiscussionResponse updateDiscussionStatus(Long discussionId, UpdateDiscussionStatusRequest request) {
        PartnerDiscussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion not found with ID: " + discussionId));

        discussion.setStatus(request.getStatus());
        PartnerDiscussion updated = discussionRepository.save(discussion);
        return mapToResponse(updated);
    }

    private ProviderProfile getProviderByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Provider user not found with email: " + email));
        return providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found for user ID: " + user.getId()));
    }

    private DiscussionResponse mapToResponse(PartnerDiscussion d) {
        DiscussionResponse res = new DiscussionResponse();
        res.setId(d.getId());
        if (d.getProvider() != null) {
            res.setProviderId(d.getProvider().getId());
            if (d.getProvider().getUser() != null) {
                res.setProviderName(d.getProvider().getUser().getName());
                res.setProviderEmail(d.getProvider().getUser().getEmail());
                res.setProviderPhone(d.getProvider().getUser().getPhone());
                res.setProviderCity(d.getProvider().getUser().getCity());
            }
        }
        res.setSubject(d.getSubject());
        res.setCategory(d.getCategory());
        res.setPriority(d.getPriority());
        res.setStatus(d.getStatus());
        res.setBookingId(d.getBookingId());
        res.setCreatedAt(d.getCreatedAt());
        res.setUpdatedAt(d.getUpdatedAt());

        if (d.getMessages() != null) {
            List<DiscussionMessageResponse> msgResponses = d.getMessages().stream()
                    .map(m -> new DiscussionMessageResponse(
                            m.getId(),
                            m.getSenderRole(),
                            m.getSenderName(),
                            m.getMessage(),
                            m.getCreatedAt()
                    ))
                    .collect(Collectors.toList());
            res.setMessages(msgResponses);
        }

        return res;
    }
}
