import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { CycleLog, CyclePhase, CyclePrediction } from '../types/cycle';

export interface CycleAnalysis {
  avgCycleLength: number;
  avgPeriodLength: number;
  cycleVariability: number;  // standard deviation in days
  shortestCycle: number;
  longestCycle: number;
  isRegular: boolean;
}

/**
 * Analyzes historical cycle logs to derive averages and regularity.
 */
export function analyzeCycles(logs: CycleLog[]): CycleAnalysis {
  const sorted = [...logs].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime()
  );

  const DEFAULT: CycleAnalysis = {
    avgCycleLength: 28,
    avgPeriodLength: 5,
    cycleVariability: 0,
    shortestCycle: 28,
    longestCycle: 28,
    isRegular: true,
  };

  if (sorted.length < 2) return DEFAULT;

  const cycleLengths: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = startOfDay(sorted[i].startDate);
    const previous = startOfDay(sorted[i + 1].startDate);
    const length = differenceInCalendarDays(current, previous);
    if (length >= 20 && length <= 45) {
      cycleLengths.push(length);
    }
  }

  if (cycleLengths.length === 0) return DEFAULT;

  const avgCycle = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);

  // Variance
  const variance =
    cycleLengths.reduce((acc, len) => acc + Math.pow(len - avgCycle, 2), 0) /
    cycleLengths.length;
  const stdDev = Math.sqrt(variance);

  // Period lengths
  const periodLengths = sorted
    .filter((l) => l.endDate != null)
    .map((l) => differenceInCalendarDays(l.endDate!, l.startDate))
    .filter((d) => d >= 2 && d <= 10);

  const avgPeriod =
    periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5;

  return {
    avgCycleLength: avgCycle,
    avgPeriodLength: avgPeriod,
    cycleVariability: Math.round(stdDev * 10) / 10,
    shortestCycle: Math.min(...cycleLengths),
    longestCycle: Math.max(...cycleLengths),
    isRegular: stdDev <= 3,
  };
}

/**
 * Predicts next cycle details from last period start and cycle analysis.
 */
export function predictNextCycle(
  lastPeriodStart: Date,
  analysis: CycleAnalysis,
  referenceDate: Date = new Date()
): CyclePrediction {
  const { avgCycleLength, avgPeriodLength } = analysis;

  const nextPeriod = addDays(lastPeriodStart, avgCycleLength);
  const ovulationDay = addDays(lastPeriodStart, Math.round(avgCycleLength / 2) - 2);
  const fertileStart = addDays(ovulationDay, -5);
  const fertileEnd = addDays(ovulationDay, 1);

  const today = startOfDay(referenceDate);
  const daysSincePeriod = differenceInCalendarDays(today, startOfDay(lastPeriodStart));
  const cycleDay = ((daysSincePeriod % avgCycleLength) + avgCycleLength) % avgCycleLength + 1;

  const currentPhase = getPhaseForDay(cycleDay, avgCycleLength, avgPeriodLength);
  const daysUntilNextPeriod = differenceInCalendarDays(nextPeriod, today);

  return {
    avgCycleLength,
    avgPeriodLength,
    nextPeriodDate: nextPeriod.toISOString(),
    ovulationDate: ovulationDay.toISOString(),
    fertileWindowStart: fertileStart.toISOString(),
    fertileWindowEnd: fertileEnd.toISOString(),
    currentPhase,
    cycleDay,
    daysUntilNextPeriod,
  };
}

/**
 * Determines cycle phase for a given cycle day.
 */
export function getPhaseForDay(
  cycleDay: number,
  cycleLength: number,
  periodLength: number
): CyclePhase {
  if (cycleDay <= periodLength) return 'menstrual';

  const follicularEnd = Math.round(cycleLength * 0.43);
  if (cycleDay <= follicularEnd) return 'follicular';

  const ovulationEnd = Math.round(cycleLength * 0.57);
  if (cycleDay <= ovulationEnd) return 'ovulation';

  return 'luteal';
}

/**
 * Returns phase color for UI display.
 */
export function getPhaseColor(phase: CyclePhase): string {
  const colors: Record<CyclePhase, string> = {
    menstrual: '#7A1A2E',
    follicular: '#1A4A3A',
    ovulation: '#B07820',
    luteal: '#3A2A6A',
  };
  return colors[phase];
}

/**
 * Returns phase emoji.
 */
export function getPhaseEmoji(phase: CyclePhase): string {
  const emojis: Record<CyclePhase, string> = {
    menstrual: '🌑',
    follicular: '🌱',
    ovulation: '🌕',
    luteal: '🌙',
  };
  return emojis[phase];
}
