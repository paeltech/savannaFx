import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../../shared/constants/colors';
import { Lock, Eye, EyeOff } from 'lucide-react-native';

function parseHashFragment(url: string | null): Record<string, string> {
  if (!url || !url.includes('#')) return {};
  const hash = url.split('#')[1];
  if (!hash) return {};
  const params: Record<string, string> = {};
  hash.split('&').forEach((part) => {
    const [key, value] = part.split('=');
    if (key && value) params[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return params;
}

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const applySessionFromUrl = async (url: string) => {
      const params = parseHashFragment(url);
      const accessToken = params.access_token;
      const refreshToken = params.refresh_token;
      const type = params.type;

      if (type !== 'recovery' || !accessToken) {
        if (mounted) {
          setTokenValid(false);
          setErrorMessage('Invalid or expired reset link. Request a new one.');
        }
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (!mounted) return;
      if (error) {
        setTokenValid(false);
        setErrorMessage('Invalid or expired reset link. Request a new one.');
        return;
      }
      setTokenValid(true);
      setErrorMessage(null);
    };

    const handleUrl = async (url: string | null) => {
      if (!url) {
        if (mounted) {
          setTokenValid(false);
          setErrorMessage('Open the reset link from your email to set a new password.');
        }
        return;
      }
      await applySessionFromUrl(url);
    };

    Linking.getInitialURL()
      .then(handleUrl)
      .catch(() => {
        if (mounted) {
          setTokenValid(false);
          setErrorMessage('Could not read reset link.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      Alert.alert('Invalid password', 'Password must be at least 8 characters.');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      Alert.alert(
        'Invalid password',
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePassword()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      await supabase.auth.signOut();

      Alert.alert(
        'Password reset',
        'Your password has been updated. Sign in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Validating reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tokenValid) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Invalid or expired link</Text>
          <Text style={styles.errorMessage}>
            {errorMessage ||
              'Open the reset link from your email to set a new password.'}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/auth/forgot-password')}
          >
            <Text style={styles.primaryButtonText}>Request new link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.secondaryButtonText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Set new password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!submitting}
              selectionColor={Colors.gold}
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.rainyGrey} strokeWidth={2} />
              ) : (
                <Eye size={20} color={Colors.rainyGrey} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} color={Colors.rainyGrey} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#666666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!submitting}
              selectionColor={Colors.gold}
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={Colors.rainyGrey} strokeWidth={2} />
              ) : (
                <Eye size={20} color={Colors.rainyGrey} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Updating...' : 'Reset password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.replace('/auth/login')}
            disabled={submitting}
          >
            <Text style={styles.backLinkText}>Back to sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: Colors.rainyGrey,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: Colors.rainyGrey,
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    color: Colors.rainyGrey,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
  },
  eyeIcon: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    marginTop: 8,
  },
  secondaryButtonText: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
  },
  backLink: {
    alignSelf: 'center',
  },
  backLinkText: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
  },
});
