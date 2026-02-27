import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { addDays, differenceInDays, startOfDay } from 'date-fns';

const db = admin.firestore();

// Runs every day at midnight UTC — resets streaks for missed habits
export const dailyStreakReset = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const yesterday = startOfDay(addDays(new Date(), -1));

    // Find all active habits
    const habitsSnap = await db
      .collectionGroup('habits')
      .where('isActive', '==', true)
      .where('currentStreak', '>', 0)
      .get();

    const batch = db.batch();
    let resetCount = 0;

    for (const habitDoc of habitsSnap.docs) {
      const habit = habitDoc.data();
      const userId = habitDoc.ref.parent.parent!.id;

      // Check if completed yesterday
      const logSnap = await db
        .collection('users').doc(userId).collection('habitLogs')
        .where('habitId', '==', habitDoc.id)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('completed', '==', true)
        .limit(1)
        .get();

      if (logSnap.empty) {
        batch.update(habitDoc.ref, { currentStreak: 0 });
        resetCount++;
      }
    }

    if (resetCount > 0) await batch.commit();
    functions.logger.info(`Daily streak reset: ${resetCount} habits reset`);
    return null;
  });

// Runs every Sunday — predicts next cycle for users who track
export const weeklyCyclePrediction = functions.pubsub
  .schedule('0 8 * * 0')
  .timeZone('UTC')
  .onRun(async () => {
    const usersSnap = await db
      .collectionGroup('cycleSettings')
      .where('trackingEnabled', '==', true)
      .get();

    functions.logger.info(`Computing cycle predictions for ${usersSnap.size} users`);

    for (const settingsDoc of usersSnap.docs) {
      const userId = settingsDoc.ref.parent.parent!.id;
      const settings = settingsDoc.data();

      if (!settings.lastPeriodStart) continue;

      const logsSnap = await db
        .collection('users').doc(userId).collection('cycleLogs')
        .orderBy('startDate', 'desc')
        .limit(6)
        .get();

      if (logsSnap.size < 2) continue;

      // Calculate average cycle length from logs
      const logs = logsSnap.docs.map((d) => d.data());
      let totalDays = 0;
      let count = 0;

      for (let i = 0; i < logs.length - 1; i++) {
        const current = logs[i].startDate.toDate();
        const previous = logs[i + 1].startDate.toDate();
        const days = differenceInDays(current, previous);
        if (days >= 20 && days <= 45) {
          totalDays += days;
          count++;
        }
      }

      if (count === 0) continue;

      const avgCycleLength = Math.round(totalDays / count);
      const lastPeriod = settings.lastPeriodStart.toDate();
      const nextPeriod = addDays(lastPeriod, avgCycleLength);

      await settingsDoc.ref.update({
        averageCycleLength: avgCycleLength,
        predictedNextPeriod: admin.firestore.Timestamp.fromDate(nextPeriod),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return null;
  });

// Daily motivation push at 7am per user timezone
export const dailyMotivation = functions.pubsub
  .schedule('0 7 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const motivations = [
      'A queen never rushes — she executes with precision.',
      'Your discipline today writes your legend tomorrow.',
      'Every great empire was built one day at a time.',
      'You are not waiting for permission. You are the permission.',
      'Cleopatra didn\'t ask if she deserved power. Neither should you.',
      'Small consistent actions carve rivers through stone.',
      'Your morning ritual is your war paint. Put it on.',
    ];

    const message = motivations[new Date().getDay() % motivations.length];

    // Get all premium users or all users (for free tier, limit)
    const usersSnap = await db
      .collection('users')
      .where('notificationsEnabled', '==', true)
      .limit(1000)
      .get();

    const allTokens: string[] = [];
    usersSnap.docs.forEach((doc) => {
      const tokens: string[] = doc.data().fcmTokens ?? [];
      allTokens.push(...tokens);
    });

    if (allTokens.length === 0) return null;

    // Send in batches of 500
    const chunks = [];
    for (let i = 0; i < allTokens.length; i += 500) {
      chunks.push(allTokens.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: '👑 Royal Decree',
          body: message,
        },
        data: { type: 'motivation' },
      });
    }

    functions.logger.info(`Daily motivation sent to ${allTokens.length} tokens`);
    return null;
  });
