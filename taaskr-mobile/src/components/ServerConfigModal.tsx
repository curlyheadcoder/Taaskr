import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Modal, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { colors } from '../theme/colors';
import { serverStorage, CLOUD_URL, DEFAULT_LOCAL_URL } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUrlChanged?: () => void;
}

export default function ServerConfigModal({ visible, onClose, onUrlChanged }: Props) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (visible) {
      serverStorage.getServerUrl().then((url) => {
        setCurrentUrl(url);
        setCustomInput(url);
        runTest(url);
      });
    }
  }, [visible]);

  const runTest = async (urlToTest: string) => {
    setTesting(true);
    setTestResult(null);
    const res = await serverStorage.testConnection(urlToTest);
    setTesting(false);
    setTestResult({ success: res.success, message: res.message });
  };

  const applyUrl = async (urlToApply: string) => {
    await serverStorage.setServerUrl(urlToApply);
    setCurrentUrl(urlToApply);
    if (onUrlChanged) onUrlChanged();
    Alert.alert('Server Changed', `Backend API URL updated to:\n${urlToApply}`);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>⚙️ Backend Server Settings</Text>
          <Text style={styles.subtitle}>Select or test the Spring Boot API host URL</Text>

          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Active Endpoint:</Text>
            <Text style={styles.statusValue} numberOfLines={1}>{currentUrl || 'Not set'}</Text>
            {testing ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 6 }} />
            ) : testResult ? (
              <View style={[styles.badge, testResult.success ? styles.badgeSuccess : styles.badgeError]}>
                <Text style={styles.badgeText}>{testResult.message}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Quick Switch Options</Text>

          <TouchableOpacity 
            style={[styles.optionCard, currentUrl === DEFAULT_LOCAL_URL && styles.optionCardActive]}
            onPress={() => applyUrl(DEFAULT_LOCAL_URL)}
          >
            <Text style={styles.optionTitle}>💻 Local Computer (Wi-Fi IP)</Text>
            <Text style={styles.optionSub}>{DEFAULT_LOCAL_URL}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionCard, currentUrl === CLOUD_URL && styles.optionCardActive]}
            onPress={() => applyUrl(CLOUD_URL)}
          >
            <Text style={styles.optionTitle}>☁️ Render Cloud Server</Text>
            <Text style={styles.optionSub}>{CLOUD_URL}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Custom Server URL</Text>
          <TextInput
            style={styles.input}
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="http://192.168.1.50:8080"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.testBtn} onPress={() => runTest(customInput)}>
              <Text style={styles.testBtnText}>Test Ping</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={() => applyUrl(customInput)}>
              <Text style={styles.applyBtnText}>Apply & Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 4,
    marginBottom: 16,
  },
  statusBox: {
    backgroundColor: '#09090B',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 2,
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 8,
    marginBottom: 8,
  },
  optionCard: {
    backgroundColor: '#27272A',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  optionSub: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  testBtn: {
    flex: 1,
    backgroundColor: '#3F3F46',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  testBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#000',
    fontWeight: '800',
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#A1A1AA',
    fontWeight: '600',
  },
});
