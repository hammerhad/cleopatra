import auth from '@react-native-firebase/auth';
import { userDoc, logEvent, setUserProperty, recordError } from './firebase';
import type { UserProfile, OnboardingData } from '../types/user';
import { ServerTimestamp } from './firebase';

export interface AuthCredentials {
  email: string;
  password: string;
}

export async function signUp({ email, password }: AuthCredentials): Promise<void> {
  await auth().createUserWithEmailAndPassword(email, password);
  await logEvent('sign_up', { method: 'email' });
}

export async function signIn({ email, password }: AuthCredentials): Promise<void> {
  await auth().signInWithEmailAndPassword(email, password);
  await logEvent('login', { method: 'email' });
}

export async function signOut(): Promise<void> {
  await auth().signOut();
}

export async function sendPasswordReset(email: string): Promise<void> {
  await auth().sendPasswordResetEmail(email);
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth().currentUser;
  if (!user || !user.email) throw new Error('Not authenticated');

  const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
  await user.reauthenticateWithCredential(credential);
  await user.updatePassword(newPassword);
}

export async function deleteAccount(password: string): Promise<void> {
  const user = auth().currentUser;
  if (!user || !user.email) throw new Error('Not authenticated');

  const credential = auth.EmailAuthProvider.credential(user.email, password);
  await user.reauthenticateWithCredential(credential);
  await user.delete();
}

export async function completeOnboarding(
  uid: string,
  data: OnboardingData
): Promise<void> {
  await userDoc(uid).update({
    displayName: data.displayName,
    onboardingComplete: true,
    timezone: data.timezone,
    updatedAt: ServerTimestamp(),
  });

  await setUserProperty('onboarding_goals', data.goals.join(','));
  await logEvent('onboarding_complete', { goals_count: data.goals.length });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await userDoc(uid).get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return {
      ...data,
      uid,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
      subscription: {
        ...data.subscription,
        expiresAt: data.subscription?.expiresAt?.toDate() ?? null,
      },
    } as UserProfile;
  } catch (error) {
    recordError(error as Error, 'getUserProfile');
    return null;
  }
}

export function onUserProfileChange(
  uid: string,
  callback: (profile: UserProfile | null) => void
): () => void {
  return userDoc(uid).onSnapshot(
    (snap) => {
      if (!snap.exists) {
        callback(null);
        return;
      }
      const data = snap.data()!;
      callback({
        ...data,
        uid,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        subscription: {
          ...data.subscription,
          expiresAt: data.subscription?.expiresAt?.toDate() ?? null,
        },
      } as UserProfile);
    },
    (error) => {
      recordError(error, 'onUserProfileChange');
      callback(null);
    }
  );
}

export async function updateProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'notificationsEnabled' | 'privacyMode' | 'timezone'>>
): Promise<void> {
  await userDoc(uid).update({
    ...updates,
    updatedAt: ServerTimestamp(),
  });

  if (updates.displayName) {
    await auth().currentUser?.updateProfile({ displayName: updates.displayName });
  }
}

export async function saveFCMToken(uid: string, token: string): Promise<void> {
  const { ArrayUnion } = await import('./firebase');
  await userDoc(uid).update({
    fcmTokens: ArrayUnion(token),
  });
}
