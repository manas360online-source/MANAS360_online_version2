import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  CircleHelp,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  Wallet,
  Wrench,
  X,
  Mail,
  Phone,
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { therapistApi, type TherapistDashboardResponse, type TherapistPatientItem } from '../../api/therapist.api';
import { psychologistApi, type PsychologistPatientOverview } from '../../api/psychologist.api';
import { useAuth } from '../../context/AuthContext';
import { ProviderDashboardContext, type ProviderDashboardMode } from '../../context/ProviderDashboardContext';

type NavItem = {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  dot?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const professionalSections: NavSection[] = [
  {
    title: 'Professional Mode',
    items: [
      { to: '/therapist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/therapist/patients', label: 'My Patients', icon: Users },
      { to: '/therapist/sessions', label: 'Sessions', icon: Calendar },
      { to: '/therapist/session-notes', label: 'Session Notes', icon: BookOpen },
      { to: '/therapist/mood-tracking', label: 'Mood Tracking', icon: HeartPulse },
      { to: '/therapist/cbt-modules', label: 'CBT Modules', icon: Wrench },
      { to: '/therapist/assessments', label: 'Assessments', icon: Activity },
      { to: '/therapist/messages', label: "Dr. Meera 'Ai", icon: MessageSquare },
      { to: '/therapist/exercise-library', label: 'Exercise Library', icon: Wrench },
      { to: '/therapist/resources', label: 'Resources', icon: BookOpen },
      { to: '/therapist/care-team', label: 'Care Team', icon: Users },
    ],
  },
];

const selfSections: NavSection[] = [
  {
    title: 'Self Mode',
    items: [
      { to: '/therapist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/therapist/patients', label: 'My Patients', icon: Users },
      { to: '/therapist/document-verification', label: 'Document Verification', icon: ShieldCheck },
      { to: '/certifications', label: 'Certifications', icon: ShieldCheck },
    ],
  },
  {
    title: 'My Practice',
    items: [
      { to: '/therapist/analytics', label: 'Analytics', icon: LineChart },
      { to: '/therapist/earnings', label: 'Earnings', icon: Wallet },
      { to: '/therapist/payout-history', label: 'Payouts', icon: Wallet },
    ],
  },
  {
    title: 'Settings',
    items: [
      { to: '/therapist/profile', label: 'Profile', icon: Settings },
      { to: '/therapist/settings', label: 'Settings', icon: Settings },
      { to: '/therapist/help-support', label: 'Help & Support', icon: CircleHelp },
      { to: '/therapist/settings?tab=ratings', label: 'Ratings', icon: TrendingUp },
    ],
  },
];

const psychologistProfessionalSections: NavSection[] = [
  {
    title: 'Professional Mode',
    items: [
      { to: '/psychologist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/psychologist/patients', label: 'My Patients', icon: Users },
      { to: '/psychologist/assessments', label: 'Assessments', icon: Activity },
      { to: '/psychologist/diagnostic-reports', label: 'Diagnostic Reports', icon: BookOpen },
      { to: '/psychologist/cognitive-tests', label: 'Cognitive Tests', icon: Activity },
      { to: '/psychologist/mood-analytics', label: 'Mood Analytics', icon: LineChart },
      { to: '/psychologist/risk-monitoring', label: 'Risk Monitoring', icon: HeartPulse },
      { to: '/psychologist/treatment-plans', label: 'Treatment Plans', icon: Calendar },
      { to: '/psychologist/care-team', label: 'Care Team', icon: Users },
      { to: '/psychologist/ai-clinical-assistant', label: 'AI Clinical Assistant', icon: MessageSquare },
      { to: '/psychologist/research-insights', label: 'Research Insights', icon: TrendingUp },
      { to: '/psychologist/resources', label: 'Resources', icon: BookOpen },
    ],
  },
  {
    title: 'Settings',
    items: [
      { to: '/psychologist/profile', label: 'Profile', icon: User },
      { to: '/psychologist/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const psychologistSelfSections: NavSection[] = [
  {
    title: 'Self Mode',
    items: [
      { to: '/psychologist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/psychologist/patients', label: 'My Patients', icon: Users },
      { to: '/psychologist/document-verification', label: 'Document Verification', icon: ShieldCheck },
      { to: '/certifications', label: 'Certifications', icon: ShieldCheck },
      { to: '/psychologist/personal-mood', label: 'Personal Mood', icon: HeartPulse },
      { to: '/psychologist/self-assessments', label: 'Self Assessments', icon: Activity },
      { to: '/psychologist/self-cbt-exercises', label: 'Self CBT Exercises', icon: Wrench },
      { to: '/psychologist/meditation', label: 'Meditation', icon: CircleHelp },
      { to: '/psychologist/journal', label: 'Journal', icon: BookOpen },
      { to: '/psychologist/insights', label: 'Insights', icon: LineChart },
      { to: '/psychologist/ai-chat', label: 'AI Therapist', icon: MessageSquare },
      { to: '/psychologist/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const professionalMobileNavItems: NavItem[] = [
  { to: '/therapist/patients', label: 'Patients', icon: Users },
  { to: '/therapist/sessions', label: 'Sessions', icon: Calendar },
  { to: '/therapist/messages', label: "Dr. Meera 'Ai", icon: MessageSquare },
  { to: '/therapist/mood-tracking', label: 'Mood', icon: HeartPulse },
  { to: '/therapist/care-team', label: 'Care Team', icon: Users },
];

const selfMobileNavItems: NavItem[] = [
  { to: '/therapist/patients', label: 'Patients', icon: Users },
  { to: '/therapist/sessions', label: 'Sessions', icon: Calendar },
  { to: '/therapist/messages', label: "Dr. Meera 'Ai", icon: MessageSquare },
  { to: '/therapist/analytics', label: 'Analytics', icon: LineChart },
  { to: '/certifications', label: 'Certify', icon: ShieldCheck },
];

const psychologistProfessionalMobileNavItems: NavItem[] = [
  { to: '/psychologist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/psychologist/patients', label: 'Patients', icon: Users },
  { to: '/psychologist/assessments', label: 'Assess', icon: Activity },
  { to: '/psychologist/risk-monitoring', label: 'Risk', icon: HeartPulse },
  { to: '/psychologist/ai-clinical-assistant', label: 'AI', icon: MessageSquare },
];

const psychologistSelfMobileNavItems: NavItem[] = [
  { to: '/psychologist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/psychologist/personal-mood', label: 'Mood', icon: HeartPulse },
  { to: '/psychologist/self-assessments', label: 'Assess', icon: Activity },
  { to: '/psychologist/journal', label: 'Journal', icon: BookOpen },
  { to: '/psychologist/ai-chat', label: 'AI', icon: MessageSquare },
  { to: '/psychologist/settings', label: 'Settings', icon: Settings },
];

const titleMap: Record<string, string> = {
  '/therapist/dashboard': 'Dashboard',
  '/therapist/patients': 'My Patients',
  '/therapist/sessions': 'Sessions',
  '/therapist/session-notes': 'Session Notes',
  '/therapist/earnings': 'Earnings',
  '/therapist/payout-history': 'Payout History',
  '/therapist/messages': "Dr. Meera 'Ai",
  '/therapist/exercise-library': 'Exercise Library',
  '/therapist/cbt-modules': 'CBT Modules',
  '/therapist/assessments': 'Assessments',
  '/therapist/mood-tracking': 'Mood Tracking',
  '/therapist/resources': 'Resources',
  '/therapist/care-team': 'Care Team',
  '/therapist/analytics': 'Analytics',
  '/therapist/ratings': 'Ratings',
  '/therapist/profile': 'Profile',
  '/therapist/settings': 'Settings',
  '/therapist/help-support': 'Help & Support',
  '/therapist/document-verification': 'Document Verification',
  '/certifications': 'Certifications',
};

// psychologist titles
const psychologistTitleMap: Record<string, string> = {
  '/psychologist/dashboard': 'Dashboard',
  '/psychologist/patients': 'My Patients',
  '/psychologist/assessments': 'Assessments',
  '/psychologist/diagnostic-reports': 'Diagnostic Reports',
  '/psychologist/cognitive-tests': 'Cognitive Tests',
  '/psychologist/mood-analytics': 'Mood Analytics',
  '/psychologist/risk-monitoring': 'Risk Monitoring',
  '/psychologist/treatment-plans': 'Treatment Plans',
  '/psychologist/care-team': 'Care Team',
  '/psychologist/ai-clinical-assistant': 'AI Clinical Assistant',
  '/psychologist/research-insights': 'Research Insights',
  '/psychologist/resources': 'Resources',
  '/psychologist/personal-mood': 'Personal Mood',
  '/psychologist/self-assessments': 'Self Assessments',
  '/psychologist/self-cbt-exercises': 'Self CBT Exercises',
  '/psychologist/meditation': 'Meditation',
  '/psychologist/journal': 'Journal',
  '/psychologist/insights': 'Insights',
  '/psychologist/ai-chat': 'AI Therapist',
  '/psychologist/reports': 'Reports',
  '/psychologist/tests': 'Tests',
  '/psychologist/schedule': 'Evaluation Schedule',
  '/psychologist/messages': 'Messages',
  '/psychologist/profile': 'Profile',
  '/psychologist/settings': 'Settings',
  '/psychologist/document-verification': 'Document Verification',
};

const DASHBOARD_MODE_STORAGE_KEY = 'manas360.therapist.dashboardMode';
const DASHBOARD_PATIENT_STORAGE_KEY = 'manas360.therapist.selectedPatientId';
const LEGACY_DASHBOARD_MODE_STORAGE_KEY = 'manas360.provider.dashboardMode';
const LEGACY_DASHBOARD_PATIENT_STORAGE_KEY = 'manas360.provider.selectedPatientId';

const initialsFromName = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TH';

export default function TherapistDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [dashboardMeta, setDashboardMeta] = useState<TherapistDashboardResponse | null>(null);
  const [patientOptions, setPatientOptions] = useState<TherapistPatientItem[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<ProviderDashboardMode>(() => {
    if (typeof window === 'undefined') return 'professional';
    const cached =
      window.localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_DASHBOARD_MODE_STORAGE_KEY);
    return cached === 'practice' ? 'practice' : 'professional';
  });
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return (
      window.localStorage.getItem(DASHBOARD_PATIENT_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_DASHBOARD_PATIENT_STORAGE_KEY) ||
      ''
    );
  });

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Therapist';
  const initials = initialsFromName(userName);
  const [selectedPatientOverview, setSelectedPatientOverview] = useState<PsychologistPatientOverview | null>(null);
  const [selectedPatientLoading, setSelectedPatientLoading] = useState(false);

  const isPsychologist = String(user?.role || '').toLowerCase() === 'psychologist';
  const providerVerified = Boolean((user as any)?.isTherapistVerified);

  const pageTitle = useMemo(() => {
    const exact = isPsychologist ? psychologistTitleMap[location.pathname] : titleMap[location.pathname];
    if (exact) return exact;
    const sourceMap = isPsychologist ? psychologistTitleMap : titleMap;
    const firstMatch = Object.entries(sourceMap).find(([path]) => location.pathname.startsWith(path));
    return firstMatch?.[1] || 'Dashboard';
  }, [location.pathname]);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const isActive = (path: string) => {
    const normalizedPath = path.split('?')[0];
    return location.pathname === normalizedPath || location.pathname.startsWith(`${normalizedPath}/`);
  };

  useEffect(() => {
    setMobileSidebarOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const loadSidebarMeta = async () => {
      try {
        if (isPsychologist) {
          const [dashboardRes, patientsRes] = await Promise.all([
            psychologistApi.getDashboard(),
            psychologistApi.getPatients(),
          ]);

          // Map psychologist dashboard into the minimal shape expected by this layout
          const mapped: TherapistDashboardResponse = {
            therapist: { id: '', name: '', email: null },
            stats: {
              todaysSessions: dashboardRes.cards?.upcomingEvaluations || 0,
              completedToday: 0,
              weeklyEarnings: 0,
              activePatients: dashboardRes.cards?.totalPatients || 0,
              avgRating: null,
              pendingNotes: dashboardRes.cards?.pendingEvaluations || 0,
              unreadMessages: 0,
            },
            todaySessions: [],
            earningsChart: { labels: [], therapistShare: [], platformShare: [] },
            alerts: [],
            recentMessages: [],
            utilization: { percent: 0, booked: 0, total: 0, open: 0 },
          };

          setDashboardMeta(mapped);
          setPatientOptions(
            (patientsRes.items || []).map((p: any) => ({
              id: String(p.patientProfileId),
              name: p.patientName || 'Patient',
              email: null,
              concern: '',
              sessions: 0,
              status: 'assigned',
              lastSessionAt: null,
            })) as TherapistPatientItem[],
          );
        } else {
          const [dashboardRes, patientsRes] = await Promise.all([
            therapistApi.getDashboard(),
            therapistApi.getPatients(),
          ]);
          setDashboardMeta(dashboardRes);
          setPatientOptions(patientsRes.items || []);
        }
      } catch {
        setDashboardMeta(null);
        setPatientOptions([]);
      }
    };

    void loadSidebarMeta();
  }, [selectedPatientId]);

  useEffect(() => {
    if (!isPsychologist || !selectedPatientId) {
      setSelectedPatientOverview(null);
      setSelectedPatientLoading(false);
      return;
    }

    const loadOverview = async () => {
      setSelectedPatientLoading(true);
      try {
        const overview = await psychologistApi.getPatientOverview(selectedPatientId);
        setSelectedPatientOverview(overview);
      } catch {
        setSelectedPatientOverview(null);
      } finally {
        setSelectedPatientLoading(false);
      }
    };

    void loadOverview();
  }, [isPsychologist, selectedPatientId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, dashboardMode);
  }, [dashboardMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_PATIENT_STORAGE_KEY, selectedPatientId);
  }, [selectedPatientId]);

  useEffect(() => {
    if (mobileSidebarOpen || profileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen, profileMenuOpen]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [profileMenuOpen]);

  const onLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    if (!term) return patientOptions;
    return patientOptions.filter((patient) => {
      return (
        String(patient.name || '').toLowerCase().includes(term) ||
        String(patient.email || '').toLowerCase().includes(term)
      );
    });
  }, [patientOptions, patientSearch]);

  const sections = useMemo(() => {
    const sourceSections = isPsychologist
      ? dashboardMode === 'professional'
        ? psychologistProfessionalSections
        : psychologistSelfSections
      : dashboardMode === 'professional'
        ? professionalSections
        : selfSections;
    const patientsCount = dashboardMeta?.stats.activePatients;
    const todaySessions = dashboardMeta?.stats.todaysSessions;
    const pendingNotes = dashboardMeta?.stats.pendingNotes;
    const unreadMessages = dashboardMeta?.stats.unreadMessages;

    return sourceSections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.to === '/therapist/patients') {
          return { ...item, badge: typeof patientsCount === 'number' ? String(patientsCount) : undefined };
        }
        if (item.to === '/therapist/sessions') {
          return { ...item, badge: typeof todaySessions === 'number' ? `${todaySessions} today` : undefined };
        }
        if (item.to === '/therapist/session-notes') {
          return { ...item, dot: typeof pendingNotes === 'number' ? pendingNotes > 0 : false };
        }
        if (item.to === '/therapist/messages') {
          return { ...item, badge: typeof unreadMessages === 'number' ? String(unreadMessages) : undefined };
        }
        if (item.to === '/psychologist/patients') {
          return { ...item, badge: typeof patientsCount === 'number' ? String(patientsCount) : undefined };
        }
        if (item.to === '/psychologist/risk-monitoring') {
          return { ...item, badge: typeof todaySessions === 'number' ? `${todaySessions} upcoming` : undefined };
        }
        if (item.to === '/therapist/document-verification' || item.to === '/psychologist/document-verification') {
          return { ...item, badge: providerVerified ? 'Verified' : 'Required' };
        }
        return item;
      }),
    }));
  }, [dashboardMeta, dashboardMode, providerVerified]);

  const mobileNavItems = isPsychologist
    ? dashboardMode === 'professional'
      ? psychologistProfessionalMobileNavItems
      : psychologistSelfMobileNavItems
    : dashboardMode === 'professional'
      ? professionalMobileNavItems
      : selfMobileNavItems;

  return (
    <ProviderDashboardContext.Provider
      value={{
        selectedPatientId,
        setSelectedPatientId,
        dashboardMode,
        setDashboardMode,
      }}
    >
    <div className="min-h-screen bg-surface-bg text-ink-800">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-ink-100 bg-[#F5F3F0] transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-ink-100 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-500 text-sm font-bold text-white">M</div>
          <span className="font-display text-lg font-bold text-sage-500">MANAS360</span>
          <span className="ml-auto rounded-full bg-sage-50 px-2 py-0.5 text-[10px] font-medium text-sage-500">{isPsychologist ? 'Psychologist' : 'Therapist'}</span>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-500">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        active ? 'bg-sage-50 font-semibold text-sage-500' : 'text-ink-500 hover:bg-[#EFEDE9]'
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${active ? 'text-sage-500' : 'text-ink-500'}`} />
                      <span>{item.label}</span>
                      {item.dot ? <span className="ml-auto h-2 w-2 rounded-full bg-clay-500" /> : null}
                      {item.badge ? (
                        <span
                          className={`ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            item.to === '/therapist/messages' ? 'bg-red-50 text-red-600' : item.label === 'Sessions' ? 'bg-clay-50 text-clay-500' : 'bg-sage-50 text-sage-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {isPsychologist && selectedPatientId ? (
            <div className="rounded-xl border border-ink-100 bg-white/70 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">Selected Patient</p>
              {selectedPatientLoading ? (
                <p className="mt-2 text-xs text-ink-500">Loading details...</p>
              ) : selectedPatientOverview ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-ink-800">{selectedPatientOverview.patient.name}</p>
                  <p className="text-xs text-ink-500">
                    {selectedPatientOverview.patient.age} yrs, {selectedPatientOverview.patient.gender}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-ink-600">
                    <span className="rounded bg-ink-100 px-1.5 py-1">Assess: {selectedPatientOverview.summary.assessmentCount}</span>
                    <span className="rounded bg-ink-100 px-1.5 py-1">Reports: {selectedPatientOverview.summary.reportCount}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Link to="/psychologist/patients" className="block rounded px-2 py-1 text-xs text-sage-600 hover:bg-sage-50">View Full Patient</Link>
                    <Link to="/psychologist/care-team" className="block rounded px-2 py-1 text-xs text-sage-600 hover:bg-sage-50">Open Care Team</Link>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-ink-500">Patient details unavailable.</p>
              )}
            </div>
          ) : null}
        </nav>

        <div className="border-t border-ink-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-50 font-display text-sm font-bold text-sage-500">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-800">{userName}</p>
              <p className="text-[11px] text-ink-500">{isPsychologist ? 'Clinical Psychologist' : 'Therapist'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="mt-2 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-ink-100 bg-surface-card px-3 text-sm font-medium text-ink-500 transition hover:bg-surface-bg"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:ml-64">
        <header className="relative sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink-100 bg-white/80 px-4 backdrop-blur-lg lg:px-6">
          <button
            type="button"
            className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Left side - Selected Menu Item & Mode */}
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="truncate font-display font-bold leading-tight text-ink-800 text-sm">{pageTitle}</h1>
              <p className="mt-0.5 hidden text-[10px] leading-none text-ink-500 sm:block">{todayLabel}</p>
            </div>
          </div>

          {/* Center - Left on Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex flex-col">
              <h1 className="font-display text-base font-bold text-ink-800">{pageTitle}</h1>
              <p className="text-[11px] leading-none text-ink-500">{todayLabel}</p>
            </div>
            <div className="hidden items-center rounded-xl border border-ink-100 bg-white p-1 xl:inline-flex ml-6">
              <button
                type="button"
                onClick={() => setDashboardMode('professional')}
                className={`min-h-[32px] rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  dashboardMode === 'professional'
                    ? 'bg-sage-500 text-white'
                    : 'text-ink-500 hover:bg-sage-50'
                }`}
              >
                Professional
              </button>
              <button
                type="button"
                onClick={() => setDashboardMode('practice')}
                className={`min-h-[32px] rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  dashboardMode === 'practice'
                    ? 'bg-sky-600 text-white'
                    : 'text-ink-500 hover:bg-sky-50'
                }`}
              >
                Self
              </button>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-lg bg-ink-100 px-3 py-2 lg:flex lg:w-48">
              <Search className="h-4 w-4 text-ink-500" />
              <input
                type="text"
                placeholder="Search patients..."
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                className="w-full border-0 bg-transparent p-0 text-sm text-ink-800 placeholder:text-ink-500 focus:ring-0"
              />
            </div>

            <label className={`hidden items-center gap-2 rounded-lg border border-ink-100 bg-white px-2 py-1 md:flex ${isPsychologist ? '' : dashboardMode === 'professional' ? '' : 'md:hidden'}`} htmlFor="provider-patient-select">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">Patient</span>
              <select
                id="provider-patient-select"
                value={selectedPatientId}
                onChange={(event) => setSelectedPatientId(event.target.value)}
                className="min-w-[140px] border-0 bg-transparent py-1 pl-2 pr-6 text-sm text-ink-800 focus:ring-0"
              >
                <option value="">All Patients</option>
                {filteredPatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Online Toggle Section */}
            <div className="flex items-center gap-2 rounded-lg border border-ink-100 bg-white px-2 py-1.5 h-9">
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                  isOnline ? 'bg-sage-500' : 'bg-ink-300'
                }`}
                aria-label={`Toggle ${isOnline ? 'offline' : 'online'}`}
              >
                <span
                  className={`inline-flex h-4 w-4 transform rounded-full bg-white transition ${
                    isOnline ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${isOnline ? 'text-sage-600' : 'text-ink-500'}`}>
                {isOnline ? 'Online' : 'Away'}
              </span>
            </div>

            <button type="button" className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button
              type="button"
              onClick={() => setProfileMenuOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-ink-100"
              aria-label="Open profile menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-50 font-display text-xs font-bold text-sage-500">{initials}</div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-ink-500 sm:block" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-4 pb-24 lg:px-6 lg:py-6 lg:pb-6">
          {isPsychologist && selectedPatientId ? (
            <div className="mb-4 rounded-xl border border-ink-100 bg-white p-4">
              {selectedPatientLoading ? (
                <p className="text-sm text-ink-500">Loading selected patient details...</p>
              ) : selectedPatientOverview ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Selected Patient</p>
                    <h3 className="mt-1 text-lg font-semibold text-ink-800">{selectedPatientOverview.patient.name}</h3>
                    <p className="mt-1 text-sm text-ink-500">
                      {selectedPatientOverview.patient.age} yrs, {selectedPatientOverview.patient.gender}
                      {selectedPatientOverview.patient.email ? ` · ${selectedPatientOverview.patient.email}` : ''}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-600 sm:grid-cols-3">
                      <div className="rounded-lg bg-ink-100 px-2 py-1">Assessments: {selectedPatientOverview.summary.assessmentCount}</div>
                      <div className="rounded-lg bg-ink-100 px-2 py-1">Reports: {selectedPatientOverview.summary.reportCount}</div>
                      <div className="rounded-lg bg-ink-100 px-2 py-1">Submitted: {selectedPatientOverview.summary.submittedReports}</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Care Team</p>
                    <div className="mt-2 space-y-2">
                      {selectedPatientOverview.careTeam.length === 0 ? (
                        <p className="text-sm text-ink-500">No care team members assigned.</p>
                      ) : (
                        selectedPatientOverview.careTeam.slice(0, 4).map((member) => (
                          <div key={member.assignmentId} className="flex items-center justify-between rounded-lg border border-ink-100 px-2 py-2">
                            <div>
                              <p className="text-sm font-semibold text-ink-800">{member.name}</p>
                              <p className="text-xs text-ink-500">{member.role}</p>
                            </div>
                            <div className="flex gap-1">
                              {member.email ? (
                                <a className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-100 text-ink-500 hover:bg-ink-100" href={`mailto:${member.email}`} title="Email">
                                  <Mail className="h-4 w-4" />
                                </a>
                              ) : null}
                              {member.phone ? (
                                <a className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-100 text-ink-500 hover:bg-ink-100" href={`tel:${member.phone}`} title="Call">
                                  <Phone className="h-4 w-4" />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-500">Patient details are unavailable for this selection.</p>
              )}
            </div>
          ) : null}
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-100 bg-white/95 px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] backdrop-blur md:hidden">
          <ul className="grid grid-cols-5 gap-1">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex min-h-[56px] flex-col items-center justify-center rounded-lg px-1 py-1 text-[11px] font-medium transition ${
                      active ? 'bg-sage-50 text-sage-500' : 'text-ink-500 hover:bg-ink-100'
                    }`}
                  >
                    <Icon className="mb-1 h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-end bg-charcoal/20 p-3 pt-16 backdrop-blur-sm sm:p-4 sm:pt-20"
          onClick={() => setProfileMenuOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-ink-100 bg-[#F5F3F0]/95 p-3 shadow-soft-sm"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Profile menu"
          >
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/85 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-50 text-xs font-semibold text-sage-500">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-800">{userName}</p>
                <p className="text-[11px] text-ink-500">{isPsychologist ? 'Psychologist Account' : 'Therapist Account'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate(isPsychologist ? '/psychologist/profile' : '/therapist/profile');
                }}
                className="flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
              >
                <User className="h-[18px] w-[18px] text-ink-500" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate(isPsychologist ? '/psychologist/settings' : '/therapist/settings');
                }}
                className="flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
              >
                <Settings className="h-[18px] w-[18px] text-ink-500" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate(isPsychologist ? '/psychologist/settings' : '/therapist/help-support');
                }}
                className="flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
              >
                <CircleHelp className="h-[18px] w-[18px] text-ink-500" />
                <span>Help & Support</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  void onLogout();
                }}
                className="flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
              >
                <LogOut className="h-[18px] w-[18px] text-ink-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProviderDashboardContext.Provider>
  );
}
