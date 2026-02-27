import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';
import type { WorkoutTemplate, ExerciseCategory } from '../../src/types/training';

// ─── Built-in Templates ───────────────────────────────────────────────────────
const BUILT_IN_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'queen-strength',
    userId: 'system',
    name: 'Queen's Strength',
    description: 'Full-body strength training fit for a pharaoh',
    category: 'strength',
    estimatedDuration: 45,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    exercises: [
      { id: 'e1', name: 'Barbell Squat', category: 'strength', muscleGroups: ['lower_body', 'glutes'], sets: 4, reps: 8, restTime: 90 },
      { id: 'e2', name: 'Romanian Deadlift', category: 'strength', muscleGroups: ['back', 'glutes', 'legs'], sets: 3, reps: 10, restTime: 90 },
      { id: 'e3', name: 'Bench Press', category: 'strength', muscleGroups: ['chest', 'arms'], sets: 4, reps: 8, restTime: 90 },
      { id: 'e4', name: 'Bent-Over Row', category: 'strength', muscleGroups: ['back', 'arms'], sets: 3, reps: 10, restTime: 60 },
      { id: 'e5', name: 'Plank Hold', category: 'strength', muscleGroups: ['core'], duration: 60, restTime: 45 },
    ],
  },
  {
    id: 'nile-hiit',
    userId: 'system',
    name: 'Nile Rush',
    description: 'High-intensity intervals to ignite your fire',
    category: 'hiit',
    estimatedDuration: 25,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    exercises: [
      { id: 'e6', name: 'Burpees', category: 'hiit', muscleGroups: ['full_body'], duration: 40, restTime: 20 },
      { id: 'e7', name: 'Jump Squats', category: 'hiit', muscleGroups: ['lower_body', 'glutes'], duration: 40, restTime: 20 },
      { id: 'e8', name: 'Mountain Climbers', category: 'hiit', muscleGroups: ['core', 'full_body'], duration: 40, restTime: 20 },
      { id: 'e9', name: 'High Knees', category: 'hiit', muscleGroups: ['lower_body', 'core'], duration: 40, restTime: 20 },
      { id: 'e10', name: 'Push-Up to T', category: 'hiit', muscleGroups: ['chest', 'core', 'arms'], duration: 40, restTime: 20 },
    ],
  },
  {
    id: 'sacred-yoga',
    userId: 'system',
    name: 'Sacred Flow',
    description: 'Restorative yoga rooted in ancient power',
    category: 'yoga',
    estimatedDuration: 30,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    exercises: [
      { id: 'e11', name: 'Sun Salutation', category: 'yoga', muscleGroups: ['full_body'], duration: 120, restTime: 30 },
      { id: 'e12', name: 'Warrior I & II', category: 'yoga', muscleGroups: ['lower_body', 'core'], duration: 90, restTime: 20 },
      { id: 'e13', name: 'Camel Pose', category: 'yoga', muscleGroups: ['back', 'chest'], duration: 60, restTime: 20 },
      { id: 'e14', name: 'Pigeon Pose', category: 'yoga', muscleGroups: ['glutes', 'lower_body'], duration: 90, restTime: 15 },
      { id: 'e15', name: 'Savasana', category: 'yoga', muscleGroups: ['full_body'], duration: 120, restTime: 0 },
    ],
  },
  {
    id: 'pharaoh-core',
    userId: 'system',
    name: 'Pharaoh's Core',
    description: 'Sculpt your center of power',
    category: 'strength',
    estimatedDuration: 20,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    exercises: [
      { id: 'e16', name: 'Dead Bug', category: 'strength', muscleGroups: ['core'], sets: 3, reps: 12, restTime: 45 },
      { id: 'e17', name: 'Hollow Hold', category: 'strength', muscleGroups: ['core'], duration: 45, restTime: 30 },
      { id: 'e18', name: 'Russian Twist', category: 'strength', muscleGroups: ['core'], sets: 3, reps: 20, restTime: 30 },
      { id: 'e19', name: 'Leg Raises', category: 'strength', muscleGroups: ['core'], sets: 3, reps: 15, restTime: 30 },
      { id: 'e20', name: 'Ab Wheel Rollout', category: 'strength', muscleGroups: ['core', 'arms'], sets: 3, reps: 8, restTime: 60 },
    ],
  },
  {
    id: 'desert-cardio',
    userId: 'system',
    name: 'Desert Wind',
    description: 'Steady-state cardio to build your endurance',
    category: 'cardio',
    estimatedDuration: 35,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    exercises: [
      { id: 'e21', name: 'Warm-up Jog', category: 'cardio', muscleGroups: ['full_body'], duration: 300, restTime: 0 },
      { id: 'e22', name: 'Steady Run', category: 'cardio', muscleGroups: ['full_body', 'legs'], duration: 1200, restTime: 0 },
      { id: 'e23', name: 'Stride Intervals', category: 'cardio', muscleGroups: ['full_body'], duration: 480, restTime: 0 },
      { id: 'e24', name: 'Cool-down Walk', category: 'cardio', muscleGroups: ['full_body'], duration: 180, restTime: 0 },
    ],
  },
];

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  strength: '#C9A84C',
  cardio: '#E07820',
  flexibility: '#1A4A3A',
  hiit: '#7A1A2E',
  yoga: '#3A2A6A',
  pilates: '#4A3A2A',
  dance: '#B07820',
  sports: '#2A4A3A',
  recovery: '#3A4A2A',
  custom: Colors.STONE,
};

const CATEGORY_EMOJIS: Record<ExerciseCategory, string> = {
  strength: '🏋️',
  cardio: '🏃',
  flexibility: '🤸',
  hiit: '⚡',
  yoga: '🧘',
  pilates: '🌀',
  dance: '💃',
  sports: '⚽',
  recovery: '🌿',
  custom: '✦',
};

const FILTER_TABS: { key: ExerciseCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Strength' },
  { key: 'hiit', label: 'HIIT' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'flexibility', label: 'Flex' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<ExerciseCategory | 'all'>('all');

  const filteredTemplates =
    activeFilter === 'all'
      ? BUILT_IN_TEMPLATES
      : BUILT_IN_TEMPLATES.filter((t) => t.category === activeFilter);

  function startWorkout(template: WorkoutTemplate) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(modals)/workout-session',
      params: { templateId: template.id, templateName: template.name },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Physical Power</Text>
            <Text style={styles.title}>Training</Text>
          </View>
          <GoldButton
            label="+ Custom"
            variant="outline"
            size="sm"
            onPress={() => router.push('/(modals)/workout-session')}
          />
        </View>

        {/* Quick start card */}
        <QuickStartCard onStart={() => startWorkout(BUILT_IN_TEMPLATES[0])} />

        {/* Weekly summary */}
        <WeeklySummaryRow />

        <GoldenDivider />

        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[styles.filterLabel, activeFilter === tab.key && styles.filterLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Templates */}
        <Text style={styles.sectionTitle}>Royal Templates</Text>
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onStart={() => startWorkout(template)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function QuickStartCard({ onStart }: { onStart: () => void }) {
  return (
    <TouchableOpacity onPress={onStart} activeOpacity={0.9}>
      <LinearGradient
        colors={['#2A1A08', '#1A0E04', Colors.ANTHRACITE]}
        style={styles.quickStart}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.quickStartContent}>
          <Text style={styles.quickStartEmoji}>⚡</Text>
          <View style={styles.quickStartText}>
            <Text style={styles.quickStartTitle}>Quick Start</Text>
            <Text style={styles.quickStartSub}>Begin Queen's Strength · 45 min</Text>
          </View>
          <Text style={styles.quickStartArrow}>→</Text>
        </View>
        <LinearGradient
          colors={['rgba(201,168,76,0.15)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function WeeklySummaryRow() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // Placeholder data — in production this would come from Firestore sessions
  const completedDays = [true, true, false, true, false, false, false];

  return (
    <CleoCard style={styles.weeklyCard}>
      <Text style={styles.weeklyTitle}>This Week</Text>
      <View style={styles.weeklyDays}>
        {days.map((d, i) => (
          <View key={i} style={styles.weeklyDay}>
            <Text style={styles.weeklyDayLabel}>{d}</Text>
            <View style={[styles.weeklyDot, completedDays[i] && styles.weeklyDotFilled]} />
          </View>
        ))}
      </View>
      <View style={styles.weeklyStats}>
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatNum}>3</Text>
          <Text style={styles.weeklyStatLabel}>Sessions</Text>
        </View>
        <View style={styles.weeklyStatDivider} />
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatNum}>115</Text>
          <Text style={styles.weeklyStatLabel}>Minutes</Text>
        </View>
        <View style={styles.weeklyStatDivider} />
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatNum}>7</Text>
          <Text style={styles.weeklyStatLabel}>Day Streak</Text>
        </View>
      </View>
    </CleoCard>
  );
}

function TemplateCard({
  template,
  onStart,
}: {
  template: WorkoutTemplate;
  onStart: () => void;
}) {
  const categoryColor = CATEGORY_COLORS[template.category] ?? Colors.GOLD;
  const categoryEmoji = CATEGORY_EMOJIS[template.category] ?? '✦';

  return (
    <CleoCard style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <View style={[styles.templateIcon, { backgroundColor: `${categoryColor}20` }]}>
          <Text style={styles.templateEmoji}>{categoryEmoji}</Text>
        </View>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          {template.description ? (
            <Text style={styles.templateDesc} numberOfLines={1}>{template.description}</Text>
          ) : null}
        </View>
        <BadgeChip
          label={template.category.toUpperCase()}
          variant="gold"
          size="sm"
        />
      </View>

      <View style={styles.templateMeta}>
        <Text style={styles.templateMetaItem}>⏱ {template.estimatedDuration} min</Text>
        <Text style={styles.templateMetaItem}>· {template.exercises.length} exercises</Text>
      </View>

      {/* Exercise preview */}
      <View style={styles.exercisePreview}>
        {template.exercises.slice(0, 3).map((ex) => (
          <View key={ex.id} style={styles.exerciseRow}>
            <View style={[styles.exerciseDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.exerciseDetail}>
              {ex.sets && ex.reps
                ? `${ex.sets}×${ex.reps}`
                : ex.duration
                ? `${ex.duration}s`
                : ''}
            </Text>
          </View>
        ))}
        {template.exercises.length > 3 && (
          <Text style={styles.moreExercises}>+{template.exercises.length - 3} more</Text>
        )}
      </View>

      <GoldButton
        label="Begin Session"
        variant="primary"
        size="sm"
        onPress={onStart}
        style={styles.startBtn}
      />
    </CleoCard>
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
  quickStart: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  quickStartEmoji: { fontSize: 28 },
  quickStartText: { flex: 1 },
  quickStartTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
  },
  quickStartSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: 2,
  },
  quickStartArrow: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 20,
    color: Colors.GOLD,
  },
  weeklyCard: { gap: 12 },
  weeklyTitle: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  weeklyDays: { flexDirection: 'row', justifyContent: 'space-between' },
  weeklyDay: { alignItems: 'center', gap: 6 },
  weeklyDayLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  weeklyDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.STONE,
  },
  weeklyDotFilled: { backgroundColor: Colors.GOLD_DEEP },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.DIVIDER,
    paddingTop: 12,
  },
  weeklyStat: { alignItems: 'center', gap: 2 },
  weeklyStatNum: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H3,
    color: Colors.GOLD,
  },
  weeklyStatLabel: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weeklyStatDivider: {
    width: 1,
    backgroundColor: Colors.DIVIDER,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  filterTabActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  filterLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: 0.5,
  },
  filterLabelActive: { color: Colors.GOLD },
  sectionTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  templateCard: { gap: 12 },
  templateHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateEmoji: { fontSize: 22 },
  templateInfo: { flex: 1 },
  templateName: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_MD,
    color: Colors.IVORY,
  },
  templateDesc: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: 2,
  },
  templateMeta: {
    flexDirection: 'row',
    gap: 4,
  },
  templateMetaItem: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  exercisePreview: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.DIVIDER,
    paddingTop: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  exerciseName: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.IVORY,
    flex: 1,
  },
  exerciseDetail: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
  },
  moreExercises: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    marginLeft: 14,
  },
  startBtn: { marginTop: 4 },
});
