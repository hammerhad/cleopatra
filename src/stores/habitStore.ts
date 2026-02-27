import { create } from 'zustand';
import type { Habit, HabitWithLog } from '../types/habits';

interface HabitState {
  habits: HabitWithLog[];
  isLoading: boolean;
  error: string | null;
  setHabits: (habits: HabitWithLog[]) => void;
  updateHabitLocally: (id: string, updates: Partial<HabitWithLog>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  completedCount: () => number;
  totalCount: () => number;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: true,
  error: null,

  setHabits: (habits) => set({ habits, isLoading: false }),

  updateHabitLocally: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  completedCount: () => get().habits.filter((h) => h.completedToday).length,
  totalCount: () => get().habits.length,
}));
