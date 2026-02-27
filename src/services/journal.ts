import { journalCol, ServerTimestamp, toDate } from './firebase';
import type { JournalEntry, CreateJournalEntryInput } from '../types/journal';
import type firestore from '@react-native-firebase/firestore';

function docToEntry(id: string, data: ReturnType<firestore.DocumentSnapshot['data']>): JournalEntry {
  const d = data!;
  return {
    id,
    userId: d.userId,
    title: d.title,
    content: d.content,
    mood: d.mood,
    moodLabel: d.moodLabel,
    tags: d.tags ?? [],
    attachments: d.attachments ?? [],
    prompt: d.prompt,
    promptCategory: d.promptCategory,
    isPrivate: d.isPrivate ?? true,
    wordCount: d.wordCount ?? 0,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

const MOOD_LABELS = ['shattered', 'low', 'neutral', 'good', 'radiant'] as const;

export async function createJournalEntry(
  uid: string,
  input: CreateJournalEntryInput
): Promise<string> {
  const ref = journalCol(uid).doc();
  const wordCount = input.content.trim().split(/\s+/).filter(Boolean).length;
  const moodLabel = MOOD_LABELS[(input.mood - 1) as 0 | 1 | 2 | 3 | 4];

  await ref.set({
    ...input,
    id: ref.id,
    userId: uid,
    moodLabel,
    attachments: [],
    isPrivate: input.isPrivate ?? true,
    wordCount,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp(),
  });

  return ref.id;
}

export async function updateJournalEntry(
  uid: string,
  entryId: string,
  updates: Partial<CreateJournalEntryInput>
): Promise<void> {
  const patch: Record<string, unknown> = { ...updates, updatedAt: ServerTimestamp() };

  if (updates.content) {
    patch.wordCount = updates.content.trim().split(/\s+/).filter(Boolean).length;
  }
  if (updates.mood !== undefined) {
    patch.moodLabel = MOOD_LABELS[(updates.mood - 1) as 0 | 1 | 2 | 3 | 4];
  }

  await journalCol(uid).doc(entryId).update(patch);
}

export async function deleteJournalEntry(uid: string, entryId: string): Promise<void> {
  await journalCol(uid).doc(entryId).delete();
}

export function onJournalEntriesChange(
  uid: string,
  callback: (entries: JournalEntry[]) => void,
  limit: number = 20
): () => void {
  return journalCol(uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .onSnapshot((snap) => {
      callback(snap.docs.map((d) => docToEntry(d.id, d.data())));
    });
}

export async function getJournalEntries(uid: string, limit = 20): Promise<JournalEntry[]> {
  const snap = await journalCol(uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => docToEntry(d.id, d.data()));
}

export async function getJournalEntry(uid: string, entryId: string): Promise<JournalEntry | null> {
  const snap = await journalCol(uid).doc(entryId).get();
  if (!snap.exists) return null;
  return docToEntry(snap.id, snap.data());
}
