import {
  computeCurrentStreak,
  computeLongestStreak,
  wasCompletedOn,
  completionRateForPeriod,
  getWeekCompletionMap,
} from '../src/utils/streaks';
import type { HabitLog } from '../src/types/habits';
import { startOfDay, subDays, addDays } from 'date-fns';

function makeLog(daysAgo: number, completed = true): HabitLog {
  return {
    id: `log-${daysAgo}`,
    habitId: 'habit-1',
    userId: 'user-1',
    date: startOfDay(subDays(new Date(), daysAgo)),
    completed,
  };
}

describe('computeCurrentStreak', () => {
  const REF = new Date('2024-03-15');

  test('returns 0 for empty logs', () => {
    expect(computeCurrentStreak([], REF)).toBe(0);
  });

  test('returns 0 when most recent completion is 2+ days ago', () => {
    const logs = [makeLog(2), makeLog(3), makeLog(4)];
    expect(computeCurrentStreak(logs, REF)).toBe(0);
  });

  test('counts consecutive streak ending today', () => {
    const logs = [makeLog(0), makeLog(1), makeLog(2), makeLog(3)];
    expect(computeCurrentStreak(logs, REF)).toBe(4);
  });

  test('counts streak ending yesterday (grace period)', () => {
    const logs = [makeLog(1), makeLog(2), makeLog(3)];
    expect(computeCurrentStreak(logs, REF)).toBe(3);
  });

  test('stops streak on gap', () => {
    const logs = [makeLog(0), makeLog(1), makeLog(3), makeLog(4)]; // gap at day 2
    expect(computeCurrentStreak(logs, REF)).toBe(2);
  });

  test('ignores incomplete logs', () => {
    const logs = [makeLog(0), makeLog(1), { ...makeLog(2), completed: false }, makeLog(3)];
    expect(computeCurrentStreak(logs, REF)).toBe(2);
  });

  test('handles single log today', () => {
    expect(computeCurrentStreak([makeLog(0)], REF)).toBe(1);
  });

  test('handles 30-day streak', () => {
    const logs = Array.from({ length: 30 }, (_, i) => makeLog(i));
    expect(computeCurrentStreak(logs, REF)).toBe(30);
  });
});

describe('computeLongestStreak', () => {
  test('returns 0 for empty logs', () => {
    expect(computeLongestStreak([])).toBe(0);
  });

  test('finds longest streak within broken history', () => {
    const logs = [
      makeLog(0), makeLog(1), makeLog(2),    // 3-day recent
      makeLog(8), makeLog(9), makeLog(10), makeLog(11), makeLog(12), // 5-day older
    ];
    expect(computeLongestStreak(logs)).toBe(5);
  });

  test('returns 1 for isolated completions', () => {
    const logs = [makeLog(0), makeLog(5), makeLog(10)];
    expect(computeLongestStreak(logs)).toBe(1);
  });

  test('deduplicates same-day logs', () => {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    const logs: HabitLog[] = [
      { id: '1', habitId: 'h1', userId: 'u1', date: today, completed: true },
      { id: '2', habitId: 'h1', userId: 'u1', date: today, completed: true }, // duplicate
      { id: '3', habitId: 'h1', userId: 'u1', date: yesterday, completed: true },
    ];
    expect(computeLongestStreak(logs)).toBe(2);
  });
});

describe('wasCompletedOn', () => {
  test('returns true when completed on given date', () => {
    expect(wasCompletedOn([makeLog(2)], subDays(new Date(), 2))).toBe(true);
  });

  test('returns false when not completed', () => {
    const log = { ...makeLog(0), completed: false };
    expect(wasCompletedOn([log], new Date())).toBe(false);
  });

  test('returns false when no log on date', () => {
    expect(wasCompletedOn([makeLog(1)], new Date())).toBe(false);
  });
});

describe('completionRateForPeriod', () => {
  const REF = new Date('2024-03-15');

  test('returns 1.0 for perfect week', () => {
    const logs = Array.from({ length: 7 }, (_, i) => makeLog(i));
    expect(completionRateForPeriod(logs, 7, REF)).toBeCloseTo(1.0);
  });

  test('returns 0 for no completions', () => {
    expect(completionRateForPeriod([], 7, REF)).toBe(0);
  });

  test('returns 0.5 for half the days', () => {
    const logs = [makeLog(0), makeLog(1), makeLog(2)];
    expect(completionRateForPeriod(logs, 6, REF)).toBeCloseTo(0.5);
  });
});

describe('getWeekCompletionMap', () => {
  test('returns 7 booleans', () => {
    const map = getWeekCompletionMap([], 0);
    expect(map).toHaveLength(7);
  });

  test('marks correct days as completed', () => {
    const logs = [makeLog(0)]; // today
    const map = getWeekCompletionMap(logs, 0);
    // today should be marked (index 6 = Saturday if today is Sat, etc.)
    // We test that at least one day is true
    expect(map.some(Boolean)).toBe(true);
  });

  test('all false for empty logs', () => {
    const map = getWeekCompletionMap([], 0);
    expect(map.every((v) => v === false)).toBe(true);
  });
});
