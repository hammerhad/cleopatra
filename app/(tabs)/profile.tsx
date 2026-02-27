import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useCycleStore } from '../../src/stores/cycleStore';
import { useUIStore } from '../../src/stores/uiStore';
import { signOut, updateProfile } from '../../src/services/auth';
import { updateCycleSettings } from '../../src/services/cycle';
import { pickAndUploadAvatar } from '../../src/services/storage';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius, Spacing } from '../../src/theme';

const RANK_EMOJIS: Record<string, string> = {
  'Initiate': '🌱', 'Scholar': '📖', 'Warrior': '⚔️',
  'Strategist': '♟️', 'Commander': '🏛️', 'High Priestess': '🔮', 'Pharaoh': '👑',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { settings } = useCycleStore();
  const { showToast } = useUIStore();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(user?.privacyMode ?? false);
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);

  async function handleAvatarUpload() {
    if (!user?.uid) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar(user.uid);
      if (url) {
        await updateProfile(user.uid, { photoURL: url });
        showToast('Royal portrait updated!', 'success');
      }
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handlePrivacyToggle(val: boolean) {
    setPrivacyMode(val);
    if (!user?.uid) return;
    try {
      await updateProfile(user.uid, { privacyMode: val });
      if (settings) {
        await updateCycleSettings(user.uid, { privacyMode: val });
      }
    } catch {
      setPrivacyMode(!val);
    }
  }

  async function handleNotificationsToggle(val: boolean) {
    setNotifications(val);
    if (!user?.uid) return;
    try {
      await updateProfile(user.uid, { notificationsEnabled: val });
    } catch {
      setNotifications(!val);
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Leave the Kingdom?',
      'You can return whenever your empire needs you.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  }

  const rankEmoji = RANK_EMOJIS[user?.rank ?? 'Initiate'] ?? '🌱';

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <LinearGradient
          colors={[Colors.ANTHRACITE, Colors.OBSIDIAN]}
          style={styles.heroGrad}
        >
          {/* Avatar */}
          <TouchableOpacity onPress={handleAvatarUpload} style={styles.avatarWrap} activeOpacity={0.85}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[Colors.GOLD_DEEP, Colors.GOLD]}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarInitial}>
                  {user?.displayName?.charAt(0)?.toUpperCase() ?? 'Q'}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editIcon}>✎</Text>
            </View>
          </TouchableOpacity>

          {/* User info */}
          <Text style={styles.userName}>{user?.displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <BadgeChip
            label={`${rankEmoji} ${user?.rank ?? 'Initiate'}`}
            variant="gold"
            style={{ marginTop: 8 }}
          />
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>{user?.rankPoints?.toLocaleString() ?? 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </CleoCard>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>{user?.streakCount ?? 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </CleoCard>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>{user?.longestStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </CleoCard>
        </View>

        {/* Subscription badge */}
        {user?.tier === 'premium' ? (
          <CleoCard variant="gold" style={styles.premiumCard}>
            <Text style={styles.premiumTitle}>👑 Premium Queen</Text>
            <Text style={styles.premiumSub}>All kingdoms unlocked</Text>
          </CleoCard>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(modals)/paywall')} activeOpacity={0.88}>
            <CleoCard style={styles.upgradeCard}>
              <View style={styles.upgradeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upgradeTitle}>Unlock Full Reign</Text>
                  <Text style={styles.upgradeSub}>
                    Moon Cycle, Royal Court, advanced analytics + more
                  </Text>
                </View>
                <Text style={styles.upgradeArrow}>→</Text>
              </View>
            </CleoCard>
          </TouchableOpacity>
        )}

        <GoldenDivider label="Settings" />

        {/* Settings */}
        <CleoCard style={styles.settingsCard}>
          <SettingRow
            label="🔒 Privacy Mode"
            description="Hides cycle data and sensitive content"
            value={privacyMode}
            onToggle={handlePrivacyToggle}
          />
          <GoldenDivider style={{ marginVertical: 0 }} />
          <SettingRow
            label="🔔 Ritual Reminders"
            description="Daily motivation and habit notifications"
            value={notifications}
            onToggle={handleNotificationsToggle}
          />
        </CleoCard>

        <GoldenDivider />

        {/* Navigation */}
        <CleoCard style={styles.navCard}>
          {[
            { label: '🌙 Moon Cycle', onPress: () => router.push('/(modals)/cycle-tracker') },
            { label: '📊 Analytics', onPress: () => {} },
            { label: '✎ Edit Profile', onPress: () => {} },
            { label: '🔑 Change Password', onPress: () => {} },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={styles.navItem}
              activeOpacity={0.7}
            >
              <Text style={styles.navLabel}>{item.label}</Text>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </CleoCard>

        <GoldButton
          label="SIGN OUT"
          variant="outline"
          onPress={handleSignOut}
          fullWidth
          style={{ marginTop: 16 }}
        />

        <Text style={styles.version}>Cleopatra v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.STONE, true: Colors.GOLD_MUTED }}
        thumbColor={value ? Colors.GOLD : Colors.DUST}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  heroGrad: {
    borderRadius: BorderRadius.XL,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
    marginBottom: 4,
  },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: Colors.GOLD,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 36,
    color: Colors.OBSIDIAN,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.ANTHRACITE,
  },
  editIcon: { fontSize: 12, color: Colors.OBSIDIAN },
  userName: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  userEmail: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.GOLD,
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumCard: { padding: 16, gap: 4 },
  premiumTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.OBSIDIAN,
  },
  premiumSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.OBSIDIAN,
    opacity: 0.7,
  },
  upgradeCard: {},
  upgradeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.TIGHT,
  },
  upgradeSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: 2,
  },
  upgradeArrow: {
    fontSize: 20,
    color: Colors.GOLD,
  },
  settingsCard: { gap: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
  },
  settingDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  navCard: { gap: 0 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  navLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.PARCHMENT,
  },
  navArrow: { color: Colors.DUST, fontSize: 16 },
  version: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.SHADOW,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
