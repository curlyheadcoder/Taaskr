import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert 
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { serverStorage } from '../../services/api';
import ServerConfigModal from '../../components/ServerConfigModal';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { theme, isDark, toggleTheme, themeColors } = useTheme();
  const [serverUrl, setServerUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const refreshUrl = async () => {
    const url = await serverStorage.getServerUrl();
    setServerUrl(url);
  };

  useEffect(() => {
    refreshUrl();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bgPage }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.textMain }]}>Settings & Account</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderLight }]}>
        <Text style={[styles.name, { color: themeColors.textMain }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.email, { color: themeColors.textMuted }]}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'CUSTOMER'}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: themeColors.textMain }]}>Account & Services</Text>

      <TouchableOpacity 
        style={[styles.settingCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderLight }]} 
        onPress={() => navigation?.navigate('AddressBook')}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingTitle, { color: themeColors.textMain }]}>📍 Saved Delivery Addresses</Text>
          <Text style={[styles.settingSub, { color: themeColors.textMuted }]}>Manage home, work, and custom addresses</Text>
        </View>
        <Text style={styles.changeBadge}>Manage →</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.settingCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderLight }]} 
        onPress={() => navigation?.navigate('VehicleTransport')}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingTitle, { color: themeColors.textMain }]}>🚚 Vehicle Transport & Freight</Text>
          <Text style={[styles.settingSub, { color: themeColors.textMuted }]}>Book on-demand intra-city goods transport</Text>
        </View>
        <Text style={styles.changeBadge}>Book →</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: themeColors.textMain }]}>App Preferences</Text>

      <View style={[styles.settingCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderLight }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingTitle, { color: themeColors.textMain }]}>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</Text>
          <Text style={[styles.settingSub, { color: themeColors.textMuted }]}>
            {isDark ? 'Sleek dark theme active' : 'Bright light theme active'}
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={isDark ? '#FFF' : '#f4f3f4'}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: themeColors.textMain }]}>Network & Server Config</Text>

      <TouchableOpacity style={[styles.settingCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.borderLight }]} onPress={() => setModalVisible(true)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingTitle, { color: themeColors.textMain }]}>🌐 Backend Server API Endpoint</Text>
          <Text style={styles.settingSub} numberOfLines={1}>{serverUrl || 'Loading...'}</Text>
        </View>
        <Text style={styles.changeBadge}>Change ⚙️</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: themeColors.textMain }]}>Account Actions</Text>

      <TouchableOpacity style={styles.logoutCard} onPress={logout}>
        <Text style={styles.logoutText}>🚪 Sign Out</Text>
      </TouchableOpacity>

      <ServerConfigModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        onUrlChanged={refreshUrl}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPage,
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  profileCard: {
    backgroundColor: colors.dark.bgCard,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    marginBottom: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  email: {
    fontSize: 13,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  roleText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 10,
  },
  settingCard: {
    backgroundColor: colors.dark.bgCard,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  settingSub: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  changeBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 10,
  },
  logoutCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
  },
});
