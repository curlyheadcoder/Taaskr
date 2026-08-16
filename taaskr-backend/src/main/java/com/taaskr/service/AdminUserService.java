package com.taaskr.service;

import com.taaskr.dto.admin.AdminUserResponse;

import java.util.List;

public interface AdminUserService {
    List<AdminUserResponse> getAllUsers();
}
