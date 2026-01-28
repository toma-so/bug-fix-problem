import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { TimeSlot } from '@/types';
import { fetchAvailableSlots } from './calcomClient';

/**
 * Fetches available slots and formats them for display
 */
export async function getAvailableSlots(
  eventTypeId: number,
  selectedDate: Date,
  userTimeZone: string
): Promise<TimeSlot[]> {
  // Format dates for API
  const startDate = format(selectedDate, 'yyyy-MM-dd');

  // Get next day for end date range
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const endDate = format(nextDay, 'yyyy-MM-dd');

  // Fetch slots from API
  const calcomSlots = await fetchAvailableSlots(
    eventTypeId,
    startDate,
    endDate,
    userTimeZone
  );

  // Transform to our internal format
  return calcomSlots.map((slot, index) => ({
    id: `slot-${index}-${slot.time}`,
    startUtc: slot.time,
    displayTime: formatInTimeZone(slot.time, userTimeZone, 'h:mm a'),
    available: true,
  }));
}

/**
 * Converts a slot to the booking time
 */
export function getBookingTime(slot: TimeSlot): string {
  return slot.startUtc;
}
