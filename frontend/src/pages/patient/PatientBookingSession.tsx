import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "@/lib/http";

type Therapist = {
  id: string;
  displayName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  languages?: string[];
  modes?: string[];
  specializations?: string[];
};

export default function BookFirstSessionPage() {
  const navigate = useNavigate();

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [therapistId, setTherapistId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");

  const getTherapistName = (t: Therapist) => {
    return (
      t.displayName ||
      t.name ||
      `${t.firstName || ""} ${t.lastName || ""}`.trim() ||
      "Therapist"
    );
  };

  const loadTherapists = async () => {
    setListLoading(true);
    setError("");

    try {
      const response = await http.get("/v1/patients/me/therapist-matches", {
        params: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          timeSlots: ["0-1439"],
          providerType: "THERAPIST",
          limit: 10,
        },
      });

      const providers = response.data?.data?.providers || [];
      setTherapists(providers);

      if (providers.length > 0) {
        setTherapistId(String(providers[0].id));
      }
    } catch (err: any) {
      const code =
        err?.response?.data?.error?.code ||
        err?.response?.data?.code;

      if (code === "BOTH_ASSESSMENTS_REQUIRED") {
        setError("Please complete PHQ-9 and GAD-7 screening first.");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load therapist list."
      );
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadTherapists();
  }, []);

  const handleBookSession = async () => {
    setError("");

    if (!therapistId || !dateTime) {
      setError("Please select therapist and session time.");
      return;
    }

    setLoading(true);

    try {
      const response = await http.post("/v1/patients/me/sessions/book", {
        therapistId,
        dateTime: new Date(dateTime).toISOString(),
      });

      navigate("/patient/onboarding/payment", {
        replace: true,
        state: {
          session: response.data?.data,
        },
      });
    } catch (err: any) {
      const code =
        err?.response?.data?.error?.code ||
        err?.response?.data?.code;

      if (code === "BOTH_ASSESSMENTS_REQUIRED") {
        navigate("/free-screening", { replace: true });
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Session booking failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3ec] px-4 py-8 flex justify-center">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#002B7F] text-white px-6 py-5">
            <p className="text-xs tracking-[0.25em] uppercase opacity-80">
              Patient Action
            </p>
            <h1 className="text-2xl font-bold mt-2">
              Book your first session
            </h1>
            <p className="text-sm opacity-80 mt-1">
              Choose therapist and preferred time to start your care journey.
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-800">
                  Select therapist
                </h2>

                <button
                  type="button"
                  onClick={loadTherapists}
                  className="text-xs font-semibold text-[#002B7F]"
                >
                  Refresh
                </button>
              </div>

              {listLoading ? (
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                  Loading therapists...
                </div>
              ) : therapists.length === 0 ? (
                <div className="rounded-xl border border-amber-200  p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    No therapist found
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Complete screening or check subscription to get smart matches.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/free-screening")}
                    className="mt-3 rounded-lg bg-[#002B7F] px-3 py-2 text-xs font-bold text-white"
                  >
                    Complete screening
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {therapists.map((t) => {
                    const name = getTherapistName(t);

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTherapistId(String(t.id))}
                        className={`text-left rounded-xl border p-4 transition ${
                          therapistId === String(t.id)
                            ? "border-[#002B7F] bg-blue-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="w-11 h-11 rounded-full bg-[#002B7F] text-white flex items-center justify-center font-bold">
                            {name.slice(0, 2).toUpperCase()}
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {t.title || "Mental Health Provider"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {(t.languages || []).join(", ") || "Hindi, English"} ·{" "}
                              {(t.modes || []).join(", ") || "Video"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-3">
                Select date and time
              </h2>

              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#002B7F]"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#fafafa] p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    First session
                  </p>
                  <h3 className="text-2xl font-bold text-[#002B7F] mt-1">
                    ₹1,499
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    50 min · video consultation
                  </p>
                </div>

                <span className="rounded-full bg-green-100 text-green-700 text-xs font-bold px-3 py-1">
                  Recommended
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-semibold">
                {error}
              </div>
            )}

            <button
              onClick={handleBookSession}
              disabled={loading || listLoading || therapists.length === 0}
              className="w-full rounded-xl bg-[#002B7F] text-white py-3 text-sm font-bold hover:bg-[#001f5c] disabled:opacity-60"
            >
              {loading ? "Booking..." : "Book session"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="inline-flex rounded-full bg-[#e8f1ff] text-[#002B7F] text-xs font-bold px-3 py-1">
            Therapist matching
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-4">
            Smart matching flow
          </h2>

          <div className="mt-5 space-y-4">
            {[
              ["1", "Complete screening", "PHQ-9 and GAD-7 are required."],
              ["2", "Get therapist list", "Matching API returns available providers."],
              ["3", "Choose a slot", "Select your preferred date and time."],
              ["4", "Book session", "Backend creates a pending booking."],
            ].map(([no, title, desc]) => (
              <div key={no} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#002B7F] text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {no}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-[#eef7ff] border border-blue-100 p-4">
            <p className="text-sm font-bold text-[#002B7F]">
              API used
            </p>
            <p className="text-xs text-slate-600 mt-1">
              GET /v1/patients/me/therapist-matches
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}