import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  CalendarDays, 
  MessageSquare, 
  ArrowRight, 
  Check, 
  Sparkles,
  Search,
  CheckCircle2,
  Bell,
  Activity
} from 'lucide-react';
import { isOnboardingRequiredError, patientApi } from '../../api/patient';
import { DashboardSkeletons } from '../../components/ui/Skeleton';

const moodEmojiMap: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

const formatDateTime = (value?: string | Date) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
};

const localDateKey = (value: Date = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameLocalDay = (value: unknown, dayKey: string) => {
  if (!value) return false;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  return localDateKey(date) === dayKey;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [moodValue, setMoodValue] = useState<number | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const [moodJustSaved, setMoodJustSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    const dashboardRes = await patientApi.getDashboardV2();
    const dashboardData = dashboardRes?.data ?? dashboardRes;

    setDashboard(dashboardData || null);

    const todayStr = localDateKey();
    const todaysMood = dashboardData?.moodTrend?.find((m: any) => isSameLocalDay(m.date, todayStr));
    if (todaysMood) {
      setMoodValue(todaysMood.score);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        await fetchDashboardData();
      } catch (err: any) {
        if (isOnboardingRequiredError(err)) {
          navigate('/patient/onboarding?next=/patient/assessments', { replace: true });
          return;
        }
        setError(err?.response?.data?.message || err?.message || 'Unable to load dashboard right now.');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const userName = dashboard?.user?.name?.split(' ')[0] || 'there';
  const upcomingSession = dashboard?.upcomingSession || null;
  const moodTrend = Array.isArray(dashboard?.moodTrend) ? dashboard.moodTrend : [];
  const exercises = Array.isArray(dashboard?.exercises) ? dashboard.exercises : [];
  const recentActivity = Array.isArray(dashboard?.recentActivity) ? dashboard.recentActivity : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const welcomeMessage = `${greeting}, ${userName}. Take a deep breath, you're doing great.`;

  const normalizedMoodTrend = useMemo(() => {
    if (!moodTrend.length) return Array.from({length: 7}, (_, i) => ({ day: String(i), score: 3 }));
    return moodTrend.slice(-7).map((item: any) => ({
      day: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' }),
      score: Number(item.score || 0),
    }));
  }, [moodTrend]);

  const avgMood = useMemo(() => {
    const total = normalizedMoodTrend.reduce((sum: number, point: any) => sum + Number(point.score || 0), 0);
    return Number((total / normalizedMoodTrend.length).toFixed(1)) || 0;
  }, [normalizedMoodTrend]);

  const onSaveMood = async (val: number) => {
    if (savingMood) return;
    setSavingMood(true);
    setMoodValue(val);
    try {
      await patientApi.addMoodLog({ mood: val });
      setMoodJustSaved(true);
      await fetchDashboardData();
    } finally {
      setSavingMood(false);
    }
  };

  if (loading) return <DashboardSkeletons />;
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error}</div>;

  const pendingExercises = exercises.filter((item: any) => String(item?.status || '').toUpperCase() !== 'COMPLETED');
  const moodChecked = Boolean(moodValue);

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-20 lg:pb-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-sage-200/50 bg-[#F5F7F5] p-6 sm:p-8 shadow-soft-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-semibold text-ink-800 tracking-tight">{welcomeMessage}</h1>
            <p className="mt-3 text-ink-500 text-lg">How are you feeling right now?</p>
            
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSaveMood(value)}
                  disabled={savingMood}
                  className={`inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl text-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                    moodValue === value 
                      ? 'bg-calm-sage/20 ring-2 ring-calm-sage/50 scale-105 shadow-soft-sm' 
                      : 'bg-white hover:bg-calm-sage/5 border border-ink-100'
                  }`}
                >
                  <span className={savingMood && moodValue === value ? 'animate-pulse' : ''}>{moodEmojiMap[value]}</span>
                </button>
              ))}
              
              {moodJustSaved && (
                <Link
                  to="/patient/mood"
                  className="ml-2 inline-flex items-center gap-2 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-black animate-in zoom-in duration-300"
                >
                  Add a journal note <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden md:block opacity-40">
             <Sparkles className="h-32 w-32 text-sage-400 stroke-[1]" />
          </div>
        </div>
      </section>

      {/* MID ROW: Up Next & Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. UP NEXT CARD (Therapy & Appointments) */}
        <section className="flex flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-soft-sm hover:shadow-soft-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-calm-sage" />
            <h2 className="text-lg font-semibold text-charcoal">Up Next</h2>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {upcomingSession ? (
              <div className="rounded-2xl bg-[#E8EFE6]/50 p-5 border border-calm-sage/10">
                <p className="text-sm font-medium text-calm-sage uppercase tracking-wide">Upcoming Session</p>
                <h3 className="mt-1 text-xl font-semibold text-charcoal">{upcomingSession.provider?.name || 'Dr. Sharma'}</h3>
                <p className="mt-1 text-ink-600">{formatDateTime(upcomingSession.scheduledAt)}</p>
                
                <div className="mt-5 flex gap-3">
                  <button disabled className="inline-flex flex-1 items-center justify-center rounded-xl bg-charcoal/40 px-4 py-2.5 text-sm font-semibold text-white cursor-not-allowed">
                    Join Video
                  </button>
                  <Link to="/patient/sessions" className="inline-flex items-center justify-center rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-ink-50">
                    Manage
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-calm-sage/10">
                  <Search className="h-6 w-6 text-calm-sage" />
                </div>
                <h3 className="text-lg font-semibold text-charcoal">Ready for your next step?</h3>
                <p className="mt-2 text-sm text-ink-500 max-w-xs mx-auto">Book a session with a therapist or coach when you feel ready to talk.</p>
                <Link to="/patient/sessions" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-charcoal px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black">
                  Find a provider <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 3. TODAY'S ACTION PLAN (Homework & Milestones) */}
        <section className="flex flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-soft-sm hover:shadow-soft-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-calm-sage" />
              <h2 className="text-lg font-semibold text-charcoal">Today's Action Plan</h2>
            </div>
            <span className="text-sm font-medium text-ink-400">
              {pendingExercises.length} tasks remaining
            </span>
          </div>

          <div className="flex-1 space-y-3">
            <Link to="/patient/mood" className={`group flex items-center justify-between rounded-2xl border p-4 transition-all ${moodChecked ? 'border-calm-sage/20 bg-calm-sage/5' : 'border-ink-100 bg-white hover:border-calm-sage/30 hover:bg-ink-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${moodChecked ? 'bg-calm-sage text-white' : 'border-2 border-ink-200 group-hover:border-calm-sage/50'}`}>
                  {moodChecked && <Check className="h-3.5 w-3.5" />}
                </div>
                <span className={`font-medium ${moodChecked ? 'text-ink-400 line-through' : 'text-charcoal'}`}>Daily Check-in</span>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-charcoal transition-colors" />
            </Link>

            {pendingExercises.length > 0 ? (
               pendingExercises.slice(0, 2).map((ex: any) => (
                <Link key={ex.id} to="/patient/therapy-plan" className="group flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-4 transition-all hover:border-calm-sage/30 hover:bg-ink-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-200 group-hover:border-calm-sage/50" />
                    <span className="font-medium text-charcoal">{ex.title || 'CBT Worksheet'} ({ex.duration || 5} min)</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-charcoal transition-colors" />
                </Link>
               ))
            ) : (
              <Link to="/patient/therapy-plan" className="group flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-4 transition-all hover:border-calm-sage/30 hover:bg-ink-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-200 group-hover:border-calm-sage/50" />
                  <span className="font-medium text-charcoal">5-Minute Evening Wind-down (Audio)</span>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-charcoal transition-colors" />
              </Link>
            )}
          </div>
        </section>

      </div>

      {/* BOTTOM ROW: Progress & AI Nudge */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        
        {/* 4. AI NUDGE (Proactive Engagement) */}
        <section className="md:col-span-1 rounded-3xl border border-ink-100 bg-gradient-to-b from-[#FAF8F5] to-white p-6 shadow-soft-sm hover:shadow-soft-md transition-shadow flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-terracotta/20">
              <Sparkles className="h-5 w-5 text-warm-terracotta" />
            </div>
            <h2 className="text-lg font-semibold text-charcoal">Dr. Meera</h2>
          </div>
          
          <div className="flex-1 relative">
             <div className="rounded-2xl rounded-tl-none bg-white p-4 border border-ink-100 shadow-sm text-sm text-ink-700 leading-relaxed">
               {avgMood <= 3 ? (
                 <>Hi {userName}! I noticed your mood score was a bit lower recently. I found a quick 3-minute grounding exercise for you to help reset. Want to try it together?</>
               ) : (
                 <>Hi {userName}! Your streak is looking great. Would you like to do a quick reflection exercise to capture this positive momentum?</>
               )}
             </div>
          </div>
          
          <Link to="/patient/messages" className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-ink-200 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ink-50 transition-colors">
            Chat with Dr. Meera <MessageSquare className="h-4 w-4" />
          </Link>
        </section>

        {/* 5. PROGRESS SNAPSHOT (Metrics & Chart) */}
        <section className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft-sm hover:shadow-soft-md transition-shadow">
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-ink-100 pb-4 sm:pb-0 sm:pr-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-calm-sage" />
              <h2 className="text-lg font-semibold text-charcoal">Progress Snapshot</h2>
            </div>
            
            <div className="flex items-center gap-8 mt-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-charcoal/50 font-semibold mb-1">Streak</p>
                <p className="text-3xl font-display font-bold text-charcoal flex items-center gap-2">
                  <span className="text-warm-terracotta">🔥</span> {dashboard?.streak || 0}
                </p>
                <p className="text-xs text-ink-400 mt-1">Days active</p>
              </div>
              
              <div>
                <p className="text-xs uppercase tracking-wider text-charcoal/50 font-semibold mb-1">Wellness</p>
                <p className="text-3xl font-display font-bold text-calm-sage">
                  {dashboard?.wellnessScore || 65}
                </p>
                <p className="text-xs text-ink-400 mt-1">Out of 100</p>
              </div>
            </div>
            
            <Link to="/patient/progress" className="mt-auto pt-6 text-sm font-semibold text-calm-sage hover:text-sage-700 inline-flex items-center gap-1">
              View detailed analytics <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="pt-4 sm:pt-0 sm:pl-6 flex flex-col h-full min-h-[160px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 mb-3">7-Day Mood Trend</p>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={normalizedMoodTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A8B5A0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A8B5A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: 'rgba(168,181,160,0.15)', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    formatter={(value: number) => [`${moodEmojiMap[value] || ''} (${value}/5)`, 'Mood']}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4C7362" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    dot={{ r: 4, fill: '#ffffff', stroke: '#4C7362', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
        
      </div>

      {/* 6. QUICK ALERTS & NOTIFICATIONS */}
      {recentActivity.length > 0 && (
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft-sm flex items-center gap-4 hover:bg-ink-50 transition-colors">
          <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-amber-50 relative">
             <Bell className="h-5 w-5 text-amber-600" />
             <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-sm font-semibold text-charcoal truncate">You have {Math.min(recentActivity.length, 3)} new updates</p>
             <p className="text-xs text-ink-500 truncate mt-0.5">Clinical reports are ready for review. Check your messages for details.</p>
          </div>
          <Link to="/patient/reports" className="shrink-0 px-4 py-2 rounded-xl bg-charcoal text-xs font-semibold text-white">
            View Updates
          </Link>
        </section>
      )}

    </div>
  );
}
