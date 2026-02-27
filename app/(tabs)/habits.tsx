import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { format, subDays } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { onHabitsChange, logHabitCompletion, deleteHabit, getTodayHabitsWithLogs } from '../../src/services/habits';
import { HabitListSkeleton } from '../../src/components/skeletons/HabitSkeleton';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius, Spacing } from '../../src/theme';
import type { HabitWithLog } from '../../src/types/habits';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Avatar colors for member differentiation
const MEMBER_COLORS: [string, string][] = [
  [Colors.GOLD_DEEP, '#A07820'],
  ['#1A3A5A', '#2A5A8A'],
  ['#3A1A3A', '#5A2A5A'],
  ['#1A3A1A', '#2A5A2A'],
  ['#3A2A1A', '#5A3A2A'],
];

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { habits, isLoading, setHabits, updateHabitLocally } = useHabitStore();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    getTodayHabitsWithLogs(user.uid).then(setHabits);

    const unsub = onHabitsChange(user.uid, async () => {
      const withLogs = await getTodayHabitsWithLogs(user.uid!);
      setHabits(withLogs);
    });

    return unsub;
  }, [user?.uid]);

  const handleRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    try {
      const withLogs = await getTodayHabitsWithLogs(user.uid);
      setHabits(withLogs);
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid]);

  async function toggleHabit(habit: HabitWithLog) {
    if (!user?.uid || togglingId) return;
    setTogglingId(habit.id);

    const newCompleted = !habit.completedToday;
    updateHabitLocally(habit.id, { completedToday: newCompleted });

    try {
      await logHabitCompletion(user.uid, habit.id, new Date(), newCompleted);
      if (newCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      updateHabitLocally(habit.id, { completedToday: !newCompleted });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setTogglingId(null);
    }
  }

  function confirmDelete(habit: HabitWithLog) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Archive Ritual',
      `Archive "${habit.title}"? Your streak data will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            await deleteHabit(user.uid, habit.id);
          },
        },
      ]
    );
  }

  if (isLoading && habits.length === 0) return <HabitListSkeleton />;

  const completedCount = habits.filter((h) => h.completedToday).length;
  const progress = habits.length > 0 ? completedCount / habits.length : 0;
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  // Per-day completions approximation for the week view
  function getDayHasCompletion(daysAgo: number): boolean {
    if (daysAgo === 0) return habits.some((h) => h.completedToday);
    // A habit contributes to a past day if its currentStreak covers it
    return habits.some((h) => h.currentStreak > daysAgo);
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.GOLD}
            colors={[Colors.GOLD]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Daily Rituals</Text>
            <Text style={styles.title}>Your Habits</Text>
          </View>
          <GoldButton
            label="+ Ritual"
            variant="outline"
            size="sm"
            onPress={() => router.push('/(modals)/habit-detail')}
          />
        </View>

        {/* Progress card */}
        <CleoCard style={styles.progressCard}>
          <View style={styles.progressRow}>
            <ProgressRing progress={progress} size={72} strokeWidth={5} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>
                {completedCount} of {habits.length} completed
              </Text>
              <Text style={styles.progressSub}>
                {habits.length === 0
                  ? 'No rituals yet. Start building.'
                  : progress === 1
                  ? 'All rituals complete! Legendary. 🔥'
                  : `${habits.length - completedCount} remaining today`}
              </Text>
              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(progress * 100)}%` as any },
                    progress === 1 && styles.progressBarComplete,
                  ]}
                />
              </View>
            </View>
          </View>
        </CleoCard>

        {/* 7-day mini calendar */}
        <CleoCard style={styles.weekCard}>
          <Text style={styles.weekLabel}>This Week</Text>
          <View style={styles.weekRow}>
            {last7.map((date, i) => {
              const daysAgo = 6 - i;
              const isToday = daysAgo === 0;
              const hasCompletion = getDayHasCompletion(daysAgo);
              return (
                <View key={i} style={styles.dayCol}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                    {DAYS_SHORT[date.getDay()]}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      isToday && styles.dayDotToday,
                      hasCompletion && !isToday && styles.dayDotFilled,
                      hasCompletion && isToday && styles.dayDotTodayFilled,
                    ]}
                  >
                    <Text style={isToday ? styles.dayDateToday : styles.dayDate}>
                      {format(date, 'd')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </CleoCard>

        <GoldenDivider />

        {/* Habit list or empty state */}
        {habits.length === 0 ? (
          <EmptyHabitsState />
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              toggling={togglingId === habit.id}
              onToggle={() => toggleHabit(habit)}
              onEdit={() => router.push({ pathname: '/(modals)/habit-detail', params: { habitId: habit.id } })}
              onDelete={() => confirmDelete(habit)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function EmptyHabitsState() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.emptyEmoji}>𓂀</Text>
      <Text style={styles.emptyTitle}>No rituals yet</Text>
      <Text style={styles.emptyBody}>
        Cleopatra built her empire one discipline at a time.{'\n'}Start with one ritual today.
      </Text>
      <GoldButton
        label="Create First Ritual"
        onPress={() => router.push('/(modals)/habit-detail')}
        style={{ marginTop: 16 }}
      />
    </Animated.View>
  );
}

function HabitCard({
  habit,
  toggling,
  onToggle,
  onEdit,
  onDelete,
}: {
  habit: HabitWithLog;
  toggling: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const checkScale = useRef(new Animated.Value(1)).current;

  function handleTogglePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 0.78, duration: 80, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 220, friction: 7 }),
    ]).start();
    onToggle();
  }

  // Streak milestone badge
  const streakBadge = habit.currentStreak >= 30 ? '🏆' : habit.currentStreak >= 7 ? '🔥' : null;

  // Streak dots: past dots filled using currentStreak approximation
  const streakDots = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    return daysAgo === 0 ? habit.completedToday : daysAgo < habit.currentStreak;
  });

  return (
    <View
      style={[
        styles.habitCardWrapper,
        habit.completedToday && styles.habitCardWrapperDone,
      ]}
    >
      {/* Color accent bar */}
      <View style={[styles.habitAccentBar, { backgroundColor: habit.color }]} />

      <View style={styles.habitCardInner}>
        {/* Main row */}
        <View style={styles.habitMain}>
          <View style={[styles.habitIcon, { backgroundColor: `${habit.color}22` }]}>
            <Text style={styles.habitEmoji}>{habit.icon}</Text>
          </View>

          <View style={styles.habitInfo}>
            <Text style={[styles.habitName, habit.completedToday && styles.habitNameDone]} numberOfLines={1}>
              {habit.title}
            </Text>
            <View style={styles.habitMeta}>
              {streakBadge ? (
                <Text style={styles.habitMetaBadge}>{streakBadge} {habit.currentStreak}d streak</Text>
              ) : (
                <Text style={styles.habitMetaText}>🔥 {habit.currentStreak} streak</Text>
              )}
              <Text style={styles.habitDot}>·</Text>
              <Text style={styles.habitMetaText}>{habit.totalCompletions} total</Text>
              {habit.longestStreak > 0 && (
                <>
                  <Text style={styles.habitDot}>·</Text>
                  <Text style={styles.habitMetaText}>Best {habit.longestStreak}d</Text>
                </>
              )}
            </View>
          </View>

          {/* Animated check button */}
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <TouchableOpacity
              onPress={handleTogglePress}
              disabled={toggling}
              style={[styles.checkBtn, habit.completedToday && { backgroundColor: habit.color, borderColor: habit.color }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.checkIcon, habit.completedToday && styles.checkIconActive]}>
                {habit.completedToday ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Streak history dots */}
        <View style={styles.streakRow}>
          <View style={styles.streakDots}>
            {streakDots.map((filled, i) => (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  filled
                    ? { backgroundColor: habit.color, opacity: i === 6 ? 1 : 0.65 }
                    : styles.streakDotEmpty,
                ]}
              />
            ))}
          </View>
          <Text style={styles.streakLabel}>7-day history</Text>
        </View>

        {/* Action row */}
        <View style={styles.habitActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionText, { color: Colors.ERROR }]}>Archive</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 4,
  },
  eyebrow: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H1,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },

  progressCard: {},
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  progressInfo: { flex: 1, gap: 4 },
  progressTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
  },
  progressSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: Colors.STONE,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.GOLD,
    borderRadius: 2,
  },
  progressBarComplete: {
    backgroundColor: Colors.SUCCESS,
  },

  weekCard: { gap: 10 },
  weekLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDE,
    textTransform: 'uppercase',
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.STONE,
    letterSpacing: 0.5,
  },
  dayLabelActive: { color: Colors.GOLD },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.ASH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotToday: {
    borderWidth: 1.5,
    borderColor: Colors.GOLD,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  dayDotFilled: { backgroundColor: 'rgba(201,168,76,0.25)', borderWidth: 0 },
  dayDotTodayFilled: {
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth: 1.5,
    borderColor: Colors.GOLD,
  },
  dayDate: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  dayDateToday: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
  },

  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyEmoji: { fontSize: 48, color: Colors.GOLD_MUTED },
  emptyTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H3,
    color: Colors.IVORY,
  },
  emptyBody: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Habit card with left accent bar
  habitCardWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
    overflow: 'hidden',
    marginBottom: 0,
  },
  habitCardWrapperDone: { opacity: 0.75 },
  habitAccentBar: {
    width: 3,
    borderRadius: 0,
  },
  habitCardInner: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  habitMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: { fontSize: 22 },
  habitInfo: { flex: 1, gap: 3 },
  habitName: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_MD,
    color: Colors.IVORY,
  },
  habitNameDone: { textDecorationLine: 'line-through', color: Colors.DUST },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  habitMetaText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  habitMetaBadge: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
  },
  habitDot: { color: Colors.STONE, fontSize: FontSize.CAPTION },

  checkBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 15,
    color: Colors.DUST,
  },
  checkIconActive: { color: Colors.OBSIDIAN },

  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakDots: { flexDirection: 'row', gap: 5 },
  streakDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  streakDotEmpty: { backgroundColor: Colors.STONE },
  streakLabel: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.STONE,
    letterSpacing: 0.3,
  },

  habitActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.DIVIDER,
    paddingTop: 8,
  },
  actionBtn: { paddingVertical: 2 },
  actionText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD_MUTED,
    letterSpacing: 0.5,
  },
});
