import { Link } from 'react-router-dom';

const members = [
  { role: 'Therapist', name: 'Dr. Meera Sharma', status: 'Primary Provider' },
  { role: 'Psychologist', name: 'Dr. Arjun Rao', status: 'Assessment Support' },
  { role: 'Care Coach', name: 'Nisha Patel', status: 'Wellness Follow-up' },
];

export default function CareTeamPage() {
  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <section className="rounded-2xl border border-calm-sage/15 bg-white/90 p-5 shadow-soft-sm">
        <h1 className="font-serif text-3xl font-light md:text-4xl">Care Team</h1>
        <p className="mt-2 text-sm text-charcoal/70">Your assigned providers coordinating your treatment plan.</p>
      </section>

      <section className="grid gap-3">
        {members.map((member) => (
          <div key={member.name} className="rounded-xl border border-calm-sage/15 bg-white/90 p-4">
            <p className="text-sm font-semibold text-charcoal">{member.name}</p>
            <p className="text-xs text-charcoal/60">{member.role} • {member.status}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-calm-sage/15 bg-white/90 p-4">
        <p className="text-sm font-semibold text-charcoal">Next Session</p>
        <p className="mt-1 text-sm text-charcoal/70">March 12, 6:00 PM with Dr. Meera Sharma</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/patient/sessions" className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs">View Sessions</Link>
          <Link to="/patient/messages" className="inline-flex min-h-[34px] items-center rounded-full border border-calm-sage/25 px-3 text-xs">Message AI Support</Link>
        </div>
      </section>
    </div>
  );
}
