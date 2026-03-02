import { Bell, CalendarDays, CreditCard, FileText, HeartPulse, Home, MessageSquare, Search, User, LifeBuoy } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: Home },
  { to: '/patient/sessions', label: 'Sessions', icon: CalendarDays },
  { to: '/patient/providers', label: 'Find Therapist', icon: Search },
  { to: '/patient/assessments', label: 'Assessments', icon: HeartPulse },
  { to: '/patient/messages', label: 'Messages', icon: MessageSquare },
  { to: '/patient/notifications', label: 'Notifications', icon: Bell },
  { to: '/patient/billing', label: 'Billing', icon: CreditCard },
  { to: '/patient/documents', label: 'Documents', icon: FileText },
  { to: '/patient/profile', label: 'Profile', icon: User },
  { to: '/patient/support', label: 'Support', icon: LifeBuoy },
];

export default function PatientDashboardLayout() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <div className="mx-auto flex w-full max-w-screen-2xl">
        <aside className="hidden min-h-screen w-64 shrink-0 border-r border-calm-sage/20 bg-white/70 px-4 py-6 lg:block">
          <Link to="/patient/dashboard" className="mb-8 inline-flex items-center text-2xl font-serif font-light">
            MANAS<span className="font-semibold">360</span>
          </Link>

          <nav className="space-y-1" aria-label="Patient dashboard navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                    active
                      ? 'bg-calm-sage/20 text-charcoal'
                      : 'text-charcoal/75 hover:bg-calm-sage/10 hover:text-charcoal'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen w-full flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-calm-sage/15 bg-cream/95 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg font-light">Patient Care Space</p>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-calm-sage/25 bg-white/85"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="w-full flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-calm-sage/20 bg-cream/98 px-2 py-1.5 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex min-h-[46px] flex-col items-center justify-center rounded-lg px-1 text-[10px] font-medium ${
                  active ? 'bg-calm-sage/20 text-charcoal' : 'text-charcoal/70'
                }`}
              >
                <Icon className="mb-0.5 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
