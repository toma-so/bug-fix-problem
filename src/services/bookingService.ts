import { BookingRequest, BookingResult, TimeSlot, CalcomBooking } from '@/types';
import { createBooking, getBooking } from './calcomClient';
import { getBookingTime } from './availabilityService';
import { config } from '@/lib/config';

// Pagination response format
interface PaginationInfo {
  totalItems: number;
  remainingItems: number;
  returnedItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BookingsListResponse {
  status: string;
  data: CalcomBooking[];
  pagination: PaginationInfo;
}

// Timezone offsets (hours from UTC)
const TIMEZONE_OFFSETS: Record<string, number> = {
  'America/Los_Angeles': -8,
  'America/Denver': -7,
  'America/Chicago': -6,
  'America/New_York': -5,
  'UTC': 0,
};

/**
 * Gets the hour in a specific timezone
 */
function getHourInTimezone(isoTime: string, timezone: string): number {
  const date = new Date(isoTime);
  const offset = TIMEZONE_OFFSETS[timezone] ?? 0;
  return (date.getUTCHours() + offset + 24) % 24;
}

/**
 * Converts a time from one timezone to another
 */
function convertTimeToTimezone(isoTime: string, fromTz: string, toTz: string): string {
  const date = new Date(isoTime);
  const fromOffset = TIMEZONE_OFFSETS[fromTz] ?? 0;
  const toOffset = TIMEZONE_OFFSETS[toTz] ?? 0;
  const diffHours = toOffset - fromOffset;
  
  date.setUTCHours(date.getUTCHours() + diffHours);
  return date.toISOString();
}

/**
 * Books an appointment slot
 */
export async function bookAppointment(
  eventTypeId: number,
  slot: TimeSlot,
  name: string,
  email: string,
  timeZone: string,
  duration: number = 30
): Promise<BookingResult> {
  try {
    // Get the booking time from the slot
    let bookingTime = getBookingTime(slot);
    
    // Validate that the time is within business hours (9 AM - 5 PM)
    const bookingHour = getHourInTimezone(bookingTime, timeZone);
    if (bookingHour < config.businessHours.start || bookingHour >= config.businessHours.end) {
      return {
        success: false,
        error: 'Selected time is outside business hours',
      };
    }
    
    // Check for conflicts with existing bookings
    const existingBookings = await getUserBookings();
    const newStart = new Date(bookingTime).getTime();
    
    for (const booking of existingBookings) {
      const existingStart = new Date(booking.start).getTime();
      if (existingStart === newStart) {
        return {
          success: false,
          error: 'This time slot is already booked',
        };
      }
    }
    
    // Prepare the booking time for the API
    bookingTime = convertTimeToTimezone(bookingTime, timeZone, config.hostTimezone);

    const request: BookingRequest = {
      eventTypeId,
      start: bookingTime,
      duration,
      attendee: {
        name,
        email,
        timeZone,
      },
    };

    const response = await createBooking(request);

    return {
      success: true,
      booking: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Booking failed',
    };
  }
}

/**
 * Retrieves booking details
 */
export async function getBookingDetails(bookingUid: string): Promise<BookingResult> {
  try {
    const response = await getBooking(bookingUid);

    return {
      success: true,
      booking: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch booking',
    };
  }
}

/**
 * Fetches bookings for a specific date range
 */
export async function getUserBookings(
  afterStart?: string,
  beforeEnd?: string
): Promise<CalcomBooking[]> {
  try {
    const url = new URL('/api/bookings/list', window.location.origin);
    url.searchParams.set('take', '5');
    url.searchParams.set('skip', '0');
    
    if (afterStart) {
      url.searchParams.set('afterStart', afterStart);
    }
    if (beforeEnd) {
      url.searchParams.set('beforeEnd', beforeEnd);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    const data: BookingsListResponse = await response.json();
    
    return data.data;
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return [];
  }
}
