import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Formats a UTC ISO string to a display time in the given timezone
 */
export function formatTimeInZone(utcIsoString: string, timeZone: string): string {
  return formatInTimeZone(utcIsoString, timeZone, 'h:mm a');
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Gets the user's current timezone
 */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
