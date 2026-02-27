export type HabitCategory =
  | 'mindfulness'
  | 'fitness'
  | 'nutrition'
  | 'learning'
  | 'creativity'
  | 'social'
  | 'self-care'
  | 'finance'
  | 'work'
  | 'custom';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface HabitFrequencyConfig {
  type: HabitFrequency;
  daysOfWeek?: number[]; // 0-6, Sun-Sat
  timesPerWeek?: number;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: HabitCategory;
  icon: string;         // emoji or icon name
  color: string;        // hex color
  frequency: HabitFrequencyConfig;
  reminderTime: string | null; // HH:MM format
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  isActive: boolean;
  order: number;        // for sorting
  lastCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: Date;
  completed: boolean;
  note?: string;
  completedAt?: Date;
}

export interface HabitWithLog extends Habit {
  todayLog?: HabitLog;
  completedToday: boolean;
}

export interface CreateHabitInput {
  title: string;
  description?: string;
  category: HabitCategory;
  icon: string;
  color: string;
  frequency: HabitFrequencyConfig;
  reminderTime: string | null;
}
