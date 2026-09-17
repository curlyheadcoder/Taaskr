import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    try {
      await login(email.trim(), password.trim());
    } catch (e) {}
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>Taaskr<Text style={styles.brandDot}>.</Text></Text>
          <Text style={styles.brandSubtitle}>On-Demand Doorstep Services Marketplace</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In to Account</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. user@taaskr.com or 9876543210"
              placeholderTextColor={colors.dark.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.dark.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPage,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  brandDot: {
    color: colors.primary,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.dark.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: colors.status.errorBg,
    borderColor: colors.status.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark.textMain,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.dark.bgSubtle,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFF',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
