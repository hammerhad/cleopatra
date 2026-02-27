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
import { format } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { onTasksChange, moveToBucket, deleteTask } from '../../src/services/tasks';
import { TaskListSkeleton } from '../../src/components/skeletons/TaskSkeleton';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';
import type { Task, TaskBucket } from '../../src/types/tasks';

const BUCKETS: { key: TaskBucket; label: string; emoji: string }[] = [
  { key: 'now', label: 'Now', emoji: '⚡' },
  { key: 'next', label: 'Next', emoji: '→' },
  { key: 'later', label: 'Later', emoji: '🌙' },
  { key: 'done', label: 'Done', emoji: '✓' },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: Colors.ERROR,
  high: '#E07820',
  medium: Colors.GOLD,
  low: Colors.DUST,
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: '!!!',
  high: '!!',
  medium: '!',
  low: '',
};

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { tasks, isLoading, setTasks, activeFilter, setFilter, removeTaskLocally } = useTaskStore();
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onTasksChange(user.uid, setTasks);
    return unsub;
  }, [user?.uid]);

  async function handleMoveToDone(taskId: string) {
    if (!user?.uid) return;
    setMovingId(taskId);
    try {
      await moveToBucket(user.uid, taskId, 'done');
    } finally {
      setMovingId(null);
    }
  }

  function confirmDelete(task: Task) {
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
    const today = new Date();
    const comp = new Date(t.completedAt);
    return comp.toDateString() === today.toDateString();
  }).length;

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
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

        {/* Stats */}
        <View style={styles.statsRow}>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>{nowCount}</Text>
            <Text style={styles.statLabel}>Critical Now</Text>
          </CleoCard>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>{doneToday}</Text>
            <Text style={styles.statLabel}>Conquered Today</Text>
          </CleoCard>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>{tasks.filter((t) => t.bucket !== 'done').length}</Text>
            <Text style={styles.statLabel}>In Queue</Text>
          </CleoCard>
        </View>

        {/* Bucket Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bucketsRow}
        >
          <TouchableOpacity
            style={[styles.bucketTab, activeFilter === 'all' && styles.bucketTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.bucketTabText, activeFilter === 'all' && styles.bucketTabTextActive]}>
              All
            </Text>
            <Text style={styles.bucketCount}>{tasks.length}</Text>
          </TouchableOpacity>
          {BUCKETS.map((b) => {
            const count = tasks.filter((t) => t.bucket === b.key).length;
            return (
              <TouchableOpacity
                key={b.key}
                style={[styles.bucketTab, activeFilter === b.key && styles.bucketTabActive]}
                onPress={() => setFilter(b.key)}
              >
                <Text style={styles.bucketEmoji}>{b.emoji}</Text>
                <Text style={[styles.bucketTabText, activeFilter === b.key && styles.bucketTabTextActive]}>
                  {b.label}
                </Text>
                {count > 0 && <Text style={styles.bucketCount}>{count}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <GoldenDivider />

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⚔️</Text>
            <Text style={styles.emptyTitle}>No tasks here</Text>
            <Text style={styles.emptyBody}>Your kingdom is at peace. Add your next conquest.</Text>
            <GoldButton
              label="Add Task"
              variant="outline"
              size="sm"
              onPress={() => router.push('/(modals)/task-detail')}
              style={{ marginTop: 16 }}
            />
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

function TaskCard({
  task,
  moving,
  onComplete,
  onEdit,
  onDelete,
}: {
  task: Task;
  moving: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDone = task.bucket === 'done';
  const priorityColor = PRIORITY_COLORS[task.priority] ?? Colors.DUST;

  return (
    <CleoCard style={[styles.taskCard, isDone && styles.taskCardDone]}>
      <View style={styles.taskMain}>
        {/* Priority indicator */}
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

        {/* Check button */}
        <TouchableOpacity
          onPress={onComplete}
          disabled={isDone || moving}
          style={[styles.taskCheck, isDone && styles.taskCheckDone]}
          activeOpacity={0.8}
        >
          <Text style={[styles.taskCheckText, isDone && styles.taskCheckTextDone]}>
            {isDone ? '✓' : '○'}
          </Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.taskContent}>
          <View style={styles.taskTitleRow}>
            <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
              {task.title}
            </Text>
            <BadgeChip
              label={task.bucket.toUpperCase()}
              variant={isDone ? 'success' : 'gold'}
              size="sm"
            />
          </View>

          {task.description ? (
            <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
          ) : null}

          <View style={styles.taskFooter}>
            {task.dueDate && (
              <Text style={styles.taskMeta}>
                📅 {format(new Date(task.dueDate), 'MMM d')}
              </Text>
            )}
            {task.tags.length > 0 && (
              <Text style={styles.taskMeta}>🏷 {task.tags[0]}</Text>
            )}
            {task.priority !== 'low' && (
              <Text style={[styles.priorityLabel, { color: priorityColor }]}>
                {PRIORITY_LABELS[task.priority]} {task.priority}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.taskActions}>
        {!isDone && (
          <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
          <Text style={[styles.actionText, { color: Colors.ERROR }]}>Delete</Text>
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
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
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
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bucketsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  bucketTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  bucketTabActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  bucketEmoji: { fontSize: 12 },
  bucketTabText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  bucketTabTextActive: { color: Colors.GOLD },
  bucketCount: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    backgroundColor: Colors.STONE,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyEmoji: { fontSize: 40 },
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
  taskCard: { gap: 10 },
  taskCardDone: { opacity: 0.6 },
  taskMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  priorityBar: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    minHeight: 40,
  },
  taskCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  taskCheckDone: { backgroundColor: Colors.SUCCESS, borderColor: Colors.SUCCESS },
  taskCheckText: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 12,
    color: Colors.DUST,
  },
  taskCheckTextDone: { color: Colors.IVORY },
  taskContent: { flex: 1, gap: 4 },
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
  taskDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  taskFooter: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  taskMeta: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  priorityLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
