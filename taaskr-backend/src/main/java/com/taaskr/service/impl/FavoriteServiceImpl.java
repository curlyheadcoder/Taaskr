package com.taaskr.service.impl;

import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.entity.Service;
import com.taaskr.entity.User;
import com.taaskr.entity.UserFavoriteService;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.repository.UserFavoriteServiceRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.FavoriteService;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class FavoriteServiceImpl implements FavoriteService {

    private final UserFavoriteServiceRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;

    public FavoriteServiceImpl(UserFavoriteServiceRepository favoriteRepository,
                               UserRepository userRepository,
                               ServiceRepository serviceRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.serviceRepository = serviceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceResponse> getMyFavorites(String userEmail) {
        User user = getUser(userEmail);
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(fav -> mapToServiceResponse(fav.getService()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorite(String userEmail, Long serviceId) {
        User user = getUser(userEmail);
        return favoriteRepository.existsByUserIdAndServiceId(user.getId(), serviceId);
    }

    @Override
    @Transactional
    public void addFavorite(String userEmail, Long serviceId) {
        User user = getUser(userEmail);
        Service serviceEntity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));

        if (!favoriteRepository.existsByUserIdAndServiceId(user.getId(), serviceId)) {
            UserFavoriteService fav = new UserFavoriteService(user, serviceEntity);
            favoriteRepository.save(fav);
        }
    }

    @Override
    @Transactional
    public void removeFavorite(String userEmail, Long serviceId) {
        User user = getUser(userEmail);
        favoriteRepository.deleteByUserIdAndServiceId(user.getId(), serviceId);
    }

    private User getUser(String userEmail) {
        return userRepository.findByEmail(userEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private ServiceResponse mapToServiceResponse(Service s) {
        return new ServiceResponse(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getPrice(),
                s.getDurationMinutes(),
                s.getCategory() != null ? s.getCategory().getId() : null,
                s.getCategory() != null ? s.getCategory().getName() : null,
                s.getActive()
        );
    }
}
