import { useEffect, useMemo, useState } from 'react';
import { therapistApi, type TherapistMessageItem } from '../../api/therapist.api';
import TherapistBadge from '../../components/therapist/dashboard/TherapistBadge';
import TherapistCard from '../../components/therapist/dashboard/TherapistCard';
import {
  TherapistEmptyState,
  TherapistErrorState,
  TherapistLoadingState,
} from '../../components/therapist/dashboard/TherapistDataState';
import TherapistPageShell from '../../components/therapist/dashboard/TherapistPageShell';

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export default function TherapistMessagesPage() {
  const [rows, setRows] = useState<TherapistMessageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await therapistApi.getMessages();
      setRows(res.items || []);
      setUnreadCount(res.unreadCount || 0);
      setSelectedId((current) => current || res.items?.[0]?.id || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const selected = useMemo(() => rows.find((item) => item.id === selectedId) || null, [rows, selectedId]);

  return (
    <TherapistPageShell title="Messages" subtitle="Stay connected with your patients and follow-up promptly.">
      {loading ? (
        <TherapistLoadingState title="Loading messages" description="Fetching your latest notifications and conversations." />
      ) : error ? (
        <TherapistErrorState title="Could not load messages" description={error} onRetry={() => void loadMessages()} />
      ) : rows.length === 0 ? (
        <TherapistEmptyState title="No messages yet" description="New patient and platform messages will appear here." />
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <TherapistCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <h3 className="font-display text-sm font-bold text-ink-800">Conversations</h3>
              <TherapistBadge variant={unreadCount > 0 ? 'danger' : 'default'} label={`${unreadCount} unread`} />
            </div>
            <div className="divide-y divide-ink-100/60">
              {rows.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedId(chat.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-bg ${selectedId === chat.id ? 'bg-sage-50/30' : ''}`}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sage-50 font-display text-xs font-bold text-sage-500">
                    {chat.title.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-800">{chat.title}</span>
                    <span className="block truncate text-xs text-ink-500">{chat.text}</span>
                  </span>
                  <span className="text-[10px] text-ink-500">{formatTime(chat.createdAt)}</span>
                </button>
              ))}
            </div>
          </TherapistCard>

          <TherapistCard className="flex min-h-[420px] flex-col">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <h3 className="font-display text-sm font-bold text-ink-800">{selected?.title || 'Conversation'}</h3>
              <TherapistBadge variant={selected?.isRead ? 'default' : 'sage'} label={selected?.isRead ? 'Read' : 'Unread'} />
            </div>

            <div className="flex-1 space-y-3 bg-surface-bg px-4 py-4">
              <div className="max-w-[90%] rounded-xl bg-surface-card px-3 py-2 text-sm text-ink-800 shadow-soft-xs">
                {selected?.text || 'Select a message to view details.'}
              </div>
            </div>
          </TherapistCard>
        </section>
      )}
    </TherapistPageShell>
  );
}
