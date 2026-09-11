package com.taaskr.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_favorite_services",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_favorite_service", columnNames = {"user_id", "service_id"})
        },
        indexes = {
                @Index(name = "idx_fav_user", columnList = "user_id"),
                @Index(name = "idx_fav_service", columnList = "service_id")
        }
)
public class UserFavoriteService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UserFavoriteService() {
    }

    public UserFavoriteService(User user, Service service) {
        this.user = user;
        this.service = service;
    }

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Service getService() {
        return service;
    }

    public void setService(Service service) {
        this.service = service;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
