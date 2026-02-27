export type UserTier = 'free' | 'premium';

export type UserRank =
  | 'Initiate'
  | 'Scholar'
  | 'Warrior'
  | 'Strategist'
  | 'Commander'
  | 'High Priestess'
  | 'Pharaoh';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  tier: UserTier;
  rank: UserRank;
  rankPoints: number;
  onboardingComplete: boolean;
  privacyMode: boolean;
  streakCount: number;
  longestStreak: number;
  timezone: string;
  notificationsEnabled: boolean;
  fcmTokens: string[];
  subscription: UserSubscription;
  bio?: string;
  birthDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscription {
  status: 'free' | 'trial' | 'active' | 'expired' | 'cancelled';
  productId?: string;
  expiresAt: Date | null;
  platform?: 'ios' | 'android';
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  rank: UserRank;
  rankPoints: number;
}

export interface OnboardingData {
  displayName: string;
  goals: string[];
  birthDate?: string;
  timezone: string;
  cycleTrackingConsent: boolean;
  notificationsConsent: boolean;
}
