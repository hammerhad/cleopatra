import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { updateProfile, updatePassword } from '../../src/services/auth';
import { GoldInput } from '../../src/components/ui/GoldInput';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { useToast } from '../../src/hooks/useToast';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';

type Tab = 'profile' | 'password';

const GOAL_OPTIONS = [
  { key: 'fitness', label: '💪 Build Strength' },
  { key: 'mindfulness', label: '🧘 Mindfulness' },
  { key: 'productivity', label: '⚔️ Productivity' },
  { key: 'nutrition', label: '🥗 Nutrition' },
  { key: 'sleep', label: '😴 Sleep' },
  { key: 'learning', label: '📖 Learning' },
  { key: 'creativity', label: '🎨 Creativity' },
];

export default function EditProfileModal() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user } = useAuthStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>(params.tab === 'password' ? 'password' : 'profile');

  // Profile fields
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile() {
    if (!user?.uid) return;
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(user.uid, {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
      });
      toast.success('Profile updated ✓');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password changed ✓');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      const msg = e?.code === 'auth/wrong-password'
        ? 'Current password is incorrect'
        : 'Failed to change password';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  }

  function toggleGoal(key: string) {
    Haptics.selectionAsync();
    setSelectedGoals((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab selector */}
        <View style={styles.tabRow}>
          {(['profile', 'password'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'profile' ? 'Profile' : 'Password'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'profile' ? (
            <>
              {/* Display Name */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                <GoldInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name, Queen"
                  autoCapitalize="words"
                  maxLength={40}
                />
              </View>

              {/* Bio */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>BIO</Text>
                <GoldInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="A brief testament to your greatness..."
                  multiline
                  numberOfLines={3}
                  maxLength={160}
                  style={{ minHeight: 80 }}
                />
                <Text style={styles.charCount}>{bio.length}/160</Text>
              </View>

              <GoldenDivider label="Goals" />

              {/* Goals */}
              <View style={styles.goalsGrid}>
                {GOAL_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    style={[styles.goalChip, selectedGoals.includes(g.key) && styles.goalChipActive]}
                    onPress={() => toggleGoal(g.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.goalLabel, selectedGoals.includes(g.key) && styles.goalLabelActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <GoldButton
                label="Save Profile"
                variant="primary"
                size="lg"
                fullWidth
                loading={savingProfile}
                onPress={handleSaveProfile}
                style={{ marginTop: 24 }}
              />
            </>
          ) : (
            <>
              <CleoCard style={styles.passwordCard}>
                <LinearGradient
                  colors={['rgba(201,168,76,0.04)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.passwordHint}>
                  Your new password must be at least 8 characters and hard to guess as your ambitions are grand.
                </Text>
              </CleoCard>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>
                <GoldInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="current-password"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
                <GoldInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
                <GoldInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              {newPassword.length > 0 && (
                <PasswordStrengthBar password={newPassword} />
              )}

              <GoldButton
                label="Change Password"
                variant="primary"
                size="lg"
                fullWidth
                loading={savingPassword}
                onPress={handleChangePassword}
                style={{ marginTop: 24 }}
              />
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Password strength bar ────────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const score = getPasswordScore(password);
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Fortress'];
  const colors = [Colors.ERROR, '#E07820', Colors.WARNING, Colors.GOLD, Colors.SUCCESS];
  return (
    <View style={styles.strengthRow}>
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.strengthBar, { backgroundColor: i <= score ? colors[score] : Colors.STONE }]} />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: colors[score] }]}>{labels[score]}</Text>
    </View>
  );
}

function getPasswordScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backIcon: { fontSize: 20, color: Colors.GOLD },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    textAlign: 'center',
    letterSpacing: LetterSpacing.TIGHT,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.MD,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.SM,
  },
  tabActive: { backgroundColor: Colors.ONYX },
  tabLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    letterSpacing: 0.3,
  },
  tabLabelActive: { color: Colors.GOLD },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  field: { gap: 8 },
  fieldLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD_MUTED,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
  },
  charCount: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.SHADOW,
    textAlign: 'right',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  goalChipActive: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderColor: Colors.GOLD,
  },
  goalLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  goalLabelActive: { color: Colors.GOLD },
  passwordCard: { overflow: 'hidden' },
  passwordHint: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: -8,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    width: 56,
    textAlign: 'right',
  },
});
