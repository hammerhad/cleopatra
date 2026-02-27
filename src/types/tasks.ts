export type TaskBucket = 'now' | 'next' | 'later' | 'done';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  bucket: TaskBucket;
  priority: TaskPriority;
  dueDate: Date | null;
  dueTime: string | null; // HH:MM
  tags: string[];
  reminderEnabled: boolean;
  reminderTime: Date | null;
  completedAt: Date | null;
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  cyclePhaseRelevance?: CyclePhase | null; // recommended phase for this task
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endsAt?: Date;
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CreateTaskInput {
  title: string;
  description?: string;
  bucket: TaskBucket;
  priority: TaskPriority;
  dueDate?: Date | null;
  dueTime?: string | null;
  tags?: string[];
  reminderEnabled?: boolean;
  reminderTime?: Date | null;
  cyclePhaseRelevance?: CyclePhase | null;
}

export interface TaskFilter {
  bucket?: TaskBucket;
  priority?: TaskPriority;
  tag?: string;
  dueBefore?: Date;
  search?: string;
}
