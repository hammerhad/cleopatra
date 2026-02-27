import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useCycleStore } from '../../src/stores/cycleStore';
import { getTodayHabitsWithLogs } from '../../src/services/habits';
import { onCycleSettingsChange, computeLocalPrediction } from '../../src/services/cycle';
import { DashboardSkeleton } from '../../src/components/skeletons/DashboardSkeleton';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { MotivationCard } from '../../src/components/ui/MotivationCard';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { PHASE_INSIGHTS } from '../../src/types/cycle';
import { Colors, FontFamily, FontSize, LetterSpacing, Spacing, BorderRadius, Shadows } from '../../src/theme';

const QUOTES = [
  { quote: "Your discipline today writes your legend tomorrow.", author: "Cleopatra" },
  { quote: "A queen never rushes — she executes with precision.", author: "The Throne" },
  { quote: "Every empire begins with a single decree.", author: "Cleopatra" },
  { quote: "Power is not given. It is cultivated, daily.", author: "The Kingdom" },
  { quote: "She who masters herself, masters the world.", author: "Ancient Wisdom" },
];

const RANK_EMOJIS: Record<string, string> = {
  'Initiate': '🌱',
  'Scholar': '📖',
  'Warrior': '⚔️',
  'Strategist': '♟️',
  'Commander': '🏛️',
  'High Priestess': '🔮',
  'Pharaoh': '👑',
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { habits, isLoading, setHabits } = useHabitStore();
  const { settings, prediction, setSettings, setPrediction } = useCycleStore();

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    loadHabits();

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, [user?.uid]);

  if (isLoading && habits.length === 0) return <DashboardSkeleton />;

  const completedHabits = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;
  const habitProgress = totalHabits > 0 ? completedHabits / totalHabits : 0;

  const currentQuote = QUOTES[quoteIndex];
  const phaseInfo = prediction?.currentPhase ? PHASE_INSIGHTS[prediction.currentPhase] : null;
  const rankEmoji = RANK_EMOJIS[user?.rank ?? 'Initiate'] ?? '🌱';
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.GOLD}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{today}</Text>
            <Text style={styles.greeting}>
              Reign, {user?.displayName?.split(' ')[0] ?? 'Queen'} 👑
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatarContainer}
          >
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
          </TouchableOpacity>
        </View>

        {/* Rank / Points */}
        <CleoCard style={styles.rankCard}>
          <View style={styles.rankRow}>
            <View>
              <Text style={styles.rankLabel}>YOUR RANK</Text>
              <Text style={styles.rankTitle}>{rankEmoji} {user?.rank ?? 'Initiate'}</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsValue}>{user?.rankPoints?.toLocaleString() ?? 0}</Text>
              <Text style={styles.pointsLabel}>POINTS</Text>
            </View>
          </View>
          <View style={styles.streakRow}>
            <Text style={styles.streakText}>
              🔥 {user?.streakCount ?? 0} day streak · Longest: {user?.longestStreak ?? 0} days
            </Text>
          </View>
        </CleoCard>

        {/* Today's Summary */}
        <View style={styles.summaryRow}>
          <CleoCard style={styles.summaryCard}>
            <ProgressRing
              progress={habitProgress}
              size={68}
              strokeWidth={5}
              label={`${completedHabits}/${totalHabits}`}
              sublabel="Rituals"
            />
          </CleoCard>
          <CleoCard style={styles.summaryCard}>
            <View style={styles.summaryCenter}>
              <Text style={styles.summaryNum}>{user?.streakCount ?? 0}</Text>
              <Text style={styles.summaryLabel}>Day{'\n'}Streak</Text>
            </View>
          </CleoCard>
          {phaseInfo && (
            <TouchableOpacity
              onPress={() => router.push('/(modals)/cycle-tracker')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={phaseInfo.gradientColors as [string, string]}
                style={[styles.summaryCard, styles.phaseCard]}
              >
                <Text style={styles.phaseEmoji}>{phaseInfo.emoji}</Text>
                <Text style={styles.phaseLabel} numberOfLines={2}>
                  {phaseInfo.title}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Phase Insight Banner */}
        {phaseInfo && (
          <TouchableOpacity
            onPress={() => router.push('/(modals)/cycle-tracker')}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[...phaseInfo.gradientColors, Colors.ANTHRACITE] as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.phaseBanner}
            >
              <View style={styles.phaseBannerContent}>
                <View>
                  <Text style={styles.phaseBannerEyebrow}>MOON CYCLE · DAY {prediction?.cycleDay}</Text>
                  <Text style={styles.phaseBannerTitle}>{phaseInfo.energyProfile}</Text>
                </View>
                <Text style={styles.phaseBannerArrow}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Today's Habits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Rituals</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/habits')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <CleoCard style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No rituals yet</Text>
            <Text style={styles.emptyBody}>Create your first habit and begin building your empire.</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/habits')}
              style={styles.emptyAction}
            >
              <Text style={styles.emptyActionText}>Create Ritual →</Text>
            </TouchableOpacity>
          </CleoCard>
        ) : (
          habits.slice(0, 3).map((habit) => (
            <TouchableOpacity
              key={habit.id}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/(modals)/habit-detail', params: { habitId: habit.id } })}
            >
              <CleoCard style={[styles.habitRow, habit.completedToday && styles.habitCompleted]}>
                <View style={[styles.habitIcon, { backgroundColor: `${habit.color}20` }]}>
                  <Text style={styles.habitEmoji}>{habit.icon}</Text>
                </View>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitTitle, habit.completedToday && styles.habitTitleDone]}>
                    {habit.title}
                  </Text>
                  <Text style={styles.habitStreak}>
                    🔥 {habit.currentStreak} day streak
                  </Text>
                </View>
                <View style={[styles.checkCircle, habit.completedToday && styles.checkCircleActive]}>
                  {habit.completedToday && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </CleoCard>
            </TouchableOpacity>
          ))
        )}

        {habits.length > 3 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/habits')} style={styles.moreHabits}>
            <Text style={styles.moreHabitsText}>+{habits.length - 3} more rituals →</Text>
          </TouchableOpacity>
        )}

        <GoldenDivider style={{ marginVertical: 20 }} />

        {/* Motivation Card */}
        <Text style={styles.sectionTitle}>Royal Decree</Text>
        <MotivationCard
          quote={currentQuote.quote}
          author={currentQuote.author}
          gradientColors={[Colors.OBSIDIAN, '#1A1410']}
          onNext={() => setQuoteIndex((i) => (i + 1) % QUOTES.length)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: { gap: 2 },
  dateText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDER,
    textTransform: 'uppercase',
  },
  greeting: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  avatarContainer: {
    ...Shadows.GOLD_SUBTLE,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.GOLD,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H4,
    color: Colors.OBSIDIAN,
  },
  rankCard: { gap: 8 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
  },
  rankTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  pointsBadge: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.TIGHT,
  },
  pointsLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD_MUTED,
    letterSpacing: LetterSpacing.WIDER,
    textTransform: 'uppercase',
  },
  streakRow: {},
  streakText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.PARCHMENT,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  summaryCenter: { alignItems: 'center' },
  summaryNum: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.D3,
    color: Colors.GOLD,
    letterSpacing: -1,
  },
  summaryLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phaseCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  phaseEmoji: { fontSize: 24 },
  phaseLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.IVORY,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  phaseBanner: {
    borderRadius: BorderRadius.LG,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  phaseBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phaseBannerEyebrow: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.WIDER,
    opacity: 0.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  phaseBannerTitle: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
    maxWidth: '90%',
  },
  phaseBannerArrow: {
    fontSize: 20,
    color: Colors.IVORY,
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H3,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  seeAll: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
    letterSpacing: 0.5,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitCompleted: {
    opacity: 0.7,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: { fontSize: 20 },
  habitInfo: { flex: 1, gap: 2 },
  habitTitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
  },
  habitTitleDone: { textDecorationLine: 'line-through', color: Colors.DUST },
  habitStreak: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: Colors.GOLD,
    borderColor: Colors.GOLD,
  },
  checkMark: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 14,
    color: Colors.OBSIDIAN,
  },
  moreHabits: { alignItems: 'center', paddingVertical: 8 },
  moreHabitsText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.GOLD,
  },
  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
  },
  emptyBody: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    textAlign: 'center',
  },
  emptyAction: { marginTop: 8 },
  emptyActionText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.GOLD,
  },
});
