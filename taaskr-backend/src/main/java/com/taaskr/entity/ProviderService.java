package com.taaskr.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "provider_service",
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"provider_id", "service_id"})
})
public class ProviderService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    public ProviderService() {
    }

    public Long getId() {
        return id;
    }

    public ProviderProfile getProvider() {
        return provider;
    }

    public Service getService() {
        return service;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setProvider(ProviderProfile provider) {
        this.provider = provider;
    }

    public void setService(Service service) {
        this.service = service;
    }
}
