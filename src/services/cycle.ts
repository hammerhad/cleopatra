import firestore from '@react-native-firebase/firestore';
import { cycleLogsCol, cycleSettingsDoc, ServerTimestamp, toDate } from './firebase';
import type { CycleLog, DailyCycleLog, CycleSettings } from '../types/cycle';
import { analyzeCycles, predictNextCycle } from '../utils/cyclePrediction';

function docToCycleLog(id: string, data: firestore.DocumentData): CycleLog {
  return {
    id,
    userId: data.userId,
    startDate: toDate(data.startDate),
    endDate: data.endDate ? toDate(data.endDate) : null,
    cycleLength: data.cycleLength,
    periodLength: data.periodLength,
    notes: data.notes,
    createdAt: toDate(data.createdAt),
  };
}

export async function getCycleSettings(uid: string): Promise<CycleSettings | null> {
  const snap = await cycleSettingsDoc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    averageCycleLength: d.averageCycleLength ?? 28,
    averagePeriodLength: d.averagePeriodLength ?? 5,
    lastPeriodStart: d.lastPeriodStart ? toDate(d.lastPeriodStart) : null,
    predictedNextPeriod: d.predictedNextPeriod ? toDate(d.predictedNextPeriod) : null,
    trackingEnabled: d.trackingEnabled ?? false,
    privacyMode: d.privacyMode ?? false,
    remindersEnabled: d.remindersEnabled ?? true,
    reminderDaysBefore: d.reminderDaysBefore ?? 2,
    createdAt: toDate(d.createdAt),
  };
}

export async function updateCycleSettings(
  uid: string,
  updates: Partial<CycleSettings>
): Promise<void> {
  const patch: Record<string, unknown> = { ...updates };
  if (updates.lastPeriodStart) {
    patch.lastPeriodStart = firestore.Timestamp.fromDate(updates.lastPeriodStart);
  }
  await cycleSettingsDoc(uid).update({ ...patch, updatedAt: ServerTimestamp() });
}

export async function logPeriodStart(uid: string, startDate: Date): Promise<string> {
  const ref = cycleLogsCol(uid).doc();
  await ref.set({
    id: ref.id,
    userId: uid,
    startDate: firestore.Timestamp.fromDate(startDate),
    endDate: null,
    createdAt: ServerTimestamp(),
  });

  await cycleSettingsDoc(uid).update({
    lastPeriodStart: firestore.Timestamp.fromDate(startDate),
    updatedAt: ServerTimestamp(),
  });

  return ref.id;
}

export async function logPeriodEnd(
  uid: string,
  cycleLogId: string,
  endDate: Date
): Promise<void> {
  const ref = cycleLogsCol(uid).doc(cycleLogId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const startDate = toDate(snap.data()!.startDate);
  const periodLength = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  await ref.update({
    endDate: firestore.Timestamp.fromDate(endDate),
    periodLength,
  });
}

export async function getCycleLogs(uid: string, limit: number = 12): Promise<CycleLog[]> {
  const snap = await cycleLogsCol(uid)
    .orderBy('startDate', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => docToCycleLog(d.id, d.data()));
}

export function onCycleSettingsChange(
  uid: string,
  callback: (settings: CycleSettings | null) => void
): () => void {
  return cycleSettingsDoc(uid).onSnapshot((snap) => {
    if (!snap.exists) { callback(null); return; }
    const d = snap.data()!;
    callback({
      averageCycleLength: d.averageCycleLength ?? 28,
      averagePeriodLength: d.averagePeriodLength ?? 5,
      lastPeriodStart: d.lastPeriodStart ? toDate(d.lastPeriodStart) : null,
      predictedNextPeriod: d.predictedNextPeriod ? toDate(d.predictedNextPeriod) : null,
      trackingEnabled: d.trackingEnabled ?? false,
      privacyMode: d.privacyMode ?? false,
      remindersEnabled: d.remindersEnabled ?? true,
      reminderDaysBefore: d.reminderDaysBefore ?? 2,
      createdAt: toDate(d.createdAt),
    });
  });
}

export async function computeLocalPrediction(uid: string) {
  const [logs, settings] = await Promise.all([
    getCycleLogs(uid),
    getCycleSettings(uid),
  ]);

  if (!settings?.lastPeriodStart || logs.length === 0) return null;

  const analysis = analyzeCycles(logs);
  return predictNextCycle(settings.lastPeriodStart, analysis);
}
