// API response types
export interface CalcomSlotResponse {
  status: 'success' | 'error';
  data: CalcomSlot[];
  nextCursor?: string;
}

export interface CalcomSlot {
  time: string; // ISO 8601 UTC string, e.g., "2025-01-28T14:00:00Z"
}

export interface CalcomBookingResponse {
  status: 'success' | 'error';
  data: CalcomBooking;
}

export interface CalcomBooking {
  id: number;
  uid: string;
  title: string;
  start: string; // ISO 8601 UTC
  end: string; // ISO 8601 UTC
  duration: number; // Duration in minutes (30 or 60)
  status: 'accepted' | 'pending' | 'cancelled';
  attendees: Array<{
    name: string;
    email: string;
    timeZone: string;
  }>;
}

// Internal app types
export interface TimeSlot {
  id: string;
  startUtc: string; // Original UTC time from API
  displayTime: string; // Formatted for display in user's timezone
  available: boolean;
}

export interface BookingRequest {
  eventTypeId: number;
  start: string; // UTC ISO string
  duration: number; // Duration in minutes (30 or 60)
  attendee: {
    name: string;
    email: string;
    timeZone: string;
  };
}

export interface BookingResult {
  success: boolean;
  booking?: CalcomBooking;
  error?: string;
}
