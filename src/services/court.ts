import firestore from '@react-native-firebase/firestore';
import {
  courtsCol, invitationsCol, ServerTimestamp, ArrayUnion, ArrayRemove, toDate
} from './firebase';
import { callFunction } from './firebase';
import type { Court, CourtChallenge, CourtMessage, CourtInvitation, CreateCourtInput } from '../types/court';

function docToCourt(id: string, data: firestore.DocumentData): Court {
  return {
    id,
    name: data.name,
    description: data.description,
    avatarURL: data.avatarURL,
    creatorId: data.creatorId,
    memberIds: data.memberIds ?? [],
    maxMembers: data.maxMembers ?? 12,
    isPrivate: data.isPrivate ?? false,
    totalPoints: data.totalPoints ?? 0,
    activeChallengeId: data.activeChallengeId ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function createCourt(uid: string, input: CreateCourtInput): Promise<string> {
  const ref = courtsCol().doc();
  await ref.set({
    ...input,
    id: ref.id,
    creatorId: uid,
    memberIds: [uid],
    maxMembers: input.maxMembers ?? 12,
    totalPoints: 0,
    activeChallengeId: null,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp(),
  });
  return ref.id;
}

export async function joinCourt(uid: string, courtId: string): Promise<void> {
  await courtsCol().doc(courtId).update({
    memberIds: ArrayUnion(uid),
    updatedAt: ServerTimestamp(),
  });
}

export async function leaveCourt(uid: string, courtId: string): Promise<void> {
  await courtsCol().doc(courtId).update({
    memberIds: ArrayRemove(uid),
    updatedAt: ServerTimestamp(),
  });
}

export function onUserCourtsChange(
  uid: string,
  callback: (courts: Court[]) => void
): () => void {
  return courtsCol()
    .where('memberIds', 'array-contains', uid)
    .onSnapshot((snap) => {
      callback(snap.docs.map((d) => docToCourt(d.id, d.data())));
    });
}

export async function sendCourtMessage(
  uid: string,
  courtId: string,
  text: string,
  senderName: string,
  senderPhotoURL: string | null
): Promise<void> {
  const ref = courtsCol().doc(courtId).collection('messages').doc();
  await ref.set({
    id: ref.id,
    courtId,
    senderId: uid,
    senderName,
    senderPhotoURL,
    text,
    type: 'text',
    createdAt: ServerTimestamp(),
  });
}

export function onCourtMessagesChange(
  courtId: string,
  callback: (messages: CourtMessage[]) => void,
  limit = 50
): () => void {
  return courtsCol()
    .doc(courtId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .onSnapshot((snap) => {
      const messages: CourtMessage[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          courtId: data.courtId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhotoURL: data.senderPhotoURL ?? null,
          text: data.text,
          type: data.type ?? 'text',
          metadata: data.metadata,
          createdAt: toDate(data.createdAt),
        };
      });
      callback(messages.reverse());
    });
}

export async function inviteToCourt(
  inviterId: string,
  inviterName: string,
  courtId: string,
  courtName: string,
  inviteeEmail: string
): Promise<string> {
  const ref = invitationsCol().doc();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await ref.set({
    id: ref.id,
    courtId,
    courtName,
    inviterId,
    inviterName,
    inviteeEmail,
    status: 'pending',
    expiresAt: firestore.Timestamp.fromDate(expiresAt),
    createdAt: ServerTimestamp(),
  });

  return ref.id;
}

export async function respondToInvitation(
  inviteId: string,
  uid: string,
  accept: boolean
): Promise<void> {
  const inviteSnap = await invitationsCol().doc(inviteId).get();
  if (!inviteSnap.exists) throw new Error('Invitation not found');

  const invite = inviteSnap.data()!;
  await invitationsCol().doc(inviteId).update({
    status: accept ? 'accepted' : 'declined',
    inviteeId: uid,
  });

  if (accept) {
    await joinCourt(uid, invite.courtId);
  }
}

export async function getCourtLeaderboard(courtId: string): Promise<unknown[]> {
  const result = await callFunction<unknown[]>('getCourtLeaderboard', { courtId });
  return (result as { data: unknown[] }).data;
}
