export default function SupportPage() {
  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <h1 className="font-serif text-3xl font-light md:text-4xl">Support & Help</h1>

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
        <h2 className="text-base font-semibold">Need Help?</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button type="button" className="rounded-xl border border-calm-sage/20 p-3 text-left text-sm">Raise Ticket</button>
          <button type="button" className="rounded-xl border border-calm-sage/20 p-3 text-left text-sm">FAQs</button>
          <button type="button" className="rounded-xl border border-calm-sage/20 p-3 text-left text-sm">Report Therapist</button>
          <button type="button" className="rounded-xl border border-calm-sage/20 p-3 text-left text-sm">Emergency Contacts</button>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-300 bg-rose-50 p-5">
        <h3 className="text-base font-semibold text-rose-700">Emergency Contact Numbers</h3>
        <p className="mt-2 text-sm text-rose-800">Tele-MANAS: 1800-599-0019</p>
      </section>
    </div>
  );
}
