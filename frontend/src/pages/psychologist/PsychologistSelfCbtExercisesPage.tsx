import TherapistCard from '../../components/therapist/dashboard/TherapistCard';
import TherapistPageShell from '../../components/therapist/dashboard/TherapistPageShell';

const exercises = ['Thought Reframing', 'Gratitude Practice', 'Breathing Reset', 'Exposure Ladder'];

export default function PsychologistSelfCbtExercisesPage() {
  return (
    <TherapistPageShell title="Self CBT Exercises" subtitle="Practice CBT tools for your own wellbeing.">
      <TherapistCard className="p-4">
        <ul className="space-y-2">
          {exercises.map((e) => (
            <li key={e} className="rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-700">{e}</li>
          ))}
        </ul>
      </TherapistCard>
    </TherapistPageShell>
  );
}
