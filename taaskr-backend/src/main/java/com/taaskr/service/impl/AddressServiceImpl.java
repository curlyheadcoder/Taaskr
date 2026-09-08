package com.taaskr.service.impl;

import com.taaskr.dto.address.AddressResponse;
import com.taaskr.dto.address.CreateAddressRequest;
import com.taaskr.entity.Address;
import com.taaskr.entity.User;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.AddressRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.AddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressServiceImpl(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public AddressResponse addAddress(String userEmail, CreateAddressRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.clearDefaultAddresses(user.getId());
        }

        Address address = new Address();
        address.setUser(user);
        address.setLabel(request.getLabel());
        address.setAddressLine(request.getAddressLine().trim());
        address.setCity(request.getCity().trim());
        address.setPincode(request.getPincode().trim());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setIsDefault(Boolean.TRUE.equals(request.getIsDefault()));

        Address saved = addressRepository.save(address);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(String userEmail, Long addressId, CreateAddressRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.clearDefaultAddresses(user.getId());
        }

        address.setLabel(request.getLabel());
        address.setAddressLine(request.getAddressLine().trim());
        address.setCity(request.getCity().trim());
        address.setPincode(request.getPincode().trim());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        if (request.getIsDefault() != null) {
            address.setIsDefault(request.getIsDefault());
        }

        Address updated = addressRepository.save(address);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return addressRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getDefaultAddress(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .map(this::mapToResponse)
                .orElseGet(() -> {
                    List<Address> list = addressRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
                    return list.isEmpty() ? null : mapToResponse(list.get(0));
                });
    }

    @Override
    @Transactional
    public void deleteAddress(String userEmail, Long addressId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(String userEmail, Long addressId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        addressRepository.clearDefaultAddresses(user.getId());
        address.setIsDefault(true);
        Address updated = addressRepository.save(address);

        return mapToResponse(updated);
    }

    private AddressResponse mapToResponse(Address a) {
        return new AddressResponse(
                a.getId(),
                a.getLabel(),
                a.getAddressLine(),
                a.getCity(),
                a.getPincode(),
                a.getLatitude(),
                a.getLongitude(),
                a.getIsDefault(),
                a.getCreatedAt()
        );
    }
}
