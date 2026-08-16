package com.taaskr.service;

import com.taaskr.dto.admin.AdminBookingResponse;

import java.util.List;

public interface AdminBookingService {

    List<AdminBookingResponse> getAllBookings();
}
