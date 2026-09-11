package com.taaskr.service;

import com.taaskr.dto.service.ServiceResponse;
import java.util.List;

public interface FavoriteService {
    List<ServiceResponse> getMyFavorites(String userEmail);
    boolean isFavorite(String userEmail, Long serviceId);
    void addFavorite(String userEmail, Long serviceId);
    void removeFavorite(String userEmail, Long serviceId);
}
