import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { Eye, EyeOff, User, Briefcase, Wrench, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';

const ROLES = [
  { id: 'customer', label: 'User', expectedRole: 'USER', icon: User, accent: colors.primary },
  { id: 'provider', label: 'Provider', expectedRole: 'PROVIDER', icon: Briefcase, accent: '#8b5cf6' },
  { id: 'partner', label: 'Worker', expectedRole: 'SERVICE_PARTNER', icon: Wrench, accent: '#10b981' },
  { id: 'admin', label: 'Admin', expectedRole: 'ADMIN', icon: ShieldCheck, accent: '#ef4444' },
];

export default function LoginScreen({ navigation }: any) {
  const [selectedRole, setSelectedRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { login, isLoading, error: authError } = useAuthStore();

  const activeRoleConfig = ROLES.find(r => r.id === selectedRole) || ROLES[0];

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setValidationError('');
    try {
      await login(email.trim(), password.trim());
      
      // Note: Zustand auth state handles login state update
    } catch (e: any) {
      // Error handled by store
    }
  };

  const currentError = validationError || authError;

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
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <View style={[styles.roleBadge, { borderColor: activeRoleConfig.accent }]}>
              <Text style={[styles.roleBadgeText, { color: activeRoleConfig.accent }]}>
                {activeRoleConfig.label} Portal
              </Text>
            </View>
          </View>

          {/* Role Switcher Pills */}
          <View style={styles.roleTabs}>
            {ROLES.map((r) => {
              const IconComp = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.roleTab,
                    isSelected && { backgroundColor: r.accent }
                  ]}
                  onPress={() => {
                    setSelectedRole(r.id);
                    setValidationError('');
                  }}
                >
                  <IconComp size={14} color={isSelected ? '#000' : colors.dark.textMuted} />
                  <Text style={[
                    styles.roleTabText,
                    isSelected && { color: '#000', fontWeight: '700' }
                  ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {currentError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{currentError}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="user@taaskr.com"
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
                <Text style={styles.forgotText}>Forgot password?</Text>
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            style={[
              styles.btnPrimary, 
              { backgroundColor: activeRoleConfig.accent },
              isLoading && styles.btnDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>Sign In as {activeRoleConfig.label}</Text>
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
    marginBottom: 28,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: colors.dark.bgSubtle,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.dark.textMuted,
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
    color: colors.primary,
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
