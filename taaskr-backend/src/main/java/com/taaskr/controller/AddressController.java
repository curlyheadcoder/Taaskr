package com.taaskr.controller;

import com.taaskr.dto.address.AddressResponse;
import com.taaskr.dto.address.CreateAddressRequest;
import com.taaskr.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
@PreAuthorize("hasRole('USER')")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<AddressResponse> getMyAddresses(Authentication authentication) {
        return addressService.getMyAddresses(authentication.getName());
    }

    @GetMapping("/default")
    public AddressResponse getDefaultAddress(Authentication authentication) {
        return addressService.getDefaultAddress(authentication.getName());
    }

    @PostMapping
    public AddressResponse addAddress(@Valid @RequestBody CreateAddressRequest request, Authentication authentication) {
        return addressService.addAddress(authentication.getName(), request);
    }

    @PutMapping("/{addressId}")
    public AddressResponse updateAddress(@PathVariable Long addressId,
                                         @Valid @RequestBody CreateAddressRequest request,
                                         Authentication authentication) {
        return addressService.updateAddress(authentication.getName(), addressId, request);
    }

    @DeleteMapping("/{addressId}")
    public Map<String, Boolean> deleteAddress(@PathVariable Long addressId, Authentication authentication) {
        addressService.deleteAddress(authentication.getName(), addressId);
        return Map.of("success", true);
    }

    @PutMapping("/{addressId}/default")
    public AddressResponse setDefaultAddress(@PathVariable Long addressId, Authentication authentication) {
        return addressService.setDefaultAddress(authentication.getName(), addressId);
    }
}
