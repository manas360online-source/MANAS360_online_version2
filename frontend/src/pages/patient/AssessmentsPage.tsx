import { useMemo, useState } from 'react';
import { patientApi } from '../../api/patient';

type AssessmentKey = 'PHQ-9' | 'GAD-7' | 'Stress Index' | 'AI Emotional Analysis';

const cards: Array<{ key: AssessmentKey; description: string }> = [
  { key: 'PHQ-9', description: 'Depression symptom screening' },
  { key: 'GAD-7', description: 'Anxiety severity screening' },
  { key: 'Stress Index', description: 'Current stress level snapshot' },
  { key: 'AI Emotional Analysis', description: 'AI-driven emotional tone insight' },
];

export default function AssessmentsPage() {
  const [selected, setSelected] = useState<AssessmentKey>('PHQ-9');
  const [score, setScore] = useState(10);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadMoodHistory = async () => {
    setLoading(true);
    try {
      const response = await patientApi.getMoodHistory();
      const payload = response.data ?? response;
      setHistory(payload || []);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await patientApi.submitAssessment({
        type: selected,
        score,
      });
      const payload = response.data ?? response;
      setMessage(`Saved: ${payload.type} • Score ${payload.score} • ${payload.result_level}`);
      await loadMoodHistory();
    } finally {
      setLoading(false);
    }
  };

  const trendBars = useMemo(() => {
    const values = history.slice(0, 20).reverse().map((entry: any) => Number(entry.mood || 0));
    return values.length ? values : [2, 3, 4, 2, 3, 4, 3];
  }, [history]);

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <h1 className="font-serif text-3xl font-light md:text-4xl">Assessments & Progress</h1>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSelected(item.key)}
            className={`rounded-2xl border p-4 text-left transition ${
              selected === item.key
                ? 'border-calm-sage bg-calm-sage/10'
                : 'border-calm-sage/15 bg-white/85 hover:bg-calm-sage/5'
            }`}
          >
            <p className="text-sm font-semibold">{item.key}</p>
            <p className="mt-1 text-xs text-charcoal/65">{item.description}</p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
        <h2 className="text-base font-semibold">Submit Quick Assessment</h2>
        <p className="mt-1 text-sm text-charcoal/65">Selected: {selected}</p>

        <div className="mt-4">
          <label className="block text-sm font-medium">Score: {score}</label>
          <input
            type="range"
            min={0}
            max={27}
            value={score}
            onChange={(event) => setScore(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="inline-flex min-h-[40px] items-center rounded-full bg-charcoal px-4 text-sm font-medium text-cream disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Assessment'}
          </button>
          <button
            type="button"
            onClick={loadMoodHistory}
            className="inline-flex min-h-[40px] items-center rounded-full border border-calm-sage/25 px-4 text-sm font-medium text-charcoal/75"
          >
            Refresh Progress
          </button>
        </div>

        {message ? <p className="mt-3 text-sm text-calm-sage">{message}</p> : null}
      </section>

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
        <h2 className="text-base font-semibold">Progress Analytics</h2>
        <p className="mt-1 text-sm text-charcoal/65">Mood tracking and trend over recent entries</p>

        <div className="mt-4 flex h-24 items-end gap-1.5">
          {trendBars.map((value, index) => (
            <span
              key={index}
              className="w-3 rounded-t bg-calm-sage/70"
              style={{ height: `${Math.max(10, value * 14)}px` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
