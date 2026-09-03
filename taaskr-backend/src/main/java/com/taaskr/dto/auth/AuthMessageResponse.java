package com.taaskr.dto.auth;

public class AuthMessageResponse {

    private boolean success;
    private String message;
    private String email;
    private String devOtp;

    public AuthMessageResponse() {
    }

    public AuthMessageResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public AuthMessageResponse(boolean success, String message, String email) {
        this.success = success;
        this.message = message;
        this.email = email;
    }

    public AuthMessageResponse(boolean success, String message, String email, String devOtp) {
        this.success = success;
        this.message = message;
        this.email = email;
        this.devOtp = devOtp;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDevOtp() {
        return devOtp;
    }

    public void setDevOtp(String devOtp) {
        this.devOtp = devOtp;
    }
}
