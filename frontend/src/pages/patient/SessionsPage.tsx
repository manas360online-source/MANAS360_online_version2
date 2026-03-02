import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api/patient';

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [u, h] = await Promise.all([patientApi.getUpcomingSessions(), patientApi.getSessionHistory()]);
      setUpcoming((u.data ?? u) || []);
      setHistory((h.data ?? h) || []);
    })();
  }, []);

  const completed = history.filter((session) => session.status === 'completed');
  const cancelled = history.filter((session) => session.status === 'cancelled');

  const visibleSessions =
    activeTab === 'upcoming'
      ? upcoming
      : activeTab === 'completed'
        ? completed
        : cancelled;

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <h1 className="font-serif text-3xl font-light md:text-4xl">Sessions</h1>

      <div className="inline-flex rounded-full border border-calm-sage/20 bg-white/80 p-1">
        {[
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'completed', label: `Completed (${completed.length})` },
          { key: 'cancelled', label: `Cancelled (${cancelled.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium md:text-sm ${
              activeTab === tab.key
                ? 'bg-calm-sage text-white'
                : 'text-charcoal/70 hover:bg-calm-sage/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="space-y-3">
        {visibleSessions.length === 0 ? (
          <div className="rounded-2xl border border-calm-sage/15 bg-white/80 p-5 text-sm text-charcoal/60">
            No sessions in this tab.
          </div>
        ) : (
          visibleSessions.map((session) => (
            <article key={session.id} className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-charcoal/60">{new Date(session.scheduled_at).toLocaleString()}</p>
                  <h2 className="mt-0.5 text-base font-semibold text-charcoal">{session.provider?.name || 'Therapist'}</h2>
                  <p className="text-sm text-charcoal/65">Mode: Video • Status: {session.status}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/patient/sessions/${session.id}`} className="inline-flex min-h-[38px] items-center rounded-full border border-calm-sage/25 px-4 text-xs font-medium text-charcoal/70 md:text-sm">
                    Details
                  </Link>
                  {activeTab === 'upcoming' && session.agora_channel && session.agora_token ? (
                    <Link to={`/patient/sessions/${session.id}/live`} className="inline-flex min-h-[38px] items-center rounded-full bg-charcoal px-4 text-xs font-medium text-cream md:text-sm">
                      Join
                    </Link>
                  ) : null}
                  <button type="button" className="inline-flex min-h-[38px] items-center rounded-full border border-calm-sage/25 px-4 text-xs font-medium text-charcoal/70 md:text-sm">
                    Session Notes
                  </button>
                  <button type="button" className="inline-flex min-h-[38px] items-center rounded-full border border-calm-sage/25 px-4 text-xs font-medium text-charcoal/70 md:text-sm">
                    Download Invoice
                  </button>
                  {activeTab === 'completed' ? (
                    <button type="button" className="inline-flex min-h-[38px] items-center rounded-full border border-calm-sage/25 px-4 text-xs font-medium text-charcoal/70 md:text-sm">
                      Feedback
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
