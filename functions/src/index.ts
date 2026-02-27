import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

// ── Auth Triggers ─────────────────────────────────────────────────────────────
export { onUserCreated, onUserDeleted } from './triggers/auth';

// ── Habit Triggers ────────────────────────────────────────────────────────────
export { onHabitLogCreated } from './triggers/habits';

// ── Notifications ─────────────────────────────────────────────────────────────
export { sendHabitReminder, sendTaskReminder, sendCycleInsight } from './triggers/notifications';

// ── Scheduled ────────────────────────────────────────────────────────────────
export { dailyStreakReset, weeklyCyclePrediction, dailyMotivation } from './scheduled/jobs';

// ── Royal Court ───────────────────────────────────────────────────────────────
export { onCourtInviteCreated, onChallengeCompleted } from './triggers/court';

// ── Analytics ────────────────────────────────────────────────────────────────
export { computeLeaderboard } from './scheduled/analytics';

// ── Callable Functions ────────────────────────────────────────────────────────
export { predictNextCycle, getCourtLeaderboard } from './callable';

// Global error handler
process.on('unhandledRejection', (reason) => {
  functions.logger.error('Unhandled Rejection:', reason);
});
