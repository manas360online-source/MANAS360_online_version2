import { useEffect, useState } from 'react';
import { therapistApi, type TherapistAnalyticsSummary } from '../../api/therapist.api';
import TherapistCard from '../../components/therapist/dashboard/TherapistCard';
import {
  TherapistErrorState,
  TherapistLoadingState,
} from '../../components/therapist/dashboard/TherapistDataState';
import TherapistPageShell from '../../components/therapist/dashboard/TherapistPageShell';

export default function TherapistAnalyticsPage() {
  const [summary, setSummary] = useState<TherapistAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await therapistApi.getAnalyticsSummary();
      setSummary(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  if (loading) {
    return (
      <TherapistPageShell title="Analytics" subtitle="Track outcomes and engagement trends for your care panel.">
        <TherapistLoadingState title="Loading analytics" description="Fetching therapist performance summary." />
      </TherapistPageShell>
    );
  }

  if (error || !summary) {
    return (
      <TherapistPageShell title="Analytics" subtitle="Track outcomes and engagement trends for your care panel.">
        <TherapistErrorState title="Could not load analytics" description={error || 'Analytics summary unavailable.'} onRetry={() => void loadSummary()} />
      </TherapistPageShell>
    );
  }

  return (
    <TherapistPageShell title="Analytics" subtitle="Track outcomes and engagement trends for your care panel.">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TherapistCard className="p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Session Completion</p>
          <p className="mt-2 font-display text-3xl font-bold text-sage-500">{summary.completionRate.toFixed(1)}%</p>
        </TherapistCard>
        <TherapistCard className="p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Completed Sessions</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-800">{summary.sessions}</p>
        </TherapistCard>
        <TherapistCard className="p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-ink-500">Avg Session Duration</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-800">{summary.avgMinutes.toFixed(1)} min</p>
        </TherapistCard>
      </section>

      <TherapistCard className="p-5">
        <h3 className="font-display text-base font-bold text-ink-800">Outcome Insights</h3>
        <p className="mt-2 text-sm text-ink-500">
          {summary.completion} out of {summary.total} tracked sessions were completed in the selected period.
          Continue focusing on timely follow-up for incomplete sessions.
        </p>
      </TherapistCard>
    </TherapistPageShell>
  );
}
