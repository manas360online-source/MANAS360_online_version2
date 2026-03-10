import { useEffect, useState } from 'react';
import { patientApi } from '../../api/patient';

type ExerciseItem = {
  id: string;
  title: string;
  category?: string;
  status?: string;
  dueAt?: string | null;
  source: 'legacy-exercise' | 'treatment-plan';
};

export default function ExercisesPage() {
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [exercisesResponse, planResponse] = await Promise.allSettled([
        patientApi.getExercises(),
        patientApi.getTherapyPlan(),
      ]);

      const exerciseRows =
        exercisesResponse.status === 'fulfilled'
          ? (((exercisesResponse.value as any)?.data ?? exercisesResponse.value ?? []) as any[])
          : [];

      const therapyTasks =
        planResponse.status === 'fulfilled'
          ? ((((planResponse.value as any)?.data ?? planResponse.value ?? null) as any)?.tasks ?? [])
          : [];

      const mappedExercises: ExerciseItem[] = exerciseRows.map((item) => ({
        id: String(item.id),
        title: String(item.title || item.name || 'Therapy Exercise'),
        category: item.category ? String(item.category) : undefined,
        status: item.status ? String(item.status) : 'pending',
        dueAt: item.dueAt || null,
        source: 'legacy-exercise',
      }));

      const mappedPlanTasks: ExerciseItem[] = (Array.isArray(therapyTasks) ? therapyTasks : [])
        .filter((task) => String(task?.type || '').toLowerCase() === 'exercise')
        .map((task) => ({
          id: String(task.id),
          title: String(task.title || 'Therapy Exercise'),
          category: 'Care Plan',
          status: task.status ? String(task.status) : 'pending',
          dueAt: task.dueAt || null,
          source: 'treatment-plan',
        }));

      const merged = [...mappedExercises, ...mappedPlanTasks];

      setItems(
        merged.map((item) => ({
          id: String(item.id),
          title: String(item.title || 'Therapy Exercise'),
          category: item.category ? String(item.category) : undefined,
          status: item.status ? String(item.status) : 'pending',
          dueAt: item.dueAt || null,
          source: item.source,
        })),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load assigned exercises.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const complete = async (item: ExerciseItem) => {
    if (completingIds.includes(item.id)) return;

    setError(null);
    setCompletingIds((prev) => [...prev, item.id]);
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: 'completed',
            }
          : entry,
      ),
    );

    try {
      if (item.source === 'treatment-plan') {
        await patientApi.completeTherapyPlanTask(item.id);
      } else {
        await patientApi.completeExercise(item.id);
      }
      await load();
    } catch {
      setError('Unable to mark exercise as complete.');
      await load();
    } finally {
      setCompletingIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalItems = items.length;
  const completedItems = items.filter((item) => String(item.status || '').toLowerCase() === 'completed').length;
  const completionPercent = totalItems ? Number(((completedItems / totalItems) * 100).toFixed(1)) : 0;
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (Math.max(0, Math.min(100, completionPercent)) / 100) * ringCircumference;

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <section className="rounded-2xl border border-calm-sage/15 bg-white/90 p-5 shadow-soft-sm">
        <h1 className="font-serif text-3xl font-light md:text-4xl">Assigned Exercises</h1>
        <p className="mt-2 text-sm text-charcoal/70">Complete therapist-assigned interventions to progress your therapy plan.</p>
      </section>

      {loading ? <div className="rounded-xl border border-calm-sage/15 bg-white/90 p-4 text-sm">Loading exercises...</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-2xl border border-calm-sage/15 bg-white/90 p-5 shadow-soft-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-charcoal/55">Exercise Completion</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
              <circle cx="36" cy="36" r={ringRadius} fill="none" stroke="rgba(95, 138, 119, 0.2)" strokeWidth="8" />
              <circle
                cx="36"
                cy="36"
                r={ringRadius}
                fill="none"
                stroke="#5f8a77"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-charcoal">{Math.round(completionPercent)}%</div>
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">{completedItems} of {totalItems} complete</p>
            <p className="text-xs text-charcoal/65">Both care-plan and assigned interventions are included.</p>
          </div>
        </div>
      </section>

      {!loading && items.length === 0 ? (
        <div className="rounded-xl border border-calm-sage/15 bg-white/90 p-4 text-sm text-charcoal/70">No assigned exercises yet.</div>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-calm-sage/15 bg-white/90 p-4 shadow-soft-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-charcoal">{item.title}</p>
                <p className="text-xs text-charcoal/60">
                  {(item.category || 'General')} • {item.dueAt ? `Due ${new Date(item.dueAt).toLocaleDateString()}` : 'No due date'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-calm-sage/25 px-2 py-0.5 text-[11px] font-semibold text-charcoal/70">
                  {item.source === 'treatment-plan' ? 'CARE PLAN' : 'ASSIGNMENT'}
                </span>
                <span className="rounded-full bg-calm-sage/15 px-2 py-0.5 text-[11px] font-semibold text-calm-sage">{String(item.status || 'pending').toUpperCase()}</span>
                {String(item.status || '').toLowerCase() !== 'completed' ? (
                  <button
                    type="button"
                    onClick={() => void complete(item)}
                    disabled={completingIds.includes(item.id)}
                    className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs"
                  >
                    {completingIds.includes(item.id) ? 'Completing...' : 'Mark Complete'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
