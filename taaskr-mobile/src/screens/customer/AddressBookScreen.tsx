import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert, Modal 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { Address } from '../../types';

export default function AddressBookScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [label, setLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.addresses.getAll();
      setAddresses(res || []);
    } catch (e: any) {
      console.error('Failed to load addresses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleCreate = async () => {
    if (!addressLine.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert('Missing Info', 'Please fill in address, city, and pincode.');
      return;
    }
    setSaving(true);
    try {
      await api.addresses.create({
        label,
        addressLine: addressLine.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        isDefault: addresses.length === 0
      });
      setModalVisible(false);
      setAddressLine('');
      setCity('');
      setPincode('');
      loadAddresses();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.addresses.setDefault(id);
      loadAddresses();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to set default.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.addresses.delete(id);
      loadAddresses();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete address.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Saved Delivery Addresses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add Address</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved addresses found.</Text>
          <TouchableOpacity style={styles.addBtnLarge} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>Add Your First Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {addresses.map((addr) => (
            <View key={addr.id} style={[styles.card, addr.isDefault && styles.cardDefault]}>
              <View style={styles.cardHeader}>
                <Text style={styles.labelTag}>{addr.label || 'Saved Address'}</Text>
                {addr.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.addressLine}>{addr.addressLine}</Text>
              <Text style={styles.subLine}>{addr.city}, {addr.pincode}</Text>

              <View style={styles.actionRow}>
                {!addr.isDefault ? (
                  <TouchableOpacity style={styles.defaultBtn} onPress={() => handleSetDefault(addr.id)}>
                    <Text style={styles.defaultBtnText}>Make Default</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(addr.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            
            <Text style={styles.inputLabel}>Address Label</Text>
            <View style={styles.labelRow}>
              {['Home', 'Work', 'Other'].map(l => (
                <TouchableOpacity 
                  key={l} 
                  style={[styles.labelChip, label === l && styles.labelChipActive]}
                  onPress={() => setLabel(l)}
                >
                  <Text style={[styles.labelChipText, label === l && styles.chipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Street / Apartment / Area</Text>
            <TextInput style={styles.input} value={addressLine} onChangeText={setAddressLine} placeholder="e.g. 102 Green Towers, MG Road" placeholderTextColor="#666" />

            <Text style={styles.inputLabel}>City</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Indore" placeholderTextColor="#666" />

            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput style={styles.input} value={pincode} onChangeText={setPincode} keyboardType="numeric" placeholder="e.g. 452001" placeholderTextColor="#666" maxLength={6} />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#A1A1AA' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPage, paddingHorizontal: 20, paddingTop: 54 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#000', fontWeight: '800', fontSize: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: colors.dark.textMuted, fontSize: 14, marginBottom: 16 },
  addBtnLarge: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  card: { backgroundColor: colors.dark.bgCard, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.dark.borderLight, marginBottom: 12 },
  cardDefault: { borderColor: colors.primary, backgroundColor: 'rgba(245, 158, 11, 0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelTag: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  defaultBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  defaultBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '800' },
  addressLine: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  subLine: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  defaultBtn: { backgroundColor: '#27272A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  defaultBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181B', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#A1A1AA', marginBottom: 6, marginTop: 10 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  labelChip: { backgroundColor: '#27272A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#3F3F46' },
  labelChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  labelChipText: { color: '#A1A1AA', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: colors.primary },
  input: { backgroundColor: '#09090B', borderWidth: 1, borderColor: '#3F3F46', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#FFF', fontSize: 14 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  cancelBtn: { padding: 12 },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  saveBtnText: { color: '#000', fontWeight: '800' }
});
