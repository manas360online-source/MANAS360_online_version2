import TherapistButton from '../../components/therapist/dashboard/TherapistButton';
import TherapistCard from '../../components/therapist/dashboard/TherapistCard';
import { TherapistEmptyState } from '../../components/therapist/dashboard/TherapistDataState';
import TherapistPageShell from '../../components/therapist/dashboard/TherapistPageShell';

export default function TherapistExerciseLibraryPage() {
  return (
    <TherapistPageShell title="Exercise Library" subtitle="Assign guided exercises for patient progress between sessions.">
      <TherapistEmptyState
        title="No exercises available"
        description="Exercise library data is currently unavailable. Configure backend exercise templates to populate this section."
      />
      <TherapistCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-500">Once backend exercise templates are available, you can assign them from here.</p>
          <TherapistButton variant="soft">Refresh Library</TherapistButton>
        </div>
      </TherapistCard>
    </TherapistPageShell>
  );
}
