import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronRight } from 'lucide-react';

interface TimePickerStepProps {
  onNext: (availabilityPrefs: {
    daysOfWeek: number[];
    timeSlots: Array<{ startMinute: number; endMinute: number }>;
  }) => void;
  onCancel: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { label: 'Morning (9 AM - 12 PM)', startMinute: 9 * 60, endMinute: 12 * 60, key: 'morning' },
  { label: 'Afternoon (12 PM - 5 PM)', startMinute: 12 * 60, endMinute: 17 * 60, key: 'afternoon' },
  { label: 'Evening (6 PM - 9 PM)', startMinute: 18 * 60, endMinute: 21 * 60, key: 'evening' },
];

export default function TimePickerStep({ onNext, onCancel }: TimePickerStepProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const toggleTimeSlot = (key: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const handleNext = () => {
    if (selectedDays.length === 0 || selectedTimeSlots.length === 0) {
      return;
    }

    const timeSlots = TIME_SLOTS.filter((slot) => selectedTimeSlots.includes(slot.key)).map(
      (slot) => ({
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
      })
    );

    onNext({
      daysOfWeek: selectedDays,
      timeSlots,
    });
  };

  const isComplete = selectedDays.length > 0 && selectedTimeSlots.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
            1
          </div>
          <h3 className="text-lg font-semibold text-charcoal">When are you available?</h3>
        </div>
        <p className="text-sm text-charcoal/60 ml-10">Select your preferred days and times</p>
      </div>

      {/* Days Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-charcoal/40" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-charcoal/50">Days</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DAYS.map((day, index) => (
            <button
              key={index}
              onClick={() => toggleDay(index)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                selectedDays.includes(index)
                  ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                  : 'border-calm-sage/20 text-charcoal/70 hover:border-teal-300 hover:bg-teal-50/30'
              }`}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots Selection */}
      {selectedDays.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-charcoal/40" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-charcoal/50">Times</h4>
          </div>
          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.key}
                onClick={() => toggleTimeSlot(slot.key)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all ${
                  selectedTimeSlots.includes(slot.key)
                    ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                    : 'border-calm-sage/20 text-charcoal/70 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {isComplete && (
        <div className="rounded-xl border border-calm-sage/15 bg-white/50 p-4 animate-in slide-in-from-bottom-4 duration-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 mb-2">Summary</p>
          <div className="text-sm text-charcoal">
            <p className="font-medium">
              {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} • {selectedTimeSlots.length} time
              {selectedTimeSlots.length !== 1 ? 's' : ''}
            </p>
            <p className="text-charcoal/60 text-xs mt-1">
              {selectedDays.map((d) => DAYS[d]).join(', ')}
            </p>
            <p className="text-charcoal/60 text-xs mt-1">
              {selectedTimeSlots.map((t) => TIME_SLOTS.find((s) => s.key === t)?.label).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-calm-sage/20 px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-calm-sage/5"
        >
          Cancel
        </button>
        <button
          onClick={handleNext}
          disabled={!isComplete}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            isComplete
              ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-sm'
              : 'bg-calm-sage/10 text-charcoal/40 cursor-not-allowed'
          }`}
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
