import { differenceInCalendarDays, startOfDay, isSameDay } from 'date-fns';
import type { HabitLog } from '../types/habits';

/**
 * Computes current streak from an array of HabitLogs.
 * A streak continues for consecutive days ending today or yesterday.
 */
export function computeCurrentStreak(logs: HabitLog[], referenceDate: Date = new Date()): number {
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => startOfDay(l.date))
    .sort((a, b) => b.getTime() - a.getTime()); // descending

  if (completedDates.length === 0) return 0;

  const today = startOfDay(referenceDate);
  const mostRecent = completedDates[0];

  // Streak must include today or yesterday (allow grace period)
  const daysSinceMostRecent = differenceInCalendarDays(today, mostRecent);
  if (daysSinceMostRecent > 1) return 0;

  let streak = 0;
  let expectedDate = mostRecent;

  for (const date of completedDates) {
    if (isSameDay(date, expectedDate)) {
      streak++;
      expectedDate = new Date(expectedDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Computes longest-ever streak from habit logs.
 */
export function computeLongestStreak(logs: HabitLog[]): number {
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => startOfDay(l.date))
    .sort((a, b) => a.getTime() - b.getTime()); // ascending

  if (completedDates.length === 0) return 0;

  // Deduplicate (same day logged multiple times)
  const uniqueDates: Date[] = [];
  for (const date of completedDates) {
    if (uniqueDates.length === 0 || !isSameDay(uniqueDates[uniqueDates.length - 1], date)) {
      uniqueDates.push(date);
    }
  }

  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = differenceInCalendarDays(uniqueDates[i], uniqueDates[i - 1]);
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

/**
 * Returns whether the habit was completed on a given date.
 */
export function wasCompletedOn(logs: HabitLog[], date: Date): boolean {
  const target = startOfDay(date);
  return logs.some((l) => l.completed && isSameDay(startOfDay(l.date), target));
}

/**
 * Returns completion rate as 0-1 fraction for the past N days.
 */
export function completionRateForPeriod(
  logs: HabitLog[],
  days: number,
  referenceDate: Date = new Date()
): number {
  const today = startOfDay(referenceDate);
  let completed = 0;

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    if (wasCompletedOn(logs, targetDate)) completed++;
  }

  return completed / days;
}

/**
 * Groups logs by week for chart display.
 * Returns array of 7 boolean values (Sun–Sat) for given week offset.
 */
export function getWeekCompletionMap(
  logs: HabitLog[],
  weekOffset: number = 0,
  referenceDate: Date = new Date()
): boolean[] {
  const today = startOfDay(referenceDate);
  const result: boolean[] = new Array(7).fill(false);

  // Sunday of target week
  const dayOfWeek = today.getDay();
  const startOfTargetWeek = new Date(today);
  startOfTargetWeek.setDate(today.getDate() - dayOfWeek - weekOffset * 7);

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfTargetWeek);
    day.setDate(startOfTargetWeek.getDate() + i);
    result[i] = wasCompletedOn(logs, day);
  }

  return result;
}
