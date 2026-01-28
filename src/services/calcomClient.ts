import { CalcomSlotResponse, CalcomBookingResponse, BookingRequest, CalcomSlot } from '@/types';
import { getSlotsApiUrl, getBookingsApiUrl, getApiHeaders } from '@/lib/config';

/**
 * Fetches available slots from the API
 */
export async function fetchAvailableSlots(
  eventTypeId: number,
  startDate: string,
  endDate: string,
  timeZone: string
): Promise<CalcomSlot[]> {
  const url = new URL(getSlotsApiUrl());
  url.searchParams.set('eventTypeId', eventTypeId.toString());
  url.searchParams.set('start', startDate);
  url.searchParams.set('end', endDate);
  url.searchParams.set('timeZone', timeZone);

  const response = await fetch(url.toString(), {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  const data: CalcomSlotResponse = await response.json();
  return data.data;
}

/**
 * Creates a booking
 */
export async function createBooking(request: BookingRequest): Promise<CalcomBookingResponse> {
  const response = await fetch(getBookingsApiUrl(), {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Booking failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Gets a booking by its UID
 */
export async function getBooking(bookingUid: string): Promise<CalcomBookingResponse> {
  const response = await fetch(`${getBookingsApiUrl()}/${bookingUid}`, {
    headers: getApiHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch booking: ${response.status}`);
  }

  return response.json();
}
