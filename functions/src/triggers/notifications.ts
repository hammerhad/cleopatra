import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

async function getUserTokens(userId: string): Promise<string[]> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return [];
  return userDoc.data()?.fcmTokens ?? [];
}

async function sendToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const tokens = await getUserTokens(userId);
  if (tokens.length === 0) return;

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data: data ?? {},
    android: {
      notification: {
        channelId: 'cleopatra_reminders',
        priority: 'high',
        color: '#C9A84C',
      },
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);

  // Clean up invalid tokens
  const invalidTokens: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const errorCode = resp.error?.code;
      if (
        errorCode === 'messaging/registration-token-not-registered' ||
        errorCode === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[idx]);
      }
    }
  });

  if (invalidTokens.length > 0) {
    await db.collection('users').doc(userId).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
    });
  }
}

// Triggered by a scheduled habit reminder document
export const sendHabitReminder = functions.firestore
  .document('users/{userId}/habits/{habitId}')
  .onUpdate(async (change, context) => {
    const { userId, habitId } = context.params;
    const after = change.after.data();
    const before = change.before.data();

    if (after.reminderTime === before.reminderTime) return null;
    if (!after.reminderTime || !after.isActive) return null;

    functions.logger.info(`Habit reminder updated: user=${userId}, habit=${habitId}`);
    return null;
  });

// Task reminder — called by scheduler
export const sendTaskReminder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { taskId, userId } = data as { taskId: string; userId: string };
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Forbidden');
  }

  const taskSnap = await db.collection('users').doc(userId).collection('tasks').doc(taskId).get();
  if (!taskSnap.exists) return { success: false };

  const task = taskSnap.data()!;
  await sendToUser(
    userId,
    '⚔️ Royal Decree',
    `Time to conquer: ${task.title}`,
    { type: 'task', taskId }
  );

  return { success: true };
});

// Cycle phase insight notification
export const sendCycleInsight = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { userId, phase, insight } = data as {
    userId: string;
    phase: string;
    insight: string;
  };

  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Forbidden');
  }

  const titles: Record<string, string> = {
    menstrual: '🌑 New Moon Energy',
    follicular: '🌱 Rising Power',
    ovulation: '🌕 Peak Radiance',
    luteal: '🌙 Inner Wisdom',
  };

  await sendToUser(
    userId,
    titles[phase] ?? '✨ Moon Cycle Insight',
    insight,
    { type: 'cycle', phase }
  );

  return { success: true };
});
