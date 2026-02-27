import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { subDays, format } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { useCycleStore } from '../../src/stores/cycleStore';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { Colors, FontFamily, FontSize, LetterSpacing } from '../../src/theme';
import { getPhaseColor, getPhaseEmoji } from '../../src/utils/cyclePrediction';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40 - 32; // screen - padding - card padding

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = '7d' | '30d' | '90d';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { habits } = useHabitStore();
  const { tasks } = useTaskStore();
  const { prediction } = useCycleStore();
  const [period, setPeriod] = useState<Period>('7d');

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const habitCompletionRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const completed = habits.filter((h) => h.completedToday).length;
    return completed / habits.length;
  }, [habits]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.bucket === 'done').length;
    const now = tasks.filter((t) => t.bucket === 'now').length;
    const completionRate = total > 0 ? done / total : 0;
    return { total, done, now, completionRate };
  }, [tasks]);

  const topHabitStreaks = useMemo(
    () =>
      [...habits]
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .slice(0, 3),
    [habits]
  );

  const longestHabitStreak = useMemo(
    () => Math.max(0, ...habits.map((h) => h.longestStreak)),
    [habits]
  );

  // Mock 7-day completion bars (in production: query Firestore habit logs)
  const weekBars = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const isToday = i === 6;
      // For today we have real data; past days are illustrative
      const rate = isToday
        ? habitCompletionRate
        : [0.8, 1.0, 0.6, 0.9, 0.75, 1.0][i] ?? 0.5;
      return { date, rate, label: format(date, 'EEE')[0] };
    });
  }, [habitCompletionRate]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Royal Intelligence</Text>
          <Text style={styles.title}>Analytics</Text>
        </View>

        {/* Period picker */}
        <View style={styles.periodRow}>
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <PeriodTab key={p} label={p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'} active={period === p} onPress={() => setPeriod(p)} />
          ))}
        </View>

        {/* Today's overview */}
        <CleoCard style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Today's Overview</Text>
          <View style={styles.overviewRow}>
            <OverviewRing
              label="Rituals"
              progress={habitCompletionRate}
              sublabel={`${habits.filter((h) => h.completedToday).length}/${habits.length}`}
            />
            <OverviewRing
              label="Tasks"
              progress={taskStats.completionRate}
              sublabel={`${taskStats.done}/${taskStats.total}`}
            />
            <OverviewRing
              label="Focus"
              progress={taskStats.now > 0 ? 1 - taskStats.now / Math.max(taskStats.total, 1) : 1}
              sublabel={`${taskStats.now} urgent`}
            />
          </View>
        </CleoCard>

        {/* Habit completion chart */}
        <CleoCard style={styles.chartCard}>
          <Text style={styles.cardTitle}>Habit Completion</Text>
          <Text style={styles.cardSubtitle}>Last 7 days</Text>
          <HabitBarChart bars={weekBars} />
        </CleoCard>

        <GoldenDivider />

        {/* Streak leaderboard */}
        <CleoCard style={styles.streakCard}>
          <Text style={styles.cardTitle}>Streak Leaders</Text>
          {topHabitStreaks.length === 0 ? (
            <Text style={styles.emptyText}>No habits tracked yet</Text>
          ) : (
            topHabitStreaks.map((h, i) => (
              <StreakRow
                key={h.id}
                rank={i + 1}
                name={h.title}
                icon={h.icon}
                streak={h.currentStreak}
                best={h.longestStreak}
                color={h.color}
              />
            ))
          )}
          {longestHabitStreak > 0 && (
            <View style={styles.bestStreakBanner}>
              <LinearGradient
                colors={['rgba(201,168,76,0.08)', 'rgba(201,168,76,0.03)']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.bestStreakLabel}>🏆 Personal Best</Text>
              <Text style={styles.bestStreakNum}>{longestHabitStreak} days</Text>
            </View>
          )}
        </CleoCard>

        {/* Task priority breakdown */}
        <CleoCard style={styles.priorityCard}>
          <Text style={styles.cardTitle}>Task Breakdown</Text>
          <PriorityBar
            label="Critical"
            count={tasks.filter((t) => t.priority === 'critical').length}
            total={tasks.length}
            color={Colors.ERROR}
          />
          <PriorityBar
            label="High"
            count={tasks.filter((t) => t.priority === 'high').length}
            total={tasks.length}
            color="#E07820"
          />
          <PriorityBar
            label="Medium"
            count={tasks.filter((t) => t.priority === 'medium').length}
            total={tasks.length}
            color={Colors.GOLD}
          />
          <PriorityBar
            label="Low"
            count={tasks.filter((t) => t.priority === 'low').length}
            total={tasks.length}
            color={Colors.STONE}
          />
        </CleoCard>

        {/* Cycle phase insights */}
        {prediction && (
          <CycleInsightCard prediction={prediction} />
        )}

        {/* Motivational insight */}
        <InsightBanner
          habitRate={habitCompletionRate}
          taskDone={taskStats.done}
          streak={longestHabitStreak}
        />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function PeriodTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.periodTab, active && styles.periodTabActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.periodLabel, active && styles.periodLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function OverviewRing({ label, progress, sublabel }: { label: string; progress: number; sublabel: string }) {
  return (
    <View style={styles.overviewRingCol}>
      <ProgressRing progress={progress} size={68} strokeWidth={5} />
      <Text style={styles.overviewRingLabel}>{label}</Text>
      <Text style={styles.overviewRingSub}>{sublabel}</Text>
    </View>
  );
}

function HabitBarChart({ bars }: { bars: { date: Date; rate: number; label: string }[] }) {
  const maxHeight = 80;
  return (
    <View style={styles.barChartContainer}>
      {bars.map((bar, i) => {
        const isToday = i === bars.length - 1;
        const height = Math.max(4, bar.rate * maxHeight);
        return (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <LinearGradient
                colors={
                  isToday
                    ? [Colors.GOLD_LIGHT, Colors.GOLD]
                    : bar.rate >= 0.8
                    ? [Colors.GOLD_MUTED, Colors.GOLD_DEEP]
                    : ['#3A3020', '#2A2818']
                }
                style={[styles.bar, { height }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>
            <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{bar.label}</Text>
            <Text style={styles.barPct}>{Math.round(bar.rate * 100)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

function StreakRow({
  rank,
  name,
  icon,
  streak,
  best,
  color,
}: {
  rank: number;
  name: string;
  icon: string;
  streak: number;
  best: number;
  color: string;
}) {
  const rankColors = ['#C9A84C', '#A0A0A0', '#8B6A3A'];
  return (
    <View style={styles.streakRow}>
      <Text style={[styles.streakRank, { color: rankColors[rank - 1] ?? Colors.DUST }]}>
        #{rank}
      </Text>
      <View style={[styles.streakIcon, { backgroundColor: `${color}20` }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text style={styles.streakName} numberOfLines={1}>{name}</Text>
      <View style={styles.streakNums}>
        <Text style={styles.streakCurrent}>🔥 {streak}</Text>
        <Text style={styles.streakBest}>Best {best}d</Text>
      </View>
    </View>
  );
}

function PriorityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? count / total : 0;
  return (
    <View style={styles.priorityRow}>
      <Text style={styles.priorityLabel}>{label}</Text>
      <View style={styles.priorityTrack}>
        <LinearGradient
          colors={[`${color}80`, color]}
          style={[styles.priorityFill, { width: `${Math.round(pct * 100)}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <Text style={styles.priorityCount}>{count}</Text>
    </View>
  );
}

function CycleInsightCard({ prediction }: { prediction: ReturnType<typeof useCycleStore>['prediction'] }) {
  if (!prediction) return null;
  const phase = prediction.currentPhase;
  const color = getPhaseColor(phase);
  const emoji = getPhaseEmoji(phase);

  return (
    <CleoCard style={styles.cycleCard}>
      <View style={styles.cycleHeader}>
        <LinearGradient
          colors={[`${color}30`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.cardTitle}>Cycle & Performance</Text>
      </View>
      <View style={styles.cycleContent}>
        <View style={[styles.phaseChip, { borderColor: `${color}60`, backgroundColor: `${color}15` }]}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
          <Text style={[styles.phaseChipLabel, { color }]}>{phase.charAt(0).toUpperCase() + phase.slice(1)} Phase</Text>
        </View>
        <View style={styles.cycleMeta}>
          <CycleStat label="Day" value={String(prediction.cycleDay)} />
          <CycleStat label="Until Period" value={`${prediction.daysUntilNextPeriod}d`} />
          <CycleStat label="Cycle Avg" value={`${prediction.avgCycleLength}d`} />
        </View>
        <Text style={styles.cycleInsight}>
          {getCyclePerformanceInsight(phase, prediction.cycleDay)}
        </Text>
      </View>
    </CleoCard>
  );
}

function CycleStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cycleStat}>
      <Text style={styles.cycleStatValue}>{value}</Text>
      <Text style={styles.cycleStatLabel}>{label}</Text>
    </View>
  );
}

function InsightBanner({
  habitRate,
  taskDone,
  streak,
}: {
  habitRate: number;
  taskDone: number;
  streak: number;
}) {
  const insight = getPersonalInsight(habitRate, taskDone, streak);
  return (
    <CleoCard style={styles.insightCard}>
      <LinearGradient
        colors={['rgba(201,168,76,0.06)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.insightDecoration}>𓂀</Text>
      <Text style={styles.insightText}>{insight}</Text>
    </CleoCard>
  );
}

// ─── Helper functions ─────────────────────────────────────────────────────────
function getCyclePerformanceInsight(phase: string, day: number): string {
  const insights: Record<string, string> = {
    menstrual: 'Your body calls for restoration. Honor it — strength preserved is strength multiplied.',
    follicular: 'Rising energy favors bold new habits and ambitious tasks. Strike while the iron is hot.',
    ovulation: 'Peak performance window. Your communication and leadership abilities are at their zenith.',
    luteal: 'Focus turns inward. Complete existing work and resist starting new initiatives.',
  };
  return insights[phase] ?? 'Track your cycle to unlock personalized performance insights.';
}

function getPersonalInsight(habitRate: number, taskDone: number, streak: number): string {
  if (habitRate >= 0.9 && taskDone > 0) {
    return 'Exceptional discipline today. History remembers those who show up consistently — you are becoming one of them.';
  }
  if (streak >= 7) {
    return `A ${streak}-day streak is not luck — it is architecture. You are building the empire of your future self.`;
  }
  if (habitRate < 0.3) {
    return 'Even Cleopatra had days where the Nile refused to rise. What matters is not today\'s stumble but tomorrow\'s return.';
  }
  return 'Data is not judgment — it is a mirror. Look clearly, adjust precisely, and advance without apology.';
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  header: { marginBottom: 4 },
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
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  periodLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  periodLabelActive: { color: Colors.GOLD },
  overviewCard: { gap: 16 },
  cardTitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.GOLD,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    marginTop: -8,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewRingCol: { alignItems: 'center', gap: 6 },
  overviewRingLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.IVORY,
    letterSpacing: 0.5,
  },
  overviewRingSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
  },
  chartCard: { gap: 8 },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '70%',
    height: 80,
    justifyContent: 'flex-end',
    backgroundColor: Colors.STONE,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  barLabelToday: { color: Colors.GOLD },
  barPct: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 8,
    color: Colors.DUST,
  },
  streakCard: { gap: 10 },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakRank: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.CAPTION,
    width: 24,
  },
  streakIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakName: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
    flex: 1,
  },
  streakNums: { alignItems: 'flex-end', gap: 2 },
  streakCurrent: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
  },
  streakBest: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
  },
  bestStreakBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.DIVIDER,
    paddingTop: 10,
    overflow: 'hidden',
  },
  bestStreakLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD_MUTED,
  },
  bestStreakNum: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.GOLD,
  },
  emptyText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    textAlign: 'center',
    paddingVertical: 12,
  },
  priorityCard: { gap: 10 },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priorityLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    width: 60,
  },
  priorityTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.STONE,
    borderRadius: 4,
    overflow: 'hidden',
  },
  priorityFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  priorityCount: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.IVORY,
    width: 20,
    textAlign: 'right',
  },
  cycleCard: { overflow: 'hidden', gap: 12 },
  cycleHeader: { overflow: 'hidden' },
  cycleContent: { gap: 12 },
  phaseChip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  phaseChipLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cycleMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  cycleStat: { gap: 2 },
  cycleStatValue: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H3,
    color: Colors.GOLD,
  },
  cycleStatLabel: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cycleInsight: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  insightCard: {
    overflow: 'hidden',
    alignItems: 'center',
    gap: 8,
  },
  insightDecoration: {
    fontSize: 24,
    color: Colors.GOLD_MUTED,
  },
  insightText: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.BODY_MD,
    color: Colors.IVORY,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
});
