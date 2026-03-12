import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface CalendarSelectionProps {
  onDateTimeSelect: (date: Date, time: string) => void;
  onCancel: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  availableCount: number;
}

type SelectionStep = 'calendar' | 'time-slots';

export default function CalendarSelection({ onDateTimeSelect, onCancel }: CalendarSelectionProps) {
  const [step, setStep] = useState<SelectionStep>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get calendar days for current month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const isDateAvailable = (day: number): boolean => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const isDateSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    if (isDateAvailable(day)) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setSelectedDate(date);
      setStep('time-slots');
      setSelectedTime(null);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Mock time slots
  const timeSlots: TimeSlot[] = [
    { startTime: '09:00', endTime: '09:30', availableCount: 3 },
    { startTime: '10:00', endTime: '10:30', availableCount: 2 },
    { startTime: '14:00', endTime: '14:30', availableCount: 5 },
    { startTime: '15:00', endTime: '15:30', availableCount: 1 },
    { startTime: '18:00', endTime: '18:30', availableCount: 4 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Calendar Step */}
      {step === 'calendar' && (
        <div className="space-y-4">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg p-2 hover:bg-calm-sage/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-charcoal" />
            </button>
            <h3 className="text-lg font-semibold text-charcoal">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="rounded-lg p-2 hover:bg-calm-sage/10 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-charcoal" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-charcoal/60 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const available = isDateAvailable(day);
              const selected = isDateSelected(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  disabled={!available}
                  className={`relative rounded-lg py-2 text-sm font-medium transition-all ${
                    selected
                      ? 'bg-teal-500 text-white shadow-md'
                      : available
                      ? 'bg-calm-sage/10 text-charcoal hover:bg-teal-50 hover:border-teal-300'
                      : 'text-charcoal/30 cursor-not-allowed'
                  } border border-transparent hover:border-teal-300`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Slots Step */}
      {step === 'time-slots' && selectedDate && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-charcoal/60 mb-4">
              Available times for{' '}
              <span className="font-semibold text-charcoal">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.startTime}
                  onClick={() => {
                    setSelectedTime(slot.startTime);
                    onDateTimeSelect(selectedDate, slot.startTime);
                  }}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                    selectedTime === slot.startTime
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-calm-sage/20 hover:border-teal-300 hover:bg-teal-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <span className="font-semibold text-charcoal">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <span className="text-xs text-charcoal/60">
                      {slot.availableCount} provider{slot.availableCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setStep('calendar')}
            className="w-full rounded-lg px-4 py-2 border border-calm-sage/20 text-charcoal font-medium hover:bg-calm-sage/5 transition-colors"
          >
            ← Back to Calendar
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {step === 'calendar' && (
        <button
          onClick={onCancel}
          className="w-full rounded-lg px-4 py-2 border border-calm-sage/20 text-charcoal font-medium hover:bg-calm-sage/5 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
