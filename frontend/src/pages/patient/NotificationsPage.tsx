import { useEffect, useState } from 'react';
import { patientApi } from '../../api/patient';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const load = async () => {
    const response = await patientApi.getNotifications();
    const payload = response.data ?? response;
    setNotifications(payload || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const markAsRead = async (id: string) => {
    await patientApi.markNotificationRead(id);
    await load();
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <h1 className="font-serif text-3xl font-light md:text-4xl">Notifications</h1>

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-charcoal/60">No notifications yet.</p>
          ) : (
            notifications.map((item) => (
              <article key={item.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-calm-sage/15 p-3">
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-charcoal/60">{item.message}</p>
                </div>
                {!item.is_read ? (
                  <button
                    type="button"
                    onClick={() => markAsRead(item.id)}
                    className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs"
                  >
                    Mark as read
                  </button>
                ) : (
                  <span className="text-xs text-charcoal/50">Read</span>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
