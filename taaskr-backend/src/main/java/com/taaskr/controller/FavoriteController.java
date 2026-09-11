package com.taaskr.controller;

import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<ServiceResponse> getMyFavorites(Authentication authentication) {
        checkAuth(authentication);
        return favoriteService.getMyFavorites(authentication.getName());
    }

    @GetMapping("/check/{serviceId}")
    public Map<String, Boolean> isFavorite(@PathVariable Long serviceId, Authentication authentication) {
        checkAuth(authentication);
        boolean isFav = favoriteService.isFavorite(authentication.getName(), serviceId);
        return Map.of("isFavorite", isFav);
    }

    @PostMapping("/{serviceId}")
    public Map<String, Object> addFavorite(@PathVariable Long serviceId, Authentication authentication) {
        checkAuth(authentication);
        favoriteService.addFavorite(authentication.getName(), serviceId);
        return Map.of("success", true, "message", "Service added to favorites");
    }

    @DeleteMapping("/{serviceId}")
    public Map<String, Object> removeFavorite(@PathVariable Long serviceId, Authentication authentication) {
        checkAuth(authentication);
        favoriteService.removeFavorite(authentication.getName(), serviceId);
        return Map.of("success", true, "message", "Service removed from favorites");
    }

    private void checkAuth(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
    }
}
