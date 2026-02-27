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
import { signUp } from '../../src/services/auth';
import { useUIStore } from '../../src/stores/uiStore';
import { Colors, FontFamily, FontSize, LetterSpacing } from '../../src/theme';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useUIStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  function validate() {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Your name is required';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'At least 8 characters required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSignUp() {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password });
      // onUserCreated cloud function will set the profile
      router.replace('/(auth)/onboarding');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email already has a kingdom' });
      } else if (code === 'auth/weak-password') {
        setErrors({ password: 'Choose a stronger password' });
      } else {
        showToast('Registration failed. Try again.', 'error');
      }
    } finally {
      setLoading(false);
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
        contentContainerStyle={[styles.container, {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>New Queen</Text>
          <Text style={styles.title}>Claim Your{'\n'}Crown</Text>
          <Text style={styles.subtitle}>
            Build your empire, one day at a time.
          </Text>
        </View>

        <GoldenDivider />

        <View style={styles.form}>
          <GoldInput
            label="Your Royal Name"
            placeholder="Queen..."
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            error={errors.name}
          />
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
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={errors.password}
            rightIcon={<Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Text style={styles.terms}>
            By creating an account, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>

          <GoldButton
            label="CLAIM MY THRONE"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 4 }}
          />
        </View>

        <GoldenDivider label="or" style={{ marginVertical: 24 }} />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/sign-in')}
          style={styles.signInLink}
        >
          <Text style={styles.signInText}>
            Already a queen?{' '}
            <Text style={styles.signInHighlight}>Return to throne →</Text>
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
  back: { alignSelf: 'flex-start', marginBottom: 24 },
  backText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  header: { gap: 8 },
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
  form: { gap: 16 },
  eyeIcon: { fontSize: 16 },
  terms: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    lineHeight: 18,
  },
  link: { color: Colors.GOLD_MUTED },
  signInLink: { alignItems: 'center' },
  signInText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  signInHighlight: { fontFamily: FontFamily.BODY_SEMIBOLD, color: Colors.GOLD },
});
