import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';

interface CalendarBookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type BookingStep = 'calendar' | 'time-slots' | 'provider-selection' | 'confirm';

interface TimeSlot {
  startTime: string;
  endTime: string;
  availableCount: number;
}

export default function CalendarBookingFlow({ isOpen, onClose, onSuccess }: CalendarBookingFlowProps) {
  const [step, setStep] = useState<BookingStep>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!isOpen) return null;

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

  // Mock time slots - replace with API call
  const timeSlots: TimeSlot[] = [
    { startTime: '09:00', endTime: '09:30', availableCount: 3 },
    { startTime: '10:00', endTime: '10:30', availableCount: 2 },
    { startTime: '14:00', endTime: '14:30', availableCount: 5 },
    { startTime: '15:00', endTime: '15:30', availableCount: 1 },
    { startTime: '18:00', endTime: '18:30', availableCount: 4 },
  ];

  const getStepTitle = (): string => {
    const titles: Record<BookingStep, string> = {
      calendar: 'Select Date',
      'time-slots': 'Select Time',
      'provider-selection': 'Choose Provider',
      confirm: 'Confirm Booking',
    };
    return titles[step];
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-charcoal/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed top-8 left-0 right-0 z-50 flex justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-calm-sage/15 bg-white px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal">{getStepTitle()}</h2>
              <div className="flex gap-1 mt-2">
                {(['calendar', 'time-slots', 'provider-selection', 'confirm'] as BookingStep[]).map(
                  (s, i) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        step === s
                          ? 'bg-teal-500'
                          : ['calendar', 'time-slots', 'provider-selection', 'confirm'].indexOf(
                              step
                            ) > i
                            ? 'bg-teal-200'
                            : 'bg-calm-sage/15'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-charcoal/40 transition-colors hover:bg-calm-sage/10 hover:text-charcoal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Calendar Step */}
            {step === 'calendar' && (
              <div className="space-y-6 animate-in fade-in duration-300">
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
              </div>
            )}

            {/* Time Slots Step */}
            {step === 'time-slots' && selectedDate && (
              <div className="space-y-6 animate-in fade-in duration-300">
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
                          setStep('provider-selection');
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

            {/* Provider Selection Step */}
            {step === 'provider-selection' && selectedDate && selectedTime && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <p className="text-sm text-charcoal/60 mb-4">
                    Providers available on{' '}
                    <span className="font-semibold text-charcoal">
                      {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {' '}at{' '}
                    <span className="font-semibold text-charcoal">{selectedTime}</span>
                  </p>
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {[
                      {
                        id: '1',
                        name: 'Dr. Sarah Johnson',
                        type: 'Clinical Psychologist',
                        rating: 4.8,
                        fee: 99900,
                      },
                      {
                        id: '2',
                        name: 'Dr. Amit Patel',
                        type: 'Psychiatrist',
                        rating: 4.9,
                        fee: 149900,
                      },
                      {
                        id: '3',
                        name: 'Ms. Priya Sharma',
                        type: 'Therapist',
                        rating: 4.7,
                        fee: 69900,
                      },
                    ].map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => setStep('confirm')}
                        className="w-full rounded-lg border border-calm-sage/20 px-4 py-4 text-left transition-all hover:border-teal-300 hover:bg-teal-50/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-charcoal">{provider.name}</h4>
                            <p className="text-xs text-charcoal/60 mt-1">{provider.type}</p>
                            <p className="text-sm font-semibold text-teal-600 mt-2">
                              ₹{(provider.fee / 100).toFixed(0)}
                            </p>
                          </div>
                          <div className="text-xs font-semibold text-amber-600 mt-1">
                            ⭐ {provider.rating}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setStep('time-slots')}
                  className="w-full rounded-lg px-4 py-2 border border-calm-sage/20 text-charcoal font-medium hover:bg-calm-sage/5 transition-colors"
                >
                  ← Back to Times
                </button>
              </div>
            )}

            {/* Confirm Step */}
            {step === 'confirm' && selectedDate && selectedTime && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 space-y-3">
                  <div>
                    <p className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold">
                      Date & Time
                    </p>
                    <p className="text-lg font-semibold text-charcoal mt-1">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {' '}at {selectedTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold">
                      Provider
                    </p>
                    <p className="text-lg font-semibold text-charcoal mt-1">Dr. Sarah Johnson</p>
                    <p className="text-xs text-charcoal/60 mt-1">Clinical Psychologist</p>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal/60 uppercase tracking-wider font-semibold">
                      Fee
                    </p>
                    <p className="text-lg font-semibold text-teal-600 mt-1">₹999</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="w-full rounded-lg bg-teal-500 px-4 py-3 font-semibold text-white transition-all hover:bg-teal-600 active:scale-95"
                  >
                    Confirm & Proceed to Payment
                  </button>
                  <button
                    onClick={() => setStep('provider-selection')}
                    className="w-full rounded-lg px-4 py-2 border border-calm-sage/20 text-charcoal font-medium hover:bg-calm-sage/5 transition-colors"
                  >
                    ← Back to Providers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
