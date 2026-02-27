import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parse, format, addDays, isBefore } from 'date-fns';

export interface ScheduledReminder {
  identifier: string;
  habitId?: string;
  taskId?: string;
  type: 'habit' | 'task' | 'cycle' | 'custom';
}

/**
 * Requests notification permissions. Returns true if granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Configures notification handler for foreground display.
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('cleopatra_reminders', {
      name: 'Cleopatra Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A84C',
      sound: 'default',
    });
  }
}

/**
 * Schedules a daily habit reminder at a given time (HH:MM).
 * Returns the notification identifier.
 */
export async function scheduleHabitReminder(
  habitId: string,
  habitTitle: string,
  timeString: string // "HH:MM"
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  // Cancel existing reminder for this habit
  await cancelHabitReminder(habitId);

  const [hours, minutes] = timeString.split(':').map(Number);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '👑 Royal Ritual',
      body: `Time for: ${habitTitle}`,
      data: { type: 'habit', habitId },
      sound: 'default',
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });

  return identifier;
}

/**
 * Cancels a habit reminder by habitId (stored as identifier prefix).
 */
export async function cancelHabitReminder(habitId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => (n.content.data as Record<string, unknown>)?.habitId === habitId
  );
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

/**
 * Schedules a one-time task reminder.
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  reminderDate: Date
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  if (isBefore(reminderDate, new Date())) return null;

  await cancelTaskReminder(taskId);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚔️ Royal Decree',
      body: `Time to conquer: ${taskTitle}`,
      data: { type: 'task', taskId },
      sound: 'default',
    },
    trigger: {
      date: reminderDate,
    },
  });

  return identifier;
}

/**
 * Cancels a task reminder by taskId.
 */
export async function cancelTaskReminder(taskId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => (n.content.data as Record<string, unknown>)?.taskId === taskId
  );
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

/**
 * Schedules a cycle phase notification.
 */
export async function scheduleCycleReminder(
  phase: string,
  message: string,
  date: Date
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  if (isBefore(date, new Date())) return null;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Moon Cycle',
      body: message,
      data: { type: 'cycle', phase },
      sound: 'default',
    },
    trigger: { date },
  });

  return identifier;
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Returns count of pending notifications.
 */
export async function getPendingReminderCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
