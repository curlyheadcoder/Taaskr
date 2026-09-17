import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import * as Location from 'expo-location';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { ServiceItem, PaymentMethod } from '../../types';

interface Props {
  route?: { params?: { service?: ServiceItem } };
  navigation?: any;
}

type DispatchMode = 'IMMEDIATE' | 'SCHEDULED';

export default function BookingScreen({ route, navigation }: Props) {
  const service = route?.params?.service;

  const [dispatchMode, setDispatchMode] = useState<DispatchMode>('IMMEDIATE');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  });
  
  // Location fields initialized strictly empty/undefined — NO hardcoded defaults
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AFTER_SERVICE');
  const [submitting, setSubmitting] = useState(false);

  if (!service) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#FFF', fontSize: 16 }}>No service selected.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#000', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Invalidate stale GPS coordinates if user manually edits text address
  const handleAddressChange = (val: string) => {
    setAddress(val);
    setLatitude(undefined);
    setLongitude(undefined);
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    setLatitude(undefined);
    setLongitude(undefined);
  };

  const handlePincodeChange = (val: string) => {
    setPincode(val);
    setLatitude(undefined);
    setLongitude(undefined);
  };

  const handleFetchGPSLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission was denied. Please enter your Indore street address, city, and pincode manually.'
        );
        setGettingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      let geocodedList: Location.LocationGeocodedAddress[] = [];
      try {
        geocodedList = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      } catch (geoErr) {
        // Reverse geocoding failed; coordinates retained, user can type missing text fields
      }

      if (geocodedList && geocodedList.length > 0) {
        const geocoded = geocodedList[0];
        const fetchedAddress = [geocoded.name, geocoded.street, geocoded.subregion, geocoded.district]
          .filter(Boolean)
          .join(', ');
        if (fetchedAddress) setAddress(fetchedAddress);

        const fetchedCity = geocoded.city || geocoded.subregion || '';
        const fetchedPincode = geocoded.postalCode || '';

        if (fetchedCity) setCity(fetchedCity);
        if (fetchedPincode) setPincode(fetchedPincode);

        if (
          (fetchedCity && !fetchedCity.toLowerCase().includes('indore')) ||
          (fetchedPincode && !fetchedPincode.startsWith('452'))
        ) {
          Alert.alert(
            'Location Notice',
            `Your current GPS location (${fetchedCity || 'Unknown'}, ${fetchedPincode || 'Unknown'}) is outside our primary service area. Taaskr operates exclusively in Indore, Madhya Pradesh (pincodes 452xxx).`
          );
        } else {
          Alert.alert('Location Acquired 📍', 'Real GPS location and address populated successfully.');
        }
      } else {
        Alert.alert(
          'GPS Coordinates Acquired 📍',
          'Latitude and longitude captured. Please enter your street address, city, and pincode manually.'
        );
      }
    } catch (err: any) {
      Alert.alert(
        'GPS Location Failed',
        'Could not get device GPS coordinates. Please enter your Indore street address, city, and pincode manually.'
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const handleBooking = async () => {
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedAddress) {
      Alert.alert('Address Required 📍', 'Please enter your street address or tap "📍 Use GPS Location".');
      return;
    }

    if (!trimmedCity) {
      Alert.alert('City Required 📍', 'Please enter your city (e.g. Indore).');
      return;
    }

    if (!trimmedPincode || trimmedPincode.length !== 6 || !/^\d{6}$/.test(trimmedPincode)) {
      Alert.alert('Valid Pincode Required 📍', 'Please enter a valid 6-digit pincode (e.g., 452001).');
      return;
    }

    const isIndoreCity = trimmedCity.toLowerCase().includes('indore');
    const isIndorePincode = trimmedPincode.startsWith('452');

    if (!isIndoreCity && !isIndorePincode) {
      Alert.alert(
        'Service Area Notice 📍',
        'Taaskr is currently operating exclusively in Indore, Madhya Pradesh (pincodes 452xxx). Please select an address within Indore.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        serviceId: service.id,
        bookingDate: date,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: '18:00:00',
        address: trimmedAddress,
        city: trimmedCity,
        pincode: trimmedPincode,
        latitude,
        longitude,
        notes: dispatchMode === 'IMMEDIATE' 
          ? `[IMMEDIATE DISPATCH] ${notes}`.trim()
          : `[SCHEDULED] ${notes}`.trim(),
        paymentMethod
      };

      const booking = await api.bookings.create(payload);
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Booking Code: ${booking.bookingCode || '#' + booking.id}\nProvider Status: ${booking.status === 'ASSIGNED' ? 'Assigned & Dispatched!' : 'Searching nearby providers...'}`,
        [
          {
            text: 'Track Booking 🚀',
            onPress: () => navigation.navigate('BookingsTab', { screen: 'MyBookings' })
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Could not place booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickDates = [
    { label: 'Today', val: new Date().toISOString().split('T')[0] },
    { label: 'Tomorrow', val: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { label: 'In 2 Days', val: new Date(Date.now() + 172800000).toISOString().split('T')[0] }
  ];

  const timeSlots = ['09:00', '11:00', '14:00', '16:00', '18:00'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
      </View>

      {/* Service Area Banner */}
      <View style={styles.cityBanner}>
        <Text style={styles.cityBannerText}>📍 Operating Exclusively in Indore, MP (pincodes 452xxx)</Text>
      </View>

      {/* Service Summary Card */}
      <View style={styles.serviceSummary}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceDesc}>{service.description || 'Professional home service with verified partners.'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Estimated Fare</Text>
          <Text style={styles.priceValue}>₹{service.price}</Text>
        </View>
      </View>

      {/* Dispatch Mode Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Choose Dispatch Option</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeCard, dispatchMode === 'IMMEDIATE' && styles.modeCardActive]}
            onPress={() => {
              setDispatchMode('IMMEDIATE');
              setDate(new Date().toISOString().split('T')[0]);
              const now = new Date();
              now.setMinutes(now.getMinutes() + 15);
              setStartTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
            }}
          >
            <Text style={styles.modeIcon}>⚡</Text>
            <Text style={styles.modeTitle}>Immediate</Text>
            <Text style={styles.modeSub}>Fastest partner (~15m)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, dispatchMode === 'SCHEDULED' && styles.modeCardActive]}
            onPress={() => setDispatchMode('SCHEDULED')}
          >
            <Text style={styles.modeIcon}>📅</Text>
            <Text style={styles.modeTitle}>Schedule</Text>
            <Text style={styles.modeSub}>Pick Date & Time</Text>
          </TouchableOpacity>
        </View>

        {dispatchMode === 'SCHEDULED' ? (
          <View style={styles.scheduleBox}>
            <Text style={styles.label}>Select Date</Text>
            <View style={styles.chipRow}>
              {quickDates.map(d => (
                <TouchableOpacity
                  key={d.val}
                  style={[styles.chip, date === d.val && styles.chipActive]}
                  onPress={() => setDate(d.val)}
                >
                  <Text style={[styles.chipText, date === d.val && styles.chipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Select Start Time Slot</Text>
            <View style={styles.chipRow}>
              {timeSlots.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, startTime === t && styles.chipActive]}
                  onPress={() => setStartTime(t)}
                >
                  <Text style={[styles.chipText, startTime === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.immediateBox}>
            <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 13 }}>
              ⚡ Immediate dispatch: Requesting nearest available Indore partner for today ({date}) at {startTime}.
            </Text>
          </View>
        )}
      </View>

      {/* Address & GPS Location */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>2. Service Address (Indore)</Text>
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={handleFetchGPSLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <Text style={styles.gpsBtnText}>📍 Use GPS Location</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Street Address *</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          value={address}
          onChangeText={handleAddressChange}
          multiline
          placeholder="House/Flat No., Street, Area in Indore..."
          placeholderTextColor="#666"
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={handleCityChange}
              placeholder="e.g. Indore"
              placeholderTextColor="#666"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={handlePincodeChange}
              placeholder="e.g. 452001"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>
      </View>

      {/* Special Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Additional Notes (Optional)</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="E.g. Ring doorbell twice, ask for Mr. Sharma..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Payment Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Payment Method</Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity 
            style={[styles.payOption, paymentMethod === 'AFTER_SERVICE' && styles.payOptionActive]}
            onPress={() => setPaymentMethod('AFTER_SERVICE')}
          >
            <Text style={styles.payText}>💵 Pay After Service</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.payOption, paymentMethod === 'ONLINE' && styles.payOptionActive]}
            onPress={() => setPaymentMethod('ONLINE')}
          >
            <Text style={styles.payText}>💳 Online / UPI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Submit Action */}
      <TouchableOpacity 
        style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
        onPress={handleBooking}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.submitBtnText}>Confirm Booking (₹{service.price})</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPage,
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: colors.dark.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 16,
  },
  headerBack: {
    paddingRight: 16,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  cityBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cityBannerText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  serviceSummary: {
    backgroundColor: colors.dark.bgCard,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    marginBottom: 20,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  priceLabel: {
    fontSize: 13,
    color: colors.dark.textMuted,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.dark.bgCard,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    alignItems: 'center',
  },
  modeCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  modeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  modeTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modeSub: {
    color: colors.dark.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  immediateBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  scheduleBox: {
    backgroundColor: colors.dark.bgCard,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    gap: 8,
  },
  gpsBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  chip: {
    backgroundColor: colors.dark.bgSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AAA',
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  payOption: {
    flex: 1,
    backgroundColor: colors.dark.bgCard,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    alignItems: 'center',
  },
  payOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  payText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
});
