import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api, serverStorage } from '../../services/api';
import { Category, ServiceItem } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import ServerConfigModal from '../../components/ServerConfigModal';

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeServerUrl, setActiveServerUrl] = useState('');
  const [serverModalVisible, setServerModalVisible] = useState(false);

  const loadData = async () => {
    setErrorMsg(null);
    const url = await serverStorage.getServerUrl();
    setActiveServerUrl(url);

    try {
      const [catRes, srvRes] = await Promise.all([
        api.catalog.getCategories(),
        api.catalog.getServices()
      ]);
      setCategories(catRes || []);
      setServices(srvRes || []);
    } catch (e: any) {
      console.error('Failed to load catalog:', e);
      setErrorMsg(e.message || 'Could not connect to backend server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredServices = selectedCatId
    ? services.filter(s => s.categoryId === selectedCatId)
    : services;

  return (
    <View style={styles.appWrapper}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); loadData(); }} 
            tintColor={colors.primary} 
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
          </View>
          <TouchableOpacity style={styles.serverPill} onPress={() => setServerModalVisible(true)}>
            <Text style={styles.serverPillText} numberOfLines={1}>⚙️ Server</Text>
          </TouchableOpacity>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>⚠️ Connection Issue</Text>
            <Text style={styles.errorSub}>{errorMsg}</Text>
            <Text style={styles.errorUrl}>Target: {activeServerUrl}</Text>

            <View style={styles.errorActionRow}>
              <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.configBtn} onPress={() => setServerModalVisible(true)}>
                <Text style={styles.configBtnText}>Change API Endpoint</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.banner}>
          <Text style={styles.bannerBadge}>TAASKR PRO</Text>
          <Text style={styles.bannerTitle}>Doorstep Experts On Demand</Text>
          <Text style={styles.bannerSubtitle}>Upfront Pricing • Verified Professionals • Live GPS Tracking</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <TouchableOpacity 
                style={[styles.catCard, selectedCatId === null && styles.catCardActive]}
                onPress={() => setSelectedCatId(null)}
              >
                <Text style={[styles.catName, selectedCatId === null && styles.catNameActive]}>All Services</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.catCard, selectedCatId === cat.id && styles.catCardActive]}
                  onPress={() => setSelectedCatId(cat.id === selectedCatId ? null : cat.id)}
                >
                  <Text style={[styles.catName, selectedCatId === cat.id && styles.catNameActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCatId ? 'Filtered Services' : 'Popular Doorstep Services'}
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : filteredServices.length === 0 ? (
            <Text style={{ color: colors.dark.textMuted, marginVertical: 14 }}>No services available in this category.</Text>
          ) : (
            filteredServices.map((srv) => (
              <View key={srv.id} style={styles.serviceCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{srv.name}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={2}>{srv.description}</Text>
                  <Text style={styles.servicePrice}>₹{srv.price}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.bookBtn}
                  onPress={() => navigation.navigate('BookingFlow', { service: srv })}
                >
                  <Text style={styles.bookBtnText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ServerConfigModal 
        visible={serverModalVisible} 
        onClose={() => setServerModalVisible(false)}
        onUrlChanged={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: colors.dark.bgPage,
  },
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPage,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: colors.dark.textMuted,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  serverPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  serverPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  errorSub: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 2,
  },
  errorUrl: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  configBtn: {
    backgroundColor: '#27272A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  configBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  banner: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  catScroll: {
    flexDirection: 'row',
  },
  catCard: {
    backgroundColor: colors.dark.bgCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  catCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  catName: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  catNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  serviceCard: {
    backgroundColor: colors.dark.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  serviceDesc: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  bookBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
});
