package com.taaskr.dto.booking;

import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.VehicleType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LiveTrackingResponse {

    private Long bookingId;
    private String bookingCode;
    private BookingStatus status;

    private Long serviceId;
    private String serviceName;
    private String categoryName;

    // Customer / Pickup Details
    private Long userId;
    private String customerName;
    private String address;
    private String city;
    private String pincode;
    private BigDecimal customerLatitude;
    private BigDecimal customerLongitude;

    // Drop Details (for vehicle transport)
    private String dropAddress;
    private String dropCity;
    private String dropPincode;
    private BigDecimal dropLatitude;
    private BigDecimal dropLongitude;

    // Provider Details
    private Long providerId;
    private String providerName;
    private String providerPhone;
    private Double providerRating;
    private Integer providerExperienceYears;
    private String providerBio;

    // Service Partner Details (if assigned)
    private Long servicePartnerId;
    private String servicePartnerName;
    private String servicePartnerPhone;
    private String servicePartnerTitle;
    private Double servicePartnerRating;
    private BigDecimal partnerLatitude;
    private BigDecimal partnerLongitude;
    private Boolean arrived;

    // Vehicle Details (if applicable)
    private VehicleType vehicleType;
    private String vehicleModel;
    private String vehicleRegistrationNumber;

    // Live Telemetry
    private BigDecimal providerLatitude;
    private BigDecimal providerLongitude;
    private LocalDateTime locationUpdatedAt;
    private Boolean isLive;

    // Calculated Metrics
    private BigDecimal distanceKm;
    private Integer estimatedEtaMinutes;
    private String routeSource;

    public LiveTrackingResponse() {
    }

    public String getRouteSource() {
        return routeSource;
    }

    public void setRouteSource(String routeSource) {
        this.routeSource = routeSource;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getBookingCode() {
        return bookingCode;
    }

    public void setBookingCode(String bookingCode) {
        this.bookingCode = bookingCode;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public BigDecimal getCustomerLatitude() {
        return customerLatitude;
    }

    public void setCustomerLatitude(BigDecimal customerLatitude) {
        this.customerLatitude = customerLatitude;
    }

    public BigDecimal getCustomerLongitude() {
        return customerLongitude;
    }

    public void setCustomerLongitude(BigDecimal customerLongitude) {
        this.customerLongitude = customerLongitude;
    }

    public String getDropAddress() {
        return dropAddress;
    }

    public void setDropAddress(String dropAddress) {
        this.dropAddress = dropAddress;
    }

    public String getDropCity() {
        return dropCity;
    }

    public void setDropCity(String dropCity) {
        this.dropCity = dropCity;
    }

    public String getDropPincode() {
        return dropPincode;
    }

    public void setDropPincode(String dropPincode) {
        this.dropPincode = dropPincode;
    }

    public BigDecimal getDropLatitude() {
        return dropLatitude;
    }

    public void setDropLatitude(BigDecimal dropLatitude) {
        this.dropLatitude = dropLatitude;
    }

    public BigDecimal getDropLongitude() {
        return dropLongitude;
    }

    public void setDropLongitude(BigDecimal dropLongitude) {
        this.dropLongitude = dropLongitude;
    }

    public Long getProviderId() {
        return providerId;
    }

    public void setProviderId(Long providerId) {
        this.providerId = providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getProviderPhone() {
        return providerPhone;
    }

    public void setProviderPhone(String providerPhone) {
        this.providerPhone = providerPhone;
    }

    public Double getProviderRating() {
        return providerRating;
    }

    public void setProviderRating(Double providerRating) {
        this.providerRating = providerRating;
    }

    public Integer getProviderExperienceYears() {
        return providerExperienceYears;
    }

    public void setProviderExperienceYears(Integer providerExperienceYears) {
        this.providerExperienceYears = providerExperienceYears;
    }

    public String getProviderBio() {
        return providerBio;
    }

    public void setProviderBio(String providerBio) {
        this.providerBio = providerBio;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public String getVehicleRegistrationNumber() {
        return vehicleRegistrationNumber;
    }

    public void setVehicleRegistrationNumber(String vehicleRegistrationNumber) {
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
    }

    public BigDecimal getProviderLatitude() {
        return providerLatitude;
    }

    public void setProviderLatitude(BigDecimal providerLatitude) {
        this.providerLatitude = providerLatitude;
    }

    public BigDecimal getProviderLongitude() {
        return providerLongitude;
    }

    public void setProviderLongitude(BigDecimal providerLongitude) {
        this.providerLongitude = providerLongitude;
    }

    public LocalDateTime getLocationUpdatedAt() {
        return locationUpdatedAt;
    }

    public void setLocationUpdatedAt(LocalDateTime locationUpdatedAt) {
        this.locationUpdatedAt = locationUpdatedAt;
    }

    public Boolean getIsLive() {
        return isLive;
    }

    public void setIsLive(Boolean isLive) {
        this.isLive = isLive;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Integer getEstimatedEtaMinutes() {
        return estimatedEtaMinutes;
    }

    public void setEstimatedEtaMinutes(Integer estimatedEtaMinutes) {
        this.estimatedEtaMinutes = estimatedEtaMinutes;
    }

    public Long getServicePartnerId() {
        return servicePartnerId;
    }

    public void setServicePartnerId(Long servicePartnerId) {
        this.servicePartnerId = servicePartnerId;
    }

    public String getServicePartnerName() {
        return servicePartnerName;
    }

    public void setServicePartnerName(String servicePartnerName) {
        this.servicePartnerName = servicePartnerName;
    }

    public String getServicePartnerPhone() {
        return servicePartnerPhone;
    }

    public void setServicePartnerPhone(String servicePartnerPhone) {
        this.servicePartnerPhone = servicePartnerPhone;
    }

    public String getServicePartnerTitle() {
        return servicePartnerTitle;
    }

    public void setServicePartnerTitle(String servicePartnerTitle) {
        this.servicePartnerTitle = servicePartnerTitle;
    }

    public Double getServicePartnerRating() {
        return servicePartnerRating;
    }

    public void setServicePartnerRating(Double servicePartnerRating) {
        this.servicePartnerRating = servicePartnerRating;
    }

    public BigDecimal getPartnerLatitude() {
        return partnerLatitude;
    }

    public void setPartnerLatitude(BigDecimal partnerLatitude) {
        this.partnerLatitude = partnerLatitude;
    }

    public BigDecimal getPartnerLongitude() {
        return partnerLongitude;
    }

    public void setPartnerLongitude(BigDecimal partnerLongitude) {
        this.partnerLongitude = partnerLongitude;
    }

    public Boolean getArrived() {
        return arrived;
    }

    public void setArrived(Boolean arrived) {
        this.arrived = arrived;
    }
}
