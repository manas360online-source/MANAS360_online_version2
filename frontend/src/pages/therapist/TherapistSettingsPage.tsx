import { useMemo } from 'react';
import TherapistButton from '../../components/therapist/dashboard/TherapistButton';
import TherapistCard from '../../components/therapist/dashboard/TherapistCard';
import { TherapistEmptyState } from '../../components/therapist/dashboard/TherapistDataState';
import TherapistPageShell from '../../components/therapist/dashboard/TherapistPageShell';
import { useAuth } from '../../context/AuthContext';

export default function TherapistSettingsPage() {
  const { user } = useAuth();

  const firstName = useMemo(() => user?.firstName || '', [user?.firstName]);
  const lastName = useMemo(() => user?.lastName || '', [user?.lastName]);

  return (
    <TherapistPageShell title="Settings" subtitle="Manage profile, availability slots, and bank payout details.">
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TherapistCard className="p-5">
          <h3 className="font-display text-base font-bold text-ink-800">Profile</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm text-ink-500">
              First Name
              <input className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-0" defaultValue={firstName} />
            </label>
            <label className="text-sm text-ink-500">
              Last Name
              <input className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-0" defaultValue={lastName} />
            </label>
          </div>
          <label className="mt-3 block text-sm text-ink-500">
            Bio
            <textarea className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-0" rows={4} placeholder="Add professional bio" />
          </label>
        </TherapistCard>

        <TherapistCard className="p-5">
          <h3 className="font-display text-base font-bold text-ink-800">Availability Slots</h3>
          <div className="mt-4">
            <TherapistEmptyState title="No availability slots" description="Configure provider availability from the scheduling module." />
          </div>
        </TherapistCard>
      </section>

      <TherapistCard className="p-5">
        <h3 className="font-display text-base font-bold text-ink-800">Bank Details</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-sm text-ink-500 sm:col-span-2">
            Account Holder Name
            <input className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-0" placeholder="Account holder name" />
          </label>
          <label className="text-sm text-ink-500">
            IFSC
            <input className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-0" placeholder="IFSC" />
          </label>
          <label className="text-sm text-ink-500 sm:col-span-2">
            Account Number
            <input className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-0" placeholder="Account number" />
          </label>
          <label className="text-sm text-ink-500">
            UPI ID
            <input className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-800 focus:border-sage-500 focus:ring-0" placeholder="UPI ID" />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <TherapistButton>Save Settings</TherapistButton>
        </div>
      </TherapistCard>
    </TherapistPageShell>
  );
}
