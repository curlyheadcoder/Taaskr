package com.taaskr.dto.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PushTokenRequest {

    @NotBlank(message = "Push token is required")
    @Size(max = 500, message = "Push token length is invalid")
    private String token;

    @Size(max = 30, message = "Platform length is invalid")
    private String platform = "ANDROID";

    @Size(max = 30, message = "Provider length is invalid")
    private String provider = "EXPO";

    public PushTokenRequest() {
    }

    public PushTokenRequest(String token, String platform, String provider) {
        this.token = token;
        this.platform = platform;
        this.provider = provider;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}
