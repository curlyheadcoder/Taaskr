import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { MapPin, Navigation, BookOpen } from 'lucide-react-native';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../services/api';
import { Address } from '../../types';

export interface LocationStepProps {
  address: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  gettingLocation: boolean;
  onAddressChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onPincodeChange: (val: string) => void;
  onFetchGPSLocation: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const LocationStep: React.FC<LocationStepProps> = ({
  address,
  city,
  pincode,
  latitude,
  longitude,
  gettingLocation,
  onAddressChange,
  onCityChange,
  onPincodeChange,
  onFetchGPSLocation,
  onNext,
  onBack,
}) => {
  const { isDark } = useTheme();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoadingAddresses(true);
    api.addresses.getAll()
      .then(res => setSavedAddresses(res || []))
      .catch(() => setSavedAddresses([]))
      .finally(() => setLoadingAddresses(false));
  }, []);

  const handleSelectSavedAddress = (addr: Address) => {
    onAddressChange(addr.addressLine || '');
    onCityChange(addr.city || '');
    onPincodeChange(addr.pincode || '');
    setErrorMsg(null);
  };

  const handleValidateNext = () => {
    setErrorMsg(null);
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedAddress) {
      setErrorMsg('Please enter your street address or use GPS location.');
      return;
    }

    if (!trimmedCity) {
      setErrorMsg('Please enter your city (e.g. Indore).');
      return;
    }

    if (!trimmedPincode || trimmedPincode.length !== 6 || !/^\d{6}$/.test(trimmedPincode)) {
      setErrorMsg('Please enter a valid 6-digit pincode (e.g. 452001).');
      return;
    }

    const isIndoreCity = trimmedCity.toLowerCase().includes('indore');
    const isIndorePincode = trimmedPincode.startsWith('452');

    if (!isIndoreCity && !isIndorePincode) {
      setErrorMsg('Taaskr operates exclusively in Indore, MP (pincodes 452xxx). Please enter an Indore address.');
      return;
    }

    onNext();
  };

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={[styles.stepTitle, { color: textColor }]}>2. Service Address</Text>
      <Text style={[styles.stepSub, { color: subColor }]}>
        Operating exclusively in Indore, MP (pincodes 452xxx).
      </Text>

      {/* Quick GPS Action Button */}
      <View style={styles.gpsRow}>
        <Button
          title={gettingLocation ? 'Acquiring GPS Location...' : 'Use Current GPS Location'}
          variant="outline"
          size="md"
          loading={gettingLocation}
          leftIcon={<Navigation size={16} color={tokens.colors.brand.primary} />}
          onPress={onFetchGPSLocation}
          fullWidth
        />
      </View>

      {/* Saved Addresses Selector (if available) */}
      {savedAddresses.length > 0 ? (
        <View style={styles.savedSection}>
          <Text style={[styles.sectionLabel, { color: subColor }]}>Select From Saved Addresses</Text>
          <View style={styles.savedGrid}>
            {savedAddresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.savedChip,
                  { backgroundColor: isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface },
                  address === addr.addressLine && styles.savedChipActive
                ]}
                onPress={() => handleSelectSavedAddress(addr)}
              >
                <MapPin size={14} color={address === addr.addressLine ? tokens.colors.brand.primary : subColor} />
                <Text style={[
                  styles.savedChipText,
                  { color: address === addr.addressLine ? tokens.colors.brand.primary : textColor }
                ]}>
                  {addr.label || 'Saved'} ({addr.pincode})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* Address Form Inputs */}
      <Input
        label="Street Address *"
        placeholder="House/Flat No., Building, Street, Area in Indore..."
        value={address}
        onChangeText={(val) => { onAddressChange(val); setErrorMsg(null); }}
        multiline
        inputStyle={{ minHeight: 54 }}
      />

      <View style={styles.cityPincodeRow}>
        <View style={{ flex: 1 }}>
          <Input
            label="City *"
            placeholder="e.g. Indore"
            value={city}
            onChangeText={(val) => { onCityChange(val); setErrorMsg(null); }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Pincode *"
            placeholder="e.g. 452001"
            value={pincode}
            onChangeText={(val) => { onPincodeChange(val); setErrorMsg(null); }}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
      </View>

      {/* Validation Error Message */}
      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        </View>
      ) : null}

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <View style={{ flex: 1 }}>
          <Button
            title="Back"
            variant="secondary"
            size="lg"
            onPress={onBack}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Continue to Time"
            variant="primary"
            size="lg"
            onPress={handleValidateNext}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
  },
  stepTitle: {
    fontSize: tokens.typography.h2.fontSize,
    lineHeight: tokens.typography.h2.lineHeight,
    fontWeight: tokens.typography.h2.fontWeight,
  },
  stepSub: {
    fontSize: tokens.typography.bodySm.fontSize,
    marginTop: 4,
    marginBottom: tokens.spacing.lg,
  },
  gpsRow: {
    marginBottom: tokens.spacing.lg,
  },
  savedSection: {
    marginBottom: tokens.spacing.lg,
  },
  sectionLabel: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: '600',
    marginBottom: tokens.spacing.xs,
  },
  savedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  savedChipActive: {
    borderColor: tokens.colors.brand.primary,
    backgroundColor: tokens.colors.brand.primaryMuted,
  },
  savedChipText: {
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '600',
  },
  cityPincodeRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  errorBox: {
    backgroundColor: tokens.colors.status.errorBg,
    borderColor: tokens.colors.status.error,
    borderWidth: 1,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    marginBottom: tokens.spacing.md,
  },
  errorText: {
    color: tokens.colors.status.error,
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
  },
});
