// API Configuration

export const config = {
  // Base URL for API routes
  baseUrl: typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3000',
  
  // Default event type ID
  eventTypeId: 123,
  
  // The calendar owner's timezone (where they are located)
  hostTimezone: 'America/Chicago',
  
  // Business hours (in the host's local time)
  businessHours: {
    start: 9,  // 9 AM
    end: 17,   // 5 PM
  },
};

// Helper to get the full API URL for slots
export function getSlotsApiUrl(): string {
  return `${config.baseUrl}/api/slots`;
}

// Helper to get the full API URL for bookings
export function getBookingsApiUrl(): string {
  return `${config.baseUrl}/api/bookings`;
}

// Get headers for API requests
export function getApiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}
