import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { Booking, WalletOverview, ProviderAvailability, ServicePartner } from '../../types';

export default function ProviderDashboardScreen() {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'BOOKINGS' | 'WALLET' | 'SLOTS' | 'PARTNERS'>('MARKETPLACE');
  const [tasks, setTasks] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [wallet, setWallet] = useState<WalletOverview | null>(null);
  const [slots, setSlots] = useState<ProviderAvailability[]>([]);
  const [partners, setPartners] = useState<ServicePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payout Modal
  const [payoutModal, setPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutUpi, setPayoutUpi] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Availability Slot Modal
  const [slotModal, setSlotModal] = useState(false);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('17:00');

  // Partner Modal
  const [partnerModal, setPartnerModal] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'MARKETPLACE') {
        const res = await api.provider.getAvailableTasks().catch(() => []);
        setTasks(res || []);
      } else if (activeTab === 'BOOKINGS') {
        const res = await api.provider.getBookings().catch(() => []);
        setMyBookings(res || []);
      } else if (activeTab === 'WALLET') {
        const res = await api.payouts.getWalletOverview().catch(() => null);
        setWallet(res);
      } else if (activeTab === 'SLOTS') {
        const res = await api.provider.getAvailability().catch(() => []);
        setSlots(res || []);
      } else if (activeTab === 'PARTNERS') {
        const res = await api.provider.getPartners().catch(() => []);
        setPartners(res || []);
      }
    } catch (e: any) {
      console.error('Failed to load provider data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleClaim = async (bookingId: number) => {
    try {
      await api.provider.claimTask(bookingId);
      Alert.alert('Task Claimed!', 'You have successfully claimed this task.');
      loadData();
    } catch (err: any) {
      Alert.alert('Claim Error', err.message || 'Could not claim task.');
    }
  };

  const handleAccept = async (bookingId: number) => {
    try {
      await api.provider.acceptBooking(bookingId);
      Alert.alert('Accepted', 'Booking status updated to ACCEPTED.');
      loadData();
    } catch (err: any) {
      Alert.alert('Accept Error', err.message || 'Could not accept booking.');
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }
    setRequestingPayout(true);
    try {
      await api.payouts.requestPayout(Number(payoutAmount), payoutUpi.trim());
      Alert.alert('Payout Requested', 'Your payout request was submitted to Admin.');
      setPayoutModal(false);
      setPayoutAmount('');
      loadData();
    } catch (e: any) {
      Alert.alert('Payout Error', e.message || 'Failed to request payout.');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleCreateSlot = async () => {
    try {
      await api.provider.createAvailability({
        availableDate: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime
      });
      Alert.alert('Slot Added', 'Availability slot saved successfully.');
      setSlotModal(false);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add slot.');
    }
  };

  const handleCreatePartner = async () => {
    if (!partnerName.trim() || !partnerPhone.trim()) {
      Alert.alert('Missing Info', 'Please enter partner name and phone.');
      return;
    }
    try {
      await api.provider.createPartner({
        name: partnerName.trim(),
        phone: partnerPhone.trim(),
        userId: 0
      });
      Alert.alert('Partner Added', 'Service partner created successfully.');
      setPartnerModal(false);
      setPartnerName('');
      setPartnerPhone('');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create partner.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💼 Provider Console</Text>
        <Text style={styles.sub}>Manage tasks, earnings, slots, and field workers</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
          {[
            { key: 'MARKETPLACE', label: '🔥 Marketplace' },
            { key: 'BOOKINGS', label: '📅 My Bookings' },
            { key: 'WALLET', label: '💰 Wallet' },
            { key: 'SLOTS', label: '🕒 Availability' },
            { key: 'PARTNERS', label: '👷 Partners' }
          ].map(t => (
            <TouchableOpacity 
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key as any)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'MARKETPLACE' ? (
          tasks.length === 0 ? (
            <Text style={styles.emptyText}>No available tasks currently in marketplace.</Text>
          ) : (
            tasks.map(item => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.serviceName}>{item.serviceName}</Text>
                  <Text style={styles.price}>₹{item.finalAmount || item.totalAmount}</Text>
                </View>
                <Text style={styles.details}>📍 {item.address}, {item.city}</Text>
                <Text style={styles.details}>📅 {item.bookingDate} at {item.startTime}</Text>
                <TouchableOpacity style={styles.claimBtn} onPress={() => handleClaim(item.id)}>
                  <Text style={styles.claimBtnText}>Claim Task</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        ) : activeTab === 'BOOKINGS' ? (
          myBookings.length === 0 ? (
            <Text style={styles.emptyText}>No active bookings assigned yet.</Text>
          ) : (
            myBookings.map(item => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.serviceName}>{item.serviceName}</Text>
                  <Text style={styles.price}>₹{item.finalAmount}</Text>
                </View>
                <Text style={styles.details}>📍 {item.address}, {item.city}</Text>
                <Text style={styles.details}>Status: {item.status.replace(/_/g, ' ')}</Text>
                {item.status === 'ASSIGNED' ? (
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                    <Text style={styles.acceptBtnText}>Accept Booking</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )
        ) : activeTab === 'WALLET' ? (
          <View>
            <View style={styles.walletCard}>
              <Text style={styles.walletTitle}>Available Wallet Balance</Text>
              <Text style={styles.walletAmount}>₹{wallet?.availableBalance || 0}</Text>

              <View style={styles.walletStats}>
                <View>
                  <Text style={styles.statLabel}>Total Earnings</Text>
                  <Text style={styles.statVal}>₹{wallet?.totalEarnings || 0}</Text>
                </View>
                <View>
                  <Text style={styles.statLabel}>Pending Payouts</Text>
                  <Text style={styles.statVal}>₹{wallet?.pendingPayouts || 0}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.payoutBtn} onPress={() => setPayoutModal(true)}>
                <Text style={styles.payoutBtnText}>Request Payout to Bank/UPI</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === 'SLOTS' ? (
          <View>
            <TouchableOpacity style={styles.addSlotBtn} onPress={() => setSlotModal(true)}>
              <Text style={styles.addSlotBtnText}>+ Add Working Slot</Text>
            </TouchableOpacity>

            {slots.map(s => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.serviceName}>📅 {s.availableDate}</Text>
                <Text style={styles.details}>Hours: {s.startTime} - {s.endTime}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <TouchableOpacity style={styles.addSlotBtn} onPress={() => setPartnerModal(true)}>
              <Text style={styles.addSlotBtnText}>+ Add Field Service Partner</Text>
            </TouchableOpacity>

            {partners.map(p => (
              <View key={p.id} style={styles.card}>
                <Text style={styles.serviceName}>👷 {p.name}</Text>
                <Text style={styles.details}>📞 {p.phone}</Text>
                <Text style={styles.details}>Status: {p.active ? 'ACTIVE' : 'INACTIVE'}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Payout Modal */}
      <Modal visible={payoutModal} animationType="slide" transparent onRequestClose={() => setPayoutModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Payout</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="Amount (₹)" placeholderTextColor="#666" value={payoutAmount} onChangeText={setPayoutAmount} />
            <TextInput style={styles.input} placeholder="UPI ID (e.g. name@upi)" placeholderTextColor="#666" value={payoutUpi} onChangeText={setPayoutUpi} />
            <TouchableOpacity style={styles.payoutBtn} onPress={handleRequestPayout} disabled={requestingPayout}>
              <Text style={styles.payoutBtnText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Slot Modal */}
      <Modal visible={slotModal} animationType="slide" transparent onRequestClose={() => setSlotModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Availability Slot</Text>
            <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#666" value={slotDate} onChangeText={setSlotDate} />
            <TextInput style={styles.input} placeholder="Start Time (e.g. 09:00)" placeholderTextColor="#666" value={slotStartTime} onChangeText={setSlotStartTime} />
            <TextInput style={styles.input} placeholder="End Time (e.g. 17:00)" placeholderTextColor="#666" value={slotEndTime} onChangeText={setSlotEndTime} />
            <TouchableOpacity style={styles.payoutBtn} onPress={handleCreateSlot}>
              <Text style={styles.payoutBtnText}>Save Slot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Partner Modal */}
      <Modal visible={partnerModal} animationType="slide" transparent onRequestClose={() => setPartnerModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Service Partner</Text>
            <TextInput style={styles.input} placeholder="Partner Full Name" placeholderTextColor="#666" value={partnerName} onChangeText={setPartnerName} />
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666" value={partnerPhone} onChangeText={setPartnerPhone} />
            <TouchableOpacity style={styles.payoutBtn} onPress={handleCreatePartner}>
              <Text style={styles.payoutBtnText}>Create Partner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPage, paddingHorizontal: 20, paddingTop: 54 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  sub: { fontSize: 12, color: colors.dark.textMuted, marginTop: 2 },
  tabRow: { flexDirection: 'row', marginTop: 14, maxHeight: 40 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.dark.bgCard, marginRight: 8, borderWidth: 1, borderColor: colors.dark.borderLight },
  tabBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.dark.textMuted },
  tabTextActive: { color: colors.primary },
  card: { backgroundColor: colors.dark.bgCard, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.dark.borderLight },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  price: { fontSize: 18, fontWeight: '900', color: colors.primary },
  details: { fontSize: 12, color: colors.dark.textMuted, marginTop: 4 },
  claimBtn: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  claimBtnText: { color: '#000', fontWeight: '800' },
  acceptBtn: { backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  acceptBtnText: { color: '#FFF', fontWeight: '800' },
  emptyText: { color: colors.dark.textMuted, textAlign: 'center', marginTop: 40 },
  walletCard: { backgroundColor: colors.dark.bgCard, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.primary },
  walletTitle: { color: '#A1A1AA', fontSize: 13 },
  walletAmount: { color: colors.primary, fontSize: 32, fontWeight: '900', marginVertical: 8 },
  walletStats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#27272A' },
  statLabel: { color: '#A1A1AA', fontSize: 11 },
  statVal: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 2 },
  payoutBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  payoutBtnText: { color: '#000', fontWeight: '800' },
  addSlotBtn: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  addSlotBtnText: { color: '#000', fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181B', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 16 },
  input: { backgroundColor: '#09090B', borderWidth: 1, borderColor: '#3F3F46', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#FFF', fontSize: 14, marginBottom: 12 }
});
