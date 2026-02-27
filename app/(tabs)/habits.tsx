import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, subDays } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { onHabitsChange, logHabitCompletion, deleteHabit, getTodayHabitsWithLogs } from '../../src/services/habits';
import { HabitListSkeleton } from '../../src/components/skeletons/HabitSkeleton';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { wasCompletedOn } from '../../src/utils/streaks';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius, Shadows } from '../../src/theme';
import type { HabitWithLog } from '../../src/types/habits';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { habits, isLoading, setHabits, updateHabitLocally } = useHabitStore();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    getTodayHabitsWithLogs(user.uid).then(setHabits);

    const unsub = onHabitsChange(user.uid, async (baseHabits) => {
      const withLogs = await getTodayHabitsWithLogs(user.uid!);
      setHabits(withLogs);
    });

    return unsub;
  }, [user?.uid]);

  async function toggleHabit(habit: HabitWithLog) {
    if (!user?.uid || togglingId) return;
    setTogglingId(habit.id);

    const newCompleted = !habit.completedToday;
    updateHabitLocally(habit.id, { completedToday: newCompleted });

    try {
      await logHabitCompletion(user.uid, habit.id, new Date(), newCompleted);
    } catch {
      // revert
      updateHabitLocally(habit.id, { completedToday: !newCompleted });
    } finally {
      setTogglingId(null);
    }
  }

  function confirmDelete(habit: HabitWithLog) {
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

  // Last 7 days for mini calendar
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
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

        {/* Progress */}
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
            </View>
          </View>
        </CleoCard>

        {/* 7-day overview */}
        <CleoCard style={styles.weekCard}>
          <View style={styles.weekRow}>
            {last7.map((date, i) => {
              const isToday = i === 6;
              const hasCompletion = habits.some((h) =>
                h.todayLog ? (isToday && h.completedToday) : false
              );
              return (
                <View key={i} style={styles.dayCol}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                    {DAYS_SHORT[date.getDay()]}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      isToday && styles.dayDotToday,
                      hasCompletion && styles.dayDotFilled,
                    ]}
                  >
                    {isToday && <Text style={styles.dayDateToday}>{format(date, 'd')}</Text>}
                    {!isToday && <Text style={styles.dayDate}>{format(date, 'd')}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </CleoCard>

        <GoldenDivider />

        {/* Habits list */}
        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No rituals yet</Text>
            <Text style={styles.emptyBody}>
              Start with one habit. Discipline compounds.
            </Text>
            <GoldButton
              label="Create First Ritual"
              onPress={() => router.push('/(modals)/habit-detail')}
              style={{ marginTop: 16 }}
            />
          </View>
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
  return (
    <CleoCard style={[styles.habitCard, habit.completedToday && styles.habitCardDone]}>
      <View style={styles.habitMain}>
        <View style={[styles.habitIcon, { backgroundColor: `${habit.color}25` }]}>
          <Text style={styles.habitEmoji}>{habit.icon}</Text>
        </View>
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, habit.completedToday && styles.habitNameDone]}>
            {habit.title}
          </Text>
          <View style={styles.habitMeta}>
            <Text style={styles.habitMetaText}>🔥 {habit.currentStreak} streak</Text>
            <Text style={styles.habitDot}>·</Text>
            <Text style={styles.habitMetaText}>{habit.totalCompletions} total</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onToggle}
          disabled={toggling}
          style={[styles.checkBtn, habit.completedToday && styles.checkBtnActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.checkIcon, habit.completedToday && styles.checkIconActive]}>
            {habit.completedToday ? '✓' : '○'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mini streak history dots */}
      <View style={styles.streakDots}>
        {Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          const isCompleted = i === 6 ? habit.completedToday : false;
          return (
            <View
              key={i}
              style={[
                styles.streakDot,
                isCompleted && { backgroundColor: habit.color },
              ]}
            />
          );
        })}
        <Text style={styles.bestStreak}>Best: {habit.longestStreak}d</Text>
      </View>

      <View style={styles.habitActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
          <Text style={[styles.actionText, { color: Colors.ERROR }]}>Archive</Text>
        </TouchableOpacity>
      </View>
    </CleoCard>
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
  weekCard: {},
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  dayLabelActive: { color: Colors.GOLD },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotToday: {
    borderWidth: 1.5,
    borderColor: Colors.GOLD,
    backgroundColor: 'rgba(201,168,76,0.1)',
  },
  dayDotFilled: { backgroundColor: Colors.GOLD_DEEP },
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
  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: 8 },
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
  },
  habitCard: { gap: 10 },
  habitCardDone: { opacity: 0.8 },
  habitMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  habitMetaText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  habitDot: { color: Colors.STONE, fontSize: FontSize.CAPTION },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnActive: { backgroundColor: Colors.GOLD, borderColor: Colors.GOLD },
  checkIcon: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 14,
    color: Colors.DUST,
  },
  checkIconActive: { color: Colors.OBSIDIAN },
  streakDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.STONE,
  },
  bestStreak: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    marginLeft: 4,
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
