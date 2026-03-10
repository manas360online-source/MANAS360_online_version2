import { useMemo, useState } from 'react';
import { patientApi } from '../../api/patient';

type AssessmentMode = 'quick' | 'clinical';
type ClinicalAssessmentKey = 'PHQ-9' | 'GAD-7' | 'PSS-10' | 'ISI';

const quickQuestions = [
  'Mood',
  'Sleep quality',
  'Stress load',
  'Energy level',
  'Focus ability',
  'Social connection',
];

const clinicalCards: Array<{ key: ClinicalAssessmentKey; description: string; max: number }> = [
  { key: 'PHQ-9', description: 'Depression symptom screening', max: 27 },
  { key: 'GAD-7', description: 'Anxiety severity screening', max: 21 },
  { key: 'PSS-10', description: 'Perceived stress evaluation', max: 40 },
  { key: 'ISI', description: 'Insomnia severity index', max: 28 },
];

const recommendationBySeverity = {
  severe: ['Immediate therapist consultation is recommended.', 'Start breathing + grounding routine today.'],
  moderate: ['Continue CBT exercises and schedule follow-up this week.', 'Track mood and sleep daily for 7 days.'],
  mild: ['Maintain routine and complete two self-care interventions this week.', 'Repeat quick check in 3 days.'],
};

const getSeverity = (score: number) => {
  if (score >= 15) return 'severe';
  if (score >= 8) return 'moderate';
  return 'mild';
};

export default function AssessmentsPage() {
  const [mode, setMode] = useState<AssessmentMode>('quick');
  const [selectedClinical, setSelectedClinical] = useState<ClinicalAssessmentKey>('PHQ-9');
  const [score, setScore] = useState(10);
  const [quickAnswers, setQuickAnswers] = useState<number[]>(Array(quickQuestions.length).fill(2));
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resultCard, setResultCard] = useState<null | {
    type: string;
    score: number;
    level: string;
    recommendations: string[];
  }>(null);

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

  const onSubmitClinical = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await patientApi.submitAssessment({
        type: selectedClinical,
        score,
      });
      const payload = response.data ?? response;
      const level = String(payload.result_level || getSeverity(Number(payload.score || 0))).toLowerCase();
      const normalized = level.includes('severe') ? 'severe' : level.includes('moderate') ? 'moderate' : 'mild';
      setMessage(`Saved: ${payload.type} • Score ${payload.score} • ${payload.result_level}`);
      setResultCard({
        type: String(payload.type || selectedClinical),
        score: Number(payload.score || score),
        level: normalized,
        recommendations: recommendationBySeverity[normalized],
      });
      await loadMoodHistory();
    } finally {
      setLoading(false);
    }
  };

  const onSubmitQuickCheck = async () => {
    setLoading(true);
    setMessage('');
    try {
      const computed = quickAnswers.reduce((sum, value) => sum + Number(value || 0), 0);
      const level = getSeverity(computed);
      const response = await patientApi.submitAssessment({
        type: 'Quick Mental Check',
        score: computed,
        answers: quickAnswers,
      });
      const payload = response.data ?? response;
      setMessage(`Saved: Quick Mental Check • Score ${payload.score} • ${payload.result_level}`);
      setResultCard({
        type: 'Quick Mental Check',
        score: Number(payload.score || computed),
        level,
        recommendations: recommendationBySeverity[level],
      });
      await loadMoodHistory();
    } finally {
      setLoading(false);
    }
  };

  const trendBars = useMemo(() => {
    const values = history.slice(0, 20).reverse().map((entry: any) => Number(entry.mood || 0));
    return values.length ? values : [2, 3, 4, 2, 3, 4, 3];
  }, [history]);

  const selectedClinicalMax = clinicalCards.find((item) => item.key === selectedClinical)?.max || 27;

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <h1 className="font-serif text-3xl font-light md:text-4xl">Assessments</h1>
      <p className="text-sm text-charcoal/65">Run quick checks or full clinical assessments and get actionable recommendations.</p>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode('quick')}
          className={`rounded-2xl border p-4 text-left transition ${
            mode === 'quick' ? 'border-calm-sage bg-calm-sage/10' : 'border-calm-sage/15 bg-white/85 hover:bg-calm-sage/5'
          }`}
        >
          <p className="text-sm font-semibold">Quick Mental Check</p>
          <p className="mt-1 text-xs text-charcoal/65">6-question, 1-minute self-check.</p>
        </button>

        <button
          type="button"
          onClick={() => setMode('clinical')}
          className={`rounded-2xl border p-4 text-left transition ${
            mode === 'clinical' ? 'border-calm-sage bg-calm-sage/10' : 'border-calm-sage/15 bg-white/85 hover:bg-calm-sage/5'
          }`}
        >
          <p className="text-sm font-semibold">Clinical Assessments</p>
          <p className="mt-1 text-xs text-charcoal/65">PHQ-9, GAD-7, PSS-10, and ISI scoring workflows.</p>
        </button>
      </section>

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
        {mode === 'quick' ? (
          <>
            <h2 className="text-base font-semibold">Quick Mental Check</h2>
            <p className="mt-1 text-sm text-charcoal/65">Rate each dimension from 0 (very low) to 4 (very high).</p>

            <div className="mt-4 space-y-3">
              {quickQuestions.map((question, index) => (
                <div key={question} className="rounded-xl border border-calm-sage/10 p-3">
                  <p className="text-sm font-medium text-charcoal">{question}</p>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={quickAnswers[index]}
                    onChange={(event) =>
                      setQuickAnswers((prev) => {
                        const next = [...prev];
                        next[index] = Number(event.target.value);
                        return next;
                      })
                    }
                    className="mt-2 w-full"
                  />
                  <p className="text-xs text-charcoal/60">Score: {quickAnswers[index]}/4</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onSubmitQuickCheck}
                disabled={loading}
                className="inline-flex min-h-[40px] items-center rounded-full bg-charcoal px-4 text-sm font-medium text-cream disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Submit Quick Check'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold">Clinical Assessments</h2>
            <p className="mt-1 text-sm text-charcoal/65">Choose a clinical tool and submit your score.</p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {clinicalCards.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedClinical(item.key);
                    setScore(Math.min(score, item.max));
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedClinical === item.key
                      ? 'border-calm-sage bg-calm-sage/10'
                      : 'border-calm-sage/15 bg-white/85 hover:bg-calm-sage/5'
                  }`}
                >
                  <p className="text-sm font-semibold">{item.key}</p>
                  <p className="mt-1 text-xs text-charcoal/65">{item.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium">Score ({selectedClinical}): {score}</label>
              <input
                type="range"
                min={0}
                max={selectedClinicalMax}
                value={Math.min(score, selectedClinicalMax)}
                onChange={(event) => setScore(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onSubmitClinical}
                disabled={loading}
                className="inline-flex min-h-[40px] items-center rounded-full bg-charcoal px-4 text-sm font-medium text-cream disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Clinical Assessment'}
              </button>
            </div>
          </>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={loadMoodHistory}
            className="inline-flex min-h-[40px] items-center rounded-full border border-calm-sage/25 px-4 text-sm font-medium text-charcoal/75"
          >
            Refresh Trend Data
          </button>
        </div>

        {message ? <p className="mt-3 text-sm text-calm-sage">{message}</p> : null}
      </section>

      {resultCard ? (
        <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
          <h2 className="text-base font-semibold">Assessment Result</h2>
          <p className="mt-1 text-sm text-charcoal/70">
            Your Result: <span className="font-semibold">{resultCard.level.toUpperCase()}</span> ({resultCard.type} • Score {resultCard.score})
          </p>
          <div className="mt-3">
            <p className="text-sm font-medium text-charcoal">Recommendations</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-charcoal/75">
              {resultCard.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
              <li>Continue mood tracking and follow your therapy plan.</li>
            </ul>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-calm-sage/15 bg-white/85 p-5 shadow-soft-sm">
        <h2 className="text-base font-semibold">Progress Analytics</h2>
        <p className="mt-1 text-sm text-charcoal/65">Mood trend over recent entries for clinical context</p>

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
