import firestore from '@react-native-firebase/firestore';
import { ServerTimestamp, toDate } from './firebase';
import type { WorkoutTemplate, WorkoutSession, CompletedExercise, SessionMood, ExerciseCategory } from '../types/training';
import { startOfWeek, endOfWeek } from 'date-fns';

// ─── Collection helpers ───────────────────────────────────────────────────────
const templatesCol = (uid: string) =>
  firestore().collection('users').doc(uid).collection('workoutTemplates');

const sessionsCol = (uid: string) =>
  firestore().collection('users').doc(uid).collection('workoutSessions');

// ─── Converters ───────────────────────────────────────────────────────────────
function docToTemplate(id: string, data: firestore.DocumentData): WorkoutTemplate {
  return {
    id,
    userId: data.userId,
    name: data.name,
    description: data.description,
    category: data.category,
    estimatedDuration: data.estimatedDuration,
    exercises: data.exercises ?? [],
    isPublic: data.isPublic ?? false,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function docToSession(id: string, data: firestore.DocumentData): WorkoutSession {
  return {
    id,
    userId: data.userId,
    templateId: data.templateId,
    templateName: data.templateName,
    exercises: data.exercises ?? [],
    totalDuration: data.totalDuration ?? 0,
    caloriesBurned: data.caloriesBurned,
    notes: data.notes,
    mood: data.mood ?? 'average',
    startedAt: toDate(data.startedAt),
    completedAt: data.completedAt ? toDate(data.completedAt) : null,
    isCompleted: data.isCompleted ?? false,
  };
}

// ─── Templates ────────────────────────────────────────────────────────────────
export async function getUserTemplates(uid: string): Promise<WorkoutTemplate[]> {
  const snap = await templatesCol(uid).orderBy('createdAt', 'desc').get();
  return snap.docs.map((d) => docToTemplate(d.id, d.data()));
}

export async function createTemplate(
  uid: string,
  input: Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = templatesCol(uid).doc();
  await ref.set({
    ...input,
    id: ref.id,
    userId: uid,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp(),
  });
  return ref.id;
}

export async function updateTemplate(
  uid: string,
  templateId: string,
  updates: Partial<WorkoutTemplate>
): Promise<void> {
  await templatesCol(uid).doc(templateId).update({
    ...updates,
    updatedAt: ServerTimestamp(),
  });
}

export async function deleteTemplate(uid: string, templateId: string): Promise<void> {
  await templatesCol(uid).doc(templateId).delete();
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function startSession(
  uid: string,
  templateName: string,
  exercises: CompletedExercise[],
  templateId?: string
): Promise<string> {
  const ref = sessionsCol(uid).doc();
  await ref.set({
    id: ref.id,
    userId: uid,
    templateId: templateId ?? null,
    templateName,
    exercises,
    totalDuration: 0,
    isCompleted: false,
    mood: 'average',
    startedAt: ServerTimestamp(),
    completedAt: null,
  });
  return ref.id;
}

export async function completeSession(
  uid: string,
  sessionId: string,
  updates: {
    exercises: CompletedExercise[];
    totalDuration: number;
    mood: SessionMood;
    notes?: string;
    caloriesBurned?: number;
  }
): Promise<void> {
  await sessionsCol(uid).doc(sessionId).update({
    ...updates,
    isCompleted: true,
    completedAt: ServerTimestamp(),
  });
}

export async function getRecentSessions(uid: string, limit = 10): Promise<WorkoutSession[]> {
  const snap = await sessionsCol(uid)
    .where('isCompleted', '==', true)
    .orderBy('completedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => docToSession(d.id, d.data()));
}

export async function getWorkoutStats(uid: string): Promise<{
  totalSessions: number;
  totalMinutes: number;
  thisWeekSessions: number;
  mostUsedCategory: ExerciseCategory | null;
  longestSessionMinutes: number;
}> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const [allSnap, weekSnap] = await Promise.all([
    sessionsCol(uid).where('isCompleted', '==', true).get(),
    sessionsCol(uid)
      .where('isCompleted', '==', true)
      .where('completedAt', '>=', firestore.Timestamp.fromDate(weekStart))
      .where('completedAt', '<=', firestore.Timestamp.fromDate(weekEnd))
      .get(),
  ]);

  let totalMinutes = 0;
  let longestSessionMinutes = 0;
  const categoryCounts: Record<string, number> = {};

  allSnap.docs.forEach((d) => {
    const data = d.data();
    const mins = Math.round((data.totalDuration ?? 0) / 60);
    totalMinutes += mins;
    if (mins > longestSessionMinutes) longestSessionMinutes = mins;
    const cat = data.templateName as string;
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  });

  const mostUsedCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    totalSessions: allSnap.size,
    totalMinutes,
    thisWeekSessions: weekSnap.size,
    mostUsedCategory: mostUsedCategory as ExerciseCategory | null,
    longestSessionMinutes,
  };
}
