'use client';

import { useState, useEffect } from 'react';
import { TimeSlot } from '@/types';
import { getAvailableSlots } from '@/services/availabilityService';
import { SlotButton } from './SlotButton';

interface SlotListProps {
  selectedDate: Date | null;
  eventTypeId: number;
  timeZone: string;
  onSelectSlot: (slot: TimeSlot) => void;
}

export function SlotList({
  selectedDate,
  eventTypeId,
  timeZone,
  onSelectSlot,
}: SlotListProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }

    setLoading(true);
    setError(null);

    getAvailableSlots(eventTypeId, selectedDate, timeZone)
      .then((data) => {
        setSlots(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [eventTypeId, timeZone]);

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlotId(slot.id);
    onSelectSlot(slot);
  };

  if (!selectedDate) {
    return (
      <div className="text-gray-500 text-center py-8">
        Please select a date to view available times
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading available times...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Error loading slots: {error}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No available times for this date
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => (
        <SlotButton
          key={slot.id}
          slot={slot}
          isSelected={slot.id === selectedSlotId}
          onSelect={() => handleSelectSlot(slot)}
        />
      ))}
    </div>
  );
}
