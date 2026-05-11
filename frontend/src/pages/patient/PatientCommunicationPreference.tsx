import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { http } from '../../lib/http';
import { getApiErrorMessage } from "@/api/auth";
// ─── Types ────────────────────────────────────────────────────────────────────
interface TimeSlot {
  id: string;
  label: string;
  time: string;
}

interface DaySlot {
  day: string;
  short: string;
  slots: string[];
}

interface PatientPreferences {
  // Language
  primaryLanguage: string;
  secondaryLanguages: string[];
  // Therapy mode
  therapyModes: string[];
  // Scheduling
  availability: Record<string, string[]>;
  timezone: string;
  sessionDuration: string;
  // Provider preferences (removed from UI — handled post-screening)
  // Communication
  reminderChannels: string[];
  reminderTiming: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English", script: "English" },
  { code: "hi", label: "Hindi", script: "हिंदी" },
  { code: "kn", label: "Kannada", script: "ಕನ್ನಡ" },
  { code: "ta", label: "Tamil", script: "தமிழ்" },
  { code: "te", label: "Telugu", script: "తెలుగు" },
];

const THERAPY_MODES = [
  { id: "video", icon: "🎥", label: "Video therapy", sub: "Face-to-face via Jitsi" },
  { id: "voice", icon: "🎙️", label: "Voice therapy", sub: "Audio only, no camera" },
  { id: "chat", icon: "💬", label: "Chat / messaging", sub: "Text-based sessions" },
  { id: "ai_buddy", icon: "🤖", label: "AnytimeBuddy (AI)", sub: "24/7 AI companion" },
];

const DAYS: DaySlot[] = [
  { day: "Monday", short: "Mon", slots: [] },
  { day: "Tuesday", short: "Tue", slots: [] },
  { day: "Wednesday", short: "Wed", slots: [] },
  { day: "Thursday", short: "Thu", slots: [] },
  { day: "Friday", short: "Fri", slots: [] },
  { day: "Saturday", short: "Sat", slots: [] },
  { day: "Sunday", short: "Sun", slots: [] },
];

const TIME_SLOTS: TimeSlot[] = [
  { id: "morning", label: "Morning", time: "6am – 12pm" },
  { id: "afternoon", label: "Afternoon", time: "12pm – 5pm" },
  { id: "evening", label: "Evening", time: "5pm – 9pm" },
  { id: "night", label: "Night", time: "9pm – 12am" },
];

const DURATIONS = ["30 min", "45 min", "60 min", "90 min"];

// ─── Sub-components ────────────────────────────────────────────────────────────
const SectionHeader = ({ step, title, sub }: { step: number; title: string; sub: string }) => (
  <div style={{ marginBottom: "1.5rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
      <span style={{
        width: "28px", height: "28px", borderRadius: "50%",
        background: "#002365", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 700, flexShrink: 0,
      }}>{step}</span>
      <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#002365", fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
    </div>
    <p style={{ margin: "0 0 0 2.65rem", fontSize: "0.78rem", color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>
  </div>
);

const Pill = ({
  label, sub, selected, onClick, color = "#002365",
}: { label: string; sub?: string; selected: boolean; onClick: () => void; color?: string }) => (
  <button
    onClick={onClick}
    style={{
      border: selected ? `2px solid ${color}` : "1.5px solid #d6e0ee",
      borderRadius: "14px",
      padding: "0.8rem 1rem",
      background: selected ? "#eaf1ff" : "#ffffff",
      cursor: "pointer",
      color: "#002365",
      textAlign: "left",
      transition: "all 0.15s",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      boxShadow: selected
        ? "0 6px 16px rgba(0,35,101,0.12)"
        : "0 2px 8px rgba(15,23,42,0.04)",
    }}
  >
    <span
      style={{
        fontSize: "0.86rem",
        fontWeight: 700,
        color: selected ? "#002365" : "#1e293b",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {label}
    </span>

    {sub && (
      <span
        style={{
          fontSize: "0.74rem",
          fontWeight: 500,
          color: selected ? "#334155" : "#002365",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {sub}
      </span>
    )}
  </button>
);

const Tag = ({
  label, selected, onClick, accent = "#002365",
}: { label: string; selected: boolean; onClick: () => void; accent?: string }) => (
  <button
    onClick={onClick}
    style={{
      border: selected ? `1.5px solid ${accent}` : "1.5px solid #e2e8f0",
      borderRadius: "20px",
      padding: "0.3rem 0.75rem",
      fontSize: "0.76rem",
      fontWeight: selected ? 600 : 400,
      background: selected ? `${accent}14` : "#f8fafc",
      color: selected ? accent : "#475569",
      cursor: "pointer",
      transition: "all 0.12s",
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </button>
);

// ─── Availability Grid ─────────────────────────────────────────────────────────
const AvailabilityGrid = ({
  availability,
  onChange,
}: {
  availability: Record<string, string[]>;
  onChange: (day: string, slot: string) => void;
}) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "480px" }}>
        <thead>
          <tr>
            <th style={{ width: "90px", padding: "0.4rem 0.5rem", fontSize: "0.72rem", color: "#94a3b8", textAlign: "left", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Slot</th>
            {days.map((d, i) => (
              <th key={d} style={{
                padding: "0.4rem 0.3rem", fontSize: "0.72rem", fontWeight: 600,
                color: i >= 5 ? "#7F8000" : "#334155",
                textAlign: "center", fontFamily: "'DM Sans', sans-serif",
              }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot) => (
            <tr key={slot.id}>
              <td style={{ padding: "0.35rem 0.5rem" }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "#334155", fontFamily: "'DM Sans', sans-serif" }}>{slot.label}</div>
                <div style={{ fontSize: "0.66rem", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>{slot.time}</div>
              </td>
              {fullDays.map((day, i) => {
                const selected = (availability[day] || []).includes(slot.id);
                return (
                  <td key={day} style={{ padding: "0.25rem 0.3rem", textAlign: "center" }}>
                    <button
                      onClick={() => onChange(day, slot.id)}
                      title={`${day} ${slot.label}`}
                      style={{
                        width: "32px", height: "28px", borderRadius: "6px",
                        border: selected ? "1.5px solid #002365" : "1.5px solid #e2e8f0",
                        background: selected ? "#002365" : i >= 5 ? "#fafdf0" : "#f8fafc",
                        cursor: "pointer", transition: "all 0.12s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {selected && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Save Button ──────────────────────────────────────────────────────────────
const SaveBar = ({ onSave, saved }: { onSave: () => void; saved: boolean }) => (
  <div style={{
    position: "sticky", bottom: 0,
    background: "linear-gradient(to top, #fff 80%, transparent)",
    padding: "1.25rem 0 0.5rem",
    display: "flex", gap: "0.75rem", justifyContent: "flex-end", alignItems: "center",
  }}>
    {saved && (
      <span style={{ fontSize: "0.78rem", color: "#0F6E56", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
        ✓ Preferences saved
      </span>
    )}
    <button
      onClick={onSave}
      style={{
        background: "#002365", color: "#fff",
        border: "none", borderRadius: "10px",
        padding: "0.65rem 1.75rem",
        fontSize: "0.88rem", fontWeight: 700,
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 4px 14px rgba(0,35,101,0.25)",
        transition: "all 0.15s",
      }}
    >
      Save preferences
    </button>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PatientProfilePreferences() {
  const [prefs, setPrefs] = useState<PatientPreferences>({
    primaryLanguage: "en",
    secondaryLanguages: [],
    therapyModes: ["video"],
    availability: {},
    timezone: "Asia/Kolkata",
    sessionDuration: "50 min",
    reminderChannels: ["whatsapp"],
    reminderTiming: "1h",
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
   const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const navigate  = useNavigate();

  const toggle = useCallback(<K extends keyof PatientPreferences>(
    key: K,
    value: string
  ) => {
    setPrefs((p) => {
      const arr = p[key] as string[];
      const updated = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...p, [key]: updated };
    });
    setSaved(false);
  }, []);

  const set = useCallback(<K extends keyof PatientPreferences>(key: K, value: PatientPreferences[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }, []);

  const toggleAvailability = useCallback((day: string, slot: string) => {
    setPrefs((p) => {
      const daySlots = p.availability[day] || [];
      const updated = daySlots.includes(slot)
        ? daySlots.filter((s) => s !== slot)
        : [...daySlots, slot];
      return { ...p, availability: { ...p.availability, [day]: updated } };
    });
    setSaved(false);
  }, []);



const handleSave = async () => {
  setError(null);
  setLoading(true);

  try {
    const payload = {
      preferredLanguage: prefs.primaryLanguage,
      communicationChannels: prefs.reminderChannels,
      therapyModes: prefs.therapyModes,
      availability: prefs.availability,
      timezone: prefs.timezone,
      sessionDuration: prefs.sessionDuration,
      reminderTiming: prefs.reminderTiming,
    };

    await http.patch(
      '/v1/patients/profile/preferences',
      payload
    );

    setSaved(true);

    navigate('/patient/onboarding/booking-prompt', {
      replace: true,
    });

  } catch (err: any) {
    setError(getApiErrorMessage(err, 'Failed to save preferences'));
  } finally {
    setLoading(false);
  }
};

  const tabs = ["Language", "Therapy mode", "Schedule"];

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e8eef6",
    padding: "1.5rem",
    marginBottom: "1rem",
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#f4f7fb",
      minHeight: "100vh",
      padding: "0",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button:focus-visible { outline: 2px solid #002365; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#002365",
        padding: "1.25rem 1.5rem 1rem",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>🧠</div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>My therapy preferences</div>
              <div style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.65)" }}>
                Helps us match you to the right provider
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{
            display: "flex", gap: "0.25rem",
            overflowX: "auto", paddingBottom: "2px",
          }}>
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.76rem",
                  fontWeight: activeTab === i ? 700 : 500,
                  background: activeTab === i ? "#fff" : "rgba(255,255,255,0.12)",
                  color: activeTab === i ? "#002365" : "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "1.25rem 1rem 2rem" }}>

        {/* ── TAB 0: LANGUAGE ── */}
        {activeTab === 0 && (
          <>
            <div style={cardStyle}>
              <SectionHeader step={1} title="Primary therapy language" sub="Sessions will be conducted in this language" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => set("primaryLanguage", lang.code)}
                    style={{
                      border: prefs.primaryLanguage === lang.code ? "2px solid #002365" : "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0.65rem 1rem",
                      background: prefs.primaryLanguage === lang.code ? "#002365" : "#fff",
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                      minWidth: "90px",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: prefs.primaryLanguage === lang.code ? "#fff" : "#334155", fontFamily: "'DM Sans', sans-serif" }}>
                      {lang.script}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: prefs.primaryLanguage === lang.code ? "rgba(255,255,255,0.75)" : "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
                      {lang.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <SectionHeader step={2} title="Also comfortable in" sub="Select all that apply — provider will use your primary language" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {LANGUAGES.filter((l) => l.code !== prefs.primaryLanguage).map((lang) => (
                  <Tag
                    key={lang.code}
                    label={`${lang.script} · ${lang.label}`}
                    selected={prefs.secondaryLanguages.includes(lang.code)}
                    onClick={() => toggle("secondaryLanguages", lang.code)}
                  />
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <SectionHeader step={3} title="Session reminders" sub="How and when should we remind you?" />
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Remind me via</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {[{ id: "whatsapp", label: "WhatsApp" }, { id: "sms", label: "SMS" }, { id: "email", label: "Email (optional)" }].map((ch) => (
                    <Tag
                      key={ch.id}
                      label={ch.label}
                      selected={prefs.reminderChannels.includes(ch.id)}
                      onClick={() => toggle("reminderChannels", ch.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Remind me</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {[{ id: "24h", label: "24 hrs before" }, { id: "2h", label: "2 hrs before" }, { id: "1h", label: "1 hr before" }, { id: "15m", label: "15 min before" }].map((t) => (
                    <Tag
                      key={t.id}
                      label={t.label}
                      selected={prefs.reminderTiming === t.id}
                      onClick={() => set("reminderTiming", t.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 1: THERAPY MODE ── */}
        {activeTab === 1 && (
          <>
         <div
  style={{
    ...cardStyle,
    background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
    border: "1px solid #dbe7ff",
    boxShadow: "0 6px 18px rgba(0,35,101,0.08)",
  }}
>
  <SectionHeader
    step={4}
    title="How do you prefer to connect?"
    sub="Select all that work for you — provider will confirm availability"
  />

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0.65rem",
    }}
  >
    {THERAPY_MODES.map((mode) => (
      <Pill
        key={mode.id}
        label={`${mode.icon} ${mode.label}`}
        sub={mode.sub}
        selected={prefs.therapyModes.includes(mode.id)}
        onClick={() => toggle("therapyModes", mode.id)}
      />
    ))}
  </div>
</div>

            <div style={cardStyle}>
              <SectionHeader step={5} title="Session duration" sub="How long would you prefer each session to be?" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {DURATIONS.map((d) => (
                  <Tag
                    key={d}
                    label={d}
                    selected={prefs.sessionDuration === d}
                    onClick={() => set("sessionDuration", d)}
                  />
                ))}
              </div>
              <div style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "#f0f7ff",
                borderRadius: "8px",
                borderLeft: "3px solid #185FA5",
              }}>
                <div style={{ fontSize: "0.75rem", color: "#185FA5", fontWeight: 600, marginBottom: "2px" }}>Provider note</div>
                <div style={{ fontSize: "0.73rem", color: "#334155" }}>
                  Most first sessions are 50 min. Your provider may suggest adjustments after the initial consultation.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 2: SCHEDULE ── */}
        {activeTab === 2 && (
          <>
            <div style={cardStyle}>
              <SectionHeader step={6} title="Your availability" sub="Select the days and times that work best — tap a cell to toggle" />
              <AvailabilityGrid availability={prefs.availability} onChange={toggleAvailability} />

              {/* Summary badges */}
              {Object.keys(prefs.availability).some((d) => (prefs.availability[d] || []).length > 0) && (
                <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {Object.entries(prefs.availability)
                    .filter(([, slots]) => slots.length > 0)
                    .map(([day, slots]) => (
                      <span key={day} style={{
                        fontSize: "0.7rem", padding: "0.2rem 0.6rem",
                        background: "#002365", color: "#fff",
                        borderRadius: "20px", fontWeight: 600,
                      }}>
                        {day.slice(0, 3)} · {slots.map((s) => TIME_SLOTS.find((t) => t.id === s)?.label).join(", ")}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <SectionHeader step={7} title="Your timezone" sub="Confirmed for IST — update if you're outside India" />
              <select
                value={prefs.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                style={{
                  width: "100%", padding: "0.65rem 0.85rem",
                  borderRadius: "10px", border: "1.5px solid #e2e8f0",
                  fontSize: "0.84rem", color: "#334155",
                  background: "#fff", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  appearance: "none",
                }}
              >
                <option value="Asia/Kolkata">India Standard Time (IST) — UTC+5:30</option>
                <option value="Asia/Dubai">Gulf Standard Time (GST) — UTC+4:00</option>
                <option value="Australia/Sydney">AEST — UTC+10:00</option>
                <option value="Europe/London">GMT/BST — UTC+0:00 / +1:00</option>
                <option value="America/New_York">Eastern Time (ET) — UTC-5:00</option>
                <option value="America/Los_Angeles">Pacific Time (PT) — UTC-8:00</option>
                <option value="Asia/Singapore">Singapore Time (SGT) — UTC+8:00</option>
              </select>
              {prefs.timezone !== "Asia/Kolkata" && (
                <div style={{
                  marginTop: "0.65rem",
                  padding: "0.65rem",
                  background: "#fef9ee",
                  borderRadius: "8px",
                  borderLeft: "3px solid #BA7517",
                  fontSize: "0.73rem",
                  color: "#633806",
                }}>
                  NRI users: Billing is in INR. An Indian +91 number via Airtel/Jio eSIM is required for WhatsApp reminders.
                </div>
              )}
            </div>
          </>
        )}

        {/* Navigation + Save */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem" }}>
          <button
            onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
            disabled={activeTab === 0}
            style={{
              border: "1.5px solid #e2e8f0",
              borderRadius: "10px", padding: "0.55rem 1.1rem",
              fontSize: "0.82rem", fontWeight: 600, color: "#475569",
              background: "#fff", cursor: activeTab === 0 ? "not-allowed" : "pointer",
              opacity: activeTab === 0 ? 0.4 : 1,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ← Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Step dots */}
            {tabs.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                style={{
                  width: i === activeTab ? "20px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === activeTab ? "#002365" : "#cbd5e1",
                  border: "none", cursor: "pointer",
                  transition: "all 0.2s",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {activeTab < tabs.length - 1 ? (
            <button
              onClick={() => setActiveTab((t) => Math.min(tabs.length - 1, t + 1))}
              style={{
                border: "none",
                borderRadius: "10px", padding: "0.55rem 1.1rem",
                fontSize: "0.82rem", fontWeight: 700, color: "#fff",
                background: "#002365", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Next →
            </button>
          ) : (
         <button
  onClick={handleSave}
  disabled={loading}
  style={{
    border: "none",
    borderRadius: "10px",
    padding: "0.55rem 1.25rem",
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#fff",
    background: saved ? "#0F6E56" : "#002365",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
    fontFamily: "'DM Sans', sans-serif",
  }}
>
  {loading ? "Saving..." : saved ? "✓ Saved!" : "Save preferences"}
</button>



          )}

          {error && (
  <div style={{
    marginTop: "1rem",
    padding: "0.75rem 1rem",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "10px",
    fontSize: "0.8rem",
    fontWeight: 600,
  }}>
    {error}
  </div>
)}
        </div>

        {saved && (
          <div style={{
            marginTop: "1rem",
            padding: "0.85rem 1rem",
            background: "#f0fdf4",
            borderRadius: "12px",
            border: "1px solid #bbf7d0",
            display: "flex", gap: "0.65rem", alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "18px" }}>✅</span>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F6E56" }}>Preferences saved</div>
              <div style={{ fontSize: "0.72rem", color: "#334155", marginTop: "2px" }}>
                <code style={{ background: "#e0f2fe", padding: "1px 5px", borderRadius: "4px", fontSize: "0.69rem", color: "#0c4a6e" }}>
                  PATCH /api/v1/patient/preferences
                </code>
                {" "}— language, therapy mode and schedule saved.
                TherapeuticGPS will use these alongside PHQ-9 output to generate provider match scores.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
