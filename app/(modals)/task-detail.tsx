import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, addHours } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { createTask, updateTask } from '../../src/services/tasks';
import { scheduleTaskReminder, cancelTaskReminder } from '../../src/utils/reminders';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldInput } from '../../src/components/ui/GoldInput';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';
import type { TaskBucket, TaskPriority, CreateTaskInput, CyclePhase } from '../../src/types/tasks';

const BUCKETS: { key: TaskBucket; emoji: string; label: string; desc: string }[] = [
  { key: 'now', emoji: '⚡', label: 'Now', desc: 'Urgent & active' },
  { key: 'next', emoji: '→', label: 'Next', desc: 'Coming up soon' },
  { key: 'later', emoji: '🌙', label: 'Later', desc: 'Not urgent yet' },
];

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: 'critical', label: '!!! Critical', color: Colors.ERROR },
  { key: 'high', label: '!! High', color: '#E07820' },
  { key: 'medium', label: '! Medium', color: Colors.GOLD },
  { key: 'low', label: 'Low', color: Colors.DUST },
];

const CYCLE_PHASES: { key: CyclePhase; emoji: string; label: string }[] = [
  { key: 'menstrual', emoji: '🌑', label: 'Blood Moon' },
  { key: 'follicular', emoji: '🌱', label: 'Rising Tide' },
  { key: 'ovulation', emoji: '🌕', label: 'Peak Radiance' },
  { key: 'luteal', emoji: '🌙', label: 'Inner Oracle' },
];

export default function TaskDetailModal() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();
  const params = useLocalSearchParams<{ taskId?: string }>();

  const existing = params.taskId ? tasks.find((t) => t.id === params.taskId) : null;
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [bucket, setBucket] = useState<TaskBucket>(existing?.bucket ?? 'now');
  const [priority, setPriority] = useState<TaskPriority>(existing?.priority ?? 'medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(existing?.reminderEnabled ?? false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase | null>(existing?.cyclePhaseRelevance ?? null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  function validate() {
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = 'Decree needs a name';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags((p) => [...p, trimmed]);
    }
    setTagInput('');
  }

  async function handleSave() {
    if (!user?.uid || !validate()) return;
    setSaving(true);

    try {
      const reminderTime = reminderEnabled ? addHours(new Date(), 1) : null;

      const input: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        bucket,
        priority,
        tags,
        reminderEnabled,
        reminderTime,
        cyclePhaseRelevance: cyclePhase,
        dueDate: null,
      };

      let taskId: string;

      if (isEdit && existing) {
        await updateTask(user.uid, existing.id, input);
        taskId = existing.id;
      } else {
        taskId = await createTask(user.uid, input);
      }

      if (reminderEnabled && reminderTime) {
        await scheduleTaskReminder(taskId, title.trim(), reminderTime);
      } else if (isEdit) {
        await cancelTaskReminder(taskId);
      }

      router.back();
    } catch {
      setErrors({ title: 'Save failed. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  const selectedPriority = PRIORITIES.find((p) => p.key === priority)!;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.OBSIDIAN, Colors.ONYX]} style={StyleSheet.absoluteFill} />
      <View style={styles.handleBar} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{isEdit ? 'Edit Decree' : 'New Decree'}</Text>

        <GoldInput
          label="Task"
          value={title}
          onChangeText={setTitle}
          placeholder="What must be conquered..."
          error={errors.title}
          maxLength={120}
          autoFocus={!isEdit}
        />

        <GoldInput
          label="Notes (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Additional context..."
          multiline
          numberOfLines={2}
          maxLength={500}
        />

        {/* Bucket */}
        <View>
          <Text style={styles.sectionLabel}>When</Text>
          <View style={styles.bucketRow}>
            {BUCKETS.map((b) => (
              <TouchableOpacity
                key={b.key}
                onPress={() => setBucket(b.key)}
                style={[styles.bucketCard, bucket === b.key && styles.bucketCardActive]}
                activeOpacity={0.8}
              >
                <Text style={styles.bucketEmoji}>{b.emoji}</Text>
                <Text style={[styles.bucketLabel, bucket === b.key && styles.bucketLabelActive]}>
                  {b.label}
                </Text>
                <Text style={styles.bucketDesc}>{b.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View>
          <Text style={styles.sectionLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPriority(p.key)}
                style={[
                  styles.priorityChip,
                  priority === p.key && { borderColor: p.color, backgroundColor: `${p.color}15` },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.priorityLabel, priority === p.key && { color: p.color }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tags */}
        <View>
          <Text style={styles.sectionLabel}>Tags</Text>
          <View style={styles.tagsWrap}>
            {tags.map((tag) => (
              <TouchableOpacity key={tag} onPress={() => setTags((p) => p.filter((t) => t !== tag))}>
                <BadgeChip label={`${tag} ×`} variant="dark" size="sm" />
              </TouchableOpacity>
            ))}
          </View>
          {tags.length < 5 && (
            <GoldInput
              placeholder="+ add tag (press enter)"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
              maxLength={20}
              containerStyle={{ marginTop: 8 }}
            />
          )}
        </View>

        {/* Cycle phase alignment */}
        <View>
          <Text style={styles.sectionLabel}>Best phase for this</Text>
          <Text style={styles.sectionHint}>
            Align tasks with your cycle for peak performance
          </Text>
          <View style={styles.phaseRow}>
            <TouchableOpacity
              onPress={() => setCyclePhase(null)}
              style={[styles.phaseChip, cyclePhase === null && styles.phaseChipActive]}
            >
              <Text style={[styles.phaseLabel, cyclePhase === null && styles.phaseLabelActive]}>
                Any
              </Text>
            </TouchableOpacity>
            {CYCLE_PHASES.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setCyclePhase(p.key)}
                style={[styles.phaseChip, cyclePhase === p.key && styles.phaseChipActive]}
              >
                <Text style={styles.phaseEmoji}>{p.emoji}</Text>
                <Text style={[styles.phaseLabel, cyclePhase === p.key && styles.phaseLabelActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder */}
        <View style={styles.reminderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>🔔 Reminder</Text>
            <Text style={styles.reminderSub}>Get notified in 1 hour</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: Colors.STONE, true: Colors.GOLD_MUTED }}
            thumbColor={reminderEnabled ? Colors.GOLD : Colors.DUST}
          />
        </View>

        <GoldenDivider />

        <View style={styles.actions}>
          <GoldButton label="Cancel" variant="ghost" onPress={() => router.back()} style={{ flex: 1 }} />
          <GoldButton
            label={isEdit ? 'Save' : 'Add Decree'}
            onPress={handleSave}
            loading={saving}
            disabled={!title.trim()}
            style={{ flex: 2 }}
          />
        </View>
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
  scroll: { paddingHorizontal: 20, gap: 20 },
  title: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
    marginTop: 8,
  },
  sectionLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    color: Colors.PARCHMENT,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionHint: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: -6,
    marginBottom: 10,
  },
  bucketRow: { flexDirection: 'row', gap: 8 },
  bucketCard: {
    flex: 1,
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.MD,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  bucketCardActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  bucketEmoji: { fontSize: 18 },
  bucketLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  bucketLabelActive: { color: Colors.GOLD },
  bucketDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.SHADOW,
    textAlign: 'center',
  },
  priorityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  priorityLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  phaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phaseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  phaseChipActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  phaseEmoji: { fontSize: 13 },
  phaseLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  phaseLabelActive: { color: Colors.GOLD },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  reminderTitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
  },
  reminderSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: 2,
  },
  actions: { flexDirection: 'row', gap: 12 },
});
