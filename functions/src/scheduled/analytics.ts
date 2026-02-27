import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const RANK_THRESHOLDS = [
  { rank: 'Pharaoh', min: 5000 },
  { rank: 'High Priestess', min: 2000 },
  { rank: 'Commander', min: 1000 },
  { rank: 'Strategist', min: 500 },
  { rank: 'Warrior', min: 200 },
  { rank: 'Scholar', min: 50 },
  { rank: 'Initiate', min: 0 },
];

function computeRank(points: number): string {
  for (const { rank, min } of RANK_THRESHOLDS) {
    if (points >= min) return rank;
  }
  return 'Initiate';
}

// Runs weekly — recomputes global leaderboard
export const computeLeaderboard = functions.pubsub
  .schedule('0 3 * * 1')
  .timeZone('UTC')
  .onRun(async () => {
    functions.logger.info('Computing weekly leaderboard...');

    const profilesSnap = await db
      .collection('publicProfiles')
      .orderBy('rankPoints', 'desc')
      .limit(100)
      .get();

    const batch = db.batch();

    // Clear old leaderboard
    const oldSnap = await db.collection('leaderboard').get();
    oldSnap.docs.forEach((doc) => batch.delete(doc.ref));

    // Write new leaderboard
    profilesSnap.docs.forEach((doc, idx) => {
      const profile = doc.data();
      const rank = computeRank(profile.rankPoints ?? 0);
      const leaderRef = db.collection('leaderboard').doc(`rank_${String(idx + 1).padStart(3, '0')}`);
      batch.set(leaderRef, {
        position: idx + 1,
        uid: doc.id,
        displayName: profile.displayName,
        photoURL: profile.photoURL ?? null,
        rankPoints: profile.rankPoints ?? 0,
        rank,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update user rank title
      const userRef = db.collection('users').doc(doc.id);
      batch.update(userRef, { rank });
      const publicRef = db.collection('publicProfiles').doc(doc.id);
      batch.update(publicRef, { rank });
    });

    await batch.commit();
    functions.logger.info(`Leaderboard computed with ${profilesSnap.size} entries`);
    return null;
  });
