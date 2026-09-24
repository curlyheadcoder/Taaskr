import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { Eye, EyeOff, Briefcase, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';

export default function ProviderLoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { login, isLoading, error: authError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setValidationError('');
    try {
      await login(email.trim(), password.trim());
    } catch (e: any) {}
  };

  const currentError = validationError || authError;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
          <ArrowLeft color="#FFF" size={18} />
          <Text style={styles.backText}>Customer Login</Text>
        </TouchableOpacity>

        <View style={styles.brandHeader}>
          <View style={styles.iconContainer}>
            <Briefcase color="#8b5cf6" size={28} />
          </View>
          <Text style={styles.brandTitle}>Provider Pro</Text>
          <Text style={styles.brandSubtitle}>Business Owner & Dispatch Console</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Provider Sign In</Text>

          {currentError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{currentError}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Provider Email</Text>
            <TextInput
              style={styles.input}
              placeholder="partner@company.com"
              placeholderTextColor={colors.dark.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotText, { color: '#8b5cf6' }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={colors.dark.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff color={colors.dark.textMuted} size={20} />
                ) : (
                  <Eye color={colors.dark.textMuted} size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Sign In to Provider Console</Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
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
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark.textMain,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
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
    backgroundColor: '#8b5cf6',
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
    color: '#FFF',
  },
});
