import { format, formatDistanceToNow, isToday, isYesterday, isTomorrow } from 'date-fns';

export function formatDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

export function formatFullDate(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}

export function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

export function formatTimeString(timeString: string): string {
  // Converts "14:30" → "2:30 PM"
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, 'h:mm a');
}

export function formatRelative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs > 0 ? secs + 's' : ''}`.trim();
  }
  return `${secs}s`;
}

export function formatRest(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatStreak(count: number): string {
  if (count === 0) return 'No streak';
  if (count === 1) return '1 day';
  return `${count} days`;
}

export function formatPoints(points: number): string {
  if (points >= 1000) return `${(points / 1000).toFixed(1)}k`;
  return String(points);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
