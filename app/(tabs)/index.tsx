import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { useCycleStore } from '../../src/stores/cycleStore';
import { getTodayHabitsWithLogs, logHabitCompletion } from '../../src/services/habits';
import { onCycleSettingsChange, computeLocalPrediction } from '../../src/services/cycle';
import { getDailyCleopatraInsight } from '../../src/services/gemini';
import { DashboardSkeleton } from '../../src/components/skeletons/DashboardSkeleton';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { MotivationCard } from '../../src/components/ui/MotivationCard';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { PHASE_INSIGHTS } from '../../src/types/cycle';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius, Shadows } from '../../src/theme';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUOTES = [
  { quote: 'Your discipline today writes your legend tomorrow.', author: 'Cleopatra' },
  { quote: 'A queen never rushes — she executes with precision.', author: 'The Throne' },
  { quote: 'Every empire begins with a single decree.', author: 'Cleopatra' },
  { quote: 'Power is not given. It is cultivated, daily.', author: 'The Kingdom' },
  { quote: 'She who masters herself, masters the world.', author: 'Ancient Wisdom' },
  { quote: 'The Nile does not apologize for its greatness.', author: 'Cleopatra' },
  { quote: 'Conquer your morning and you conquer your day.', author: 'The Pharaohs' },
];

const RANK_EMOJIS: Record<string, string> = {
  Initiate: '🌱', Scholar: '📖', Warrior: '⚔️',
  Strategist: '♟️', Commander: '🏛️', 'High Priestess': '🔮', Pharaoh: '👑',
};

const RANK_THRESHOLDS = [
  { rank: 'Initiate', points: 0 },
  { rank: 'Scholar', points: 100 },
  { rank: 'Warrior', points: 300 },
  { rank: 'Strategist', points: 600 },
  { rank: 'Commander', points: 1000 },
  { rank: 'High Priestess', points: 2000 },
  { rank: 'Pharaoh', points: 5000 },
];

const QUICK_ACCESS = [
  { label: 'Training', emoji: '🏋️', route: '/(tabs)/training', color: '#C9A84C' },
  { label: 'Journal', emoji: '📜', route: '/(tabs)/journal', color: '#3A2A6A' },
  { label: 'Analytics', emoji: '📊', route: '/(tabs)/analytics', color: '#1A4A3A' },
  { label: 'Cycle', emoji: '🌙', route: '/(modals)/cycle-tracker', color: '#7A1A2E' },
] as const;

function getRankProgress(rank: string, points: number): number {
  const idx = RANK_THRESHOLDS.findIndex((r) => r.rank === rank);
  if (idx === -1 || idx >= RANK_THRESHOLDS.length - 1) return 1;
  const current = RANK_THRESHOLDS[idx].points;
  const next = RANK_THRESHOLDS[idx + 1].points;
  return Math.min((points - current) / (next - current), 1);
}

function getNextRank(rank: string): string | null {
  const idx = RANK_THRESHOLDS.findIndex((r) => r.rank === rank);
  return RANK_THRESHOLDS[idx + 1]?.rank ?? null;
}

function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    critical: Colors.ERROR,
    high: '#E07820',
    medium: Colors.GOLD,
    low: Colors.STONE,
  };
  return map[priority] ?? Colors.STONE;
}

// ─── Stagger-animated section ─────────────────────────────────────────────────
function FadeSlide({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY: ty }] }}>{children}</Animated.View>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { habits, isLoading, setHabits } = useHabitStore();
  const { tasks } = useTaskStore();
  const { prediction, setSettings, setPrediction } = useCycleStore();

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyInsight, setDailyInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    loadHabits();
    loadDailyInsight();
    const unsubCycle = onCycleSettingsChange(user.uid, async (s) => {
      setSettings(s);
      if (s?.trackingEnabled) {
        const pred = await computeLocalPrediction(user.uid!);
        setPrediction(pred);
      }
    });
    return () => { unsubCycle(); };
  }, [user?.uid]);

  async function loadHabits() {
    if (!user?.uid) return;
    try {
      const withLogs = await getTodayHabitsWithLogs(user.uid);
      setHabits(withLogs);
    } catch {}
  }

  async function loadDailyInsight() {
    setInsightLoading(true);
    try {
      const insight = await getDailyCleopatraInsight({
        cyclePhase: prediction?.currentPhase,
        cycleDay: prediction?.cycleDay,
      });
      setDailyInsight(insight);
    } catch {
      setDailyInsight(null);
    } finally {
      setInsightLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadHabits(), loadDailyInsight()]);
    setRefreshing(false);
  }, [user?.uid]);

  async function toggleHabit(habitId: string, done: boolean) {
    if (!user?.uid || toggling) return;
    setToggling(habitId);
    Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    setHabits(habits.map((h) => h.id === habitId ? { ...h, completedToday: !done } : h));
    try {
      await logHabitCompletion(user.uid, habitId, new Date(), !done);
      if (!done) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setHabits(habits.map((h) => h.id === habitId ? { ...h, completedToday: done } : h));
    } finally {
      setToggling(null);
    }
  }

  if (isLoading && habits.length === 0) return <DashboardSkeleton />;

  const completedHabits = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;
  const habitProgress = totalHabits > 0 ? completedHabits / totalHabits : 0;
  const urgentTasks = tasks.filter((t) => t.bucket === 'now');
  const phaseInfo = prediction?.currentPhase ? PHASE_INSIGHTS[prediction.currentPhase] : null;
  const rankEmoji = RANK_EMOJIS[user?.rank ?? 'Initiate'] ?? '🌱';
  const rankProgress = getRankProgress(user?.rank ?? 'Initiate', user?.rankPoints ?? 0);
  const nextRank = getNextRank(user?.rank ?? 'Initiate');
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.GOLD} />}
      >

        {/* ── Header ── */}
        <FadeSlide delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.dateText}>{today}</Text>
              <Text style={styles.greeting}>Reign, {user?.displayName?.split(' ')[0] ?? 'Queen'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={[Colors.GOLD_DEEP, Colors.GOLD]} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{user?.displayName?.charAt(0)?.toUpperCase() ?? 'Q'}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </FadeSlide>

        {/* ── Rank Card ── */}
        <FadeSlide delay={50}>
          <CleoCard style={styles.rankCard}>
            <LinearGradient
              colors={['rgba(201,168,76,0.06)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.rankTopRow}>
              <View>
                <Text style={styles.rankLabel}>YOUR RANK</Text>
                <Text style={styles.rankTitle}>{rankEmoji} {user?.rank ?? 'Initiate'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.pointsValue}>{(user?.rankPoints ?? 0).toLocaleString()}</Text>
                <Text style={styles.pointsLabel}>POINTS</Text>
              </View>
            </View>
            <View style={styles.rankBarTrack}>
              <View style={[styles.rankBarFill, { width: `${Math.round(Math.max(rankProgress, 0.02) * 100)}%` as any }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.rankBarLabel}>{user?.rank ?? 'Initiate'}</Text>
              {nextRank && <Text style={styles.rankBarNextLabel}>{nextRank} →</Text>}
            </View>
            <Text style={styles.streakText}>🔥 {user?.streakCount ?? 0} day streak · Best: {user?.longestStreak ?? 0} days</Text>
          </CleoCard>
        </FadeSlide>

        {/* ── Summary Row ── */}
        <FadeSlide delay={100}>
          <View style={styles.summaryRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(tabs)/habits')} activeOpacity={0.88}>
              <CleoCard style={styles.summaryCard}>
                <ProgressRing progress={habitProgress} size={64} strokeWidth={5}
                  label={`${completedHabits}/${totalHabits}`} sublabel="Rituals" />
              </CleoCard>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <CleoCard style={styles.summaryCard}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.summaryNum}>{user?.streakCount ?? 0}</Text>
                  <Text style={styles.summaryLabel}>Day{'\n'}Streak</Text>
                </View>
              </CleoCard>
            </View>

            {phaseInfo ? (
              <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(modals)/cycle-tracker')} activeOpacity={0.88}>
                <LinearGradient colors={phaseInfo.gradientColors as [string, string]} style={[styles.summaryCard, styles.phaseCard]}>
                  <Text style={{ fontSize: 22 }}>{phaseInfo.emoji}</Text>
                  <Text style={styles.phaseLabel} numberOfLines={2}>{phaseInfo.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(tabs)/tasks')} activeOpacity={0.88}>
                <CleoCard style={styles.summaryCard}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.summaryNum, urgentTasks.length > 0 && { color: Colors.WARNING }]}>
                      {urgentTasks.length}
                    </Text>
                    <Text style={styles.summaryLabel}>Urgent{'\n'}Tasks</Text>
                  </View>
                </CleoCard>
              </TouchableOpacity>
            )}
          </View>
        </FadeSlide>

        {/* ── Phase Banner ── */}
        {phaseInfo && (
          <FadeSlide delay={130}>
            <TouchableOpacity onPress={() => router.push('/(modals)/cycle-tracker')} activeOpacity={0.88}>
              <LinearGradient
                colors={[...phaseInfo.gradientColors, Colors.ANTHRACITE] as [string, string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.phaseBanner}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phaseBannerEyebrow}>MOON CYCLE · DAY {prediction?.cycleDay}</Text>
                    <Text style={styles.phaseBannerTitle}>{phaseInfo.energyProfile}</Text>
                    <Text style={styles.phaseBannerSub} numberOfLines={1}>{phaseInfo.affirmation}</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: Colors.IVORY, opacity: 0.55 }}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </FadeSlide>
        )}

        {/* ── Quick Access Grid ── */}
        <FadeSlide delay={160}>
          <View style={styles.quickRow}>
            {QUICK_ACCESS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickItem}
                onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${item.color}20`, borderColor: `${item.color}50` }]}>
                  <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeSlide>

        {/* ── Cleopatra Daily Insight ── */}
        {(dailyInsight || insightLoading) && (
          <FadeSlide delay={200}>
            <CleoCard style={styles.insightCard}>
              <LinearGradient colors={['rgba(201,168,76,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 16, color: Colors.GOLD }}>𓂀</Text>
                <Text style={styles.insightEyebrow}>CLEOPATRA SPEAKS</Text>
              </View>
              {insightLoading
                ? <Text style={styles.insightLoading}>Consulting the ancients...</Text>
                : <Text style={styles.insightText}>"{dailyInsight}"</Text>
              }
            </CleoCard>
          </FadeSlide>
        )}

        {/* ── Today's Rituals ── */}
        <FadeSlide delay={230}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Rituals</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/habits')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
        </FadeSlide>

        {habits.length === 0 ? (
          <FadeSlide delay={260}>
            <CleoCard style={styles.emptyCard}>
              <Text style={{ fontSize: 32 }}>✨</Text>
              <Text style={styles.emptyTitle}>No rituals yet</Text>
              <Text style={styles.emptyBody}>Build your empire one ritual at a time.</Text>
              <TouchableOpacity onPress={() => router.push('/(modals)/habit-detail')} style={{ marginTop: 8 }}>
                <Text style={styles.emptyAction}>+ Create First Ritual</Text>
              </TouchableOpacity>
            </CleoCard>
          </FadeSlide>
        ) : (
          habits.slice(0, 3).map((habit, i) => (
            <FadeSlide key={habit.id} delay={260 + i * 40}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/(modals)/habit-detail', params: { habitId: habit.id } })}
              >
                <CleoCard style={[styles.habitRow, habit.completedToday && { opacity: 0.65 }]}>
                  <View style={[styles.habitColorBar, { backgroundColor: habit.color }]} />
                  <View style={[styles.habitIconWrap, { backgroundColor: `${habit.color}22` }]}>
                    <Text style={{ fontSize: 18 }}>{habit.icon}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.habitTitle, habit.completedToday && { textDecorationLine: 'line-through', color: Colors.DUST }]}>
                      {habit.title}
                    </Text>
                    <Text style={styles.habitSub}>🔥 {habit.currentStreak} day streak</Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); toggleHabit(habit.id, habit.completedToday); }}
                    style={[styles.check, habit.completedToday && styles.checkDone]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {habit.completedToday && <Text style={{ fontSize: 13, fontFamily: FontFamily.BODY_BOLD, color: Colors.OBSIDIAN }}>✓</Text>}
                  </TouchableOpacity>
                </CleoCard>
              </TouchableOpacity>
            </FadeSlide>
          ))
        )}

        {habits.length > 3 && (
          <FadeSlide delay={380}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/habits')} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={styles.seeAll}>+{habits.length - 3} more rituals →</Text>
            </TouchableOpacity>
          </FadeSlide>
        )}

        {/* ── Urgent Tasks ── */}
        {urgentTasks.length > 0 && (
          <FadeSlide delay={340}>
            <View style={[styles.sectionHeader, { marginTop: 4 }]}>
              <Text style={styles.sectionTitle}>Urgent Decrees</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {urgentTasks.slice(0, 2).map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => router.push({ pathname: '/(modals)/task-detail', params: { taskId: task.id } })}
                activeOpacity={0.88}
              >
                <CleoCard style={styles.taskRow}>
                  <View style={[styles.taskBar, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <View style={{ flex: 1, paddingLeft: 10, gap: 2 }}>
                    <Text style={styles.habitTitle} numberOfLines={1}>{task.title}</Text>
                    {task.dueDate && (
                      <Text style={styles.habitSub}>
                        Due: {format(task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate as any), 'MMM d')}
                      </Text>
                    )}
                  </View>
                  <Text style={[{ fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.MICRO, letterSpacing: 0.5 }, { color: getPriorityColor(task.priority) }]}>
                    {task.priority.toUpperCase()}
                  </Text>
                </CleoCard>
              </TouchableOpacity>
            ))}
          </FadeSlide>
        )}

        <GoldenDivider style={{ marginVertical: 16 }} />

        {/* ── Motivation Card ── */}
        <FadeSlide delay={420}>
          <Text style={styles.sectionTitle}>Royal Decree</Text>
          <MotivationCard
            quote={QUOTES[quoteIndex].quote}
            author={QUOTES[quoteIndex].author}
            gradientColors={[Colors.OBSIDIAN, '#1A1410']}
            onNext={() => { Haptics.selectionAsync(); setQuoteIndex((i) => (i + 1) % QUOTES.length); }}
          />
        </FadeSlide>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  dateText: {
    fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.CAPTION, color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDER, textTransform: 'uppercase',
  },
  greeting: { fontFamily: FontFamily.DISPLAY, fontSize: FontSize.H2, color: Colors.IVORY, letterSpacing: LetterSpacing.TIGHT },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.GOLD },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.DISPLAY, fontSize: FontSize.H4, color: Colors.OBSIDIAN },

  rankCard: { gap: 8, overflow: 'hidden' },
  rankTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankLabel: { fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.MICRO, color: Colors.DUST, letterSpacing: LetterSpacing.WIDEST, textTransform: 'uppercase', marginBottom: 2 },
  rankTitle: { fontFamily: FontFamily.DISPLAY_MEDIUM, fontSize: FontSize.H4, color: Colors.IVORY, letterSpacing: LetterSpacing.TIGHT },
  pointsValue: { fontFamily: FontFamily.DISPLAY, fontSize: FontSize.H2, color: Colors.GOLD, letterSpacing: LetterSpacing.TIGHT },
  pointsLabel: { fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.MICRO, color: Colors.GOLD_MUTED, letterSpacing: LetterSpacing.WIDER, textTransform: 'uppercase' },
  rankBarTrack: { height: 3, backgroundColor: Colors.STONE, borderRadius: 2, overflow: 'hidden' },
  rankBarFill: { height: '100%', backgroundColor: Colors.GOLD, borderRadius: 2 },
  rankBarLabel: { fontFamily: FontFamily.BODY, fontSize: FontSize.MICRO, color: Colors.DUST },
  rankBarNextLabel: { fontFamily: FontFamily.BODY_MEDIUM, fontSize: FontSize.MICRO, color: Colors.GOLD_MUTED },
  streakText: { fontFamily: FontFamily.BODY, fontSize: FontSize.CAPTION, color: Colors.PARCHMENT },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  summaryNum: { fontFamily: FontFamily.DISPLAY, fontSize: FontSize.D3, color: Colors.GOLD, letterSpacing: -1 },
  summaryLabel: { fontFamily: FontFamily.BODY_MEDIUM, fontSize: FontSize.MICRO, color: Colors.DUST, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },
  phaseCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 90, borderRadius: BorderRadius.LG },
  phaseLabel: { fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.MICRO, color: Colors.IVORY, textAlign: 'center', letterSpacing: 0.5 },

  phaseBanner: { borderRadius: BorderRadius.LG, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  phaseBannerEyebrow: { fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.MICRO, color: Colors.IVORY, letterSpacing: LetterSpacing.WIDER, opacity: 0.65, textTransform: 'uppercase', marginBottom: 4 },
  phaseBannerTitle: { fontFamily: FontFamily.DISPLAY_ITALIC, fontSize: FontSize.H4, color: Colors.IVORY, letterSpacing: LetterSpacing.TIGHT, marginBottom: 4 },
  phaseBannerSub: { fontFamily: FontFamily.BODY, fontSize: FontSize.CAPTION, color: Colors.IVORY, opacity: 0.55, fontStyle: 'italic' },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: { width: 52, height: 52, borderRadius: BorderRadius.MD, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  quickLabel: { fontFamily: FontFamily.BODY_MEDIUM, fontSize: FontSize.MICRO, color: Colors.DUST, letterSpacing: 0.3 },

  insightCard: { overflow: 'hidden', gap: 4 },
  insightEyebrow: { fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.MICRO, color: Colors.GOLD, letterSpacing: LetterSpacing.WIDEST, textTransform: 'uppercase' },
  insightLoading: { fontFamily: FontFamily.BODY, fontSize: FontSize.BODY_SM, color: Colors.DUST, fontStyle: 'italic' },
  insightText: { fontFamily: FontFamily.DISPLAY_ITALIC, fontSize: FontSize.BODY_MD, color: Colors.PARCHMENT, lineHeight: 24, letterSpacing: 0.2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontFamily: FontFamily.DISPLAY_MEDIUM, fontSize: FontSize.H3, color: Colors.IVORY, letterSpacing: LetterSpacing.TIGHT },
  seeAll: { fontFamily: FontFamily.BODY_MEDIUM, fontSize: FontSize.CAPTION, color: Colors.GOLD, letterSpacing: 0.5 },

  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', paddingLeft: 0 },
  habitColorBar: { width: 3, position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2 },
  habitIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  habitTitle: { fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.BODY_SM, color: Colors.IVORY },
  habitSub: { fontFamily: FontFamily.BODY, fontSize: FontSize.CAPTION, color: Colors.DUST },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: Colors.STONE, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: Colors.GOLD, borderColor: Colors.GOLD },

  taskRow: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  taskBar: { width: 3, position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2 },

  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { fontFamily: FontFamily.DISPLAY_MEDIUM, fontSize: FontSize.H4, color: Colors.IVORY },
  emptyBody: { fontFamily: FontFamily.BODY, fontSize: FontSize.BODY_SM, color: Colors.DUST, textAlign: 'center', maxWidth: 240 },
  emptyAction: { fontFamily: FontFamily.BODY_SEMIBOLD, fontSize: FontSize.BODY_SM, color: Colors.GOLD },
});
