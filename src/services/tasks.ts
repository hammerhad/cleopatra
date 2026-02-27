import firestore from '@react-native-firebase/firestore';
import { tasksCol, ServerTimestamp, toDate } from './firebase';
import type { Task, CreateTaskInput, TaskBucket, TaskFilter } from '../types/tasks';

function docToTask(id: string, data: firestore.DocumentData): Task {
  return {
    id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    bucket: data.bucket,
    priority: data.priority,
    dueDate: data.dueDate ? toDate(data.dueDate) : null,
    dueTime: data.dueTime ?? null,
    tags: data.tags ?? [],
    reminderEnabled: data.reminderEnabled ?? false,
    reminderTime: data.reminderTime ? toDate(data.reminderTime) : null,
    completedAt: data.completedAt ? toDate(data.completedAt) : null,
    isRecurring: data.isRecurring ?? false,
    recurringConfig: data.recurringConfig,
    cyclePhaseRelevance: data.cyclePhaseRelevance ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function createTask(uid: string, input: CreateTaskInput): Promise<string> {
  const ref = tasksCol(uid).doc();
  await ref.set({
    ...input,
    id: ref.id,
    userId: uid,
    dueDate: input.dueDate ? firestore.Timestamp.fromDate(input.dueDate) : null,
    reminderTime: input.reminderTime ? firestore.Timestamp.fromDate(input.reminderTime) : null,
    tags: input.tags ?? [],
    completedAt: null,
    isRecurring: false,
    createdAt: ServerTimestamp(),
    updatedAt: ServerTimestamp(),
  });
  return ref.id;
}

export async function updateTask(
  uid: string,
  taskId: string,
  updates: Partial<CreateTaskInput>
): Promise<void> {
  const patch: Record<string, unknown> = { ...updates, updatedAt: ServerTimestamp() };
  if (updates.dueDate !== undefined) {
    patch.dueDate = updates.dueDate ? firestore.Timestamp.fromDate(updates.dueDate) : null;
  }
  if (updates.reminderTime !== undefined) {
    patch.reminderTime = updates.reminderTime
      ? firestore.Timestamp.fromDate(updates.reminderTime)
      : null;
  }
  await tasksCol(uid).doc(taskId).update(patch);
}

export async function moveToBucket(
  uid: string,
  taskId: string,
  bucket: TaskBucket
): Promise<void> {
  const updates: Record<string, unknown> = {
    bucket,
    updatedAt: ServerTimestamp(),
  };
  if (bucket === 'done') {
    updates.completedAt = ServerTimestamp();
  } else {
    updates.completedAt = null;
  }
  await tasksCol(uid).doc(taskId).update(updates);
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  await tasksCol(uid).doc(taskId).delete();
}

export function onTasksChange(
  uid: string,
  callback: (tasks: Task[]) => void
): () => void {
  return tasksCol(uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot((snap) => {
      const tasks = snap.docs.map((d) => docToTask(d.id, d.data()));
      callback(tasks);
    });
}

export async function getTasksByBucket(uid: string, bucket: TaskBucket): Promise<Task[]> {
  const snap = await tasksCol(uid)
    .where('bucket', '==', bucket)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => docToTask(d.id, d.data()));
}

export async function searchTasks(uid: string, filter: TaskFilter): Promise<Task[]> {
  let query: firestore.Query = tasksCol(uid);

  if (filter.bucket) query = query.where('bucket', '==', filter.bucket);
  if (filter.priority) query = query.where('priority', '==', filter.priority);

  const snap = await query.orderBy('createdAt', 'desc').get();
  let tasks = snap.docs.map((d) => docToTask(d.id, d.data()));

  // Client-side filtering
  if (filter.tag) tasks = tasks.filter((t) => t.tags.includes(filter.tag!));
  if (filter.search) {
    const q = filter.search.toLowerCase();
    tasks = tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
    );
  }

  return tasks;
}
