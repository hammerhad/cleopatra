import { create } from 'zustand';
import type { Task, TaskBucket } from '../types/tasks';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  activeFilter: TaskBucket | 'all';
  setTasks: (tasks: Task[]) => void;
  updateTaskLocally: (id: string, updates: Partial<Task>) => void;
  removeTaskLocally: (id: string) => void;
  setFilter: (filter: TaskBucket | 'all') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getByBucket: (bucket: TaskBucket) => Task[];
  getNowTasks: () => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: true,
  error: null,
  activeFilter: 'all',

  setTasks: (tasks) => set({ tasks, isLoading: false }),

  updateTaskLocally: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTaskLocally: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  setFilter: (activeFilter) => set({ activeFilter }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getByBucket: (bucket) => get().tasks.filter((t) => t.bucket === bucket),

  getNowTasks: () =>
    get()
      .tasks.filter((t) => t.bucket === 'now')
      .sort((a, b) => {
        const p = { critical: 4, high: 3, medium: 2, low: 1 };
        return (p[b.priority] ?? 0) - (p[a.priority] ?? 0);
      }),
}));
