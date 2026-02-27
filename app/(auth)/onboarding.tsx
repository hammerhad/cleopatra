import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldInput } from '../../src/components/ui/GoldInput';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { completeOnboarding } from '../../src/services/auth';
import { useAuthStore } from '../../src/stores/authStore';
import { useUIStore } from '../../src/stores/uiStore';
import { Colors, FontFamily, FontSize, LetterSpacing, Spacing, BorderRadius } from '../../src/theme';

const GOALS = [
  { id: 'habits', emoji: '🔥', label: 'Build powerful habits' },
  { id: 'tasks', emoji: '⚔️', label: 'Conquer my to-do list' },
  { id: 'fitness', emoji: '💪', label: 'Train my body' },
  { id: 'mindset', emoji: '🧠', label: 'Master my mindset' },
  { id: 'journal', emoji: '📖', label: 'Journal & reflect' },
  { id: 'cycle', emoji: '🌙', label: 'Align with my cycle' },
  { id: 'community', emoji: '👑', label: 'Connect with queens' },
];

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [cycleConsent, setCycleConsent] = useState(false);
  const [notifConsent, setNotifConsent] = useState(true);
  const [loading, setLoading] = useState(false);

  function toggleGoal(id: string) {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await completeOnboarding(user.uid, {
        displayName: displayName.trim() || 'Queen',
        goals: selectedGoals,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cycleTrackingConsent: cycleConsent,
        notificationsConsent: notifConsent,
      });
      router.replace('/(tabs)/');
    } catch {
      showToast('Setup failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    // Step 0 — Name
    <Animated.View
      key="name"
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={styles.stepContent}
    >
      <Text style={styles.stepTitle}>What shall we{'\n'}call you, Queen?</Text>
      <Text style={styles.stepBody}>
        This is how you'll be known throughout your kingdom.
      </Text>
      <GoldInput
        label="Your Name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Queen..."
        autoFocus
      />
    </Animated.View>,

    // Step 1 — Goals
    <Animated.View
      key="goals"
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={styles.stepContent}
    >
      <Text style={styles.stepTitle}>What will you{'\n'}conquer?</Text>
      <Text style={styles.stepBody}>Choose all that call to you.</Text>
      <View style={styles.goalsGrid}>
        {GOALS.map((goal) => {
          const selected = selectedGoals.includes(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              style={[styles.goalChip, selected && styles.goalChipSelected]}
              onPress={() => toggleGoal(goal.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>,

    // Step 2 — Privacy / Cycle
    <Animated.View
      key="privacy"
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={styles.stepContent}
    >
      <Text style={styles.stepTitle}>Your Kingdom,{'\n'}Your Rules</Text>
      <Text style={styles.stepBody}>
        Cleopatra never forced compliance. Neither do we.
      </Text>
      <View style={styles.consentBlock}>
        <View style={styles.consentRow}>
          <View style={styles.consentLeft}>
            <Text style={styles.consentTitle}>🌙 Moon Cycle Tracking</Text>
            <Text style={styles.consentDesc}>
              Track your cycle for personalized insights and phase-aware planning. Always private, never shared.
            </Text>
          </View>
          <Switch
            value={cycleConsent}
            onValueChange={setCycleConsent}
            trackColor={{ false: Colors.STONE, true: Colors.GOLD_MUTED }}
            thumbColor={cycleConsent ? Colors.GOLD : Colors.DUST}
          />
        </View>
        <View style={styles.dividerLine} />
        <View style={styles.consentRow}>
          <View style={styles.consentLeft}>
            <Text style={styles.consentTitle}>🔔 Ritual Reminders</Text>
            <Text style={styles.consentDesc}>
              Daily motivation and habit reminders to keep your momentum.
            </Text>
          </View>
          <Switch
            value={notifConsent}
            onValueChange={setNotifConsent}
            trackColor={{ false: Colors.STONE, true: Colors.GOLD_MUTED }}
            thumbColor={notifConsent ? Colors.GOLD : Colors.DUST}
          />
        </View>
      </View>
    </Animated.View>,

    // Step 3 — Ready
    <Animated.View
      key="ready"
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={[styles.stepContent, styles.readyStep]}
    >
      <Text style={styles.ankh}>𓂀</Text>
      <Text style={styles.readyTitle}>Your Kingdom{'\n'}Awaits, {displayName || 'Queen'}</Text>
      <Text style={styles.readyBody}>
        You have chosen your battles. Now go forth and conquer. The throne is yours.
      </Text>
      <LinearGradient
        colors={['rgba(201,168,76,0.05)', 'rgba(201,168,76,0.1)', 'rgba(201,168,76,0.05)']}
        style={styles.readyBox}
      >
        <Text style={styles.readyDecree}>
          "Discipline is not punishment —{'\n'}it is the highest form of self-love."
        </Text>
      </LinearGradient>
    </Animated.View>,
  ];

  const canAdvance =
    step === 0 ? displayName.trim().length >= 2 :
    step === 1 ? selectedGoals.length > 0 :
    true;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.OBSIDIAN, Colors.ONYX]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
        }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= step && styles.progressDotActive]}
            />
          ))}
          <Text style={styles.progressText}>{step + 1} / {TOTAL_STEPS}</Text>
        </View>

        {steps[step]}

        {/* Navigation */}
        <View style={styles.nav}>
          {step > 0 && (
            <GoldButton
              label="← Back"
              variant="ghost"
              onPress={() => setStep(step - 1)}
              style={{ flex: 1 }}
            />
          )}
          <GoldButton
            label={step === TOTAL_STEPS - 1 ? 'BEGIN REIGN' : 'CONTINUE →'}
            onPress={step === TOTAL_STEPS - 1 ? handleFinish : () => setStep(step + 1)}
            loading={loading}
            disabled={!canAdvance}
            style={{ flex: step > 0 ? 2 : 1 }}
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.OBSIDIAN },
  scroll: { paddingHorizontal: 24, flexGrow: 1, gap: 24 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.STONE,
  },
  progressDotActive: {
    backgroundColor: Colors.GOLD,
  },
  progressText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginLeft: 8,
  },
  stepContent: { gap: 20 },
  stepTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 34,
    color: Colors.IVORY,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  stepBody: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_MD,
    color: Colors.DUST,
    lineHeight: 22,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.MD,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  goalChipSelected: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  goalEmoji: { fontSize: 16 },
  goalLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  goalLabelSelected: { color: Colors.IVORY },
  consentBlock: {
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
    overflow: 'hidden',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  consentLeft: { flex: 1, gap: 4 },
  consentTitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
  },
  consentDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    lineHeight: 18,
  },
  dividerLine: { height: 1, backgroundColor: Colors.DIVIDER, marginHorizontal: 16 },
  readyStep: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  ankh: {
    fontSize: 56,
    color: Colors.GOLD,
    textShadowColor: Colors.GOLD,
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  readyTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 36,
    color: Colors.IVORY,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  readyBody: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_MD,
    color: Colors.DUST,
    textAlign: 'center',
    lineHeight: 24,
  },
  readyBox: {
    borderRadius: BorderRadius.LG,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    width: '100%',
  },
  readyDecree: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.PARCHMENT,
    textAlign: 'center',
    lineHeight: 28,
  },
  nav: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
});
