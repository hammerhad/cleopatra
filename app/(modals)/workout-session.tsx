import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { formatDuration, formatRest } from '../../src/utils/formatting';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';

const SAMPLE_EXERCISES = [
  { id: '1', name: 'Barbell Squat', sets: 4, reps: 8, weight: 60, restTime: 90, muscleGroups: ['legs', 'glutes'] },
  { id: '2', name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 50, restTime: 90, muscleGroups: ['glutes', 'back'] },
  { id: '3', name: 'Hip Thrust', sets: 4, reps: 12, weight: 80, restTime: 60, muscleGroups: ['glutes'] },
  { id: '4', name: 'Leg Press', sets: 3, reps: 15, weight: 120, restTime: 60, muscleGroups: ['legs'] },
];

type SetStatus = 'pending' | 'completed' | 'skipped';
interface ExerciseState {
  id: string;
  setStatuses: SetStatus[];
  currentSet: number;
}

export default function WorkoutSessionModal() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(
    SAMPLE_EXERCISES.map((e) => ({
      id: e.id,
      setStatuses: Array(e.sets).fill('pending' as SetStatus),
      currentSet: 0,
    }))
  );

  const sessionInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const restInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rest timer pulse animation
  const restPulse = useSharedValue(1);
  const restPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: restPulse.value }],
  }));

  useEffect(() => {
    if (sessionStarted) {
      sessionInterval.current = setInterval(() => {
        setTotalSeconds((s) => s + 1);
      }, 1000);
    }
    return () => { if (sessionInterval.current) clearInterval(sessionInterval.current); };
  }, [sessionStarted]);

  useEffect(() => {
    if (restTimer !== null && restTimer > 0) {
      restPulse.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1, false
      );
      restInterval.current = setInterval(() => {
        setRestTimer((t) => {
          if (t === null || t <= 1) {
            clearInterval(restInterval.current!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return null;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      restPulse.value = withTiming(1);
    }
    return () => { if (restInterval.current) clearInterval(restInterval.current); };
  }, [restTimer !== null]);

  function completeSet(exerciseIdx: number, setIdx: number, status: SetStatus) {
    setExerciseStates((prev) => {
      const next = [...prev];
      next[exerciseIdx] = {
        ...next[exerciseIdx],
        setStatuses: next[exerciseIdx].setStatuses.map((s, i) => (i === setIdx ? status : s)),
        currentSet: Math.min(setIdx + 1, SAMPLE_EXERCISES[exerciseIdx].sets - 1),
      };
      return next;
    });

    if (status === 'completed') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRestTimer(SAMPLE_EXERCISES[exerciseIdx].restTime);
    }
  }

  function handleFinishSession() {
    Alert.alert(
      'Complete Workout?',
      `Great session! ${formatDuration(totalSeconds)} of work done.`,
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            if (sessionInterval.current) clearInterval(sessionInterval.current);
            // In production: save to Firestore
            router.back();
          },
        },
      ]
    );
  }

  const currentExercise = SAMPLE_EXERCISES[currentExerciseIdx];
  const currentState = exerciseStates[currentExerciseIdx];
  const allSetsComplete = currentState.setStatuses.every((s) => s !== 'pending');

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.OBSIDIAN, '#0A0804']} style={StyleSheet.absoluteFill} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => Alert.alert('Quit Workout?', 'Your progress will be lost.', [
          { text: 'Continue', style: 'cancel' },
          { text: 'Quit', style: 'destructive', onPress: () => router.back() },
        ])}>
          <Text style={styles.quitText}>✕ Quit</Text>
        </TouchableOpacity>

        <View style={styles.timerBlock}>
          <Text style={styles.timerText}>{formatDuration(totalSeconds)}</Text>
          <Text style={styles.timerLabel}>SESSION TIME</Text>
        </View>

        {!sessionStarted ? (
          <GoldButton label="Start" size="sm" onPress={() => setSessionStarted(true)} />
        ) : (
          <GoldButton label="Finish" size="sm" variant="outline" onPress={handleFinishSession} />
        )}
      </View>

      {/* Rest Timer Overlay */}
      {restTimer !== null && (
        <Animated.View style={[styles.restOverlay, restPulseStyle]}>
          <LinearGradient
            colors={['rgba(10,9,8,0.97)', 'rgba(20,16,8,0.97)']}
            style={styles.restContent}
          >
            <Text style={styles.restEmoji}>⏱</Text>
            <Text style={styles.restTime}>{formatRest(restTimer)}</Text>
            <Text style={styles.restLabel}>REST</Text>
            <TouchableOpacity onPress={() => setRestTimer(null)} style={styles.skipRest}>
              <Text style={styles.skipRestText}>Skip rest →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseTabs}>
          {SAMPLE_EXERCISES.map((ex, idx) => {
            const state = exerciseStates[idx];
            const done = state.setStatuses.every((s) => s !== 'pending');
            return (
              <TouchableOpacity
                key={ex.id}
                onPress={() => setCurrentExerciseIdx(idx)}
                style={[
                  styles.exerciseTab,
                  currentExerciseIdx === idx && styles.exerciseTabActive,
                  done && styles.exerciseTabDone,
                ]}
              >
                <Text style={[
                  styles.exerciseTabText,
                  currentExerciseIdx === idx && styles.exerciseTabTextActive,
                ]}>
                  {done ? '✓ ' : ''}{ex.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Current exercise */}
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <View style={styles.exerciseMeta}>
            <Text style={styles.exerciseMetaText}>{currentExercise.sets} sets</Text>
            <Text style={styles.exerciseDot}>·</Text>
            <Text style={styles.exerciseMetaText}>{currentExercise.reps} reps</Text>
            <Text style={styles.exerciseDot}>·</Text>
            <Text style={styles.exerciseMetaText}>{currentExercise.weight}kg</Text>
          </View>
        </View>

        <GoldenDivider />

        {/* Sets */}
        {Array.from({ length: currentExercise.sets }, (_, setIdx) => {
          const status = currentState.setStatuses[setIdx];
          const isCurrent = setIdx === currentState.currentSet && status === 'pending';

          return (
            <CleoCard
              key={setIdx}
              style={[
                styles.setCard,
                status === 'completed' && styles.setCardDone,
                isCurrent && styles.setCardCurrent,
              ]}
            >
              <View style={styles.setRow}>
                <View style={styles.setNumber}>
                  <Text style={[styles.setNum, status === 'completed' && styles.setNumDone]}>
                    {status === 'completed' ? '✓' : setIdx + 1}
                  </Text>
                </View>
                <View style={styles.setInfo}>
                  <Text style={styles.setReps}>
                    {currentExercise.reps} reps × {currentExercise.weight}kg
                  </Text>
                  {isCurrent && <Text style={styles.setCurrentLabel}>← Current set</Text>}
                </View>
                {isCurrent && sessionStarted && (
                  <View style={styles.setActions}>
                    <TouchableOpacity
                      onPress={() => completeSet(currentExerciseIdx, setIdx, 'completed')}
                      style={styles.setBtn}
                    >
                      <Text style={styles.setBtnText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => completeSet(currentExerciseIdx, setIdx, 'skipped')}
                      style={[styles.setBtn, styles.setBtnSkip]}
                    >
                      <Text style={styles.setBtnSkipText}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {status === 'skipped' && (
                  <Text style={styles.skippedLabel}>Skipped</Text>
                )}
              </View>
            </CleoCard>
          );
        })}

        {/* Navigation */}
        {allSetsComplete && (
          <GoldButton
            label={currentExerciseIdx < SAMPLE_EXERCISES.length - 1 ? 'Next Exercise →' : '🏆 Finish Workout'}
            onPress={() => {
              if (currentExerciseIdx < SAMPLE_EXERCISES.length - 1) {
                setCurrentExerciseIdx((i) => i + 1);
              } else {
                handleFinishSession();
              }
            }}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  quitText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  timerBlock: { alignItems: 'center' },
  timerText: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.TIGHT,
  },
  timerLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDER,
  },
  restOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  restEmoji: { fontSize: 48 },
  restTime: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: 80,
    color: Colors.GOLD,
    letterSpacing: -4,
  },
  restLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.LABEL,
    color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
  },
  skipRest: { marginTop: 16 },
  skipRestText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.GOLD_MUTED,
    letterSpacing: 0.5,
  },
  scroll: { paddingHorizontal: 20, gap: 12, paddingTop: 16 },
  exerciseTabs: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  exerciseTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  exerciseTabActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  exerciseTabDone: { opacity: 0.5 },
  exerciseTabText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  exerciseTabTextActive: { color: Colors.GOLD },
  exerciseHeader: { gap: 4 },
  exerciseName: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  exerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exerciseMetaText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
  },
  exerciseDot: { color: Colors.STONE },
  setCard: { gap: 0 },
  setCardDone: { opacity: 0.6 },
  setCardCurrent: {
    borderColor: 'rgba(201,168,76,0.3)',
    borderWidth: 1,
  },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  setNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.ASH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNum: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.PARCHMENT,
  },
  setNumDone: { color: Colors.GOLD },
  setInfo: { flex: 1, gap: 2 },
  setReps: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
  },
  setCurrentLabel: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
  },
  setActions: { flexDirection: 'row', gap: 8 },
  setBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBtnText: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.BODY_MD,
    color: Colors.OBSIDIAN,
  },
  setBtnSkip: {
    backgroundColor: Colors.STONE,
  },
  setBtnSkipText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  skippedLabel: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    fontStyle: 'italic',
  },
});
