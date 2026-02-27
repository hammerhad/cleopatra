import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldInput } from '../../src/components/ui/GoldInput';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { signIn, sendPasswordReset } from '../../src/services/auth';
import { useUIStore } from '../../src/stores/uiStore';
import { Colors, FontFamily, FontSize, LetterSpacing, Spacing } from '../../src/theme';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSignIn() {
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        showToast('Invalid credentials. Try again.', 'error');
      } else if (code === 'auth/too-many-requests') {
        showToast('Too many attempts. Reset your password.', 'error');
      } else {
        showToast('Sign in failed. Try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email first' });
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordReset(email.trim());
      showToast('Reset link sent to your email', 'success');
    } catch {
      showToast('Could not send reset email', 'error');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[Colors.OBSIDIAN, Colors.ONYX]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Welcome Back</Text>
          <Text style={styles.title}>The Throne{'\n'}Awaits You</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your reign.
          </Text>
        </View>

        <GoldenDivider />

        {/* Form */}
        <View style={styles.form}>
          <GoldInput
            label="Royal Email"
            placeholder="queen@empire.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
          <GoldInput
            label="Secret Decree (Password)"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            error={errors.password}
            rightIcon={
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotLink}>
            <Text style={styles.forgotText}>
              {resetLoading ? 'Sending...' : 'Forgot your decree?'}
            </Text>
          </TouchableOpacity>

          <GoldButton
            label="ENTER THE KINGDOM"
            onPress={handleSignIn}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>

        <GoldenDivider label="or" style={{ marginVertical: 24 }} />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/sign-up')}
          style={styles.signUpLink}
        >
          <Text style={styles.signUpText}>
            No kingdom yet?{' '}
            <Text style={styles.signUpHighlight}>Claim your throne →</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    flexGrow: 1,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 36,
    color: Colors.IVORY,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  form: {
    gap: 16,
  },
  eyeIcon: {
    fontSize: 16,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD_MUTED,
    letterSpacing: 0.5,
  },
  signUpLink: {
    alignItems: 'center',
  },
  signUpText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  signUpHighlight: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    color: Colors.GOLD,
  },
});
