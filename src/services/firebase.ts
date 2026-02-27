import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import remoteConfig from '@react-native-firebase/remote-config';

// Auth
export const Auth = auth;
export const getCurrentUser = () => auth().currentUser;
export const requireAuth = () => {
  const user = auth().currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

// Firestore
export const Firestore = firestore;
export const ServerTimestamp = firestore.FieldValue.serverTimestamp;
export const ArrayUnion = firestore.FieldValue.arrayUnion;
export const ArrayRemove = firestore.FieldValue.arrayRemove;
export const Increment = firestore.FieldValue.increment;
export const Timestamp = firestore.Timestamp;

// Helper: convert Firestore Timestamp to Date
export function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date();
}

// Collection refs
export const usersCol = () => firestore().collection('users');
export const userDoc = (uid: string) => firestore().collection('users').doc(uid);
export const publicProfilesCol = () => firestore().collection('publicProfiles');
export const courtsCol = () => firestore().collection('courts');
export const leaderboardCol = () => firestore().collection('leaderboard');
export const invitationsCol = () => firestore().collection('invitations');

// Sub-collection helpers
export const habitsCol = (uid: string) => userDoc(uid).collection('habits');
export const habitLogsCol = (uid: string) => userDoc(uid).collection('habitLogs');
export const tasksCol = (uid: string) => userDoc(uid).collection('tasks');
export const workoutTemplatesCol = (uid: string) => userDoc(uid).collection('workoutTemplates');
export const workoutSessionsCol = (uid: string) => userDoc(uid).collection('workoutSessions');
export const journalCol = (uid: string) => userDoc(uid).collection('journalEntries');
export const cycleLogsCol = (uid: string) => userDoc(uid).collection('cycleLogs');
export const cycleSettingsDoc = (uid: string) =>
  userDoc(uid).collection('cycleSettings').doc('default');

// Storage
export const Storage = storage;
export const avatarRef = (uid: string, filename: string) =>
  storage().ref(`avatars/${uid}/${filename}`);
export const journalAttachmentRef = (uid: string, entryId: string, filename: string) =>
  storage().ref(`journal/${uid}/${entryId}/${filename}`);

// Cloud Functions
export const Functions = functions;
export const callFunction = <T = unknown>(name: string, data?: unknown) =>
  functions().httpsCallable<unknown, T>(name)(data);

// Messaging
export const Messaging = messaging;

// Analytics
export const Analytics = analytics;
export const logEvent = (name: string, params?: Record<string, unknown>) =>
  analytics().logEvent(name, params);
export const setUserProperty = (name: string, value: string) =>
  analytics().setUserProperty(name, value);

// Crashlytics
export const Crashlytics = crashlytics;
export const recordError = (error: Error, jsErrorName?: string) =>
  crashlytics().recordError(error, jsErrorName);
export const log = (message: string) => crashlytics().log(message);

// Remote Config
export const RemoteConfig = remoteConfig;
export const getRemoteConfigString = (key: string) =>
  remoteConfig().getString(key);
export const getRemoteConfigBoolean = (key: string) =>
  remoteConfig().getBoolean(key);
export const getRemoteConfigNumber = (key: string) =>
  remoteConfig().getNumber(key);
