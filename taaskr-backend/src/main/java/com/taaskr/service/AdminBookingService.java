package com.taaskr.service;

import com.taaskr.dto.admin.AdminBookingResponse;
import com.taaskr.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminBookingService {

    List<AdminBookingResponse> getAllBookings();

    PageResponse<AdminBookingResponse> getAllBookings(Pageable pageable);
}
