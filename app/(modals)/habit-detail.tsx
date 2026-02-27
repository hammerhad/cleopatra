import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../src/stores/authStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { createHabit, updateHabit, getHabitLogs } from '../../src/services/habits';
import { scheduleHabitReminder, cancelHabitReminder } from '../../src/utils/reminders';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldInput } from '../../src/components/ui/GoldInput';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius, Spacing } from '../../src/theme';
import type { HabitCategory, CreateHabitInput } from '../../src/types/habits';

const CATEGORIES: { id: HabitCategory; emoji: string; label: string }[] = [
  { id: 'mindfulness', emoji: '🧘', label: 'Mindfulness' },
  { id: 'fitness', emoji: '💪', label: 'Fitness' },
  { id: 'nutrition', emoji: '🥗', label: 'Nutrition' },
  { id: 'learning', emoji: '📚', label: 'Learning' },
  { id: 'creativity', emoji: '🎨', label: 'Creativity' },
  { id: 'social', emoji: '🤝', label: 'Social' },
  { id: 'self-care', emoji: '🛁', label: 'Self-care' },
  { id: 'finance', emoji: '💰', label: 'Finance' },
  { id: 'work', emoji: '⚔️', label: 'Work' },
  { id: 'custom', emoji: '✨', label: 'Custom' },
];

const HABIT_COLORS = [
  Colors.GOLD, '#E07820', Colors.SUCCESS, '#3A7ABF',
  Colors.AMETHYST, Colors.SCARLET, '#2A8A6A', '#8A5A2A',
];

const HABIT_EMOJIS = [
  '🧘', '💪', '📚', '🥗', '💧', '☀️', '🏃', '✍️',
  '🎵', '🧹', '💰', '🌿', '🔥', '⚔️', '🌙', '✨',
];

export default function HabitDetailModal() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { habits } = useHabitStore();
  const params = useLocalSearchParams<{ habitId?: string }>();

  const existing = params.habitId ? habits.find((h) => h.id === params.habitId) : null;
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState<HabitCategory>(existing?.category ?? 'custom');
  const [icon, setIcon] = useState(existing?.icon ?? '✨');
  const [color, setColor] = useState(existing?.color ?? Colors.GOLD);
  const [reminderEnabled, setReminderEnabled] = useState(!!existing?.reminderTime);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (existing?.reminderTime) {
      const [h, m] = existing.reminderTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setReminderTime(d);
    }
  }, []);

  function validate() {
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = 'Ritual name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!user?.uid || !validate()) return;
    setSaving(true);

    try {
      const timeString = reminderEnabled
        ? `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`
        : null;

      const input: CreateHabitInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        color,
        frequency: { type: 'daily' },
        reminderTime: timeString,
      };

      let habitId: string;

      if (isEdit && existing) {
        await updateHabit(user.uid, existing.id, input);
        habitId = existing.id;
      } else {
        habitId = await createHabit(user.uid, input);
      }

      // Schedule or cancel reminder
      if (reminderEnabled && timeString) {
        await scheduleHabitReminder(habitId, title.trim(), timeString);
      } else {
        await cancelHabitReminder(habitId);
      }

      router.back();
    } catch {
      setErrors({ title: 'Save failed. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.OBSIDIAN, Colors.ONYX]} style={StyleSheet.absoluteFill} />

      {/* Handle bar */}
      <View style={styles.handleBar} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{isEdit ? 'Edit Ritual' : 'New Ritual'}</Text>

        {/* Selected icon/color preview */}
        <View style={styles.previewRow}>
          <View style={[styles.iconPreview, { backgroundColor: `${color}20`, borderColor: color }]}>
            <Text style={styles.iconPreviewText}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle}>{title || 'Your Ritual'}</Text>
            <Text style={styles.previewCategory}>{category}</Text>
          </View>
        </View>

        <GoldenDivider />

        {/* Title */}
        <GoldInput
          label="Ritual Name"
          value={title}
          onChangeText={setTitle}
          placeholder="Morning meditation..."
          error={errors.title}
          maxLength={64}
        />

        <GoldInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Why this ritual matters to you..."
          multiline
          numberOfLines={2}
          maxLength={200}
        />

        {/* Category */}
        <View>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[styles.categoryChip, category === cat.id && styles.categoryChipActive]}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Icon picker */}
        <View>
          <Text style={styles.sectionLabel}>Icon</Text>
          <View style={styles.iconGrid}>
            {HABIT_EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => setIcon(e)}
                style={[styles.iconOption, icon === e && { borderColor: color, borderWidth: 2 }]}
                activeOpacity={0.8}
              >
                <Text style={styles.iconOptionText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color picker */}
        <View>
          <Text style={styles.sectionLabel}>Color</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorOptionActive]}
                activeOpacity={0.8}
              >
                {color === c && <Text style={styles.colorCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder */}
        <View style={styles.reminderSection}>
          <View style={styles.reminderRow}>
            <View>
              <Text style={styles.reminderTitle}>⏰ Daily Reminder</Text>
              <Text style={styles.reminderSub}>Get notified at the same time each day</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: Colors.STONE, true: Colors.GOLD_MUTED }}
              thumbColor={reminderEnabled ? Colors.GOLD : Colors.DUST}
            />
          </View>

          {reminderEnabled && (
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={styles.timeButton}
            >
              <Text style={styles.timeButtonText}>
                {reminderTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.timeButtonEdit}>Change →</Text>
            </TouchableOpacity>
          )}
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            display="spinner"
            themeVariant="dark"
            onChange={(_, date) => {
              setShowTimePicker(false);
              if (date) setReminderTime(date);
            }}
          />
        )}

        <GoldenDivider />

        <View style={styles.actions}>
          <GoldButton label="Cancel" variant="ghost" onPress={() => router.back()} style={{ flex: 1 }} />
          <GoldButton
            label={isEdit ? 'Save Changes' : 'Create Ritual'}
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
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.STONE,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scroll: { paddingHorizontal: 20, gap: 20 },
  title: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
    marginTop: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  iconPreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconPreviewText: { fontSize: 26 },
  previewTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  previewCategory: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  sectionLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    color: Colors.PARCHMENT,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  categoryRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.MD,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  categoryLabelActive: { color: Colors.GOLD },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.ANTHRACITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  iconOptionText: { fontSize: 22 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: Colors.IVORY,
  },
  colorCheck: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: 14,
    color: Colors.IVORY,
  },
  reminderSection: {
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.ASH,
    borderRadius: BorderRadius.MD,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  timeButtonText: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H3,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.TIGHT,
  },
  timeButtonEdit: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD_MUTED,
  },
  actions: { flexDirection: 'row', gap: 12 },
});
