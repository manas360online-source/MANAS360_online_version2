import { Link } from 'react-router-dom';

const reportItems = [
  { id: 'mood', title: 'Mood Trend Report', subtitle: 'Weekly mood and trigger summary' },
  { id: 'assessment', title: 'Assessment History', subtitle: 'PHQ-9 / GAD-7 score progression' },
  { id: 'adherence', title: 'Therapy Adherence', subtitle: 'Sessions, exercises, and completion consistency' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <section className="rounded-2xl border border-calm-sage/15 bg-white/90 p-5 shadow-soft-sm">
        <h1 className="font-serif text-3xl font-light md:text-4xl">Reports</h1>
        <p className="mt-2 text-sm text-charcoal/70">Download and review your clinical progress snapshots.</p>
      </section>

      <section className="space-y-3">
        {reportItems.map((item) => (
          <div key={item.id} className="rounded-xl border border-calm-sage/15 bg-white/90 p-4">
            <p className="text-sm font-semibold text-charcoal">{item.title}</p>
            <p className="text-xs text-charcoal/60">{item.subtitle}</p>
            <button type="button" className="mt-3 inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs">
              Download PDF
            </button>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-calm-sage/15 bg-white/90 p-4">
        <p className="text-sm text-charcoal/70">Need complete documents and prescriptions?</p>
        <Link to="/patient/documents" className="mt-2 inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs">
          Open Document Center
        </Link>
      </section>
    </div>
  );
}
