import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const onCourtInviteCreated = functions.firestore
  .document('invitations/{inviteId}')
  .onCreate(async (snap, context) => {
    const invite = snap.data();

    // Notify invitee if they have an account
    if (!invite.inviteeEmail) return null;

    const usersSnap = await db
      .collection('users')
      .where('email', '==', invite.inviteeEmail)
      .limit(1)
      .get();

    if (usersSnap.empty) return null;

    const inviteeUid = usersSnap.docs[0].id;
    const inviteeDoc = usersSnap.docs[0].data();
    const tokens: string[] = inviteeDoc.fcmTokens ?? [];

    if (tokens.length === 0) return null;

    const courtSnap = await db.collection('courts').doc(invite.courtId).get();
    const courtName = courtSnap.data()?.name ?? 'a Royal Court';

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: '👑 You\'ve Been Summoned',
        body: `You\'ve been invited to join ${courtName}`,
      },
      data: {
        type: 'court_invite',
        inviteId: context.params.inviteId,
        courtId: invite.courtId,
      },
    });

    // Update invite with inviteeId
    await snap.ref.update({ inviteeId: inviteeUid });

    functions.logger.info(`Court invite sent to ${invite.inviteeEmail}`);
    return null;
  });

export const onChallengeCompleted = functions.firestore
  .document('courts/{courtId}/challenges/{challengeId}')
  .onUpdate(async (change, context) => {
    const { courtId } = context.params;
    const after = change.after.data();
    const before = change.before.data();

    if (before.status === after.status) return null;
    if (after.status !== 'completed') return null;

    // Award points to all participants who completed
    const completedBy: string[] = after.completedBy ?? [];
    const batch = db.batch();

    for (const uid of completedBy) {
      const userRef = db.collection('users').doc(uid);
      batch.update(userRef, {
        rankPoints: admin.firestore.FieldValue.increment(after.pointReward ?? 50),
      });

      const publicRef = db.collection('publicProfiles').doc(uid);
      batch.update(publicRef, {
        rankPoints: admin.firestore.FieldValue.increment(after.pointReward ?? 50),
      });
    }

    await batch.commit();

    // Notify court members
    const courtSnap = await db.collection('courts').doc(courtId).get();
    const memberIds: string[] = courtSnap.data()?.memberIds ?? [];

    const tokenPromises = memberIds.map(async (uid) => {
      const userDoc = await db.collection('users').doc(uid).get();
      return userDoc.data()?.fcmTokens ?? [];
    });

    const allTokenArrays = await Promise.all(tokenPromises);
    const allTokens = allTokenArrays.flat();

    if (allTokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: allTokens,
        notification: {
          title: '🏆 Challenge Conquered!',
          body: `Your court completed: ${after.title}`,
        },
        data: { type: 'challenge_complete', courtId, challengeId: context.params.challengeId },
      });
    }

    functions.logger.info(`Challenge ${context.params.challengeId} completed in court ${courtId}`);
    return null;
  });
