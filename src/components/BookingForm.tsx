'use client';

import { useState } from 'react';
import { TimeSlot } from '@/types';

interface BookingFormProps {
  selectedSlot: TimeSlot | null;
  onSubmit: (name: string, email: string) => void;
  isSubmitting: boolean;
}

export function BookingForm({ selectedSlot, onSubmit, isSubmitting }: BookingFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && selectedSlot) {
      onSubmit(name, email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your name"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="your@email.com"
          required
        />
      </div>

      <button
        type="submit"
        disabled={!selectedSlot || isSubmitting}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-all
          ${
            !selectedSlot || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {isSubmitting
          ? 'Booking...'
          : selectedSlot
            ? `Book ${selectedSlot.displayTime}`
            : 'Select a time'}
      </button>
    </form>
  );
}
