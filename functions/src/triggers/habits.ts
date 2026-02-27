import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const onHabitLogCreated = functions.firestore
  .document('users/{userId}/habitLogs/{logId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const log = snap.data();

    if (!log.completed) return null;

    const habitRef = db.collection('users').doc(userId).collection('habits').doc(log.habitId);
    const habitSnap = await habitRef.get();
    if (!habitSnap.exists) return null;

    const habit = habitSnap.data()!;

    // Fetch last 30 days of logs for this habit
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logsSnap = await db
      .collection('users').doc(userId).collection('habitLogs')
      .where('habitId', '==', log.habitId)
      .where('completed', '==', true)
      .orderBy('date', 'desc')
      .limit(60)
      .get();

    const completedDates = logsSnap.docs
      .map((d) => d.data().date.toDate())
      .sort((a: Date, b: Date) => b.getTime() - a.getTime());

    // Calculate current streak
    let streak = 0;
    const today = new Date(log.date.toDate());
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < completedDates.length; i++) {
      const d = new Date(completedDates[i]);
      d.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);

      if (d.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    const longestStreak = Math.max(streak, habit.longestStreak ?? 0);

    await habitRef.update({
      currentStreak: streak,
      longestStreak,
      totalCompletions: admin.firestore.FieldValue.increment(1),
      lastCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user rank points
    const pointsToAdd = streak >= 7 ? 15 : streak >= 3 ? 10 : 5;
    await db.collection('users').doc(userId).update({
      rankPoints: admin.firestore.FieldValue.increment(pointsToAdd),
      streakCount: streak,
      longestStreak,
    });

    // Update public profile
    await db.collection('publicProfiles').doc(userId).update({
      rankPoints: admin.firestore.FieldValue.increment(pointsToAdd),
    });

    functions.logger.info(`Streak updated: user=${userId}, habit=${log.habitId}, streak=${streak}`);
    return null;
  });
