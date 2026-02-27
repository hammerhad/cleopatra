import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  const batch = db.batch();

  // Create user document
  const userRef = db.collection('users').doc(uid);
  batch.set(userRef, {
    uid,
    email: email ?? '',
    displayName: displayName ?? email?.split('@')[0] ?? 'Queen',
    photoURL: photoURL ?? null,
    tier: 'free',
    rank: 'Initiate',
    rankPoints: 0,
    onboardingComplete: false,
    privacyMode: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    streakCount: 0,
    longestStreak: 0,
    timezone: 'UTC',
    notificationsEnabled: true,
    fcmTokens: [],
    subscription: {
      status: 'free',
      expiresAt: null,
    },
  });

  // Create public profile
  const publicRef = db.collection('publicProfiles').doc(uid);
  batch.set(publicRef, {
    uid,
    displayName: displayName ?? email?.split('@')[0] ?? 'Queen',
    photoURL: photoURL ?? null,
    rank: 'Initiate',
    rankPoints: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Default cycle settings
  const cycleRef = db.collection('users').doc(uid).collection('cycleSettings').doc('default');
  batch.set(cycleRef, {
    averageCycleLength: 28,
    averagePeriodLength: 5,
    lastPeriodStart: null,
    trackingEnabled: false,
    privacyMode: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  functions.logger.info(`New queen registered: ${uid} (${email})`);
  return null;
});

export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  functions.logger.info(`Deleting data for user: ${uid}`);

  // Delete all user subcollections via batched deletes
  const collections = [
    'habits', 'habitLogs', 'tasks',
    'workoutTemplates', 'workoutSessions',
    'journalEntries', 'cycleLogs', 'cycleSettings',
    'notificationTokens',
  ];

  for (const col of collections) {
    const snap = await db.collection('users').doc(uid).collection(col).limit(500).get();
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    if (snap.size > 0) await batch.commit();
  }

  // Delete user doc and public profile
  await db.collection('users').doc(uid).delete();
  await db.collection('publicProfiles').doc(uid).delete();

  functions.logger.info(`All data deleted for user: ${uid}`);
  return null;
});
