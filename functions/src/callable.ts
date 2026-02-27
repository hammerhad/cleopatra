import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { addDays, differenceInDays } from 'date-fns';

const db = admin.firestore();

export const predictNextCycle = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  }

  const userId = context.auth.uid;

  const settingsSnap = await db
    .collection('users').doc(userId).collection('cycleSettings').doc('default').get();

  if (!settingsSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Cycle settings not found');
  }

  const settings = settingsSnap.data()!;

  const logsSnap = await db
    .collection('users').doc(userId).collection('cycleLogs')
    .orderBy('startDate', 'desc')
    .limit(6)
    .get();

  const logs = logsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let avgCycleLength = settings.averageCycleLength ?? 28;
  let avgPeriodLength = settings.averagePeriodLength ?? 5;

  if (logs.length >= 2) {
    let totalCycle = 0, cycleCount = 0;
    let totalPeriod = 0, periodCount = 0;

    for (let i = 0; i < logs.length - 1; i++) {
      const curr = (logs[i] as any).startDate.toDate();
      const prev = (logs[i + 1] as any).startDate.toDate();
      const days = differenceInDays(curr, prev);
      if (days >= 20 && days <= 45) { totalCycle += days; cycleCount++; }
    }

    logs.forEach((log: any) => {
      if (log.endDate) {
        const len = differenceInDays(log.endDate.toDate(), log.startDate.toDate());
        if (len >= 2 && len <= 10) { totalPeriod += len; periodCount++; }
      }
    });

    if (cycleCount > 0) avgCycleLength = Math.round(totalCycle / cycleCount);
    if (periodCount > 0) avgPeriodLength = Math.round(totalPeriod / periodCount);
  }

  const lastPeriod = settings.lastPeriodStart?.toDate() ?? new Date();
  const nextPeriod = addDays(lastPeriod, avgCycleLength);
  const ovulationDay = addDays(lastPeriod, Math.round(avgCycleLength / 2) - 2);
  const fertileStart = addDays(ovulationDay, -5);
  const fertileEnd = addDays(ovulationDay, 1);

  // Current phase
  const today = new Date();
  const daysSincePeriod = differenceInDays(today, lastPeriod);
  const cycleDay = ((daysSincePeriod % avgCycleLength) + avgCycleLength) % avgCycleLength + 1;

  let currentPhase: string;
  if (cycleDay <= avgPeriodLength) currentPhase = 'menstrual';
  else if (cycleDay <= Math.round(avgCycleLength * 0.43)) currentPhase = 'follicular';
  else if (cycleDay <= Math.round(avgCycleLength * 0.57)) currentPhase = 'ovulation';
  else currentPhase = 'luteal';

  return {
    avgCycleLength,
    avgPeriodLength,
    nextPeriodDate: nextPeriod.toISOString(),
    ovulationDate: ovulationDay.toISOString(),
    fertileWindowStart: fertileStart.toISOString(),
    fertileWindowEnd: fertileEnd.toISOString(),
    currentPhase,
    cycleDay,
    daysUntilNextPeriod: differenceInDays(nextPeriod, today),
  };
});

export const getCourtLeaderboard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  }

  const { courtId } = data as { courtId: string };

  const courtSnap = await db.collection('courts').doc(courtId).get();
  if (!courtSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Court not found');
  }

  const memberIds: string[] = courtSnap.data()?.memberIds ?? [];
  if (!memberIds.includes(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Not a member');
  }

  const memberProfiles = await Promise.all(
    memberIds.map(async (uid) => {
      const snap = await db.collection('publicProfiles').doc(uid).get();
      return snap.exists ? { uid, ...snap.data() } : null;
    })
  );

  return memberProfiles
    .filter(Boolean)
    .sort((a: any, b: any) => (b.rankPoints ?? 0) - (a.rankPoints ?? 0));
});
