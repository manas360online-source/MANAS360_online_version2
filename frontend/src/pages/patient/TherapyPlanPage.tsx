
import { useEffect, useState } from 'react';
import { patientApi } from '../../api/patient';
import { CheckCircle2, PlayCircle, StickyNote, Activity, FileText, Calendar, Library } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  frequency: 'DAILY_RITUAL' | 'WEEKLY_MILESTONE' | 'ONE_TIME';
  activityType: 'MOOD_CHECKIN' | 'EXERCISE' | 'AUDIO_THERAPY' | 'CLINICAL_ASSESSMENT' | 'READING_MATERIAL' | 'SESSION_BOOKING';
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  completedAt?: string;
  estimatedMinutes?: number;
}

export default function TherapyPlanPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [completingTaskIds, setCompletingTaskIds] = useState<string[]>([]);

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientApi.getTherapyPlan();
      setPlanData((response as any)?.data ?? response ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load your Guided Recovery Journey.');
      setPlanData(null);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    setError(null);
    setCompletingTaskIds((prev) => (prev.includes(taskId) ? prev : [...prev, taskId]));

    setPlanData((prev: any) => {
      if (!prev || !Array.isArray(prev.activities)) return prev;
      return {
        ...prev,
        activities: prev.activities.map((task: any) =>
          String(task.id) === taskId
            ? { ...task, status: 'COMPLETED', completedAt: new Date().toISOString() }
            : task,
        ),
      };
    });

    try {
      await patientApi.completeTherapyPlanTask(taskId);
      await loadPlan(); // Re-sync to get official adherence percentage
    } catch {
      setError('Unable to mark activity as complete.');
      await loadPlan();
    } finally {
      setCompletingTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  useEffect(() => {
    void loadPlan();
  }, []);

  const activities: ActivityItem[] = Array.isArray(planData?.activities) ? planData.activities : [];
  const plan = planData?.plan;

  const dailyRituals = activities.filter((a) => a.frequency === 'DAILY_RITUAL');
  const weeklyMilestones = activities.filter((a) => a.frequency === 'WEEKLY_MILESTONE');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'AUDIO_THERAPY': return <PlayCircle className="h-5 w-5 text-calm-sage" />;
      case 'CLINICAL_ASSESSMENT': return <Activity className="h-5 w-5 text-calm-sage" />;
      case 'READING_MATERIAL': return <FileText className="h-5 w-5 text-calm-sage" />;
      case 'SESSION_BOOKING': return <Calendar className="h-5 w-5 text-calm-sage" />;
      default: return <CheckCircle2 className="h-5 w-5 text-calm-sage" />;
    }
  };

  const renderActivityCard = (task: ActivityItem) => {
    const isDone = task.status === 'COMPLETED';
    const isCompleting = completingTaskIds.includes(task.id);

    return (
      <div 
        key={task.id} 
        className={`group flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${isDone ? 'border-calm-sage/10 bg-white/40' : 'border-calm-sage/15 bg-white/90 shadow-soft-sm hover:shadow-soft-md'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isDone ? 'bg-calm-sage/10' : 'bg-calm-sage/15'}`}>
            {getActivityIcon(task.activityType)}
          </div>
          <div>
            <p className={`font-medium transition-all ${isDone ? 'text-charcoal/40 line-through' : 'text-charcoal'}`}>
              {task.title}
            </p>
            {task.estimatedMinutes ? (
              <p className={`mt-0.5 text-xs ${isDone ? 'text-charcoal/30' : 'text-charcoal/60'}`}>
                {task.estimatedMinutes} mins
              </p>
            ) : null}
          </div>
        </div>

        <div>
          {!isDone ? (
            <button
              type="button"
              onClick={() => void completeTask(task.id)}
              disabled={isCompleting}
              className="inline-flex h-9 items-center justify-center rounded-full bg-calm-sage/10 px-4 text-xs font-semibold text-calm-sage transition-all hover:bg-calm-sage hover:text-white disabled:opacity-50"
            >
              {isCompleting ? 'Completing...' : 'Mark Done'}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-calm-sage/10 px-3 py-1 text-xs font-semibold text-calm-sage">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-sm font-medium text-charcoal/60">Loading your journey...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20 lg:pb-8">
      
      {/* 1. Journey Header */}
      <section className="relative overflow-hidden rounded-3xl border border-calm-sage/15 bg-gradient-to-br from-white to-calm-sage/5 p-8 shadow-soft-sm">
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-calm-sage">
            Guided Recovery Pathway
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-charcoal md:text-4xl">
            {plan?.title || 'Understanding Your Triggers'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-charcoal/70">
            Welcome to week {plan?.weekNumber || 1}. We'll focus on identifying patterns in your daily life and building emotional resilience through structured practice.
          </p>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm font-medium">
              <span className="text-charcoal/80">Weekly Momentum</span>
              <span className="text-calm-sage">{plan?.adherencePercent || 0}% Complete</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-calm-sage/15">
              <div 
                className="h-full bg-calm-sage transition-all duration-1000 ease-out"
                style={{ width: `${plan?.adherencePercent || 0}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-calm-sage/10 blur-3xl" />
      </section>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* 2. Provider Note (Sticky Note UI) */}
      {(plan?.providerNote || true) && (
        <section className="relative rotate-1 transform rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 shadow-sm transition-transform hover:rotate-0">
          <div className="absolute -left-1 -top-1">
            <StickyNote className="h-6 w-6 text-amber-500/30" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/60">Note from your provider</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
            {plan?.providerNote || "I've focused this week's plan entirely on grounding. When things feel overwhelming, just start with the 5-minute audio ritual. You've got this."}
          </p>
        </section>
      )}

      {/* 3. Action Items */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* Daily Rituals */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-charcoal">Daily Rituals</h2>
            <span className="flex h-5 items-center rounded-full bg-calm-sage/15 px-2 text-[10px] font-bold uppercase tracking-wider text-calm-sage">
              Habit Builder
            </span>
          </div>
          {dailyRituals.length > 0 ? (
            <div className="space-y-3">
              {dailyRituals.map(renderActivityCard)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-calm-sage/30 p-8 text-center">
              <p className="text-sm text-charcoal/50">No daily rituals assigned for this week.</p>
            </div>
          )}
        </section>

        {/* Weekly Milestones */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-charcoal">Weekly Milestones</h2>
            <span className="flex h-5 items-center rounded-full bg-blue-500/10 px-2 text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Deep Work
            </span>
          </div>
          {weeklyMilestones.length > 0 ? (
            <div className="space-y-3">
              {weeklyMilestones.map(renderActivityCard)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-calm-sage/30 p-8 text-center">
              <p className="text-sm text-charcoal/50">No weekly milestones assigned for this week.</p>
            </div>
          )}
        </section>

      </div>

      {/* 4. Explore More / Wellness Library Stub */}
      <section className="mt-8 rounded-2xl border border-calm-sage/15 bg-white p-6 shadow-soft-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-charcoal">Wellness Library</h2>
            <p className="mt-1 text-sm text-charcoal/60">Explore unassigned content to further your journey.</p>
          </div>
          <Library className="h-8 w-8 text-calm-sage/40" />
        </div>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {/* Mock Carousel Items */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[200px] shrink-0 cursor-pointer rounded-xl border border-calm-sage/15 p-4 transition-all hover:bg-calm-sage/5 hover:shadow-soft-sm">
              <div className="mb-3 h-24 w-full rounded-lg bg-calm-sage/10 object-cover" />
              <p className="text-xs font-semibold text-calm-sage">MEDITATION</p>
              <p className="mt-1 text-sm font-medium text-charcoal">Evening Wind Down</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
