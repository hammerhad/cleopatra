export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'hiit'
  | 'yoga'
  | 'pilates'
  | 'dance'
  | 'sports'
  | 'recovery'
  | 'custom';

export type MuscleGroup =
  | 'full_body'
  | 'upper_body'
  | 'lower_body'
  | 'core'
  | 'back'
  | 'chest'
  | 'arms'
  | 'shoulders'
  | 'glutes'
  | 'legs';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  sets?: number;
  reps?: number;
  duration?: number;  // seconds
  weight?: number;    // kg
  restTime: number;   // seconds
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: ExerciseCategory;
  estimatedDuration: number;  // minutes
  exercises: Exercise[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  templateId?: string;
  templateName: string;
  exercises: CompletedExercise[];
  totalDuration: number;  // seconds
  caloriesBurned?: number;
  notes?: string;
  mood: SessionMood;
  startedAt: Date;
  completedAt: Date | null;
  isCompleted: boolean;
}

export interface CompletedExercise extends Exercise {
  completedSets: CompletedSet[];
  skipped: boolean;
}

export interface CompletedSet {
  setNumber: number;
  reps: number;
  weight?: number;
  duration?: number;
  completed: boolean;
}

export type SessionMood = 'warrior' | 'strong' | 'average' | 'tired' | 'injured';

export interface WorkoutStats {
  totalSessions: number;
  totalDuration: number;  // minutes
  currentWeekSessions: number;
  mostFrequentCategory: ExerciseCategory;
  longestSession: number;  // minutes
  streakDays: number;
}
