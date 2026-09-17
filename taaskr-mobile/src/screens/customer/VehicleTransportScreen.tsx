import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { VehicleEstimate, PricingRule } from '../../types';

export default function VehicleTransportScreen({ navigation }: any) {
  const [vehicleType, setVehicleType] = useState('THREE_WHEELER');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [distanceKm, setDistanceKm] = useState('8');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<VehicleEstimate | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  useEffect(() => {
    api.vehicle.getPricingRules()
      .then(res => setPricingRules(res || []))
      .catch(() => {});
  }, []);

  const handleEstimate = async () => {
    const trimmedPickup = pickupAddress.trim();
    const trimmedDrop = dropAddress.trim();
    const trimmedCity = city.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedPickup || !trimmedDrop) {
      Alert.alert('Missing Details', 'Please enter pickup and drop addresses.');
      return;
    }

    if (!trimmedCity || !trimmedPincode) {
      Alert.alert('Location Details Required', 'Please enter your city and valid 6-digit pincode in Indore.');
      return;
    }

    if (!trimmedCity.toLowerCase().includes('indore') && !trimmedPincode.startsWith('452')) {
      Alert.alert('Service Area Notice', 'Taaskr is currently operating exclusively in Indore, MP (pincodes 452xxx).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.vehicle.estimate({
        vehicleType,
        pickupAddress: trimmedPickup,
        dropAddress: trimmedDrop,
        distanceKm: Number(distanceKm) || 5
      });
      setEstimate(res);
    } catch (e: any) {
      Alert.alert('Estimate Error', e.message || 'Failed to estimate price.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookVehicle = async () => {
    if (!estimate) return;
    const trimmedPickup = pickupAddress.trim();
    const trimmedDrop = dropAddress.trim();
    const trimmedCity = city.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedPickup || !trimmedDrop || !trimmedCity || !trimmedPincode) {
      Alert.alert('Missing Details', 'Please enter complete pickup, drop address, city, and pincode.');
      return;
    }

    setLoading(true);
    try {
      await api.bookings.create({
        serviceId: 999, // Vehicle Transport Service
        bookingDate: new Date().toISOString().split('T')[0],
        startTime: '10:00:00',
        endTime: '12:00:00',
        address: trimmedPickup,
        dropAddress: trimmedDrop,
        city: trimmedCity,
        pincode: trimmedPincode,
        totalAmount: estimate.estimatedPrice,
        finalAmount: estimate.estimatedPrice,
        paymentMethod: 'AFTER_SERVICE',
        notes: `Vehicle Transport: ${vehicleType} (${distanceKm} km)`
      });
      Alert.alert('Booking Created 🎉', 'Intra-city transport booked successfully!');
      navigation.navigate('BookingsTab', { screen: 'MyBookings' });
    } catch (e: any) {
      Alert.alert('Booking Error', e.message || 'Failed to book transport.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚚 On-Demand Vehicle Transport</Text>
        <Text style={styles.subtitle}>Instant intra-city pickup & goods transport (Indore Area)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Select Vehicle Type</Text>
        <View style={styles.vehicleRow}>
          {['TWO_WHEELER', 'THREE_WHEELER', 'PICKUP_TRUCK', 'HEAVY_TRUCK'].map((type) => (
            <TouchableOpacity 
              key={type}
              style={[styles.vehicleChip, vehicleType === type && styles.vehicleChipActive]}
              onPress={() => setVehicleType(type)}
            >
              <Text style={[styles.chipText, vehicleType === type && styles.chipTextActive]}>
                {type.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pickup Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Warehouse 4, Central Market, Indore"
            placeholderTextColor="#666"
            value={pickupAddress}
            onChangeText={setPickupAddress}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Drop Destination *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Shop 12, Sanwer Road Industrial Area"
            placeholderTextColor="#666"
            value={dropAddress}
            onChangeText={setDropAddress}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Indore"
              placeholderTextColor="#666"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Pincode *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 452001"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Estimated Distance (KM)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="8"
            placeholderTextColor="#666"
            value={distanceKm}
            onChangeText={setDistanceKm}
          />
        </View>

        <TouchableOpacity style={styles.estimateBtn} onPress={handleEstimate} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.estimateBtnText}>Calculate Fare</Text>}
        </TouchableOpacity>
      </View>

      {estimate ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Fare Estimate Summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Type:</Text>
            <Text style={styles.detailVal}>{estimate.vehicleType.replace('_', ' ')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailVal}>{estimate.distanceKm} km</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Fare:</Text>
            <Text style={styles.priceVal}>₹{estimate.estimatedPrice}</Text>
          </View>

          <TouchableOpacity style={styles.bookBtn} onPress={handleBookVehicle} disabled={loading}>
            <Text style={styles.bookBtnText}>Confirm Transport Order</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPage, padding: 20 },
  header: { marginTop: 40, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 13, color: colors.dark.textMuted, marginTop: 4 },
  card: { backgroundColor: colors.dark.bgCard, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.dark.borderLight, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  vehicleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  vehicleChip: { backgroundColor: '#27272A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#3F3F46' },
  vehicleChipActive: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: colors.primary },
  chipText: { color: '#A1A1AA', fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: colors.primary },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#A1A1AA', marginBottom: 6 },
  input: { backgroundColor: '#09090B', borderWidth: 1, borderColor: '#3F3F46', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#FFF', fontSize: 14 },
  estimateBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  estimateBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  resultCard: { backgroundColor: '#18181B', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, marginBottom: 30 },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: '#A1A1AA', fontSize: 13 },
  detailVal: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  priceVal: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  bookBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  bookBtnText: { color: '#000', fontWeight: '800', fontSize: 15 }
});
