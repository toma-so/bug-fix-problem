'use client';

import { useState, useEffect } from 'react';
import { CalcomBooking } from '@/types';
import { getUserBookings } from '@/services/bookingService';
import { formatInTimeZone } from 'date-fns-tz';
import { format, startOfDay, endOfDay } from 'date-fns';

interface BookingsListProps {
  timeZone: string;
  selectedDate?: Date | null;
  refreshTrigger?: number;
}

export function BookingsList({ timeZone, selectedDate, refreshTrigger }: BookingsListProps) {
  const [bookings, setBookings] = useState<CalcomBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Build date filters for the selected day
    let afterStart: string | undefined;
    let beforeEnd: string | undefined;
    
    if (selectedDate) {
      // Filter to just this day
      afterStart = startOfDay(selectedDate).toISOString();
      beforeEnd = endOfDay(selectedDate).toISOString();
    }

    getUserBookings(afterStart, beforeEnd)
      .then((data) => {
        // Sort by start time
        const sorted = data.sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );
        setBookings(sorted);
      })
      .finally(() => setLoading(false));
  }, [refreshTrigger, selectedDate]);

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading bookings...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        {selectedDate
          ? `No bookings for ${format(selectedDate, 'MMM d, yyyy')}`
          : 'No bookings yet'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2">
        Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        {selectedDate && ` for ${format(selectedDate, 'MMM d')}`}
      </p>
      {bookings.map((booking) => (
        <div
          key={booking.uid}
          className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-800 text-sm">{booking.title}</p>
              <p className="text-sm text-gray-600">
                {formatInTimeZone(booking.start, timeZone, 'EEE, MMM d')} at{' '}
                <span className="font-medium">
                  {formatInTimeZone(booking.start, timeZone, 'h:mm a')}
                </span>
              </p>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                booking.status === 'accepted'
                  ? 'bg-green-100 text-green-700'
                  : booking.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {booking.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
