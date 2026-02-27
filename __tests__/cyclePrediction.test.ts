import {
  analyzeCycles,
  predictNextCycle,
  getPhaseForDay,
  getPhaseColor,
  getPhaseEmoji,
} from '../src/utils/cyclePrediction';
import type { CycleLog } from '../src/types/cycle';
import { subDays, addDays } from 'date-fns';

function makeCycleLog(startDaysAgo: number, lengthDays = 5): CycleLog {
  const start = subDays(new Date(), startDaysAgo);
  return {
    id: `cycle-${startDaysAgo}`,
    userId: 'user-1',
    startDate: start,
    endDate: addDays(start, lengthDays),
    periodLength: lengthDays,
    createdAt: start,
  };
}

describe('analyzeCycles', () => {
  test('returns defaults for < 2 logs', () => {
    const result = analyzeCycles([makeCycleLog(0)]);
    expect(result.avgCycleLength).toBe(28);
    expect(result.avgPeriodLength).toBe(5);
  });

  test('returns defaults for empty logs', () => {
    const result = analyzeCycles([]);
    expect(result.avgCycleLength).toBe(28);
  });

  test('calculates correct average cycle length', () => {
    // Cycles of 28 and 30 days → avg 29
    const logs = [
      makeCycleLog(0),   // most recent
      makeCycleLog(28),  // 28 days before
      makeCycleLog(58),  // 30 days before that
    ];
    const result = analyzeCycles(logs);
    expect(result.avgCycleLength).toBe(29);
  });

  test('marks as regular when std dev <= 3', () => {
    const logs = [
      makeCycleLog(0),
      makeCycleLog(28),
      makeCycleLog(56),
      makeCycleLog(84),
    ];
    const result = analyzeCycles(logs);
    expect(result.isRegular).toBe(true);
  });

  test('marks as irregular when std dev > 3', () => {
    const logs = [
      makeCycleLog(0),
      makeCycleLog(22),   // 22 days
      makeCycleLog(57),   // 35 days
      makeCycleLog(93),   // 36 days
    ];
    const result = analyzeCycles(logs);
    expect(result.isRegular).toBe(false);
  });

  test('filters out biologically impossible cycle lengths', () => {
    const validLog = makeCycleLog(28);
    // Manufacture a log with a 10-day "cycle" (too short, should be ignored)
    const impossibleLog: CycleLog = {
      ...makeCycleLog(38),
      startDate: subDays(new Date(), 38),
    };
    const result = analyzeCycles([makeCycleLog(0), validLog, impossibleLog]);
    // Should still get a valid result
    expect(result.avgCycleLength).toBeGreaterThanOrEqual(20);
    expect(result.avgCycleLength).toBeLessThanOrEqual(45);
  });

  test('calculates correct period length average', () => {
    const logs = [
      makeCycleLog(0, 4),   // 4-day period
      makeCycleLog(28, 6),  // 6-day period
    ];
    const result = analyzeCycles(logs);
    expect(result.avgPeriodLength).toBe(5); // avg of 4+6
  });
});

describe('predictNextCycle', () => {
  const REF = new Date('2024-03-15');

  test('predicts next period correctly', () => {
    const lastPeriod = subDays(REF, 14); // 14 days ago
    const analysis = {
      avgCycleLength: 28,
      avgPeriodLength: 5,
      cycleVariability: 1,
      shortestCycle: 27,
      longestCycle: 29,
      isRegular: true,
    };
    const pred = predictNextCycle(lastPeriod, analysis, REF);

    expect(pred.cycleDay).toBe(15); // 14 days ago = day 15
    expect(pred.currentPhase).toBe('follicular'); // day 15 of 28-day cycle
    expect(pred.avgCycleLength).toBe(28);
  });

  test('returns menstrual phase for early cycle days', () => {
    const lastPeriod = subDays(REF, 2);
    const analysis = { avgCycleLength: 28, avgPeriodLength: 5, cycleVariability: 0, shortestCycle: 28, longestCycle: 28, isRegular: true };
    const pred = predictNextCycle(lastPeriod, analysis, REF);
    expect(pred.currentPhase).toBe('menstrual');
  });

  test('returns luteal phase for late cycle days', () => {
    const lastPeriod = subDays(REF, 22);
    const analysis = { avgCycleLength: 28, avgPeriodLength: 5, cycleVariability: 0, shortestCycle: 28, longestCycle: 28, isRegular: true };
    const pred = predictNextCycle(lastPeriod, analysis, REF);
    expect(pred.currentPhase).toBe('luteal');
  });

  test('returns positive daysUntilNextPeriod when period has not come', () => {
    const lastPeriod = subDays(REF, 7);
    const analysis = { avgCycleLength: 28, avgPeriodLength: 5, cycleVariability: 0, shortestCycle: 28, longestCycle: 28, isRegular: true };
    const pred = predictNextCycle(lastPeriod, analysis, REF);
    expect(pred.daysUntilNextPeriod).toBe(21);
  });

  test('includes valid ISO date strings', () => {
    const lastPeriod = subDays(REF, 14);
    const analysis = { avgCycleLength: 28, avgPeriodLength: 5, cycleVariability: 0, shortestCycle: 28, longestCycle: 28, isRegular: true };
    const pred = predictNextCycle(lastPeriod, analysis, REF);

    expect(() => new Date(pred.nextPeriodDate)).not.toThrow();
    expect(() => new Date(pred.ovulationDate)).not.toThrow();
    expect(() => new Date(pred.fertileWindowStart)).not.toThrow();
    expect(() => new Date(pred.fertileWindowEnd)).not.toThrow();
  });
});

describe('getPhaseForDay', () => {
  test('menstrual phase for days 1-5', () => {
    expect(getPhaseForDay(1, 28, 5)).toBe('menstrual');
    expect(getPhaseForDay(5, 28, 5)).toBe('menstrual');
  });

  test('follicular phase for days 6-12', () => {
    expect(getPhaseForDay(6, 28, 5)).toBe('follicular');
    expect(getPhaseForDay(12, 28, 5)).toBe('follicular');
  });

  test('ovulation phase around cycle midpoint', () => {
    expect(getPhaseForDay(14, 28, 5)).toBe('ovulation');
    expect(getPhaseForDay(16, 28, 5)).toBe('ovulation');
  });

  test('luteal phase for late cycle days', () => {
    expect(getPhaseForDay(20, 28, 5)).toBe('luteal');
    expect(getPhaseForDay(28, 28, 5)).toBe('luteal');
  });
});

describe('getPhaseColor', () => {
  test('returns color string for all phases', () => {
    const phases = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;
    phases.forEach((p) => {
      const color = getPhaseColor(p);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe('getPhaseEmoji', () => {
  test('returns emoji for all phases', () => {
    expect(getPhaseEmoji('menstrual')).toBe('🌑');
    expect(getPhaseEmoji('follicular')).toBe('🌱');
    expect(getPhaseEmoji('ovulation')).toBe('🌕');
    expect(getPhaseEmoji('luteal')).toBe('🌙');
  });
});
