import { useEffect, useMemo, useState } from 'react';
import { patientApi } from '../../api/patient';

const plans = [
  { name: 'Per Session', price: '₹1500 / session', active: true },
  { name: 'Monthly Therapy Plan', price: '₹4999 / month', active: false },
  { name: 'Corporate Sponsored Plan', price: 'Provided by employer', active: false },
];

export default function BillingPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const response = await patientApi.getSessionHistory();
      const payload = response.data ?? response;
      setSessions(payload || []);
    })();
  }, []);

  const paidCount = useMemo(() => sessions.filter((item) => item.payment_status === 'PAID').length, [sessions]);

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <h1 className="font-serif text-3xl font-light md:text-4xl">Billing & Subscriptions</h1>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`rounded-2xl border p-4 ${plan.active ? 'border-calm-sage bg-calm-sage/10' : 'border-calm-sage/15 bg-white/85'}`}>
            <p className="text-sm font-semibold">{plan.name}</p>
            <p className="mt-1 text-sm text-charcoal/70">{plan.price}</p>
            <button type="button" className="mt-3 inline-flex min-h-[36px] items-center rounded-full border border-calm-sage/25 px-3 text-xs font-medium text-charcoal/75">
              {plan.active ? 'Active Plan' : 'Upgrade'}
            </button>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
        <h2 className="text-base font-semibold">Payment History</h2>
        <p className="mt-1 text-sm text-charcoal/65">Paid sessions: {paidCount}</p>

        <div className="mt-4 space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-charcoal/60">No payments yet.</p>
          ) : (
            sessions.slice(0, 20).map((session) => (
              <div key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-calm-sage/15 p-3">
                <div>
                  <p className="text-sm font-medium">{new Date(session.scheduled_at).toLocaleString()}</p>
                  <p className="text-xs text-charcoal/60">{session.provider?.name || 'Therapist'} • {session.payment_status || 'PENDING'}</p>
                </div>
                <button type="button" className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs font-medium text-charcoal/75">
                  Download Invoice
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
