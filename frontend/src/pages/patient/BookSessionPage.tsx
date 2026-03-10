import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientApi } from '../../api/patient';

const loadRazorpayScript = async (): Promise<boolean> => {
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BookSessionPage() {
  const { providerId = '' } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any>(null);
  const [slot, setSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) return;
    (async () => {
      const res = await patientApi.getProvider(providerId);
      const p = res.data ?? res;
      setProvider(p);
      if (p.available_slots?.[0]) setSlot(String(p.available_slots[0]));
    })();
  }, [providerId]);

  const amountMinor = useMemo(() => Number(provider?.session_rate || 150000), [provider]);
  const canUseDevPaidFlow = import.meta.env.DEV;

  const onDevMarkAsPaid = async () => {
    if (!providerId || !slot) return;
    setLoading(true);
    setError(null);

    try {
      const initRes = await patientApi.bookSession({ providerId, scheduledAt: slot, amountMinor });
      const payload = initRes.data ?? initRes;

      await patientApi.verifyPayment({
        razorpay_order_id: String(payload.order_id),
        razorpay_payment_id: `devpay_${Date.now()}`,
        razorpay_signature: 'dev_signature_bypass',
      });

      navigate('/patient/sessions');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Dev payment simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const onBook = async () => {
    if (!providerId || !slot) return;
    setLoading(true);
    setError(null);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        setError('Unable to load Razorpay checkout. Please try again.');
        return;
      }

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key) {
        setError('Razorpay key is not configured in frontend environment.');
        return;
      }

      const initRes = await patientApi.bookSession({ providerId, scheduledAt: slot, amountMinor });
      const payload = initRes.data ?? initRes;

      const options = {
        key,
        amount: Number(payload.amount),
        currency: String(payload.currency || 'INR'),
        name: 'MANAS360',
        description: 'Therapy Session Booking',
        order_id: String(payload.order_id),
        prefill: {
          name: provider?.name || 'Patient',
        },
        theme: {
          color: '#111827',
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await patientApi.verifyPayment(response);
            navigate('/patient/sessions');
          } catch (verifyError: any) {
            setError(verifyError?.response?.data?.message || 'Payment captured but verification failed.');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      if (!window.Razorpay) {
        setError('Razorpay SDK unavailable.');
        return;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!provider) return <div className="responsive-page"><div className="responsive-container">Loading booking...</div></div>;

  return (
    <div className="responsive-page">
      <div className="responsive-container section-stack">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Book Session</h1>
      {canUseDevPaidFlow && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Development mode: real Razorpay payment is optional. Use <strong>Paid (Dev)</strong> to simulate a successful payment.
        </div>
      )}
      <p>Provider: {provider.name}</p>
      <label className="block">
        <span className="mb-1 block text-sm">Select Slot</span>
        <select value={slot} onChange={(e) => setSlot(e.target.value)} className="w-full rounded border p-2">
          {(provider.available_slots || []).map((s: string) => <option key={s} value={s}>{new Date(s).toLocaleString()}</option>)}
        </select>
      </label>
      <p className="text-sm">Session Fee: ₹{(amountMinor / 100).toFixed(0)}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button disabled={loading || !slot} onClick={onBook} className="responsive-action-btn rounded-xl bg-slate-900 text-white disabled:opacity-60">{loading ? 'Processing...' : 'Proceed to Pay'}</button>
        {canUseDevPaidFlow && (
          <button
            disabled={loading || !slot}
            onClick={onDevMarkAsPaid}
            className="responsive-action-btn rounded-xl bg-emerald-700 text-white disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Paid (Dev)'}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
