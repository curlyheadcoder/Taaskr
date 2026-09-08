package com.taaskr.service.impl;

import com.taaskr.dto.admin.AdminUserResponse;
import com.taaskr.entity.User;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.AdminUserService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;

    public AdminUserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public com.taaskr.dto.common.PageResponse<AdminUserResponse> getAllUsers(org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<User> page = userRepository.findAll(pageable);
        return com.taaskr.dto.common.PageResponse.of(page, this::mapToResponse);
    }

    private AdminUserResponse mapToResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getCity(),
                user.getPincode(),
                user.getEnabled(),
                Boolean.TRUE.equals(user.getEmailVerified()),
                Boolean.TRUE.equals(user.getPhoneVerified()),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
