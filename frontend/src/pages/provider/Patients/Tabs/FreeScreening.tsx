import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { http } from "@/lib/http";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { FREE_SCREENING_QUESTIONS } from "../../../../utils/freeScreening";
import {
  CLINICAL_QUESTION_BANK,
  severityFromClinicalScore,
} from "../../../../utils/clinicalAssessments";

type Stage = "intro" | "free" | "phq9" | "gad7" | "result";

const COMMON_OPTIONS = FREE_SCREENING_QUESTIONS[0].options;

const stageMeta = {
  free: {
    title: "Quick Wellbeing Screening",
    subtitle: "5-question general wellbeing screener",
    max: 15,
    minutes: "2-3 min",
    badge: "Free",
  },
  phq9: {
    title: "PHQ-9 Depression Assessment",
    subtitle: "Patient Health Questionnaire",
    max: 27,
    minutes: "3-5 min",
    badge: "Clinical",
  },
  gad7: {
    title: "GAD-7 Anxiety Assessment",
    subtitle: "Generalized Anxiety Disorder Assessment",
    max: 21,
    minutes: "2-4 min",
    badge: "Clinical",
  },
};

const getFreeSeverity = (score: number) => {
  if (score >= 12) return "Severe";
  if (score >= 8) return "Moderate";
  if (score >= 4) return "Mild";
  return "Minimal";
};

const severityClass = (severity: string) => {
  if (severity === "Severe" || severity === "Moderately Severe") return "bg-red-50 text-red-600";
  if (severity === "Moderate") return "bg-amber-50 text-amber-700";
  if (severity === "Mild") return "bg-[#E8EFE6] text-[#4A6741]";
  return "bg-slate-100 text-slate-700";
};

export default function FreeScreening() {
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("intro");
  const [step, setStep] = useState(0);

  const [freeAnswers, setFreeAnswers] = useState<Record<number, number>>({});
  const [phqAnswers, setPhqAnswers] = useState<Record<number, number>>({});
  const [gadAnswers, setGadAnswers] = useState<Record<number, number>>({});
const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
const [historyLoading, setHistoryLoading] = useState(false);
const [attemptId, setAttemptId] = useState<string>('');
const [attemptToken, setAttemptToken] = useState<string>('');


const loadAssessmentHistory = async () => {
  try {
    setHistoryLoading(true);

    const response = await http.get(
      "/api/v1/patients/me/assessments",
      {
        params: {
          page: 1,
          limit: 10,
        },
      }
    );

    setAssessmentHistory(
      response.data?.data?.items || []
    );

  } catch (err) {
    console.error("Assessment history failed", err);
  } finally {
    setHistoryLoading(false);
  }
};


const startAssessment = async () => {
  try {
    const response = await http.post(
      '/api/v1/free-screening/start'
    );

    const data = response.data?.data;

    setAttemptId(data?.attemptId || '');
    setAttemptToken(data?.attemptToken || '');

  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  loadAssessmentHistory();
  startAssessment();
}, []);

  const currentQuestions = useMemo(() => {
    if (stage === "free") return FREE_SCREENING_QUESTIONS;

    if (stage === "phq9") {
      return CLINICAL_QUESTION_BANK["PHQ-9"].map((question) => ({
        question,
        options: COMMON_OPTIONS,
      }));
    }

    if (stage === "gad7") {
      return CLINICAL_QUESTION_BANK["GAD-7"].map((question) => ({
        question,
        options: COMMON_OPTIONS,
      }));
    }

    return [];
  }, [stage]);

  const currentQuestion = currentQuestions[step];

  const freeScore = Object.values(freeAnswers).reduce((a, b) => a + b, 0);
  const phqScore = Object.values(phqAnswers).reduce((a, b) => a + b, 0);
  const gadScore = Object.values(gadAnswers).reduce((a, b) => a + b, 0);

  const selected =
    stage === "free"
      ? freeAnswers[step]
      : stage === "phq9"
        ? phqAnswers[step]
        : gadAnswers[step];

  const progress =
    currentQuestions.length > 0 ? ((step + 1) / currentQuestions.length) * 100 : 0;

  const activeMeta =
    stage === "free" || stage === "phq9" || stage === "gad7"
      ? stageMeta[stage]
      : null;

  const historyItems = [
    {
      key: "free",
      title: "Free Screening",
      score: freeScore,
      max: 15,
      severity: Object.keys(freeAnswers).length ? getFreeSeverity(freeScore) : "Pending",
      active: stage === "free",
      complete: stage !== "intro" && stage !== "free",
    },
    {
      key: "phq9",
      title: "PHQ-9 Depression",
      score: phqScore,
      max: 27,
      severity: Object.keys(phqAnswers).length
        ? severityFromClinicalScore("PHQ-9", phqScore)
        : "Pending",
      active: stage === "phq9",
      complete: stage === "gad7" || stage === "result",
    },
    {
      key: "gad7",
      title: "GAD-7 Anxiety",
      score: gadScore,
      max: 21,
      severity: Object.keys(gadAnswers).length
        ? severityFromClinicalScore("GAD-7", gadScore)
        : "Pending",
      active: stage === "gad7",
      complete: stage === "result",
    },
  ];

 const handleAnswer = async (points: number) => {
  if (stage === "free") setFreeAnswers((prev) => ({ ...prev, [step]: points }));
  if (stage === "phq9") setPhqAnswers((prev) => ({ ...prev, [step]: points }));
  if (stage === "gad7") setGadAnswers((prev) => ({ ...prev, [step]: points }));

  setTimeout(async () => {
    if (step < currentQuestions.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    if (stage === "free") {
      setStage("phq9");
      setStep(0);
      return;
    }

    if (stage === "phq9") {
      setStage("gad7");
      setStep(0);
      return;
    }

    if (stage === "gad7") {
      try {
        await http.post("/free-screening/submit", {
          freeScore,
          phqScore,
          gadScore,
        });
      } catch (err) {
        console.error("Assessment submit failed", err);
      }

      setStage("result");
    }
  }, 280);
};

  const goBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      return;
    }

    if (stage === "gad7") {
      setStage("phq9");
      setStep(CLINICAL_QUESTION_BANK["PHQ-9"].length - 1);
      return;
    }

    if (stage === "phq9") {
      setStage("free");
      setStep(FREE_SCREENING_QUESTIONS.length - 1);
      return;
    }

    setStage("intro");
  };

  const resetAll = () => {
    setStage("intro");
    setStep(0);
    setFreeAnswers({});
    setPhqAnswers({});
    setGadAnswers({});
  };

  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-[#FAFAF8] px-4 py-10" style={{ fontFamily: "DM Sans, sans-serif" }}>
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#E8EFE6] px-3 py-1 text-xs font-semibold text-[#4A6741]">
                  <ShieldCheck className="h-4 w-4" />
                  Private · Guided · Immediate Summary
                </div>

                <h1 className="mt-5 font-display text-3xl font-semibold text-[#2D4128] sm:text-4xl">
                  Free Mental Health Screening
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Start with a 5-question wellbeing screener, then continue through PHQ-9 and GAD-7.
                  Your score summary will help guide the next action.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Free Screening", "5 questions"],
                    ["PHQ-9", "9 questions"],
                    ["GAD-7", "7 questions"],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] p-4">
                      <CheckCircle2 className="h-5 w-5 text-[#4A6741]" />
                      <p className="mt-2 text-sm font-semibold text-[#2D4128]">{title}</p>
                      <p className="mt-1 text-xs text-slate-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] p-5 lg:w-72">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Entry A Flow
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>1. Free screening</p>
                  <p>2. PHQ-9 assessment</p>
                  <p>3. GAD-7 assessment</p>
                  <p>4. Score summary</p>
                  <p>5. Continue booking</p>
                </div>

              <button
  type="button"
  onClick={() => {
    setStage("free");
    setStep(0);
  }}
  className="group mt-6 w-full overflow-hidden rounded-2xl border border-[#4A6741]/20 bg-[#2D4128] p-[1px] shadow-lg shadow-[#4A6741]/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#4A6741]/20 active:translate-y-0"
>
  <span className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#4A6741] to-[#2D4128] px-5 py-4 text-sm font-bold text-white">
    <span>
      Start Screening
      {/* <span className="mt-0.5 block text-xs font-medium text-white/75">
        Takes only 2–3 minutes
      </span> */}
    </span>

    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  </span>
</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "result") {
    const freeSeverity = getFreeSeverity(freeScore);
    const phqSeverity = severityFromClinicalScore("PHQ-9", phqScore);
    const gadSeverity = severityFromClinicalScore("GAD-7", gadScore);

    return (
      <div className="min-h-screen bg-[#FAFAF8] px-4 py-10" style={{ fontFamily: "DM Sans, sans-serif" }}>
        <div className="mx-auto max-w-5xl space-y-4">
          <header className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#2D4128]">
                  Assessment Summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review your screening scores and continue to book support.
                </p>
              </div>

              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm font-semibold text-[#2D4128] transition hover:bg-[#FAFAF8]"
              >
                Retake
              </button>
            </div>
          </header>

          {assessmentHistory.length > 0 && (
  <div className="mt-6 rounded-xl border border-[#E5E5E5] bg-white p-5">
    <h3 className="text-lg font-bold text-[#2D4128]">
      Previous Assessments
    </h3>

    <div className="mt-4 space-y-3">
      {assessmentHistory.map((item: any) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                {item.type}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-[#002B7F]">
                {item.score}
              </p>

              <p className="text-xs text-slate-500">
                Score
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm">
                <p className="font-display text-lg font-semibold text-[#2D4128]">
                  Completed Instruments
                </p>
                {/* <p className="mt-1 text-sm text-slate-500">Entry A journey completed</p> */}

                <div className="mt-4 space-y-3">
                  {[
                    ["Free Screening", freeScore, 15, freeSeverity],
                    ["PHQ-9 Depression", phqScore, 27, phqSeverity],
                    ["GAD-7 Anxiety", gadScore, 21, gadSeverity],
                  ].map(([title, score, max, severity]) => (
                    <div key={String(title)} className="rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#2D4128]">{title}</p>
                          <p className="mt-1 text-xs text-slate-500">Completed now</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityClass(String(severity))}`}>
                          {String(severity)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Total Score
                        </span>
                        <span className="font-semibold text-[#2D4128]">
                          {String(score)}/{String(max)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="lg:col-span-2">
              <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-[#E5E5E5] pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-display text-2xl font-semibold text-[#2D4128]">
                      Your Mental Health Summary
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      This is not a diagnosis. It helps guide your next step.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Combined Score
                    </p>
                    <p className="mt-1 font-display text-3xl font-semibold text-[#2D4128]">
                      {freeScore + phqScore + gadScore}/63
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-blue-100  p-4">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-display text-sm font-semibold text-slate-800">
                        Clinical Insight
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Free screening: {freeSeverity}. PHQ-9: {phqSeverity}. GAD-7: {gadSeverity}.
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        A trained professional can review these results and suggest the right support plan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-[#E8EFE6] p-4">
                    <p className="text-xs text-slate-500">Free Screening</p>
                    <p className="mt-1 text-2xl font-bold text-[#2D4128]">{freeScore}/15</p>
                  </div>
                  <div className="rounded-xl  p-4">
                    <p className="text-xs text-slate-500">PHQ-9</p>
                    <p className="mt-1 text-2xl font-bold text-[#2D4128]">{phqScore}/27</p>
                  </div>
                  <div className="rounded-xl  p-4">
                    <p className="text-xs text-slate-500">GAD-7</p>
                    <p className="mt-1 text-2xl font-bold text-[#2D4128]">{gadScore}/21</p>
                  </div>
                </div>

             <button
  type="button"
onClick={() => {
  sessionStorage.setItem("patientLeadFlow", "true");

  sessionStorage.setItem(
    "freeScreeningResult",
    JSON.stringify({
      freeScore,
      phqScore,
      gadScore,
      freeSeverity,
      phqSeverity,
      gadSeverity,
      completedAt: new Date().toISOString(),
    }),
  );

  navigate("/auth/signup?flow=patient-lead");
}}
  className="group mt-6 w-full overflow-hidden rounded-2xl border border-[#4A6741]/20 bg-[#2D4128] p-[1px] shadow-lg shadow-[#4A6741]/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#4A6741]/20 active:translate-y-0"
>
  <span className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#4A6741] via-[#3F5D37] to-[#2D4128] px-5 py-4 text-left text-white">
    <span>
      <span className="block text-sm font-bold">
        Continue & Book Session
      </span>
      <span className="mt-0.5 block text-xs font-medium text-white/75">
        Save your result and find the right therapist
      </span>
    </span>

    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-bold transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  </span>
</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] px-4 py-10" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-col gap-3 rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2D4128]">
              Mental Health Assessment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeMeta?.subtitle} · {activeMeta?.minutes}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-lg bg-[#E8EFE6] px-3 py-2 text-xs font-semibold text-[#4A6741]">
              {activeMeta?.badge}
            </span>
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm font-semibold text-[#2D4128] transition hover:bg-[#FAFAF8]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] pb-4">
                <div>
                  <p className="font-display text-lg font-semibold text-[#2D4128]">
                    Assessment Flow
                  </p>
                  <p className="text-sm text-slate-500">Auto next after selection</p>
                </div>
                <div className="rounded-full bg-[#FAFAF8] px-3 py-1 text-xs font-semibold text-slate-500">
                  {step + 1}/{currentQuestions.length}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {historyItems.map((item) => (
                  <div
                    key={item.key}
                    className={`rounded-xl border px-4 py-4 transition-all ${
                      item.active
                        ? "border-[#E5E5E5] border-l-4 border-l-[#4A6741] bg-[#E8EFE6]"
                        : "border-[#E5E5E5] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#2D4128]">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.complete ? "Completed" : item.active ? "In progress" : "Pending"}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.severity === "Pending" ? "bg-slate-100 text-slate-500" : severityClass(item.severity)
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Score
                      </span>
                      <span className="font-semibold text-[#2D4128]">
                        {item.score}/{item.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-2">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-[#E5E5E5] pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-display text-2xl font-semibold text-[#2D4128]">
                    {activeMeta?.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Question {step + 1} of {currentQuestions.length}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Progress
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold text-[#2D4128]">
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E5E5]">
                  <div
                    className="h-full rounded-full bg-[#4A6741] transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(progress, 5)}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-blue-100  p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-display text-sm font-semibold text-slate-800">
                      Please choose one response
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Select the option that best matches how you have felt. The next question opens automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[#E5E5E5] bg-[#FAFAF8] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Question
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-7 text-[#2D4128]">
                  {currentQuestion?.question}
                </h3>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-[#E5E5E5]">
                <div className="divide-y divide-[#E5E5E5] bg-white">
                  {currentQuestion?.options.map((opt: any) => {
                    const active = selected === opt.points;

                    return (
                      <button
                        key={opt.optionIndex}
                        type="button"
                        onClick={() => handleAnswer(opt.points)}
                        className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-all active:scale-[0.995] ${
                          active ? "bg-[#E8EFE6]" : "hover:bg-[#FAFAF8]"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#2D4128]">
                            {opt.label}
                          </p>
                          {/* <p className="mt-1 text-xs text-slate-500">
                            Response option {opt.optionIndex + 1}
                          </p> */}
                        </div>

                        <span
                          className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-bold ${
                            active
                              ? "bg-[#4A6741] text-white"
                              : "border border-[#E5E5E5] bg-[#FAFAF8] text-slate-500"
                          }`}
                        >
                          {active ? "✓" : opt.points}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}