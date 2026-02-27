export type MoodRating = 1 | 2 | 3 | 4 | 5;

export type MoodLabel =
  | 'shattered'
  | 'low'
  | 'neutral'
  | 'good'
  | 'radiant';

export type JournalPromptCategory =
  | 'gratitude'
  | 'reflection'
  | 'intention'
  | 'achievement'
  | 'challenge'
  | 'free';

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mood: MoodRating;
  moodLabel: MoodLabel;
  tags: string[];
  attachments: JournalAttachment[];
  prompt?: string;
  promptCategory?: JournalPromptCategory;
  isPrivate: boolean;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalAttachment {
  id: string;
  type: 'image' | 'audio';
  url: string;
  storagePath: string;
  filename: string;
  size: number;
}

export interface CreateJournalEntryInput {
  title?: string;
  content: string;
  mood: MoodRating;
  tags?: string[];
  prompt?: string;
  promptCategory?: JournalPromptCategory;
  isPrivate?: boolean;
}

export interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  averageMood: number;
  mostUsedTags: string[];
  entriesThisMonth: number;
  wordCountTotal: number;
}

export const DAILY_PROMPTS: Record<JournalPromptCategory, string[]> = {
  gratitude: [
    'What three small victories did you claim today?',
    'Name one person who made your empire stronger.',
    'What beauty did you notice that others overlooked?',
  ],
  reflection: [
    'What decision today revealed your character?',
    'Where did you compromise — and was it strategic or weak?',
    'What would your future self thank you for today?',
  ],
  intention: [
    'What one thing, if done, would make tomorrow extraordinary?',
    'Decree your most important goal for the next 7 days.',
    'What habit will you protect at all costs this week?',
  ],
  achievement: [
    'What did you do today that your past self couldn\'t?',
    'Name a boundary you held with grace.',
    'What skill did you sharpen today?',
  ],
  challenge: [
    'What obstacle is testing your resolve? How will you use it?',
    'What fear did you face, even partially?',
    'What would Cleopatra do in your situation right now?',
  ],
  free: [
    'The crown is yours — write freely.',
    'Your thoughts. No filter. No judgment.',
    'Begin anywhere. Let the words be your ally.',
  ],
};
