import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { AdminAnalytics, ProviderProfile, Dispute, Payout, KycDocument } from '../../types';

export default function AdminConsoleScreen() {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'PROVIDERS' | 'DISPUTES' | 'PAYOUTS' | 'KYC'>('ANALYTICS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [kycDocs, setKycDocs] = useState<KycDocument[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ANALYTICS') {
        const res = await api.admin.getAnalytics(30);
        setAnalytics(res);
      } else if (activeTab === 'PROVIDERS') {
        const res = await api.admin.getProviders();
        setProviders(res || []);
      } else if (activeTab === 'DISPUTES') {
        const res = await api.disputes.getAllForAdmin();
        setDisputes(res || []);
      } else if (activeTab === 'PAYOUTS') {
        const res = await api.payouts.getAdminPayouts();
        setPayouts(res || []);
      } else if (activeTab === 'KYC') {
        const res = await api.kyc.getAdminDocuments();
        setKycDocs(res?.content || res || []);
      }
    } catch (e: any) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleApproveProvider = async (id: number) => {
    try {
      await api.admin.approveProvider(id);
      Alert.alert('Approved', 'Provider account approved.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to approve.');
    }
  };

  const handleProcessPayout = async (id: number, status: string) => {
    try {
      await api.payouts.processAdminPayout(id, status, `TXN_${Date.now()}`, 'Processed via Mobile Admin');
      Alert.alert('Payout Processed', `Payout status updated to ${status}.`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to process payout.');
    }
  };

  const handleVerifyKyc = async (id: number, status: string) => {
    try {
      await api.kyc.verifyDocument(id, status);
      Alert.alert('Document Verification', `KYC Document marked as ${status}.`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update KYC.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Taaskr Operations Console</Text>
        <Text style={styles.subtitle}>Super Admin Management & Governance Portal</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {[
          { key: 'ANALYTICS', label: '📊 Overview' },
          { key: 'PROVIDERS', label: '💼 Providers' },
          { key: 'DISPUTES', label: '⚠️ Disputes' },
          { key: 'PAYOUTS', label: '💰 Payouts' },
          { key: 'KYC', label: '📑 KYC Docs' }
        ].map(t => (
          <TouchableOpacity 
            key={t.key}
            style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
            onPress={() => setActiveTab(t.key as any)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'ANALYTICS' ? (
          <View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Users</Text>
                <Text style={styles.metricVal}>{analytics?.totalUsers || 0}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Providers</Text>
                <Text style={styles.metricVal}>{analytics?.totalProviders || 0}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Bookings</Text>
                <Text style={styles.metricVal}>{analytics?.totalBookings || 0}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <Text style={[styles.metricVal, { color: colors.primary }]}>₹{analytics?.totalRevenue || 0}</Text>
              </View>
            </View>
          </View>
        ) : activeTab === 'PROVIDERS' ? (
          providers.map(p => (
            <View key={p.id} style={styles.listCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <View style={[styles.badge, p.approved ? styles.badgeSuccess : styles.badgeWarn]}>
                  <Text style={styles.badgeText}>{p.approved ? 'APPROVED' : 'PENDING'}</Text>
                </View>
              </View>
              <Text style={styles.subText}>{p.email} • {p.phone}</Text>
              <Text style={styles.subText}>City: {p.city || 'N/A'} | Rating: ⭐ {p.rating || 'N/A'}</Text>

              {!p.approved ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleApproveProvider(p.id)}>
                  <Text style={styles.actionBtnText}>Approve Provider Application</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        ) : activeTab === 'PAYOUTS' ? (
          payouts.map(po => (
            <View key={po.id} style={styles.listCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Amount: ₹{po.amount}</Text>
                <View style={styles.badgeWarn}>
                  <Text style={styles.badgeText}>{po.status}</Text>
                </View>
              </View>
              <Text style={styles.subText}>Provider ID: {po.providerId} | UPI: {po.upiId || 'N/A'}</Text>

              {po.status === 'PENDING' ? (
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleProcessPayout(po.id, 'PROCESSED')}>
                    <Text style={styles.actionBtnText}>Approve & Process Payout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleProcessPayout(po.id, 'REJECTED')}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))
        ) : activeTab === 'KYC' ? (
          kycDocs.map(k => (
            <View key={k.id} style={styles.listCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{k.documentType}</Text>
                <View style={k.status === 'VERIFIED' ? styles.badgeSuccess : styles.badgeWarn}>
                  <Text style={styles.badgeText}>{k.status}</Text>
                </View>
              </View>
              <Text style={styles.subText}>Doc No: {k.documentNumber || 'N/A'} | Provider ID: {k.providerId}</Text>

              {k.status === 'PENDING' ? (
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleVerifyKyc(k.id, 'VERIFIED')}>
                    <Text style={styles.actionBtnText}>Verify Document</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleVerifyKyc(k.id, 'REJECTED')}>
                    <Text style={styles.rejectBtnText}>Reject Document</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          disputes.map(d => (
            <View key={d.id} style={styles.listCard}>
              <Text style={styles.cardTitle}>Booking #{d.bookingId} - {d.reason}</Text>
              <Text style={styles.subText}>{d.description}</Text>
              <Text style={styles.subText}>Status: {d.status}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPage, paddingTop: 54 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 13, color: colors.dark.textMuted, marginTop: 4 },
  tabBar: { paddingHorizontal: 20, marginBottom: 16, maxHeight: 44 },
  tabItem: { backgroundColor: '#27272A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: '#3F3F46' },
  tabItemActive: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: colors.primary },
  tabText: { color: '#A1A1AA', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: colors.primary },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { backgroundColor: colors.dark.bgCard, width: '47%', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.dark.borderLight },
  metricLabel: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },
  metricVal: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 6 },
  listCard: { backgroundColor: colors.dark.bgCard, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.dark.borderLight, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  subText: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  badgeWarn: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  actionBtnText: { color: '#000', fontSize: 12, fontWeight: '800' },
  rejectBtn: { backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  rejectBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '800' }
});
