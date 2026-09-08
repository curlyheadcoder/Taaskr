package com.taaskr.service;

import com.taaskr.dto.admin.AdminUserResponse;
import com.taaskr.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminUserService {
    List<AdminUserResponse> getAllUsers();

    PageResponse<AdminUserResponse> getAllUsers(Pageable pageable);
}
