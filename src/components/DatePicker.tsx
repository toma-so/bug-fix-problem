'use client';

import { format, addDays, isSameDay } from 'date-fns';

interface DatePickerProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function DatePicker({ selectedDate, onSelectDate }: DatePickerProps) {
  // Show next 7 days
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((day) => {
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={`
              flex flex-col items-center p-3 rounded-lg border min-w-[70px] transition-all
              ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }
            `}
          >
            <span className="text-xs uppercase">{format(day, 'EEE')}</span>
            <span className="text-lg font-semibold">{format(day, 'd')}</span>
          </button>
        );
      })}
    </div>
  );
}
