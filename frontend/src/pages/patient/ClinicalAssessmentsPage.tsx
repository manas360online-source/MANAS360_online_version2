import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "@/lib/http";
import {
  CLINICAL_ASSESSMENT_OPTIONS,
  CLINICAL_QUESTION_BANK,
  severityFromClinicalScore,
} from "@/utils/clinicalAssessments";

type AssessmentType = "PHQ-9" | "GAD-7";
type Stage = "phq9" | "gad7" | "result";

export default function ClinicalAssessmentsPage() {
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("phq9");
  const [step, setStep] = useState(0);
  const [phqAnswers, setPhqAnswers] = useState<Record<number, number>>({});
  const [gadAnswers, setGadAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeType: AssessmentType = stage === "phq9" ? "PHQ-9" : "GAD-7";

  const questions = useMemo(() => {
    if (stage === "result") return [];
    return CLINICAL_QUESTION_BANK[activeType];
  }, [stage, activeType]);

  const currentQuestion = questions[step];

  const activeAnswers = stage === "phq9" ? phqAnswers : gadAnswers;

  const phqScore = Object.values(phqAnswers).reduce((a, b) => a + b, 0);
  const gadScore = Object.values(gadAnswers).reduce((a, b) => a + b, 0);

  const saveAssessment = async (
    type: AssessmentType,
    answersObj: Record<number, number>
  ) => {
    const totalQuestions = CLINICAL_QUESTION_BANK[type].length;

    const answers = Array.from({ length: totalQuestions }, (_, index) =>
      Number(answersObj[index] ?? 0)
    );

    await http.post("/v1/patients/assessments", {
      type,
      answers,
    });
  };

  const handleAnswer = async (points: number) => {
    setError("");

    if (stage === "phq9") {
      const updated = { ...phqAnswers, [step]: points };
      setPhqAnswers(updated);

      setTimeout(() => {
        if (step < questions.length - 1) {
          setStep((prev) => prev + 1);
        } else {
          setStage("gad7");
          setStep(0);
        }
      }, 220);

      return;
    }

    if (stage === "gad7") {
      const updated = { ...gadAnswers, [step]: points };
      setGadAnswers(updated);

      setTimeout(async () => {
        if (step < questions.length - 1) {
          setStep((prev) => prev + 1);
          return;
        }

        setSubmitting(true);

        try {
          await saveAssessment("PHQ-9", phqAnswers);
          await saveAssessment("GAD-7", updated);

          setStage("result");
        } catch (err: any) {
          setError(
            err?.response?.data?.message ||
              "Assessment submit failed. Please try again."
          );
        } finally {
          setSubmitting(false);
        }
      }, 220);
    }
  };

if (stage === "result") {
  const phqSeverity = severityFromClinicalScore("PHQ-9", phqScore);
  const gadSeverity = severityFromClinicalScore("GAD-7", gadScore);
  const combinedScore = phqScore + gadScore;

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✅
            </div>

            <h1 className="mt-4 text-3xl font-bold text-[#002365]">
              Assessments completed
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              PHQ-9 and GAD-7 have been saved successfully. You can now continue to therapist matching.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-5">
              <p className="text-xs font-bold uppercase text-slate-500">
                PHQ-9 Score
              </p>
              <p className="mt-2 text-3xl font-bold text-[#002365]">
                {phqScore}/27
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {phqSeverity}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-5">
              <p className="text-xs font-bold uppercase text-slate-500">
                GAD-7 Score
              </p>
              <p className="mt-2 text-3xl font-bold text-[#002365]">
                {gadScore}/21
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {gadSeverity}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#eef7ff] p-5">
              <p className="text-xs font-bold uppercase text-slate-500">
                Combined
              </p>
              <p className="mt-2 text-3xl font-bold text-[#002365]">
                {combinedScore}/48
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                Clinical screening summary
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100  p-5">
            <p className="text-sm font-bold text-[#002365]">
              Next step
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Therapist matching will now use your saved PHQ-9 and GAD-7 results to show available providers.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/patient/onboarding/booking-prompt", {
                replace: true,
              })
            }
            className="mt-6 w-full rounded-2xl bg-[#002365] py-4 text-sm font-bold text-white shadow-lg hover:bg-[#001f5c]"
          >
            Continue to therapist list →
          </button>
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-[#FAFAF8] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {activeType}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#2D4128]">
              {activeType === "PHQ-9"
                ? "Depression Assessment"
                : "Anxiety Assessment"}
            </h1>
          </div>

          <div className="rounded-full bg-[#E8EFE6] px-3 py-1 text-xs font-bold text-[#4A6741]">
            {step + 1}/{questions.length}
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#4A6741]"
            style={{
              width: `${((step + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <div className="mt-6 rounded-xl border bg-[#FAFAF8] p-5">
          <p className="text-xs font-bold uppercase text-slate-500">
            Question
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[#2D4128]">
            {currentQuestion}
          </h2>
        </div>

        <div className="mt-5 space-y-3">
          {CLINICAL_ASSESSMENT_OPTIONS.map((option) => {
            const selected = activeAnswers[step] === option.points;

            return (
              <button
                key={option.points}
                type="button"
                disabled={submitting}
                onClick={() => handleAnswer(option.points)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left text-sm font-semibold transition ${
                  selected
                    ? "border-[#4A6741] bg-[#E8EFE6] text-[#2D4128]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{option.label}</span>
                <span>{selected ? "✓" : option.points}</span>
              </button>
            );
          })}
        </div>

        {submitting && (
          <p className="mt-4 text-sm font-semibold text-[#4A6741]">
            Saving assessments...
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}