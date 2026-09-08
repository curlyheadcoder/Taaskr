package com.taaskr.service;

import com.taaskr.dto.address.CreateAddressRequest;
import com.taaskr.dto.address.AddressResponse;

import java.util.List;

public interface AddressService {
    AddressResponse addAddress(String userEmail, CreateAddressRequest request);
    AddressResponse updateAddress(String userEmail, Long addressId, CreateAddressRequest request);
    List<AddressResponse> getMyAddresses(String userEmail);
    AddressResponse getDefaultAddress(String userEmail);
    void deleteAddress(String userEmail, Long addressId);
    AddressResponse setDefaultAddress(String userEmail, Long addressId);
}
