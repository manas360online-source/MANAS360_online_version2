const docs = [
  { type: 'Therapist Notes', title: 'Session Reflection Notes', date: '2026-03-01' },
  { type: 'Prescription', title: 'Psychiatrist Prescription', date: '2026-02-24' },
  { type: 'Report', title: 'Uploaded Lab Report', date: '2026-02-20' },
];

export default function DocumentsPage() {
  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <h1 className="font-serif text-3xl font-light md:text-4xl">Documents & Prescriptions</h1>

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
        <h2 className="text-base font-semibold">Your Documents</h2>
        <div className="mt-4 space-y-2">
          {docs.map((doc) => (
            <div key={`${doc.type}-${doc.title}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-calm-sage/15 p-3">
              <div>
                <p className="text-sm font-medium">{doc.title}</p>
                <p className="text-xs text-charcoal/60">{doc.type} • {doc.date}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs">Download PDF</button>
                <button type="button" className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs">Share Securely</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
