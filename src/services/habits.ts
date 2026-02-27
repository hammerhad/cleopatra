import firestore from '@react-native-firebase/firestore';
import {
  habitsCol, habitLogsCol, ServerTimestamp, Increment, toDate
} from './firebase';
import type {
  Habit, HabitLog, HabitWithLog, CreateHabitInput
} from '../types/habits';
import { startOfDay, endOfDay } from 'date-fns';

function docToHabit(id: string, data: firestore.DocumentData): Habit {
  return {
    id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    category: data.category,
    icon: data.icon,
    color: data.color,
    frequency: data.frequency,
    reminderTime: data.reminderTime ?? null,
    currentStreak: data.currentStreak ?? 0,
    longestStreak: data.longestStreak ?? 0,
    totalCompletions: data.totalCompletions ?? 0,
    isActive: data.isActive ?? true,
    order: data.order ?? 0,
    lastCompletedAt: data.lastCompletedAt ? toDate(data.lastCompletedAt) : null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function docToHabitLog(id: string, data: firestore.DocumentData): HabitLog {
  return {
    id,
    habitId: data.habitId,
    userId: data.userId,
    date: toDate(data.date),
    completed: data.completed,
    note: data.note,
    completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
  };
}

export async function createHabit(
  uid: string,
  input: CreateHabitInput
): Promise<string> {
  const col = habitsCol(uid);

  // Get current count for ordering
  const existingSnap = await col.where('isActive', '==', true).get();
  const order = existingSnap.size;

  const ref = col.doc();
  await ref.set({
    ...input,
    id: ref.id,
    userId: uid,
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
    isActive: true,
    order,
    lastCompletedAt: null,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp(),
  });

  return ref.id;
}

export async function updateHabit(
  uid: string,
  habitId: string,
  updates: Partial<CreateHabitInput>
): Promise<void> {
  await habitsCol(uid).doc(habitId).update({
    ...updates,
    updatedAt: ServerTimestamp(),
  });
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  await habitsCol(uid).doc(habitId).update({
    isActive: false,
    updatedAt: ServerTimestamp(),
  });
}

export function onHabitsChange(
  uid: string,
  callback: (habits: Habit[]) => void
): () => void {
  return habitsCol(uid)
    .where('isActive', '==', true)
    .orderBy('order', 'asc')
    .onSnapshot((snap) => {
      const habits = snap.docs.map((d) => docToHabit(d.id, d.data()));
      callback(habits);
    });
}

export async function logHabitCompletion(
  uid: string,
  habitId: string,
  date: Date,
  completed: boolean,
  note?: string
): Promise<void> {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  // Check for existing log
  const existingSnap = await habitLogsCol(uid)
    .where('habitId', '==', habitId)
    .where('date', '>=', firestore.Timestamp.fromDate(startDate))
    .where('date', '<=', firestore.Timestamp.fromDate(endDate))
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    await existingSnap.docs[0].ref.update({
      completed,
      note: note ?? null,
      completedAt: completed ? ServerTimestamp() : null,
    });
  } else {
    const ref = habitLogsCol(uid).doc();
    await ref.set({
      id: ref.id,
      habitId,
      userId: uid,
      date: firestore.Timestamp.fromDate(startDate),
      completed,
      note: note ?? null,
      completedAt: completed ? ServerTimestamp() : null,
    });
  }
}

export async function getHabitLogs(
  uid: string,
  habitId: string,
  days: number = 30
): Promise<HabitLog[]> {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const snap = await habitLogsCol(uid)
    .where('habitId', '==', habitId)
    .where('date', '>=', firestore.Timestamp.fromDate(from))
    .orderBy('date', 'desc')
    .get();

  return snap.docs.map((d) => docToHabitLog(d.id, d.data()));
}

export async function getTodayHabitsWithLogs(uid: string): Promise<HabitWithLog[]> {
  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [habitsSnap, logsSnap] = await Promise.all([
    habitsCol(uid).where('isActive', '==', true).orderBy('order', 'asc').get(),
    habitLogsCol(uid)
      .where('date', '>=', firestore.Timestamp.fromDate(today))
      .where('date', '<=', firestore.Timestamp.fromDate(todayEnd))
      .get(),
  ]);

  const logsMap = new Map<string, HabitLog>();
  logsSnap.docs.forEach((d) => {
    const log = docToHabitLog(d.id, d.data());
    logsMap.set(log.habitId, log);
  });

  return habitsSnap.docs.map((d) => {
    const habit = docToHabit(d.id, d.data());
    const todayLog = logsMap.get(habit.id);
    return {
      ...habit,
      todayLog,
      completedToday: todayLog?.completed ?? false,
    };
  });
}

export async function reorderHabits(uid: string, habitIds: string[]): Promise<void> {
  const batch = firestore().batch();
  habitIds.forEach((id, idx) => {
    batch.update(habitsCol(uid).doc(id), { order: idx });
  });
  await batch.commit();
}
