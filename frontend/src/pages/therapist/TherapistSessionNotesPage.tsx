import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { therapistApi, type TherapistSessionNoteItem } from '../../api/therapist.api';
import TherapistBadge from '../../components/therapist/dashboard/TherapistBadge';
import TherapistButton from '../../components/therapist/dashboard/TherapistButton';
import TherapistCard from '../../components/therapist/dashboard/TherapistCard';
import {
  TherapistEmptyState,
  TherapistErrorState,
  TherapistLoadingState,
} from '../../components/therapist/dashboard/TherapistDataState';
import TherapistPageShell from '../../components/therapist/dashboard/TherapistPageShell';
import TherapistTable from '../../components/therapist/dashboard/TherapistTable';

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function TherapistSessionNotesPage() {
  const [rows, setRows] = useState<TherapistSessionNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await therapistApi.getSessionNotes();
      setRows(res.items || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session notes';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  return (
    <TherapistPageShell title="Session Notes" subtitle="Create and manage clinical session documentation.">
      {loading ? (
        <TherapistLoadingState title="Loading notes" description="Fetching submitted and pending notes." />
      ) : error ? (
        <TherapistErrorState title="Could not load notes" description={error} onRetry={() => void loadNotes()} />
      ) : rows.length === 0 ? (
        <TherapistEmptyState title="No notes found" description="Completed sessions without notes will appear here." />
      ) : (
        <TherapistCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-800">Pending and submitted notes</p>
            <TherapistButton className="w-full sm:w-auto">
              <FileText className="h-4 w-4" />
              Write Note
            </TherapistButton>
          </div>
          <TherapistTable
            columns={[
              { key: 'patient', header: 'Patient', render: (row) => <span className="font-semibold">{row.patientName}</span> },
              { key: 'session', header: 'Session', render: (row) => formatDateTime(row.sessionAt) },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <TherapistBadge label={row.status === 'submitted' ? 'Submitted' : 'Pending'} variant={row.status === 'submitted' ? 'success' : 'warning'} />,
              },
              {
                key: 'action',
                header: 'Action',
                render: (row) => (
                  <TherapistButton variant="secondary" className="min-h-[34px] px-3 py-1 text-xs">
                    {row.status === 'submitted' ? 'View Note' : 'Write Note'}
                  </TherapistButton>
                ),
              },
            ]}
            rows={rows}
            rowKey={(row) => row.id}
          />
        </TherapistCard>
      )}
    </TherapistPageShell>
  );
}
