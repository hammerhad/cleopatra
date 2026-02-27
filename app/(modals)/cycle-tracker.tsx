import React, { useState, useEffect } from 'react';
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
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '../../src/stores/authStore';
import { useCycleStore } from '../../src/stores/cycleStore';
import { useUIStore } from '../../src/stores/uiStore';
import {
  getCycleSettings, updateCycleSettings, logPeriodStart, getCycleLogs,
} from '../../src/services/cycle';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { PHASE_INSIGHTS, type CyclePhase, type CycleSymptom, type FlowIntensity } from '../../src/types/cycle';
import { getPhaseEmoji } from '../../src/utils/cyclePrediction';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';

const SYMPTOMS: { key: CycleSymptom; emoji: string; label: string }[] = [
  { key: 'cramps', emoji: '😣', label: 'Cramps' },
  { key: 'bloating', emoji: '💨', label: 'Bloating' },
  { key: 'headache', emoji: '🤕', label: 'Headache' },
  { key: 'fatigue', emoji: '😴', label: 'Fatigue' },
  { key: 'mood_swings', emoji: '🌊', label: 'Mood swings' },
  { key: 'breast_tenderness', emoji: '💔', label: 'Tenderness' },
  { key: 'acne', emoji: '😤', label: 'Acne' },
  { key: 'backache', emoji: '🔙', label: 'Backache' },
  { key: 'high_energy', emoji: '⚡', label: 'High energy' },
  { key: 'low_energy', emoji: '🔋', label: 'Low energy' },
  { key: 'cravings', emoji: '🍫', label: 'Cravings' },
  { key: 'insomnia', emoji: '🌙', label: 'Insomnia' },
];

const FLOW_LEVELS: { key: FlowIntensity; emoji: string; label: string }[] = [
  { key: 'none', emoji: '○', label: 'None' },
  { key: 'spotting', emoji: '·', label: 'Spotting' },
  { key: 'light', emoji: '◑', label: 'Light' },
  { key: 'medium', emoji: '●', label: 'Medium' },
  { key: 'heavy', emoji: '⬤', label: 'Heavy' },
];

export default function CycleTrackerModal() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { settings, prediction, setSettings } = useCycleStore();
  const { showToast } = useUIStore();

  const [selectedSymptoms, setSelectedSymptoms] = useState<CycleSymptom[]>([]);
  const [flow, setFlow] = useState<FlowIntensity>('none');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [trackingEnabled, setTrackingEnabled] = useState(settings?.trackingEnabled ?? false);
  const [loggingPeriod, setLoggingPeriod] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleSymptom(s: CycleSymptom) {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleLogPeriodStart() {
    if (!user?.uid) return;
    setLoggingPeriod(true);
    try {
      await logPeriodStart(user.uid, new Date());
      showToast('Period logged. Your cycle begins anew.', 'success');
    } catch {
      showToast('Failed to log period', 'error');
    } finally {
      setLoggingPeriod(false);
    }
  }

  async function handleToggleTracking(val: boolean) {
    setTrackingEnabled(val);
    if (!user?.uid) return;
    try {
      await updateCycleSettings(user.uid, { trackingEnabled: val });
      const updated = await getCycleSettings(user.uid);
      if (updated) setSettings(updated);
    } catch {
      setTrackingEnabled(!val);
    }
  }

  const currentPhase = prediction?.currentPhase;
  const phaseInfo = currentPhase ? PHASE_INSIGHTS[currentPhase] : null;
  const daysUntil = prediction?.daysUntilNextPeriod ?? null;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.OBSIDIAN, Colors.ONYX]} style={StyleSheet.absoluteFill} />
      <View style={styles.handleBar} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Sacred Cycle</Text>
          <Text style={styles.title}>Moon Phases</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Enable tracking */}
        <CleoCard style={styles.trackingToggle}>
          <View style={styles.trackingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.trackingTitle}>🌙 Cycle Tracking</Text>
              <Text style={styles.trackingDesc}>
                Track your phases for personalized insights
              </Text>
            </View>
            <Switch
              value={trackingEnabled}
              onValueChange={handleToggleTracking}
              trackColor={{ false: Colors.STONE, true: Colors.GOLD_MUTED }}
              thumbColor={trackingEnabled ? Colors.GOLD : Colors.DUST}
            />
          </View>
        </CleoCard>

        {!trackingEnabled ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.trackingOff}>
            <Text style={styles.trackingOffEmoji}>🌑</Text>
            <Text style={styles.trackingOffTitle}>The moon waits for you</Text>
            <Text style={styles.trackingOffBody}>
              Enable cycle tracking to align your habits, tasks, and energy
              with the natural rhythm of your body.
            </Text>
          </Animated.View>
        ) : (
          <>
            {/* Current phase card */}
            {phaseInfo ? (
              <Animated.View entering={FadeInDown.duration(400)}>
                <LinearGradient
                  colors={phaseInfo.gradientColors as [string, string]}
                  style={styles.phaseCard}
                >
                  <View style={styles.phaseCardHeader}>
                    <Text style={styles.phaseEmoji}>{phaseInfo.emoji}</Text>
                    <View>
                      <Text style={styles.phaseCardEyebrow}>CURRENT PHASE · DAY {prediction?.cycleDay}</Text>
                      <Text style={styles.phaseCardTitle}>{phaseInfo.title}</Text>
                    </View>
                  </View>
                  <Text style={styles.phaseCardEnergy}>{phaseInfo.energyProfile}</Text>
                  <Text style={styles.phaseCardAffirmation}>"{phaseInfo.affirmation}"</Text>

                  {daysUntil !== null && (
                    <View style={styles.nextPeriodRow}>
                      <Text style={styles.nextPeriodText}>
                        {daysUntil <= 0
                          ? 'Your period may begin today'
                          : daysUntil === 1
                          ? 'Period expected tomorrow'
                          : `Period expected in ${daysUntil} days`}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            ) : (
              <CleoCard style={styles.noPrediction}>
                <Text style={styles.noPredictionText}>
                  Log your first period to unlock phase predictions
                </Text>
              </CleoCard>
            )}

            {/* Phase insights */}
            {phaseInfo && (
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.insightsSection}>
                <Text style={styles.insightTitle}>Best for right now:</Text>
                <View style={styles.insightList}>
                  {phaseInfo.bestFor.slice(0, 3).map((item) => (
                    <View key={item} style={styles.insightItem}>
                      <Text style={styles.insightDot}>◆</Text>
                      <Text style={styles.insightText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.workoutSuggest}>
                  💪 {phaseInfo.workoutSuggestion}
                </Text>
              </Animated.View>
            )}

            <GoldenDivider label="Log Today" />

            {/* Flow */}
            <View>
              <Text style={styles.sectionLabel}>Flow</Text>
              <View style={styles.flowRow}>
                {FLOW_LEVELS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setFlow(f.key)}
                    style={[styles.flowOption, flow === f.key && styles.flowOptionActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.flowEmoji, flow === f.key && styles.flowEmojiActive]}>
                      {f.emoji}
                    </Text>
                    <Text style={[styles.flowLabel, flow === f.key && styles.flowLabelActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Energy */}
            <View>
              <Text style={styles.sectionLabel}>Energy Level</Text>
              <View style={styles.energyRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setEnergyLevel(n)}
                    style={[styles.energyDot, n <= energyLevel && styles.energyDotFilled]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.energyNum}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Symptoms */}
            <View>
              <Text style={styles.sectionLabel}>Symptoms</Text>
              <View style={styles.symptomsGrid}>
                {SYMPTOMS.map((s) => {
                  const selected = selectedSymptoms.includes(s.key);
                  return (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => toggleSymptom(s.key)}
                      style={[styles.symptomChip, selected && styles.symptomChipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.symptomEmoji}>{s.emoji}</Text>
                      <Text style={[styles.symptomLabel, selected && styles.symptomLabelActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <GoldenDivider />

            {/* Log period start */}
            <View style={styles.periodSection}>
              <Text style={styles.periodTitle}>Start of Period?</Text>
              <Text style={styles.periodDesc}>
                Mark today as the first day of your new cycle
              </Text>
              <GoldButton
                label="🌑 LOG PERIOD START"
                variant="outline"
                onPress={handleLogPeriodStart}
                loading={loggingPeriod}
                fullWidth
                style={{ marginTop: 12 }}
              />
            </View>

            <GoldButton
              label="Save Today's Log"
              onPress={() => {
                showToast('Daily log saved', 'success');
                router.back();
              }}
              fullWidth
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  handleBar: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.STONE,
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: 13,
    color: Colors.DUST,
  },
  trackingToggle: {},
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trackingTitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
  },
  trackingDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: 2,
  },
  trackingOff: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  trackingOffEmoji: { fontSize: 48 },
  trackingOffTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H3,
    color: Colors.IVORY,
  },
  trackingOffBody: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    textAlign: 'center',
    lineHeight: 22,
  },
  phaseCard: {
    borderRadius: BorderRadius.XL,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  phaseCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  phaseEmoji: { fontSize: 36 },
  phaseCardEyebrow: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.WIDEST,
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  phaseCardTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H3,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  phaseCardEnergy: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
    opacity: 0.85,
    lineHeight: 20,
  },
  phaseCardAffirmation: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    lineHeight: 26,
    opacity: 0.9,
    letterSpacing: -0.2,
  },
  nextPeriodRow: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BorderRadius.MD,
    padding: 10,
  },
  nextPeriodText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.IVORY,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  noPrediction: { alignItems: 'center', paddingVertical: 24 },
  noPredictionText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    textAlign: 'center',
  },
  insightsSection: {
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
  },
  insightTitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.GOLD,
    letterSpacing: 0.5,
  },
  insightList: { gap: 6 },
  insightItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightDot: { fontSize: 8, color: Colors.GOLD },
  insightText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.PARCHMENT,
  },
  workoutSuggest: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    fontStyle: 'italic',
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    color: Colors.PARCHMENT,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  flowRow: { flexDirection: 'row', gap: 8 },
  flowOption: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: BorderRadius.MD,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  flowOptionActive: {
    backgroundColor: 'rgba(122,26,46,0.2)',
    borderColor: Colors.MENSTRUAL,
  },
  flowEmoji: { fontSize: 18, color: Colors.DUST },
  flowEmojiActive: { color: Colors.IVORY },
  flowLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
  },
  flowLabelActive: { color: Colors.IVORY },
  energyRow: { flexDirection: 'row', gap: 10 },
  energyDot: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.MD,
    backgroundColor: Colors.ANTHRACITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  energyDotFilled: {
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderColor: Colors.GOLD,
  },
  energyNum: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  symptomChipActive: {
    backgroundColor: 'rgba(58,10,21,0.4)',
    borderColor: Colors.MENSTRUAL,
  },
  symptomEmoji: { fontSize: 13 },
  symptomLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  symptomLabelActive: { color: Colors.IVORY },
  periodSection: { gap: 4 },
  periodTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  periodDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
});
