import {
  scheduleHabitReminder,
  scheduleTaskReminder,
  cancelHabitReminder,
  cancelTaskReminder,
  cancelAllReminders,
  getPendingReminderCount,
  scheduleCycleReminder,
  requestNotificationPermissions,
} from '../src/utils/reminders';
import { addDays, subDays } from 'date-fns';

// ─── Mock expo-notifications ──────────────────────────────────────────────────
const mockScheduled: Array<{
  identifier: string;
  content: { data: Record<string, unknown>; title: string; body: string };
  trigger: unknown;
}> = [];

let mockPermissionStatus: 'granted' | 'denied' | 'undetermined' = 'granted';
let mockIdentifierCounter = 0;

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: mockPermissionStatus })),
  requestPermissionsAsync: jest.fn(async () => ({ status: mockPermissionStatus })),
  scheduleNotificationAsync: jest.fn(async ({ content, trigger }: { content: Record<string, unknown>; trigger: unknown }) => {
    const identifier = `notif-${++mockIdentifierCounter}`;
    mockScheduled.push({ identifier, content: content as any, trigger });
    return identifier;
  }),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled]),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    const idx = mockScheduled.findIndex((n) => n.identifier === id);
    if (idx !== -1) mockScheduled.splice(idx, 1);
  }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {
    mockScheduled.splice(0, mockScheduled.length);
  }),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clearScheduled() {
  mockScheduled.splice(0, mockScheduled.length);
  mockIdentifierCounter = 0;
}

// ─── requestNotificationPermissions ──────────────────────────────────────────
describe('requestNotificationPermissions', () => {
  beforeEach(() => {
    mockPermissionStatus = 'granted';
  });

  test('returns true when already granted', async () => {
    mockPermissionStatus = 'granted';
    const result = await requestNotificationPermissions();
    expect(result).toBe(true);
  });

  test('requests and returns true when permission granted', async () => {
    mockPermissionStatus = 'denied'; // getPermissionsAsync returns denied
    // then requestPermissionsAsync would be called; set it to granted
    const Notifications = require('expo-notifications');
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

    const result = await requestNotificationPermissions();
    expect(result).toBe(true);
  });

  test('returns false when permission denied', async () => {
    const Notifications = require('expo-notifications');
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const result = await requestNotificationPermissions();
    expect(result).toBe(false);
  });
});

// ─── scheduleHabitReminder ────────────────────────────────────────────────────
describe('scheduleHabitReminder', () => {
  beforeEach(() => {
    clearScheduled();
    mockPermissionStatus = 'granted';
  });

  test('returns null when permission denied', async () => {
    const Notifications = require('expo-notifications');
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const result = await scheduleHabitReminder('h1', 'Meditate', '07:00');
    expect(result).toBeNull();
  });

  test('returns notification identifier string when scheduled', async () => {
    const id = await scheduleHabitReminder('h1', 'Morning Run', '06:30');
    expect(typeof id).toBe('string');
    expect(id).toBeTruthy();
  });

  test('schedules notification with correct habit data', async () => {
    const Notifications = require('expo-notifications');
    await scheduleHabitReminder('habit-123', 'Journaling', '20:00');
    const calls = Notifications.scheduleNotificationAsync.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.content.data.habitId).toBe('habit-123');
    expect(lastCall.content.data.type).toBe('habit');
    expect(lastCall.content.body).toContain('Journaling');
  });

  test('parses time string correctly (HH:MM)', async () => {
    const Notifications = require('expo-notifications');
    await scheduleHabitReminder('h2', 'Stretch', '14:45');
    const calls = Notifications.scheduleNotificationAsync.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.trigger.hour).toBe(14);
    expect(lastCall.trigger.minute).toBe(45);
    expect(lastCall.trigger.repeats).toBe(true);
  });

  test('cancels existing reminder before scheduling new one', async () => {
    // Schedule first
    await scheduleHabitReminder('h-repeat', 'Yoga', '07:00');
    const countAfterFirst = mockScheduled.length;

    // Schedule again — should cancel old one first
    await scheduleHabitReminder('h-repeat', 'Yoga', '08:00');
    // Still only 1 scheduled for this habit (old removed, new added)
    const habitNotifs = mockScheduled.filter(
      (n) => n.content.data.habitId === 'h-repeat'
    );
    expect(habitNotifs.length).toBe(1);
  });

  test('uses repeats: true for daily trigger', async () => {
    const Notifications = require('expo-notifications');
    await scheduleHabitReminder('h3', 'Cold shower', '05:00');
    const calls = Notifications.scheduleNotificationAsync.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.trigger.repeats).toBe(true);
  });
});

// ─── cancelHabitReminder ──────────────────────────────────────────────────────
describe('cancelHabitReminder', () => {
  beforeEach(() => {
    clearScheduled();
    mockPermissionStatus = 'granted';
  });

  test('cancels notifications for a specific habitId', async () => {
    await scheduleHabitReminder('h-cancel', 'Read', '21:00');
    expect(mockScheduled.some((n) => n.content.data.habitId === 'h-cancel')).toBe(true);

    await cancelHabitReminder('h-cancel');
    expect(mockScheduled.some((n) => n.content.data.habitId === 'h-cancel')).toBe(false);
  });

  test('does not cancel notifications for other habits', async () => {
    await scheduleHabitReminder('h-keep', 'Walk', '08:00');
    await scheduleHabitReminder('h-delete', 'Swim', '07:00');

    await cancelHabitReminder('h-delete');

    expect(mockScheduled.some((n) => n.content.data.habitId === 'h-keep')).toBe(true);
    expect(mockScheduled.some((n) => n.content.data.habitId === 'h-delete')).toBe(false);
  });

  test('does nothing if habitId not found', async () => {
    await scheduleHabitReminder('h-other', 'Run', '06:00');
    const before = mockScheduled.length;
    await cancelHabitReminder('nonexistent-habit');
    expect(mockScheduled.length).toBe(before);
  });
});

// ─── scheduleTaskReminder ─────────────────────────────────────────────────────
describe('scheduleTaskReminder', () => {
  beforeEach(() => {
    clearScheduled();
    mockPermissionStatus = 'granted';
  });

  test('returns null when permission denied', async () => {
    const Notifications = require('expo-notifications');
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const futureDate = addDays(new Date(), 1);
    const result = await scheduleTaskReminder('t1', 'Report', futureDate);
    expect(result).toBeNull();
  });

  test('returns null for past dates', async () => {
    const pastDate = subDays(new Date(), 1);
    const result = await scheduleTaskReminder('t2', 'Old task', pastDate);
    expect(result).toBeNull();
  });

  test('schedules for future dates and returns identifier', async () => {
    const futureDate = addDays(new Date(), 2);
    const id = await scheduleTaskReminder('t3', 'Strategy meeting', futureDate);
    expect(typeof id).toBe('string');
    expect(id).toBeTruthy();
  });

  test('schedules with correct task data', async () => {
    const Notifications = require('expo-notifications');
    const futureDate = addDays(new Date(), 1);
    await scheduleTaskReminder('task-xyz', 'Write report', futureDate);
    const calls = Notifications.scheduleNotificationAsync.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.content.data.taskId).toBe('task-xyz');
    expect(lastCall.content.data.type).toBe('task');
    expect(lastCall.content.body).toContain('Write report');
  });

  test('uses correct trigger date', async () => {
    const Notifications = require('expo-notifications');
    const futureDate = addDays(new Date(), 3);
    await scheduleTaskReminder('t4', 'Review', futureDate);
    const calls = Notifications.scheduleNotificationAsync.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.trigger.date).toEqual(futureDate);
  });

  test('cancels existing task reminder before scheduling new one', async () => {
    const futureDate1 = addDays(new Date(), 1);
    const futureDate2 = addDays(new Date(), 2);

    await scheduleTaskReminder('t-repeat', 'Task A', futureDate1);
    await scheduleTaskReminder('t-repeat', 'Task A', futureDate2);

    const taskNotifs = mockScheduled.filter(
      (n) => n.content.data.taskId === 't-repeat'
    );
    expect(taskNotifs.length).toBe(1);
  });
});

// ─── cancelTaskReminder ───────────────────────────────────────────────────────
describe('cancelTaskReminder', () => {
  beforeEach(() => {
    clearScheduled();
    mockPermissionStatus = 'granted';
  });

  test('cancels notifications for a specific taskId', async () => {
    const futureDate = addDays(new Date(), 1);
    await scheduleTaskReminder('t-cancel', 'Plan session', futureDate);
    expect(mockScheduled.some((n) => n.content.data.taskId === 't-cancel')).toBe(true);

    await cancelTaskReminder('t-cancel');
    expect(mockScheduled.some((n) => n.content.data.taskId === 't-cancel')).toBe(false);
  });

  test('does not cancel notifications for other tasks', async () => {
    const futureDate = addDays(new Date(), 1);
    await scheduleTaskReminder('t-keep', 'Keep this', futureDate);
    await scheduleTaskReminder('t-remove', 'Remove this', addDays(new Date(), 2));

    await cancelTaskReminder('t-remove');
    expect(mockScheduled.some((n) => n.content.data.taskId === 't-keep')).toBe(true);
    expect(mockScheduled.some((n) => n.content.data.taskId === 't-remove')).toBe(false);
  });
});

// ─── scheduleCycleReminder ────────────────────────────────────────────────────
describe('scheduleCycleReminder', () => {
  beforeEach(() => {
    clearScheduled();
    mockPermissionStatus = 'granted';
  });

  test('returns null for past date', async () => {
    const pastDate = subDays(new Date(), 1);
    const result = await scheduleCycleReminder('follicular', 'Your energy is rising', pastDate);
    expect(result).toBeNull();
  });

  test('schedules for future date with cycle type', async () => {
    const Notifications = require('expo-notifications');
    const futureDate = addDays(new Date(), 1);
    await scheduleCycleReminder('ovulation', 'Peak energy day!', futureDate);
    const calls = Notifications.scheduleNotificationAsync.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.content.data.type).toBe('cycle');
    expect(lastCall.content.data.phase).toBe('ovulation');
    expect(lastCall.content.body).toBe('Peak energy day!');
  });

  test('returns identifier when successfully scheduled', async () => {
    const futureDate = addDays(new Date(), 5);
    const id = await scheduleCycleReminder('luteal', 'Rest and reflect', futureDate);
    expect(typeof id).toBe('string');
    expect(id).toBeTruthy();
  });

  test('returns null when permission denied', async () => {
    const Notifications = require('expo-notifications');
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const futureDate = addDays(new Date(), 1);
    const result = await scheduleCycleReminder('menstrual', 'Rest today', futureDate);
    expect(result).toBeNull();
  });
});

// ─── cancelAllReminders ───────────────────────────────────────────────────────
describe('cancelAllReminders', () => {
  beforeEach(() => {
    clearScheduled();
    mockPermissionStatus = 'granted';
  });

  test('cancels all scheduled notifications', async () => {
    await scheduleHabitReminder('h1', 'Meditate', '07:00');
    await scheduleHabitReminder('h2', 'Exercise', '08:00');
    const futureDate = addDays(new Date(), 1);
    await scheduleTaskReminder('t1', 'Report', futureDate);

    expect(mockScheduled.length).toBeGreaterThan(0);
    await cancelAllReminders();
    expect(mockScheduled.length).toBe(0);
  });

  test('is safe to call when no notifications scheduled', async () => {
    await expect(cancelAllReminders()).resolves.not.toThrow();
  });
});

// ─── getPendingReminderCount ──────────────────────────────────────────────────
describe('getPendingReminderCount', () => {
  beforeEach(() => {
    clearScheduled();
    mockPermissionStatus = 'granted';
  });

  test('returns 0 when no reminders are scheduled', async () => {
    const count = await getPendingReminderCount();
    expect(count).toBe(0);
  });

  test('returns correct count after scheduling', async () => {
    await scheduleHabitReminder('h1', 'Yoga', '07:00');
    await scheduleHabitReminder('h2', 'Read', '21:00');
    const count = await getPendingReminderCount();
    expect(count).toBe(2);
  });

  test('decrements after cancellation', async () => {
    await scheduleHabitReminder('h1', 'Run', '06:00');
    await scheduleHabitReminder('h2', 'Swim', '07:00');
    await cancelHabitReminder('h1');

    const count = await getPendingReminderCount();
    expect(count).toBe(1);
  });

  test('returns 0 after cancelAll', async () => {
    await scheduleHabitReminder('h1', 'Habit A', '08:00');
    await scheduleHabitReminder('h2', 'Habit B', '09:00');
    await cancelAllReminders();

    const count = await getPendingReminderCount();
    expect(count).toBe(0);
  });
});
