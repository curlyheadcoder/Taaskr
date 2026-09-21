import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, BackHandler, Text } from 'react-native';
import * as Location from 'expo-location';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../services/api';
import { ServiceItem, PaymentMethod, Booking } from '../../types';
import { HeaderBar } from '../../components/common/HeaderBar';
import { Button } from '../../components/common/Button';
import { BookingProgress } from '../../components/booking/BookingProgress';
import { ServiceStep } from '../../components/booking/ServiceStep';
import { LocationStep } from '../../components/booking/LocationStep';
import { TimeStep, DispatchMode } from '../../components/booking/TimeStep';
import { BookingSummaryStep } from '../../components/booking/BookingSummaryStep';
import { BookingConfirmationStep } from '../../components/booking/BookingConfirmationStep';

interface Props {
  route?: { params?: { service?: ServiceItem; dispatchMode?: DispatchMode } };
  navigation?: any;
}

export default function BookingScreen({ route, navigation }: Props) {
  const service = route?.params?.service;
  const initialDispatchMode = route?.params?.dispatchMode || 'IMMEDIATE';

  const { isDark } = useTheme();

  // Wizard Step State (1: Service, 2: Location, 3: Time, 4: Summary, 5: Confirmation)
  const [step, setStep] = useState<number>(1);

  // Booking Form State - All preserved across step navigation
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>(initialDispatchMode);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  });

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AFTER_SERVICE');
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Handle Android Hardware Back Button (Step-by-step backward navigation)
  useEffect(() => {
    const backAction = () => {
      if (step === 5) {
        navigation?.navigate('BookingsTab', { screen: 'MyBookings' });
        return true;
      }
      if (step > 1) {
        setStep((prev) => prev - 1);
        return true;
      }
      return false; // Let default stack back action execute on Step 1
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [step, navigation]);

  if (!service) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? tokens.colors.dark.bgPage : tokens.colors.light.bgPage }]}>
        <HeaderBar title="Booking Error" onBack={() => navigation?.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={{ color: isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary, fontSize: 16 }}>
            No service selected.
          </Text>
          <Button
            title="Return to Home"
            variant="primary"
            size="md"
            onPress={() => navigation?.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    );
  }

  // Location Handlers - Invalidate stale GPS coordinates when text fields are manually edited
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
      } catch (geoErr) {}

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
            `Your current GPS location (${fetchedCity || 'Unknown'}, ${fetchedPincode || 'Unknown'}) is outside our primary service area. Taaskr operates exclusively in Indore, MP (pincodes 452xxx).`
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

  // Submit Booking Payload to Backend API
  const handleFinalBookingSubmit = async () => {
    if (submitting) return; // Prevent duplicate submission
    setSubmitting(true);

    try {
      const payload = {
        serviceId: service.id,
        bookingDate: date,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: '18:00:00',
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        latitude,
        longitude,
        notes: dispatchMode === 'IMMEDIATE' 
          ? `[IMMEDIATE DISPATCH] ${notes}`.trim()
          : `[SCHEDULED] ${notes}`.trim(),
        paymentMethod
      };

      const booking = await api.bookings.create(payload);
      setCreatedBooking(booking);
      setStep(5); // Move to Confirmation Step
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Could not place booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHeaderBack = () => {
    if (step === 5) {
      navigation?.navigate('BookingsTab', { screen: 'MyBookings' });
    } else if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigation?.goBack();
    }
  };

  const bgColor = isDark ? tokens.colors.dark.bgPage : tokens.colors.light.bgPage;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top Header Bar */}
      <HeaderBar
        title={step === 5 ? 'Booking Complete' : `Confirm Booking`}
        subtitle={step < 5 ? `Step ${step} of 4` : undefined}
        onBack={handleHeaderBack}
      />

      {/* Progress Step Indicator */}
      <BookingProgress currentStep={step} />

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <ServiceStep
            service={service}
            onNext={() => setStep(2)}
          />
        ) : step === 2 ? (
          <LocationStep
            address={address}
            city={city}
            pincode={pincode}
            latitude={latitude}
            longitude={longitude}
            gettingLocation={gettingLocation}
            onAddressChange={handleAddressChange}
            onCityChange={handleCityChange}
            onPincodeChange={handlePincodeChange}
            onFetchGPSLocation={handleFetchGPSLocation}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        ) : step === 3 ? (
          <TimeStep
            dispatchMode={dispatchMode}
            date={date}
            startTime={startTime}
            onDispatchModeChange={setDispatchMode}
            onDateChange={setDate}
            onStartTimeChange={setStartTime}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        ) : step === 4 ? (
          <BookingSummaryStep
            service={service}
            address={address}
            city={city}
            pincode={pincode}
            dispatchMode={dispatchMode}
            date={date}
            startTime={startTime}
            notes={notes}
            paymentMethod={paymentMethod}
            submitting={submitting}
            onNotesChange={setNotes}
            onPaymentMethodChange={setPaymentMethod}
            onConfirm={handleFinalBookingSubmit}
            onBack={() => setStep(3)}
          />
        ) : step === 5 && createdBooking ? (
          <BookingConfirmationStep
            booking={createdBooking}
            onTrackBooking={(bookingId) => 
              navigation?.navigate('BookingsTab', { 
                screen: 'LiveTracking', 
                params: { bookingId } 
              })
            }
            onViewMyBookings={() => 
              navigation?.navigate('BookingsTab', { screen: 'MyBookings' })
            }
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.huge,
  },
});
