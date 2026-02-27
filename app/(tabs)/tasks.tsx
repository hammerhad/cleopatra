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
import { format } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { onTasksChange, moveToBucket, deleteTask } from '../../src/services/tasks';
import { TaskListSkeleton } from '../../src/components/skeletons/TaskSkeleton';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';
import type { Task, TaskBucket } from '../../src/types/tasks';

const BUCKETS: { key: TaskBucket; label: string; emoji: string; color: string }[] = [
  { key: 'now',  label: 'Now',   emoji: '⚡', color: Colors.ERROR },
  { key: 'next', label: 'Next',  emoji: '→',  color: Colors.GOLD },
  { key: 'later',label: 'Later', emoji: '🌙', color: '#6A7A9A' },
  { key: 'done', label: 'Done',  emoji: '✓',  color: Colors.SUCCESS },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: Colors.ERROR,
  high: '#E07820',
  medium: Colors.GOLD,
  low: Colors.DUST,
};

const PRIORITY_BG: Record<string, string> = {
  critical: 'rgba(220,38,38,0.06)',
  high: 'rgba(224,120,32,0.05)',
  medium: 'transparent',
  low: 'transparent',
};

const BUCKET_EMPTY_MESSAGES: Record<string, { emoji: string; title: string; body: string }> = {
  now:  { emoji: '⚡', title: 'No urgent decrees', body: 'Your present is clear. Add what demands action now.' },
  next: { emoji: '→', title: 'Nothing queued next', body: 'Plan your next conquest. Strategy is power.' },
  later:{ emoji: '🌙', title: 'No deferred tasks', body: 'The future is open. Reserve it for bold ambitions.' },
  done: { emoji: '✓', title: 'No completed tasks yet', body: 'Conquer your first task and claim victory.' },
  all:  { emoji: '⚔️', title: 'No tasks yet', body: 'Your kingdom is at peace. Add your next conquest.' },
};

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { tasks, isLoading, setTasks, activeFilter, setFilter, removeTaskLocally, updateTaskLocally } = useTaskStore();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onTasksChange(user.uid, setTasks);
    return unsub;
  }, [user?.uid]);

  const handleRefresh = useCallback(async () => {
    // onTasksChange is a live listener, so just trigger a haptic and it auto-updates
    setRefreshing(true);
    Haptics.selectionAsync();
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  async function handleMoveToDone(taskId: string) {
    if (!user?.uid || movingId) return;
    setMovingId(taskId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Optimistic update
    updateTaskLocally(taskId, { bucket: 'done' });
    try {
      await moveToBucket(user.uid, taskId, 'done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      updateTaskLocally(taskId, { bucket: activeFilter === 'all' ? 'now' : activeFilter as TaskBucket });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setMovingId(null);
    }
  }

  function confirmDelete(task: Task) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete Task', `Delete "${task.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user?.uid) return;
          removeTaskLocally(task.id);
          await deleteTask(user.uid, task.id);
        },
      },
    ]);
  }

  if (isLoading && tasks.length === 0) return <TaskListSkeleton />;

  const filteredTasks = activeFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.bucket === activeFilter);

  const nowCount = tasks.filter((t) => t.bucket === 'now').length;
  const doneToday = tasks.filter((t) => {
    if (t.bucket !== 'done' || !t.completedAt) return false;
    return new Date(t.completedAt).toDateString() === new Date().toDateString();
  }).length;
  const inQueue = tasks.filter((t) => t.bucket !== 'done').length;

  const emptyInfo = BUCKET_EMPTY_MESSAGES[activeFilter] ?? BUCKET_EMPTY_MESSAGES.all;

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
            <Text style={styles.eyebrow}>Royal Decrees</Text>
            <Text style={styles.title}>Tasks</Text>
          </View>
          <GoldButton
            label="+ Task"
            variant="outline"
            size="sm"
            onPress={() => router.push('/(modals)/task-detail')}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard value={nowCount} label="Critical Now" color={Colors.ERROR} />
          <StatCard value={doneToday} label="Conquered" color={Colors.SUCCESS} />
          <StatCard value={inQueue} label="In Queue" color={Colors.GOLD} />
        </View>

        {/* Bucket filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bucketsRow}
        >
          {/* "All" tab */}
          <BucketTab
            label="All"
            emoji="◈"
            count={tasks.length}
            active={activeFilter === 'all'}
            color={Colors.GOLD_MUTED}
            onPress={() => { Haptics.selectionAsync(); setFilter('all'); }}
          />
          {BUCKETS.map((b) => (
            <BucketTab
              key={b.key}
              label={b.label}
              emoji={b.emoji}
              count={tasks.filter((t) => t.bucket === b.key).length}
              active={activeFilter === b.key}
              color={b.color}
              onPress={() => { Haptics.selectionAsync(); setFilter(b.key); }}
            />
          ))}
        </ScrollView>

        <GoldenDivider />

        {/* Task list */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{emptyInfo.emoji}</Text>
            <Text style={styles.emptyTitle}>{emptyInfo.title}</Text>
            <Text style={styles.emptyBody}>{emptyInfo.body}</Text>
            {activeFilter !== 'done' && (
              <GoldButton
                label="Add Task"
                variant="outline"
                size="sm"
                onPress={() => router.push('/(modals)/task-detail')}
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              moving={movingId === task.id}
              onComplete={() => handleMoveToDone(task.id)}
              onEdit={() => router.push({ pathname: '/(modals)/task-detail', params: { taskId: task.id } })}
              onDelete={() => confirmDelete(task)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <CleoCard style={styles.statCard}>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </CleoCard>
  );
}

function BucketTab({
  label, emoji, count, active, color, onPress,
}: {
  label: string; emoji: string; count: number; active: boolean; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.bucketTab, active && { borderColor: color, backgroundColor: `${color}18` }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.bucketEmoji}>{emoji}</Text>
      <Text style={[styles.bucketTabText, active && { color }]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.bucketCountBadge, active && { backgroundColor: `${color}30` }]}>
          <Text style={[styles.bucketCount, active && { color }]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function TaskCard({
  task, moving, onComplete, onEdit, onDelete,
}: {
  task: Task; moving: boolean; onComplete: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const checkScale = useRef(new Animated.Value(1)).current;
  const isDone = task.bucket === 'done';
  const priorityColor = PRIORITY_COLORS[task.priority] ?? Colors.DUST;
  const priorityBg = PRIORITY_BG[task.priority] ?? 'transparent';

  function handleComplete() {
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 0.7, duration: 80, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, tension: 220, friction: 7, useNativeDriver: true }),
    ]).start();
    onComplete();
  }

  const bucketConfig = BUCKETS.find((b) => b.key === task.bucket);

  return (
    <View style={[styles.taskCardWrapper, isDone && styles.taskCardDone, { backgroundColor: isDone ? Colors.ANTHRACITE : priorityBg || Colors.ANTHRACITE }]}>
      {/* Priority bar */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      <View style={styles.taskCardInner}>
        {/* Main row */}
        <View style={styles.taskMain}>
          {/* Animated check */}
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <TouchableOpacity
              onPress={handleComplete}
              disabled={isDone || moving}
              style={[
                styles.taskCheck,
                isDone && { backgroundColor: Colors.SUCCESS, borderColor: Colors.SUCCESS },
                !isDone && task.priority === 'critical' && { borderColor: Colors.ERROR },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.taskCheckText, isDone && styles.taskCheckTextDone]}>
                {isDone ? '✓' : moving ? '…' : '○'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Content */}
          <View style={styles.taskContent}>
            <View style={styles.taskTitleRow}>
              <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
                {task.title}
              </Text>
              {/* Bucket chip */}
              {bucketConfig && (
                <View style={[styles.bucketChip, { borderColor: `${bucketConfig.color}50`, backgroundColor: `${bucketConfig.color}15` }]}>
                  <Text style={[styles.bucketChipText, { color: bucketConfig.color }]}>
                    {bucketConfig.emoji} {bucketConfig.label}
                  </Text>
                </View>
              )}
            </View>

            {task.description ? (
              <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
            ) : null}

            <View style={styles.taskFooter}>
              {task.dueDate && (
                <View style={styles.taskMetaChip}>
                  <Text style={styles.taskMeta}>📅 {format(new Date(task.dueDate), 'MMM d')}</Text>
                </View>
              )}
              {task.tags && task.tags.length > 0 && (
                <View style={styles.taskMetaChip}>
                  <Text style={styles.taskMeta}>🏷 {task.tags[0]}</Text>
                </View>
              )}
              {task.priority !== 'low' && (
                <View style={[styles.priorityChip, { backgroundColor: `${priorityColor}20`, borderColor: `${priorityColor}40` }]}>
                  <Text style={[styles.priorityLabel, { color: priorityColor }]}>
                    {task.priority.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action row */}
        <View style={styles.taskActions}>
          {!isDone && (
            <TouchableOpacity onPress={onEdit} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDelete} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionText, { color: Colors.ERROR }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  bucketsRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  bucketTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  bucketEmoji: { fontSize: 12 },
  bucketTabText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  bucketCountBadge: {
    backgroundColor: Colors.ASH,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  bucketCount: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
  },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
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

  // Task card with left priority bar
  taskCardWrapper: {
    flexDirection: 'row',
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
    overflow: 'hidden',
  },
  taskCardDone: { opacity: 0.6 },
  priorityBar: {
    width: 3,
    borderRadius: 0,
  },
  taskCardInner: {
    flex: 1,
    padding: 14,
    gap: 10,
  },

  taskMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  taskCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  taskCheckText: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 12,
    color: Colors.DUST,
  },
  taskCheckTextDone: { color: Colors.IVORY },

  taskContent: { flex: 1, gap: 5 },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskTitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_MD,
    color: Colors.IVORY,
    flex: 1,
  },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.DUST },

  bucketChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
  },
  bucketChipText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    letterSpacing: 0.3,
  },

  taskDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  taskFooter: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  taskMetaChip: {
    backgroundColor: Colors.ASH,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskMeta: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  priorityChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    letterSpacing: 0.8,
  },

  taskActions: {
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
