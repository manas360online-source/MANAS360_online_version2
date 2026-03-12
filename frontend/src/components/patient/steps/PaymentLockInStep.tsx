import { useEffect, useState } from 'react';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { patientApi } from '../../../api/patient';

interface PaymentLockInStepProps {
  appointmentRequestId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentPendingRequest {
  id: string;
  providerId: string;
  providerName: string;
  scheduledAt: string;
  paymentDeadlineAt: string;
  amountMinor: number;
  timeRemaining: number;
}

export default function PaymentLockInStep({
  appointmentRequestId,
  onSuccess,
  onCancel,
}: PaymentLockInStepProps) {
  const [paymentRequest, setPaymentRequest] = useState<PaymentPendingRequest | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment request details
  useEffect(() => {
    const fetchPaymentRequest = async () => {
      try {
        setLoading(true);
        const result = await patientApi.getPaymentPendingRequest();
        if (result.hasPaymentPending && result.request) {
          setPaymentRequest(result.request);
        } else {
          setError('Payment request not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentRequest();
  }, [appointmentRequestId]);

  // Timer countdown
  useEffect(() => {
    if (!paymentRequest) return;

    const updateTimer = () => {
      const now = new Date();
      const deadline = new Date(paymentRequest.paymentDeadlineAt);
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Payment deadline expired');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentRequest]);

  const handlePayment = async () => {
    if (!paymentRequest) return;

    try {
      setPaying(true);
      setError(null);

      // TODO: Integrate with actual Razorpay API to create order
      // For now, show success after 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
        <p className="text-sm text-charcoal/60">Loading payment details...</p>
      </div>
    );
  }

  if (!paymentRequest) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Payment Request Not Found</p>
            <p className="text-sm text-red-700 mt-1">
              {error || 'Unable to retrieve payment details. Please try again.'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-full rounded-lg border border-calm-sage/20 px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-calm-sage/5"
        >
          Close
        </button>
      </div>
    );
  }

  const sessionDate = new Date(paymentRequest.scheduledAt);
  const isExpired = new Date(paymentRequest.paymentDeadlineAt) <= new Date();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
            4
          </div>
          <h3 className="text-lg font-semibold text-charcoal">Confirm & Pay</h3>
        </div>
        <p className="text-sm text-charcoal/60 ml-10">Provider accepted your request</p>
      </div>

      {/* Status Card - Provider Accepted */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">Provider Accepted</span>
        </div>
        <p className="text-sm text-emerald-800">
          <strong>{paymentRequest.providerName}</strong> has accepted your appointment request.
        </p>
      </div>

      {/* Session Details Card */}
      <div className="rounded-xl border border-calm-sage/15 bg-white/50 p-5 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">Session Details</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-charcoal/60">Provider</span>
            <span className="font-semibold text-charcoal">{paymentRequest.providerName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-charcoal/60">Date & Time</span>
            <span className="font-semibold text-charcoal">
              {sessionDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              @ {sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-charcoal/60">Duration</span>
            <span className="font-semibold text-charcoal">50 minutes</span>
          </div>

          <div className="my-3 border-t border-dashed border-calm-sage/30" />

          <div className="flex justify-between items-center">
            <span className="text-charcoal/60">Amount</span>
            <span className="text-xl font-bold text-teal-600">
              ₹{(paymentRequest.amountMinor / 100).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Deadline */}
      {!isExpired && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 flex gap-3 animate-in slide-in-from-top-4 duration-300">
          <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Payment Due</p>
            <p className="text-sm font-semibold text-orange-700 mt-1">{timeRemaining}</p>
            <p className="text-xs text-orange-600 mt-1">
              Must pay by {new Date(paymentRequest.paymentDeadlineAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Expired State */}
      {isExpired && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Payment Deadline Expired</p>
            <p className="text-sm text-red-700 mt-1">
              Unfortunately, the payment deadline has passed. The booking has been cancelled.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-calm-sage/15 bg-white/50 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">Important</p>
        <ul className="space-y-1 text-xs text-charcoal/70">
          <li>• Payment secures your slot</li>
          <li>• Session starts after payment</li>
          <li>• You'll receive video link via email</li>
          <li>• Cancel anytime before 24 hours</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        {!isExpired && (
          <>
            <button
              onClick={onCancel}
              disabled={paying}
              className="flex-1 rounded-lg border border-calm-sage/20 px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-calm-sage/5 disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={handlePayment}
              disabled={paying}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-teal-600 disabled:bg-teal-400 shadow-sm"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ₹{(paymentRequest.amountMinor / 100).toFixed(0)}
                </>
              )}
            </button>
          </>
        )}

        {isExpired && (
          <button
            onClick={onCancel}
            className="w-full rounded-lg border border-calm-sage/20 px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-calm-sage/5"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
