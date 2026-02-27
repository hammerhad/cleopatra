export interface Court {
  id: string;
  name: string;
  description?: string;
  avatarURL?: string;
  creatorId: string;
  memberIds: string[];
  maxMembers: number;
  isPrivate: boolean;
  totalPoints: number;
  activeChallengeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourtMember {
  uid: string;
  displayName: string;
  photoURL: string | null;
  rank: string;
  rankPoints: number;
  courtStreak: number;
  challengesCompleted: number;
  joinedAt: Date;
}

export interface CourtChallenge {
  id: string;
  courtId: string;
  title: string;
  description: string;
  category: 'habits' | 'fitness' | 'mindfulness' | 'learning' | 'custom';
  duration: number;    // days
  pointReward: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  completedBy: string[];  // user ids
  createdBy: string;
  createdAt: Date;
}

export interface CourtMessage {
  id: string;
  courtId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  text: string;
  type: 'text' | 'achievement' | 'system';
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface CourtInvitation {
  id: string;
  courtId: string;
  courtName: string;
  inviterId: string;
  inviterName: string;
  inviteeId?: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateCourtInput {
  name: string;
  description?: string;
  isPrivate: boolean;
  maxMembers?: number;
}
