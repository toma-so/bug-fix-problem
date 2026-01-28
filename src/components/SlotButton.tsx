'use client';

import { TimeSlot } from '@/types';

interface SlotButtonProps {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: () => void;
}

export function SlotButton({ slot, isSelected, onSelect }: SlotButtonProps) {
  return (
    <button
      onClick={onSelect}
      disabled={!slot.available}
      className={`
        p-3 rounded-lg border text-sm font-medium transition-all
        ${
          !slot.available
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : isSelected
              ? 'bg-blue-600 text-white border-blue-700 shadow-md'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }
      `}
    >
      {slot.displayTime}
    </button>
  );
}
