import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../api/patient';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [moodValue, setMoodValue] = useState<number>(3);
  const [savingMood, setSavingMood] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashboardRes, historyRes] = await Promise.all([
          patientApi.getDashboard(),
          patientApi.getSessionHistory(),
        ]);
        const dashboard = dashboardRes.data ?? dashboardRes;
        const history = historyRes.data ?? historyRes;
        setData(dashboard);
        setSessionHistory(history || []);

        if (dashboard?.recentMoodLogs?.[0]?.moodScore) {
          setMoodValue(Number(dashboard.recentMoodLogs[0].moodScore));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcoming = (data?.upcomingSessions || []) as any[];
  const nextSession = upcoming[0] || null;

  const canJoinNow = useMemo(() => {
    if (!nextSession?.scheduledAt) return false;
    const startsAt = new Date(nextSession.scheduledAt).getTime();
    const now = Date.now();
    const fiveMinutesBefore = startsAt - 5 * 60 * 1000;
    return now >= fiveMinutesBefore && Boolean(nextSession.agoraChannel);
  }, [nextSession]);

  const completedSessions = useMemo(
    () => sessionHistory.filter((session) => session.status === 'completed').length,
    [sessionHistory],
  );

  const moodTrendValues = useMemo(() => {
    const logs = [...(data?.recentMoodLogs || [])].reverse();
    return logs.slice(-30).map((log: any) => Number(log.moodScore ?? log.mood ?? 0));
  }, [data]);

  const onSaveMood = async () => {
    setSavingMood(true);
    try {
      await patientApi.addMood({ mood: moodValue });
      const refreshed = await patientApi.getDashboard();
      setData(refreshed.data ?? refreshed);
    } finally {
      setSavingMood(false);
    }
  };

  if (loading) return <div className="rounded-2xl border border-calm-sage/15 bg-white/80 p-6">Loading dashboard...</div>;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm md:p-6">
        <p className="text-sm text-charcoal/65">Welcome back</p>
        <h1 className="mt-1 font-serif text-3xl font-light md:text-4xl">How are you feeling today?</h1>

        <div className="mt-5 rounded-xl border border-calm-sage/15 bg-cream/70 p-4">
          <p className="text-sm font-medium text-charcoal/80">Quick mood check (1–5)</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMoodValue(value)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                  moodValue === value
                    ? 'bg-calm-sage text-white'
                    : 'bg-white text-charcoal/70 hover:bg-calm-sage/10'
                }`}
                aria-label={`Set mood value to ${value}`}
              >
                {value}
              </button>
            ))}
            <button
              type="button"
              onClick={onSaveMood}
              disabled={savingMood}
              className="ml-1 inline-flex min-h-[40px] items-center rounded-full bg-charcoal px-4 text-sm font-medium text-cream disabled:opacity-60"
            >
              {savingMood ? 'Saving...' : 'Save mood'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm xl:col-span-2">
          <h2 className="text-base font-semibold">Next Session</h2>
          {!nextSession ? (
            <p className="mt-2 text-sm text-charcoal/60">No upcoming session booked yet.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-charcoal/75">Therapist: <span className="font-medium text-charcoal">{nextSession.provider?.name || 'Assigned Therapist'}</span></p>
              <p className="text-sm text-charcoal/75">Date & Time: <span className="font-medium text-charcoal">{new Date(nextSession.scheduledAt).toLocaleString()}</span></p>

              <div className="mt-4 flex flex-wrap gap-2">
                {canJoinNow ? (
                  <Link
                    to={`/patient/sessions/${nextSession.id}/live`}
                    className="inline-flex min-h-[40px] items-center rounded-full bg-charcoal px-4 text-sm font-medium text-cream"
                  >
                    Join Session
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-[40px] items-center rounded-full bg-charcoal/40 px-4 text-sm font-medium text-cream"
                  >
                    Join (enabled 5 mins before)
                  </button>
                )}
                <button type="button" disabled className="inline-flex min-h-[40px] items-center rounded-full border border-calm-sage/30 px-4 text-sm text-charcoal/60">
                  Reschedule
                </button>
                <button type="button" disabled className="inline-flex min-h-[40px] items-center rounded-full border border-calm-sage/30 px-4 text-sm text-charcoal/60">
                  Cancel
                </button>
              </div>
            </>
          )}
        </article>

        <article className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
          <h2 className="text-base font-semibold">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <Link to="/patient/providers" className="rounded-xl border border-calm-sage/20 px-3 py-2 text-sm hover:bg-calm-sage/10">➕ Book Session</Link>
            <Link to="/patient/documents" className="rounded-xl border border-calm-sage/20 px-3 py-2 text-sm hover:bg-calm-sage/10">🧾 View Prescription</Link>
            <Link to="/assessment" className="rounded-xl border border-calm-sage/20 px-3 py-2 text-sm hover:bg-calm-sage/10">📊 Take Assessment</Link>
            <Link to="/patient/messages" className="rounded-xl border border-calm-sage/20 px-3 py-2 text-sm hover:bg-calm-sage/10">💬 Chat with Therapist</Link>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <article className="rounded-2xl border border-calm-sage/15 bg-white/85 p-4 shadow-soft-sm">
          <p className="text-xs uppercase tracking-wider text-charcoal/50">Sessions Completed</p>
          <p className="mt-1 text-2xl font-semibold">{completedSessions}</p>
        </article>
        <article className="rounded-2xl border border-calm-sage/15 bg-white/85 p-4 shadow-soft-sm">
          <p className="text-xs uppercase tracking-wider text-charcoal/50">Active Plan</p>
          <p className="mt-1 text-2xl font-semibold">Per Session</p>
        </article>
        <article className="rounded-2xl border border-calm-sage/15 bg-white/85 p-4 shadow-soft-sm">
          <p className="text-xs uppercase tracking-wider text-charcoal/50">Last Assessment</p>
          <p className="mt-1 text-lg font-semibold">
            {data?.lastAssessment
              ? `${data.lastAssessment.type} • ${data.lastAssessment.score}`
              : 'No data'}
          </p>
        </article>
        <article className="rounded-2xl border border-calm-sage/15 bg-white/85 p-4 shadow-soft-sm">
          <p className="text-xs uppercase tracking-wider text-charcoal/50">Trend (30d)</p>
          <div className="mt-2 flex h-10 items-end gap-1">
            {(moodTrendValues.length ? moodTrendValues : [0, 0, 0, 0, 0]).slice(-12).map((value: number, index: number) => (
              <span
                key={index}
                className="w-2.5 rounded-t bg-calm-sage/70"
                style={{ height: `${Math.max(8, value * 8)}px` }}
                aria-hidden="true"
              />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
