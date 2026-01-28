'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DatePicker } from './DatePicker';
import { SlotList } from './SlotList';
import { BookingForm } from './BookingForm';
import { BookingsList } from './BookingsList';
import { TimeSlot } from '@/types';
import { bookAppointment } from '@/services/bookingService';
import { format, parseISO } from 'date-fns';

// This would typically come from config or URL params
const EVENT_TYPE_ID = 123;

export function SchedulerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial date from URL or default to today
  const getInitialDate = (): Date => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        return parseISO(dateParam);
      } catch {
        return new Date();
      }
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(getInitialDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Update URL when date changes
  const updateUrlWithDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('date', dateStr);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Clear slot selection when date changes
    setBookingError(null);
    updateUrlWithDate(date);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setBookingError(null);
  };

  const handleSubmitBooking = async (name: string, email: string) => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const result = await bookAppointment(
        EVENT_TYPE_ID,
        selectedSlot,
        name,
        email,
        userTimeZone
      );

      if (result.success) {
        setBookingComplete(true);
        setBookingsRefreshKey((k) => k + 1); // Refresh bookings list
      } else {
        setBookingError(result.error || 'Booking failed');
      }
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingComplete) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600">
          Your appointment has been scheduled for {selectedSlot?.displayTime}.
        </p>
        <button
          onClick={() => {
            setBookingComplete(false);
            setSelectedDate(new Date());
            setSelectedSlot(null);
            updateUrlWithDate(new Date());
          }}
          className="mt-6 px-4 py-2 text-blue-600 hover:underline"
        >
          Book another appointment
        </button>

        <div className="mt-8 text-left">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Bookings</h3>
          <BookingsList timeZone={userTimeZone} refreshTrigger={bookingsRefreshKey} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Booking form */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Book an Appointment</h1>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Select a date</h2>
            <DatePicker selectedDate={selectedDate} onSelectDate={handleSelectDate} />
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">
              Available times
              {selectedDate && (
                <span className="ml-2 text-gray-400 font-normal">
                  ({format(selectedDate, 'MMM d, yyyy')})
                </span>
              )}
            </h2>
            <SlotList
              selectedDate={selectedDate}
              eventTypeId={EVENT_TYPE_ID}
              timeZone={userTimeZone}
              onSelectSlot={handleSelectSlot}
            />
          </div>

          {bookingError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {bookingError}
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-3">Your details</h2>
            <BookingForm
              selectedSlot={selectedSlot}
              onSubmit={handleSubmitBooking}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>

        {/* Right column - Bookings list */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Bookings for {selectedDate ? format(selectedDate, 'MMM d') : 'Selected Day'}
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Timezone: {userTimeZone}
          </p>
          <BookingsList 
            timeZone={userTimeZone} 
            selectedDate={selectedDate}
            refreshTrigger={bookingsRefreshKey} 
          />
        </div>
      </div>
    </div>
  );
}
