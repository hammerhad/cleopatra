export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export type CycleSymptom =
  | 'cramps'
  | 'bloating'
  | 'headache'
  | 'fatigue'
  | 'mood_swings'
  | 'breast_tenderness'
  | 'acne'
  | 'backache'
  | 'nausea'
  | 'insomnia'
  | 'high_energy'
  | 'low_energy'
  | 'increased_libido'
  | 'decreased_libido'
  | 'cravings'
  | 'spotting';

export type FlowIntensity = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface CycleLog {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date | null;
  cycleLength?: number;
  periodLength?: number;
  notes?: string;
  createdAt: Date;
}

export interface DailyCycleLog {
  id: string;
  userId: string;
  date: Date;
  phase: CyclePhase;
  cycleDay: number;
  flowIntensity: FlowIntensity;
  symptoms: CycleSymptom[];
  energyLevel: EnergyLevel;
  mood: number;        // 1-5
  sexualDesire: number; // 1-5
  notes?: string;
  createdAt: Date;
}

export interface CycleSettings {
  averageCycleLength: number;
  averagePeriodLength: number;
  lastPeriodStart: Date | null;
  predictedNextPeriod?: Date | null;
  trackingEnabled: boolean;
  privacyMode: boolean;
  remindersEnabled: boolean;
  reminderDaysBefore: number;
  createdAt: Date;
}

export interface CyclePrediction {
  avgCycleLength: number;
  avgPeriodLength: number;
  nextPeriodDate: string;
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  currentPhase: CyclePhase;
  cycleDay: number;
  daysUntilNextPeriod: number;
}

export interface PhaseInsight {
  phase: CyclePhase;
  title: string;
  emoji: string;
  color: string;
  gradientColors: string[];
  energyProfile: string;
  bestFor: string[];
  avoidWhen: string[];
  affirmation: string;
  nutritionTips: string[];
  workoutSuggestion: string;
}

export const PHASE_INSIGHTS: Record<CyclePhase, PhaseInsight> = {
  menstrual: {
    phase: 'menstrual',
    title: 'Blood Moon',
    emoji: '🌑',
    color: '#7A1A2E',
    gradientColors: ['#3A0A15', '#7A1A2E'],
    energyProfile: 'Inward power. Rest is resistance.',
    bestFor: ['Rest', 'Reflection', 'Gentle movement', 'Strategy sessions', 'Releasing what no longer serves'],
    avoidWhen: ['High-intensity workouts', 'Major decisions under pressure', 'People-pleasing'],
    affirmation: 'I release, I renew, I rise.',
    nutritionTips: ['Iron-rich foods', 'Dark chocolate', 'Warm, nourishing meals', 'Stay hydrated'],
    workoutSuggestion: 'Yin yoga, gentle walks, breathwork',
  },
  follicular: {
    phase: 'follicular',
    title: 'Rising Tide',
    emoji: '🌱',
    color: '#1A4A3A',
    gradientColors: ['#0A1E18', '#1A4A3A'],
    energyProfile: 'Curiosity ignites. Begin new conquests.',
    bestFor: ['New projects', 'Learning', 'Creative work', 'Social events', 'Planning campaigns'],
    avoidWhen: ['Avoiding risk', 'Playing small', 'Isolation'],
    affirmation: 'I plant seeds of empire today.',
    nutritionTips: ['Fresh vegetables', 'Fermented foods', 'Light proteins', 'Green tea'],
    workoutSuggestion: 'HIIT, strength training, dancing, running',
  },
  ovulation: {
    phase: 'ovulation',
    title: 'Peak Radiance',
    emoji: '🌕',
    color: '#B07820',
    gradientColors: ['#2A1A00', '#B07820'],
    energyProfile: 'Your magnetism is at its apex. Command the room.',
    bestFor: ['Presentations', 'Negotiations', 'Leadership', 'Networking', 'Intimacy', 'High-stakes decisions'],
    avoidWhen: ['Hiding your light', 'Undercharging your worth'],
    affirmation: 'I am seen. I am powerful. I am irresistible.',
    nutritionTips: ['Antioxidant-rich foods', 'Cruciferous vegetables', 'Light, energizing meals'],
    workoutSuggestion: 'Peak performance training, group classes, competitive sports',
  },
  luteal: {
    phase: 'luteal',
    title: 'Inner Oracle',
    emoji: '🌙',
    color: '#3A2A6A',
    gradientColors: ['#150A2A', '#3A2A6A'],
    energyProfile: 'Your intuition is sharpest. Trust your instincts.',
    bestFor: ['Deep work', 'Analysis', 'Editing & refining', 'Setting boundaries', 'Self-care rituals'],
    avoidWhen: ['Overcommitting', 'Caffeine excess', 'Ignoring your body\'s signals'],
    affirmation: 'My inner wisdom is my most powerful weapon.',
    nutritionTips: ['Complex carbs', 'Magnesium-rich foods', 'Reduce salt and sugar', 'Chamomile tea'],
    workoutSuggestion: 'Pilates, swimming, moderate strength, yoga',
  },
};
