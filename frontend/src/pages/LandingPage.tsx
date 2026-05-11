import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Language = "English" | "Hindi" | "Kannada" | "Tamil" | "Telugu";

type LoginOption = {
  type: string;
  label: string;
  icon: string;
  desc: string;
};

type LiveCard = {
  icon: string;
  title: string;
  doctor: string;
  language: string;
  seats: string;
  rightBadge: string;
  buttonText: string;
  bg: string;
  buttonBg: string;
};
type QuickNavMegaItem = {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
};

type QuickNavMegaMenu = {
  accent: string;
  title: string;
  subtitle: string;
  columns: number;
  items: QuickNavMegaItem[];
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [showTopPromo, setShowTopPromo] = useState(true);
  const [showMentalHealthPromo, setShowMentalHealthPromo] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("English");
  const [isScrolled, setIsScrolled] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [activeQuickNav, setActiveQuickNav] = useState<string | null>(null);
  const quickNavCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftPanelCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".brand-bar");
      if (!navbar) return;
      if (window.scrollY > 10) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");

      setIsScrolled(window.scrollY > 90);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setLoginDropdownOpen(false);
        setActiveQuickNav(null);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const handleLogin = (type: string) => {
    setLoginDropdownOpen(false);
    setTimeout(() => {
      navigate(`/auth/login?userType=${type}`);
    }, 100);
  };

  const handleScrollToAssess = () => {
    navigate("/assessment");
    // navigate("/free-screening");
  };


  

  const handleHitASixerPromo = () => {
    navigate("/hit-a-sixer");
  };

  const handleQuickNavMegaItemClick = (menuLabel: string) => {
    if (menuLabel === "I Need a Helping Hand") {
      setActiveQuickNav(null);
      navigate("/helping-hand");
      return;
    }

    if (menuLabel === "AI Power Hub") {
      setActiveQuickNav(null);
      navigate("/ai-power-hub");
      return;
    }

    if (menuLabel === "Find a Spark Again") {
      setActiveQuickNav(null);
      navigate("/find-spark");
      return;
    }

    if (menuLabel === "Self-Help Tools") {
      setActiveQuickNav(null);
      navigate("/self-help");
      return;
    }

    if (menuLabel === "For Corporates / Edu / Healthcare") {
      setActiveQuickNav(null);
      navigate("/corporate-landing");
      return;
    }

    if (menuLabel === "Premium Therapy Hub") {
      setActiveQuickNav(null);
      navigate("/premium-theraphy");
      return;
    }

    if (menuLabel === "MyDigitalClinic") {
      setActiveQuickNav(null);
      navigate("/my-digital-clinic");
      return;
    }

    if (menuLabel === "Certify2EarnMore") {
      setActiveQuickNav(null);
      navigate("/certifications");
      return;
    }

    if (menuLabel === "Digital Pets4Happy Hormones") {
      setActiveQuickNav(null);
      navigate("/pet");
    }
  };

  const footerQuickLinkRoutes: Record<string, string> = {
    "About Us": "/landing",
    "How It Works": "/how-it-works",
    "Specialized Care": "/specialized-care",
    "For Providers": "/my-digital-clinic",
    MyDigitalClinic: "/my-digital-clinic",
    Careers: "/corporate-landing"
  };

  const footerLegalRoutes: Record<string, string> = {
    "Privacy Policy": "/privacy",
    "Terms of Service": "/terms",
    "Cookie Policy": "/cookie-policy",
    "DPDPA Compliance": "/privacy",
    "Refund Policy": "/refunds",
    Disclaimer: "/terms"
  };

  const handleFooterRoute = (routeMap: Record<string, string>, label: string) => {
    const path = routeMap[label];
    if (path) {
      navigate(path);
    }
  };

  const openLeftPanel = () => {
    if (leftPanelCloseTimer.current) {
      clearTimeout(leftPanelCloseTimer.current);
      leftPanelCloseTimer.current = null;
    }
    setLeftPanelOpen(true);
  };

  const closeLeftPanelWithDelay = () => {
    if (leftPanelCloseTimer.current) {
      clearTimeout(leftPanelCloseTimer.current);
    }
    leftPanelCloseTimer.current = setTimeout(() => {
      setLeftPanelOpen(false);
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (leftPanelCloseTimer.current) {
        clearTimeout(leftPanelCloseTimer.current);
      }
    };
  }, []);
  useEffect(() => {
    return () => {
      if (quickNavCloseTimer.current) {
        clearTimeout(quickNavCloseTimer.current);
      }
    };
  }, []);

  const loginOptions: LoginOption[] = useMemo(
    () => [
      { type: "patient", label: "Patient", icon: "\uD83E\uDDD1", desc: "Find therapy & healing" },
      { type: "therapist", label: "Therapist", icon: "\u2695\uFE0F", desc: "Join & earn" },
      { type: "corporate", label: "Corporate", icon: "\uD83C\uDFE2", desc: "Wellness programs" },
      { type: "clinic", label: "Clinic", icon: "\uD83C\uDFE5", desc: "Manage practice" }
    ],
    []
  );
  const quickNavItems: Array<{ icon: string; label: string }> = useMemo(
    () => [
      { icon: "\uD83E\uDD1D", label: "I Need a Helping Hand" },
      { icon: "\u26A1", label: "AI Power Hub" },
      { icon: "\uD83D\uDC3E", label: "Digital Pets4Happy Hormones" },
      { icon: "\uD83D\uDC8E", label: "Premium Therapy Hub" },
      { icon: "\uD83E\uDDF0", label: "Self-Help Tools" },
      { icon: "\u2728", label: "Find a Spark Again" },
      { icon: "\uD83C\uDFDB\uFE0F", label: "For Corporates / Edu / Healthcare" },
      { icon: "\uD83C\uDF93", label: "Certify2EarnMore" },
      { icon: "\uD83D\uDCCB", label: "MyDigitalClinic" }
    ],
    []
  );
  const quickNavMegaMenus: Record<string, QuickNavMegaMenu> = useMemo(
    () => ({
      "I Need a Helping Hand": {
        accent: "#16A34A",
        title: "I Need a Helping Hand",
        subtitle: "Start your healing journey",
        columns: 5,
        items: [
          { icon: "\uD83E\uDE7A", title: "Free Screening", subtitle: "2-min PHQ-9 mood assessment", badge: "Free" },
          { icon: "\uD83E\uDDE0", title: "Find a Therapist", subtitle: "Psychologists & counselors" },
          { icon: "\u2695\uFE0F", title: "See a Psychiatrist", subtitle: "Medication & diagnosis" },
          { icon: "\uD83C\uDFAF", title: "Specialized Care", subtitle: "OCD, PTSD, addiction, child" },
          { icon: "\uD83D\uDC65", title: "Group Sessions", subtitle: "Peer support from \u20B999", badge: "\u20B999" },
          { icon: "\uD83D\uDEA8", title: "Crisis Support", subtitle: "Immediate 24/7 help", badge: "SOS" }
        ]
      },
      "AI Power Hub": {
        accent: "#7C3AED",
        title: "AI Power Hub",
        subtitle: "AI-driven tools \u2014 24/7, no appointment needed",
        columns: 4,
        items: [
          { icon: "\uD83E\uDD16", title: "Anytime Buddy AI", subtitle: "Guidance from your AI companion", badge: "AI" },
          { icon: "\uD83D\uDCAC", title: "AnytimeBuddy Chat", subtitle: "24/7 text companion", badge: "24/7" },
          { icon: "\u2601\uFE0F", title: "Vent Buddy", subtitle: "Safe space to express feelings", badge: "Soon" },
          { icon: "\uD83D\uDCDD", title: "AI Session Notes", subtitle: "Claude-powered clinical summaries", badge: "Pro" }
        ]
      },
      "Digital Pets4Happy Hormones": {
        accent: "#F97316",
        title: "Digital Pets4Happy Hormones",
        subtitle: "4 pets, 4 hormones \u2014 nurture them, nurture you",
        columns: 5,
        items: [
          { icon: "\uD83E\uDD95", title: "Baby Dinosaur", subtitle: "Oxytocin \u2014 nurture, bond, feel loved", badge: "Love" },
          { icon: "\uD83D\uDC15", title: "Golden Retriever", subtitle: "Serotonin \u2014 daily routines, calm, stability", badge: "Happy" },
          { icon: "\uD83D\uDC18", title: "Healing Elephant", subtitle: "Dopamine \u2014 achievements, games, milestones", badge: "Reward" },
          { icon: "\uD83E\uDD8A", title: "Chintu Fox", subtitle: "Endorphins \u2014 breathwork, play, laughter", badge: "Energy" },
          { icon: "\uD83D\uDC9D", title: "Name Your Pet \u2014 Adopt", subtitle: "Choose, name, and start your journey", badge: "Free" }
        ]
      },
      "Premium Therapy Hub": {
        accent: "#0EA5A4",
        title: "Premium Therapy Hub",
        subtitle: "Clinically supervised, evidence-based sessions",
        columns: 5,
        items: [
          { icon: "\uD83E\uDDE0", title: "1-on-1 Therapy", subtitle: "Psychologist sessions from \u20B9699", badge: "\u20B9699" },
          { icon: "\u2695\uFE0F", title: "Psychiatry Consult", subtitle: "Medication review from \u20B9999", badge: "\u20B9999" },
          { icon: "\uD83D\uDC91", title: "Couples Therapy", subtitle: "Rebuild your relationship", badge: "\u20B91,499" },
          { icon: "\uD83D\uDC65", title: "Group Therapy", subtitle: "Peer circles from \u20B9149", badge: "\u20B9149" },
          { icon: "\uD83C\uDFB5", title: "Sound Therapy", subtitle: "Raga healing + sleep tracks", badge: "20 Free" },
          { icon: "\uD83D\uDCBC", title: "Executive Coaching", subtitle: "High-performance wellness", badge: "Pro" }
        ]
      },
      "Self-Help Tools": {
        accent: "#A16207",
        title: "Self-Help Tools",
        subtitle: "Free tools you can use right now \u2014 no login needed",
        columns: 5,
        items: [
          { icon: "\uD83D\uDCCA", title: "Mood Tracker", subtitle: "Track emotional trends daily", badge: "Free" },
          { icon: "\uD83C\uDFB5", title: "Sound Therapy", subtitle: "Calm sound-based relaxation", badge: "Free" },
          { icon: "\uD83C\uDF2C\uFE0F", title: "Breathing Exercises", subtitle: "4-7-8 \u2022 Box \u2022 Calm Breath \u2022 Guided sessions", badge: "Free" },
          { icon: "\uD83D\uDCD3", title: "Journaling Prompts", subtitle: "Daily reflection questions" },
          { icon: "\uD83C\uDF19", title: "Sleep Guide", subtitle: "Hygiene checklist + wind-down" },
          { icon: "\uD83D\uDCC4", title: "CBT Worksheets", subtitle: "Thought records & behavioral experiments", badge: "Free" }
        ]
      },
      "Find a Spark Again": {
        accent: "#E11D48",
        title: "Find a Spark Again",
        subtitle: "Couples, parents & families",
        columns: 4,
        items: [
          { icon: "\uD83D\uDC91", title: "Find a Spark \u2014 Couples", subtitle: "Reignite your connection" },
          { icon: "\uD83D\uDC6A", title: "Concerned Parent", subtitle: "Help for your child" },
          { icon: "\uD83D\uDC6A", title: "Family Plan", subtitle: "Care for 2-5 members", badge: "\u20B9499+" },
          { icon: "\uD83C\uDF93", title: "Teen & Student", subtitle: "Age-appropriate support", badge: "50% off" }
        ]
      },
      "For Corporates / Edu / Healthcare": {
        accent: "#1D4ED8",
        title: "For Corporates / Edu / Healthcare",
        subtitle: "Corporate, education institutions & healthcare units",
        columns: 4,
        items: [
          { icon: "\uD83C\uDFE2", title: "Corporate Wellness", subtitle: "Employee mental health programs" },
          { icon: "\uD83C\uDFEB", title: "Education Institutions", subtitle: "School & college wellness programs" },
          { icon: "\uD83C\uDFE5", title: "Healthcare Units", subtitle: "Hospital & clinic integration" },
          { icon: "\uD83C\uDFDB\uFE0F", title: "Government Agency", subtitle: "Tele-MANAS & ASHA worker programs" }
        ]
      },
      Certify2EarnMore: {
        accent: "#16A34A",
        title: "Certify2EarnMore",
        subtitle: "Certifications, training & shop",
        columns: 4,
        items: [
          { icon: "\uD83C\uDFC6", title: "Certification Hub", subtitle: "CBT, NLP, 5Whys training", badge: "Pro" },
          { icon: "\uD83E\uDDD1", title: "Join as Therapist", subtitle: "Earn \u20B950K-2L/month" },
          { icon: "\uD83C\uDFD5\uFE0F", title: "Wellness Retreats", subtitle: "Rishikesh, Coorg, Goa" },
          { icon: "\uD83D\uDED2", title: "Wellness Shop", subtitle: "Journals, tools, merch" }
        ]
      },
      MyDigitalClinic: {
        accent: "#1D4ED8",
        title: "MyDigitalClinic",
        subtitle: "Digitize your practice - your patients, your data",
        columns: 5,
        items: [
          { icon: "\uD83D\uDC64", title: "Patient Database", subtitle: "DPDPA-compliant vault" },
          { icon: "\uD83D\uDCDD", title: "Session Notes", subtitle: "SOAP, CBT, Trauma templates" },
          { icon: "\uD83D\uDCC6", title: "Scheduling", subtitle: "Booking + auto-reminders" },
          { icon: "\uD83D\uDC8A", title: "Prescriptions", subtitle: "Digital sign + PDF + delivery" },
          { icon: "\uD83D\uDCCA", title: "Progress Tracking", subtitle: "PHQ-9/GAD-7 trends" },
          { icon: "\u2728", title: "21-Day Free Trial", subtitle: "All modules unlocked", badge: "Free" }
        ]
      }
    }),
    []
  );

  const openQuickNavMenu = (label: string) => {
    if (!quickNavMegaMenus[label]) {
      setActiveQuickNav(null);
      return;
    }
    if (quickNavCloseTimer.current) {
      clearTimeout(quickNavCloseTimer.current);
      quickNavCloseTimer.current = null;
    }
    setActiveQuickNav(label);
  };

  const keepQuickNavMenuOpen = () => {
    if (quickNavCloseTimer.current) {
      clearTimeout(quickNavCloseTimer.current);
      quickNavCloseTimer.current = null;
    }
  };

  const closeQuickNavMenuWithDelay = () => {
    if (quickNavCloseTimer.current) {
      clearTimeout(quickNavCloseTimer.current);
    }
    quickNavCloseTimer.current = setTimeout(() => {
      setActiveQuickNav(null);
    }, 120);
  };

  const liveCards: LiveCard[] = useMemo(
    () => [
      {
        icon: "\uD83E\uDDE0",
        title: "Anxiety Support Circle",
        doctor: "Dr. Priya",
        language: "English",
        seats: "Only 1 seat left!",
        rightBadge: "LIVE",
        buttonText: "JOIN NOW \u2192 FREE",
        bg: "linear-gradient(135deg, rgba(255, 227, 214, 0.75), rgba(255, 245, 239, 0.9))",
        buttonBg: "linear-gradient(135deg, #FF6A00, #FF8A3D)"
      },
      {
        icon: "\uD83D\uDD25",
        title: "Work Burnout Recovery",
        doctor: "Dr. Meera",
        language: "English",
        seats: "Only 3 seats left!",
        rightBadge: "LIVE",
        buttonText: "JOIN NOW \u2192 FREE",
        bg: "linear-gradient(135deg, rgba(220, 252, 231, 0.75), rgba(240, 253, 244, 0.92))",
        buttonBg: "linear-gradient(135deg, #15803D, #22C55E)"
      },
      {
        icon: "\uD83D\uDD6F\uFE0F",
        title: "Grief & Loss — Safe Space",
        doctor: "Dr. Rajan",
        language: "Hindi",
        seats: "Only 2 seats left!",
        rightBadge: "Starting Soon",
        buttonText: "JOIN \u2192 Starting Soon",
        bg: "linear-gradient(135deg, rgba(214, 232, 255, 0.75), rgba(238, 246, 255, 0.92))",
        buttonBg: "linear-gradient(135deg, #1D4ED8, #3B82F6)"
      },
      {
        icon: "\uD83D\uDC9E",
        title: "Couples Communication Workshop",
        doctor: "Ms. Ananya",
        language: "Kannada",
        seats: "6/15 joined",
        rightBadge: "1H 10M",
        buttonText: "Remind Me",
        bg: "linear-gradient(135deg, rgba(237, 233, 254, 0.9), rgba(245, 243, 255, 0.98))",
        buttonBg: "linear-gradient(135deg, #6D28D9, #7C3AED)"
      }
    ],
    []
  );

  const languageLabelMap: Record<Language, string> = {
    English: "English",
    Hindi: "हिन्दी",
    Tamil: "தமிழ்",
    Telugu: "తెలుగు",
    Kannada: "ಕನ್ನಡ"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        backgroundImage: 'url("/You%20renot%20alone-Beach.jpeg")',
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat"
      }}
    >
  {showTopPromo && !isScrolled && (
  <div
    style={{
      background: "#2D6A2E",
      color: "white",
      fontSize: "11px",
      fontWeight: 500,
      borderBottom: "1px solid rgba(0,0,0,0.1)",
      width: "100%"
    }}
  >
    <div
      style={{
        maxWidth: "1260px",
        margin: "0 auto",
        padding: "8px 40px 8px 14px", // Right padding zyada rakha hai close button ke liye
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap", // Mobile par content niche aa jayega
        position: "relative"
      }}
    >
      {/* Left Section: Icon and Text */}
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          cursor: "pointer",
          textAlign: "center"
        }}
        onClick={handleHitASixerPromo}
      >
        <span style={{ fontSize: "14px" }}>🏏</span>
        <div style={{ lineHeight: "1.2" }}>
          <span style={{ fontWeight: 800, color: "#FFD700", marginRight: "6px" }}>HIT A SIXER!</span>
          <span style={{ opacity: 0.9 }}>
            — Refer a friend & both get <strong style={{ color: "#FFD700" }}>10% off</strong>
            <span className="hide-on-mobile"> next therapy session</span>
          </span>
        </div>
      </div>

      {/* Middle Section: Action Button */}
      <button
        type="button"
        onClick={handleHitASixerPromo}
        style={{
          border: "1px solid #ADFF2F",
          cursor: "pointer",
          background: "transparent",
          color: "#FFD700",
          fontWeight: 700,
          fontSize: "10px",
          padding: "3px 10px",
          borderRadius: "20px",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        CLAIM ₹70 CREDIT →
      </button>

      {/* Right Section: Timer */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "5px", 
        fontSize: "11px", 
        opacity: 0.9,
        background: "rgba(0,0,0,0.1)",
        padding: "2px 8px",
        borderRadius: "4px"
      }}>
        <span>⏳</span>
        <span>Expires in 23:56:59</span>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTopPromo(false);
        }}
        aria-label="Close"
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          border: "none",
          cursor: "pointer",
          background: "transparent",
          color: "rgba(255,255,255,0.6)",
          fontSize: "20px",
          lineHeight: 1,
          padding: "5px"
        }}
      >
        &times;
      </button>
    </div>

    {/* Mobile Specific Styling (Optional) */}
    <style>{`
      @media (max-width: 600px) {
        .hide-on-mobile { display: none; }
      }
    `}</style>
  </div>
)}

{/* World Mental Health Day Promo Banner */}
{showMentalHealthPromo && (
  <div
    style={{
      // Image image_d6c619.png ke jaisa dark navy to mustard yellow gradient
      background: "linear-gradient(90deg, #001A4D 0%, #002266 40%, #8B8000 100%)",
      color: "white",
      fontSize: "11px",
      fontWeight: 500,
      width: "100%",
    }}
  >
    <div
      style={{
        maxWidth: "1260px",
        margin: "0 auto",
        padding: "8px 40px 8px 14px", // Right padding close button ke liye space chhodta hai
        display: "flex",
        alignItems: "center",
        justifyContent: "center", // Desktop par centered, mobile par wrap
        gap: "12px",
        flexWrap: "wrap", // Mobile par content ko niche shift karne ke liye
        position: "relative",
        minHeight: "40px"
      }}
    >
      {/* Promo Text Section */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "8px", 
        flexWrap: "wrap", 
        justifyContent: "center",
        textAlign: "center"
      }}>
        <span>🎁</span>
        <span style={{ color: "#D4C900", fontWeight: "700" }}>
          Free for World Mental Health Day
        </span>
        <span style={{ opacity: 0.9, fontSize: "12px" }}>
          — Premium access 30 days, no card needed
        </span>
      </div>

      {/* Action Button */}
      <button
        type="button"
        style={{
          border: "1px solid #D4C900",
          cursor: "pointer",
          background: "transparent",
          color: "#D4C900",
          fontWeight: 700,
          fontSize: "10px",
          padding: "4px 12px",
          borderRadius: "16px",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        CLAIM FREE →
      </button>

      {/* Close Button - Isko absolute rakha hai taaki ye hamesha corner mein rahe */}
      <button
        type="button"
        onClick={() => setShowMentalHealthPromo(false)}
        aria-label="Close"
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          border: "none",
          cursor: "pointer",
          background: "transparent",
          color: "rgba(255,255,255,0.6)",
          fontSize: "20px",
          lineHeight: 1,
          padding: "5px"
        }}
      >
        &times;
      </button>
    </div>
  </div>
)}


   
  {/* LEFT QUICK DOCK */}
<div
  className="left-dock-wrap"
  onMouseEnter={openLeftPanel}
  onMouseLeave={closeLeftPanelWithDelay}
>
  <div className={`floating-left-dock ${leftPanelOpen ? "is-open" : ""}`}>
    {[
      { id: "bot", icon: "🤖", bg: "#EFE7FF", dot: true },
      { id: "pets", icon: "🐾", bg: "#F0EAFE" },
      { id: "sound", icon: "🎵", bg: "#E6F4F1" },
      { id: "schedule", icon: "🗓️", bg: "#DCFCE7" },
      { id: "chat", icon: "💬", bg: "#DCFCE7" },
      { id: "notes", icon: "📋", bg: "#E6F0FF" },
      { id: "brain", icon: "🧠", bg: "#FCE7F3" },
    ].map((item) => (
      <button
        key={item.id}
        type="button"
        className="dock-icon-btn"
        style={{ background: item.bg }}
        aria-label={item.id}
      >
        <span>{item.icon}</span>
        {item.dot && <span className="dock-live-dot" />}
      </button>
    ))}
  </div>

  <div className={`left-dock-panel ${leftPanelOpen ? "open" : ""}`}>
    <div className="dock-panel-inner">
      <div className="dock-section-title first">QUICK ACCESS</div>

      {[
        { icon: "🤖", title: "AnytimeBUDDY", text: "Your 24/7 AI companion · Talk anytime", tag: "LIVE", tagColor: "#16A34A" },
        { icon: "🐾", title: "Digital Pets", text: "🧪 Oxytocin · 🦋 Serotonin · 🐘 Dopamine", tag: "NEW", tagColor: "#2563EB" },
        { icon: "🎵", title: "Sound Therapy", text: "Sleep, calm, focus — 200+ curated" },
      ].map((row) => (
        <div key={row.title} className="dock-panel-row">
          <div className="dock-panel-icon">{row.icon}</div>
          <div className="dock-panel-text">
            <div className="dock-panel-name">
              {row.tag && (
                <span className="dock-tag" style={{ background: row.tagColor }}>
                  {row.tag}
                </span>
              )}
              {row.title}
            </div>
            <div className="dock-panel-desc">{row.text}</div>
          </div>
        </div>
      ))}

      <div className="dock-divider" />
      <div className="dock-section-title">WHATSAPP</div>

      {[
        { icon: "🗓️", title: "WA Book Session", text: "Book therapist via WhatsApp · 2 min" },
        { icon: "💬", title: "WA Session", text: "Text-based therapy · Chat at your pace", tag: "CHAT", tagColor: "#16A34A" },
      ].map((row) => (
        <div key={row.title} className="dock-panel-row">
          <div className="dock-panel-icon">{row.icon}</div>
          <div className="dock-panel-text">
            <div className="dock-panel-name">
              {row.tag && (
                <span className="dock-tag" style={{ background: row.tagColor }}>
                  {row.tag}
                </span>
              )}
              {row.title}
            </div>
            <div className="dock-panel-desc">{row.text}</div>
          </div>
        </div>
      ))}

      <div className="dock-divider" />
      <div className="dock-section-title">FREE TOOLS</div>

      {[
        { icon: "📝", title: "Free Screening", text: "PHQ-9 · GAD-7 · 3 min · 5 languages", tag: "FREE", tagColor: "#06B6D4" },
        { icon: "🧠", title: "AI Self-Service", text: "CBT · Journaling · Breathing · Mood", tag: "AI", tagColor: "#DB2777" },
      ].map((row) => (
        <div key={row.title} className="dock-panel-row">
          <div className="dock-panel-icon">{row.icon}</div>
          <div className="dock-panel-text">
            <div className="dock-panel-name">
              {row.tag && (
                <span className="dock-tag" style={{ background: row.tagColor }}>
                  {row.tag}
                </span>
              )}
              {row.title}
            </div>
            <div className="dock-panel-desc">{row.text}</div>
          </div>
        </div>
      ))}
    </div>
  </div>

  <style>{`
    .left-dock-wrap {
      position: fixed;
      left: 0;
      top: 155px;
      z-index: 180;
      display: flex;
      align-items: flex-start;
    }

    .floating-left-dock {
      width: 52px;
      background: rgba(255,255,255,0.96);
      border: 1px solid #E1E8F0;
      border-left: none;
      border-radius: 0 20px 20px 0;
      padding: 10px 7px;
      box-shadow: 0 12px 32px rgba(15,23,42,0.14);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      transition: all 0.24s ease;
    }

    .floating-left-dock.is-open {
      border-radius: 0;
      box-shadow: none;
    }

    .dock-icon-btn {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .dock-live-dot {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #22C55E;
      border: 1.5px solid white;
    }

    .left-dock-panel {
      width: 0;
      opacity: 0;
      overflow: hidden;
      transform: translateX(-8px);
      pointer-events: none;
      transition: width 0.26s ease, opacity 0.22s ease, transform 0.26s ease;
    }

    .left-dock-panel.open {
      width: 335px;
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }

    .dock-panel-inner {
      background: rgba(255,255,255,0.96);
      border: 1px solid #E1E8F0;
      border-left: none;
      border-radius: 0 22px 22px 0;
      box-shadow: 0 20px 50px rgba(15,23,42,0.16);
      padding: 14px 14px 16px;
      max-height: 76vh;
      overflow-y: auto;
      backdrop-filter: blur(14px);
    }

    .dock-panel-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 4px;
      border-radius: 16px;
      cursor: pointer;
      transition: background 0.18s ease, transform 0.18s ease;
    }

    .dock-panel-row:hover {
      background: #F8FAFC;
      transform: translateX(3px);
    }

    .dock-panel-icon {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      background: linear-gradient(180deg, #ECF4F1, #DFE8F1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
    }

    .dock-panel-text {
      min-width: 0;
      flex: 1;
    }

    .dock-panel-name {
      position: relative;
      font-size: 20px;
      font-weight: 900;
      color: #082B63;
      -webkit-text-fill-color: #082B63;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-top: 4px;
    }

    .dock-panel-desc {
      margin-top: 6px;
      font-size: 14px;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
      font-weight: 800;
      line-height: 1.35;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dock-tag {
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-72%);
      font-size: 10px;
      font-weight: 900;
      color: white;
      -webkit-text-fill-color: white;
      border-radius: 999px;
      padding: 3px 10px;
      box-shadow: 0 5px 12px rgba(15,23,42,0.14);
    }

    .dock-divider {
      height: 1px;
      background: #D7DEE8;
      margin: 12px 4px;
    }

    .dock-section-title {
      margin: 14px 4px 8px;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #082B63;
      -webkit-text-fill-color: #082B63;
    }

    .dock-section-title.first {
      margin-top: 0;
    }

    @media (max-width: 1100px) {
      .left-dock-panel.open {
        width: 300px;
      }

      .dock-panel-icon {
        width: 50px;
        height: 50px;
        font-size: 24px;
      }

      .dock-panel-name {
        font-size: 17px;
      }

      .dock-panel-desc {
        font-size: 12px;
      }
    }

    @media (max-width: 768px) {
      .left-dock-wrap {
        top: auto;
        bottom: 18px;
        left: 12px;
      }

      .floating-left-dock {
        width: auto;
        max-width: calc(100vw - 24px);
        overflow-x: auto;
        flex-direction: row;
        border: 1px solid #E1E8F0;
        border-radius: 999px;
        padding: 8px;
        gap: 8px;
        box-shadow: 0 12px 32px rgba(15,23,42,0.14);
      }

      .floating-left-dock.is-open {
        border-radius: 999px;
        box-shadow: 0 12px 32px rgba(15,23,42,0.14);
      }

      .left-dock-panel {
        display: none;
      }

      .dock-icon-btn {
        width: 34px;
        height: 34px;
        font-size: 16px;
      }
    }
  `}</style>
</div>

{/* RIGHT FLOATING AVATARS */}
<div className="floating-right-avatars">
  {[
    { bg: "#FFF", image: "/AnytimeBUDDY.jpeg", label: "Doctor" },
    { bg: "#111827", image: "/HitASixer.jpeg", label: "Cricket", href: "/hit-a-sixer" },
    { bg: "#03163A", image: "/DigitalPet1.jpg", label: "Digital Pet", href: "/pet" },
  ].map((item, idx) => (
    <div
      key={idx}
      className="right-avatar"
      style={{ background: item.bg, animationDelay: `${idx * 0.35}s` }}
      role={item.href ? "button" : undefined}
      tabIndex={item.href ? 0 : undefined}
      onClick={() => item.href && navigate(item.href)}
      onKeyDown={(e) => {
        if (item.href && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          navigate(item.href);
        }
      }}
    >
      <img src={item.image} alt={item.label} />
    </div>
  ))}
</div>

<style>{`
  .left-dock-wrap {
    position: fixed;
    left: 0;
    top: 260px;
    z-index: 180;
    display: flex;
    align-items: flex-start;
  }

  .floating-left-dock {
    width: 54px;
    background: rgba(255,255,255,0.96);
    border: 1px solid #E1E8F0;
    border-left: none;
    border-radius: 0 18px 18px 0;
    padding: 10px 7px;
    box-shadow: 0 12px 32px rgba(15,23,42,0.14);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    transition: all 0.22s ease;
  }

  .floating-left-dock.is-open {
    border-radius: 0;
    box-shadow: none;
  }

  .dock-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .left-dock-panel {
    width: 0;
    opacity: 0;
    overflow: hidden;
    transform: translateX(-8px);
    pointer-events: none;
    transition: width 0.25s ease, opacity 0.22s ease, transform 0.25s ease;
  }

  .left-dock-panel.open {
    width: 286px;
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  .dock-panel-inner {
    background: white;
    border: 1px solid #E1E8F0;
    border-left: none;
    border-radius: 0 20px 20px 0;
    box-shadow: 0 18px 40px rgba(15,23,42,0.16);
    padding: 14px 12px;
    max-height: 76vh;
    overflow-y: auto;
  }

  .dock-panel-title {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #0B2D5E;
    -webkit-text-fill-color: #0B2D5E;
    margin-bottom: 10px;
  }

  .dock-panel-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .dock-panel-row:hover {
    background: #F8FAFC;
  }

  .dock-panel-icon {
    width: 38px;
    height: 38px;
    border-radius: 13px;
    background: linear-gradient(180deg,#ECF4F1,#DFE8F1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
    flex-shrink: 0;
  }

  .dock-panel-text {
    min-width: 0;
  }

  .dock-panel-name {
    font-size: 14px;
    font-weight: 900;
    color: #1F2937;
    -webkit-text-fill-color: #1F2937;
    line-height: 1.15;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dock-panel-desc {
    margin-top: 3px;
    font-size: 11px;
    color: #6B7280;
    -webkit-text-fill-color: #6B7280;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dock-tag {
    font-size: 9px;
    font-weight: 900;
    color: #0A8F4D;
    -webkit-text-fill-color: #0A8F4D;
    background: #DCFCE7;
    border-radius: 999px;
    padding: 2px 6px;
    margin-right: 6px;
    vertical-align: middle;
  }

  .floating-right-avatars {
    position: fixed;
    right: 18px;
    top: 288px;
    z-index: 160;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .right-avatar {
    width: 72px;
    height: 72px;
    border-radius: 999px;
    border: 5px solid rgba(255,255,255,0.95);
    box-shadow: 0 12px 30px rgba(0,0,0,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    animation: avatarFloat 3.8s ease-in-out infinite;
    overflow: hidden;
  }

  .right-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 999px;
    display: block;
  }

  @keyframes avatarFloat {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  @media (max-width: 1024px) {
    .floating-right-avatars {
      right: 10px;
      top: 250px;
      gap: 10px;
    }

    .right-avatar {
      width: 58px;
      height: 58px;
      border-width: 4px;
    }

    .left-dock-wrap {
      top: 145px;
    }
  }

  @media (max-width: 768px) {
    .left-dock-wrap {
      top: auto;
      bottom: 18px;
      left: 12px;
    }

    .floating-left-dock {
      width: auto;
      flex-direction: row;
      border: 1px solid #E1E8F0;
      border-radius: 999px;
      padding: 8px;
      gap: 8px;
      max-width: calc(100vw - 24px);
      overflow-x: auto;
    }

    .floating-left-dock.is-open {
      border-radius: 999px;
      box-shadow: 0 12px 32px rgba(15,23,42,0.14);
    }

    .left-dock-panel {
      display: none;
    }

    .dock-icon-btn {
      width: 34px;
      height: 34px;
      font-size: 16px;
    }

    .floating-right-avatars {
      display: none;
    }
  }
`}</style>

    <header className="manas-header">
  <div className="header-top-line" />

  <div className="header-main">
    <a href="/" className="header-logo" aria-label="MANAS360 Home">
      <img src="/Manas360-Logo_Med_optimized.jpeg" alt="MANAS360" />
    </a>

    <div className="language-pills">
      {(["English", "Hindi", "Kannada", "Tamil", "Telugu"] as const).map((lang) => {
        const active = selectedLanguage === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setSelectedLanguage(lang)}
            className={`lang-btn ${active ? "active" : ""}`}
          >
            {languageLabelMap[lang]}
          </button>
        );
      })}
    </div>

    <div className="header-actions">
      <button type="button" className="search-box" onClick={() => setShowSearch(true)}>
        <span>🔍</span>
        <span className="search-text">Search or ask...</span>
        <kbd>⌘K</kbd>
      </button>

      <button type="button" className="subscribe-btn">Subscribe</button>

      <div className="login-wrap">
        <a href="/auth/signup">
        <button
          type="button"
          className="subscribe-btn"
         
        >
          Sign UP
        </button>
        </a>
        <button
          type="button"
          className="login-btn"
          onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
        >
          Log In
        </button>

        {loginDropdownOpen && (
          <div className="login-dropdown">
            {loginOptions.map((option) => (
              <div
                key={option.type}
                className="login-option"
                onClick={() => handleLogin(option.type)}
              >
                <span className="login-option-icon">{option.icon}</span>
                <div>
                  <div className="login-option-title">{option.label}</div>
                  <div className="login-option-desc">{option.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="social-icons">
        {["☏", "◎", "▶", "in"].map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  </div>

  <div className="quick-menu-area">
    <div
      className="quick-nav-holder"
      onMouseEnter={keepQuickNavMenuOpen}
      onMouseLeave={closeQuickNavMenuWithDelay}
    >
      <nav className="quick-nav">
        {quickNavItems.map((item) => {
          const menu = quickNavMegaMenus[item.label];
          const isActive = activeQuickNav === item.label && !!menu;

          return (
            <button
              key={item.label}
              type="button"
              className={`quick-item ${isActive ? "active" : ""}`}
              onMouseEnter={() => openQuickNavMenu(item.label)}
              style={{
                borderColor: isActive && menu?.accent ? menu.accent : undefined,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {activeQuickNav && quickNavMegaMenus[activeQuickNav] && (
        <div className="mega-menu">
          <div
            className="mega-top-line"
            style={{ background: quickNavMegaMenus[activeQuickNav].accent }}
          />

          <div className="mega-content">
            <div className="mega-title">
              {quickNavMegaMenus[activeQuickNav].title}
            </div>

            <div className="mega-subtitle">
              {quickNavMegaMenus[activeQuickNav].subtitle}
            </div>

            <div
              className="mega-grid"
              style={{
                gridTemplateColumns: `repeat(${quickNavMegaMenus[activeQuickNav].columns}, minmax(0, 1fr))`,
              }}
            >
              {quickNavMegaMenus[activeQuickNav].items.map((mi) => (
                <div
                  key={mi.title}
                  className="mega-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleQuickNavMegaItemClick(activeQuickNav)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleQuickNavMegaItemClick(activeQuickNav);
                    }
                  }}
                >
                  <div className="mega-icon">{mi.icon}</div>

                  <div className="mega-text">
                    <div className="mega-card-title-row">
                      <div className="mega-card-title">{mi.title}</div>
                      {mi.badge && <span className="mega-badge">{mi.badge}</span>}
                    </div>

                    <div className="mega-card-subtitle">{mi.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>

  <style>{`
   .manas-header {
    position: sticky;
    top: 0;
    z-index: 999;
    background: #FFFFFF !important;
    background-image: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border-bottom: 1px solid #E2E8F0;
    box-shadow: 0 8px 24px rgba(15,23,42,0.04);
  }

    .header-top-line {
      height: 4px;
      background: linear-gradient(90deg, #082B63, #7F8000, #082B63);
    }

    .header-main {
      max-width: 1260px;
      margin: 0 auto;
      padding: 8px 16px 6px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 18px;
    }

    .header-logo {
      width: 54px;
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      text-decoration: none;
    }

    .header-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .language-pills {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .lang-btn {
      border: 1px solid #E2E8F0;
      background: #fff;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
      font-size: 12px;
      font-weight: 900;
      padding: 7px 16px;
      border-radius: 999px;
      cursor: pointer;
    }

    .lang-btn.active {
      background: #082B63;
      border-color: #082B63;
      color: white;
      -webkit-text-fill-color: white;
    }

    .header-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .search-box {
      width: 175px;
      height: 34px;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 10px;
      cursor: pointer;
    }

    .search-text {
      flex: 1;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
    }

    .search-box kbd {
      font-size: 10px;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 1px 5px;
      background: white;
    }

    .subscribe-btn {
      border: none;
      background: #082B63;
      color: white;
      -webkit-text-fill-color: white;
      font-size: 11px;
      font-weight: 900;
      padding: 9px 18px;
      border-radius: 999px;
      cursor: pointer;
    }

    .login-wrap {
      position: relative;
    }

    .login-btn {
      border: 1px solid #E2E8F0;
      background: #fff;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
      font-size: 11px;
      font-weight: 900;
      padding: 8px 14px;
      border-radius: 999px;
      cursor: pointer;
    }

    .login-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 248px;
      background: white;
      border: 1px solid #E8EDF2;
      border-radius: 14px;
      padding: 7px;
      box-shadow: 0 18px 60px rgba(15,23,42,0.18);
      animation: fadeDown 0.18s ease both;
      z-index: 1000;
    }

    .login-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 10px;
      cursor: pointer;
    }

    .login-option:hover {
      background: #F8FAFC;
    }

    .login-option-icon {
      font-size: 17px;
      width: 24px;
      text-align: center;
    }

    .login-option-title {
      font-size: 12px;
      font-weight: 900;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
    }

    .login-option-desc {
      font-size: 10px;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
      margin-top: 1px;
    }

    .social-icons {
      display: flex;
      gap: 10px;
      font-size: 15px;
      color: #475569;
      -webkit-text-fill-color: #475569;
      font-weight: 900;
    }

    .quick-menu-area {
      border-top: 1px solid rgba(226,232,240,0.75);
    }

    .quick-nav-holder {
      max-width: 1260px;
      margin: 0 auto;
      padding: 8px 16px 10px;
      position: relative;
    }

    .quick-nav {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .quick-nav::-webkit-scrollbar {
      display: none;
    }

    .quick-item {
      border: 1px solid transparent;
      background: transparent;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      white-space: nowrap;
      padding: 7px 10px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .quick-item:hover,
    .quick-item.active {
      background: #FFFFFF;
      box-shadow: 0 10px 24px rgba(15,23,42,0.10);
      transform: translateY(-1px);
    }

    .mega-menu {
      position: absolute;
      left: 16px;
      right: 16px;
      top: calc(100% + 8px);
      background: white;
      border-radius: 20px;
      border: 1px solid rgba(226,232,240,0.95);
      box-shadow: 0 28px 90px rgba(15,23,42,0.22);
      overflow: hidden;
      animation: fadeDown 0.22s ease both;
      z-index: 1000;
    }

    .mega-top-line {
      height: 4px;
    }

    .mega-content {
      padding: 18px;
    }

    .mega-title {
      font-size: 18px;
      font-weight: 900;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
      line-height: 1.15;
    }

    .mega-subtitle {
      margin-top: 4px;
      font-size: 12px;
      font-weight: 700;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
    }

    .mega-grid {
      margin-top: 14px;
      display: grid;
      gap: 10px;
    }

    .mega-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      border-radius: 14px;
      background: rgba(248,250,252,0.9);
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.18s ease;
    }

    .mega-card:hover {
      background: white;
      border-color: #E2E8F0;
      transform: translateY(-2px);
      box-shadow: 0 14px 35px rgba(15,23,42,0.08);
    }

    .mega-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      border: 1px solid #E8EDF2;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .mega-text {
      min-width: 0;
      flex: 1;
    }

    .mega-card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .mega-card-title {
      font-size: 13px;
      font-weight: 900;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mega-badge {
      font-size: 10px;
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 999px;
      background: #F1F5F9;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
      white-space: nowrap;
    }

    .mega-card-subtitle {
      margin-top: 3px;
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
      line-height: 1.45;
    }

    @keyframes fadeDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1024px) {
      .header-main {
        grid-template-columns: auto 1fr;
      }

      .header-actions {
        grid-column: 1 / -1;
        justify-content: center;
        flex-wrap: wrap;
      }

      .mega-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 640px) {
      .header-main {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px 12px;
      }

      .header-logo {
        width: 46px;
        height: 46px;
      }

      .language-pills {
        width: 100%;
        overflow-x: auto;
        flex-wrap: nowrap;
        justify-content: flex-start;
      }

      .lang-btn {
        flex-shrink: 0;
        font-size: 11px;
        padding: 7px 13px;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .search-box {
        flex: 1;
        min-width: 145px;
      }

      .social-icons {
        display: none;
      }

      .subscribe-btn,
      .login-btn {
        font-size: 10px;
        padding: 8px 11px;
      }

      .quick-nav {
        justify-content: flex-start;
        gap: 12px;
      }

      .quick-item {
        font-size: 11px;
      }

      .mega-menu {
        left: 8px;
        right: 8px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .mega-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `}</style>
</header>



<div
  style={{
    position: "relative",
    overflow: "hidden",
    textAlign: "center",
    padding: "34px 26px 82px 26px",
  }}
>
  
  

 
       <div style={{ width: "100%", textAlign: "center", padding: "20px 0",  position: "relative",
      zIndex: 2, color: "#ffffff", }}>
 <h1
  style={{
    fontSize: "45px",
    fontWeight: 900,
    color: "#0F172A",
    lineHeight: 1.1,
    margin: "0 auto",
    fontFamily: "Georgia, 'Times New Roman', serif",
    width: "100%",
    textAlign: "center",
  }}
>
  {"You're "}
  <span
    style={{
      color: "#7F8000",
      WebkitTextFillColor: "#7F8000",
      marginLeft: "12px",
      display: "inline-block",
      fontWeight: 900,
    }}
  >
    not alone
  </span>
  {". Let's take"}
  <br />
  {"this "}
  <span
    style={{
      color: "#7F8000",
      WebkitTextFillColor: "#7F8000",
      marginLeft: "12px",
      display: "inline-block",
      fontWeight: 900,
    }}
  >
    together
  </span>
  {"."}
</h1>
</div>
      <p
  style={{
    fontSize: "14px",
    position: "relative",
      zIndex: 2,
    color: "#0F172A",
    WebkitTextFillColor: "#0F172A",
    lineHeight: 1.6,
    margin: "0 0 8px 0",
    fontWeight: 600,
  }}
>
  {"Feeling overwhelmed? Confused? That's okay. We'll help you"}
  <br />
  {"understand your feelings in a safe, quiet space."}
</p>

<p
  style={{
    fontSize: "12px",
    position: "relative",
      zIndex: 2,
    color: "#0b1b41",
    WebkitTextFillColor: "#0f2966",
    margin: "0 0 18px 0",
    fontWeight: 800,
  }}
>
  Takes just 60 seconds.
</p>
        <button
          type="button"
          onClick={handleScrollToAssess}
          style={{
            background: "white",
            position: "relative",
      zIndex: 2,
            color: "#0F172A",
            padding: "12px 26px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 900,
            cursor: "pointer",
            border: "1px solid rgba(232, 237, 242, 0.95)",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
            marginBottom: "16px"
          }}
        >
          START FREE SCREENING &rarr;
        </button>

        <div
  style={{
    display: "flex",
    justifyContent: "center",
    position: "relative",
      zIndex: 2,
    gap: "14px",
    flexWrap: "wrap",
    fontSize: "12px",
    fontWeight: 800,
    color: "#334155",
    WebkitTextFillColor: "#334155",
  }}
>
  {["Confidential", "No Judgment", "Immediate"].map((t) => (
    <div
      key={t}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "999px",
          background: "#0B2D5E",
          display: "inline-block",
          flexShrink: 0,
        }}
      />

      <span
        style={{
          color: "#334155",
          position: "relative",
      zIndex: 2, 
          WebkitTextFillColor: "#334155",
          fontWeight: 800,
        }}
      >
        {t}
      </span>
    </div>
  ))}
</div>

<section
  aria-label="For Mental Health Professionals"
  style={{
    background: "linear-gradient(180deg, #CFE0EB 0%, #E7F3F5 55%, #FFFFFF 100%)",
    padding: "60px 26px",
    marginTop: "90px",
    fontFamily: "Inter, system-ui, sans-serif"
  }}
>
  <style>
    {`
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .spin-border {
        animation: rotate 10s linear infinite;
      }
      .card-container {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        max-width: 1100px;
        margin: 0 auto;
      }
      @media (max-width: 1024px) {
        .card-container { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 600px) {
        .card-container { grid-template-columns: 1fr; }
      }
    `}
  </style>

  <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
    {/* Badge Title */}
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "11px",
      fontWeight: 900,
      letterSpacing: "2px",
      color: "#0B2D5E",
      marginBottom: "12px"
    }}>
      <span style={{ fontSize: "14px" }}>✦</span>
      FOR MENTAL HEALTH PROFESSIONALS
    </div>

    <h2 style={{
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      fontSize: "22px",
      color: "#0B2D5E",
      marginBottom: "40px",
      fontWeight: 600
    }}>
      Join India's growing network — Discover plans, create your profile, start earning
    </h2>

    <div className="card-container">
      {[
        { title: "Psychologist", icon: "🧠", badge: "RCI VERIFIED", bColor: "#7C3AED", light: "#F5F3FF", desc: "Clinical & counseling psychology. RCI registered. Earn ₹60K–₹2L/mo" },
        { title: "Psychiatrist", icon: "⚕️", badge: "NMC VERIFIED", bColor: "#0EA5A6", light: "#F0FDFA", desc: "Diagnosis, medication, e-prescriptions. NMC registered MDs" },
        { title: "Therapist", icon: "💚", badge: "0% FEE — 3 MO", bColor: "#16A34A", light: "#F0FDF4", desc: "CBT, DBT, REBT, integrative. Build your practice on your terms" },
        { title: "NLP Coach", icon: "⭐", badge: "CERTIFIED", bColor: "#D97706", light: "#FFFBEB", desc: "Neuro-linguistic programming. Life coaching. Transformation specialists" }
      ].map((item, i) => (
        <div key={i} style={{
          background: "white",
          borderRadius: "24px",
          padding: "30px 20px",
          position: "relative",
          boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
          border: "1px solid #F1F5F9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Top Badge */}
          <span style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontSize: "8px",
            fontWeight: 900,
            background: item.bColor,
            color: "white",
            padding: "4px 10px",
            borderRadius: "999px"
          }}>
            {item.badge}
          </span>

          {/* Animated Icon Section */}
          <div style={{ position: "relative", width: "80px", height: "80px", marginBottom: "20px" }}>
            <div className="spin-border" style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px dashed ${item.bColor}44`,
            }} />
            <div style={{
              position: "absolute",
              inset: "6px",
              background: item.light,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px"
            }}>
              {item.icon}
            </div>
          </div>

          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", margin: "0 0 10px 0" }}>{item.title}</h3>
         <p
  style={{
    fontSize: "12px",
    color: "#64748B",
    WebkitTextFillColor: "#64748B",
    lineHeight: 1.6,
    margin: "0 0 20px 0",
    minHeight: "40px",
    fontWeight: 600,
  }}
>
  {item.desc}
</p>

          <button style={{
            background: "transparent",
            border: `1.5px solid ${item.bColor}`,
            color: item.bColor,
            borderRadius: "999px",
            padding: "8px 20px",
            fontSize: "12px",
            fontWeight: 900,
            cursor: "pointer"
          }}>
            ✦ Join Now
          </button>

          <div style={{ marginTop: "16px", fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>
            Discover — Plans — Profile
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      </div>

      
<section
  id="assessSection"
  style={{
    background: "linear-gradient(180deg, #E8EEF7 0%, #F1F5F9 100%)",
    padding: "40px 8px",
    fontFamily: "Inter, system-ui, sans-serif"
  }}
>
  <style>
    {`
      .assess-card-inner {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .assess-card-inner:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
      }
      .assess-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 40px;
        align-items: center;
      }
      @media (max-width: 968px) {
        .assess-grid {
          grid-template-columns: 1fr;
          gap: 32px;
        }
      }
    `}
  </style>

  <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)",
        padding: "20px"
      }}
    >
      <div className="assess-grid">
        {/* Left Side Content */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16A34A" }} />
        <span
  style={{
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "2px",
    color: "#0B2D5E",
    WebkitTextFillColor: "#0B2D5E",
    textTransform: "uppercase",
    display: "inline-block",
  }}
>
  FREE MENTAL HEALTH CHECK-UP
</span>
          </div>

     <h2
  style={{
    fontFamily: "Georgia, serif",
    fontSize: "42px",
    fontWeight: 800,
    color: "#0F172A",
    WebkitTextFillColor: "#0F172A",
    lineHeight: 1.1,
    marginBottom: "20px",
  }}
>
  {"Not sure where to start? "}
  <br />
  {"Take a "}
  <span
    style={{
      fontStyle: "italic",
      color: "#0B2D5E",
      WebkitTextFillColor: "#0B2D5E",
      fontWeight: 800,
      display: "inline-block",
    }}
  >
    free assessment
  </span>
  {" — your way."}
</h2>

        <p
  style={{
    fontSize: "15px",
    color: "#64748B",
    WebkitTextFillColor: "#64748B",
    lineHeight: 1.6,
    marginBottom: "32px",
    fontWeight: 500,
  }}
>
  A quick PHQ-9 screening takes 3 minutes. Available in Hindi, Kannada, Tamil, Telugu & English.
  Get your results instantly — no signup, no charge, completely confidential.
</p>

          {/* Feature List */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", 
            gap: "16px",
            fontSize: "13px", 
            fontWeight: 700, 
            color: "#334155" 
          }}>
            {[
              { icon: "🔐", label: "100% Confidential" },
              { icon: "🆓", label: "Always Free" },
              { icon: "🌐", label: "5 Languages" },
              { icon: "⚡", label: "Instant Results" }
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Action Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* In-App Card */}
       <div style={{ display: "grid", gap: "14px", width: "100%" }}>
  {/* In-App Card */}
  <div
    className="assess-card-inner"
    style={{
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: "20px",
      padding: "14px 18px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      boxShadow: "0 8px 22px rgba(15, 23, 42, 0.04)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "14px",
          background: "#EDE9FE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          flexShrink: 0,
        }}
      >
        📱
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 900,
            color: "#0F172A",
            WebkitTextFillColor: "#0F172A",
          }}
        >
          In-App Check-In
        </div>

        <div
          style={{
            fontSize: "11px",
            color: "#64748B",
            WebkitTextFillColor: "#64748B",
            marginTop: "2px",
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          Emoji mood picker • 60-second Vibe Check • Track your streak
        </div>
      </div>
    </div>

    <span
      style={{
        fontSize: "10px",
        fontWeight: 900,
        color: "#6D28D9",
        WebkitTextFillColor: "#6D28D9",
        background: "#F5F3FF",
        padding: "6px 12px",
        borderRadius: "999px",
        border: "1px solid #E9D5FF",
        whiteSpace: "nowrap",
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      OPEN APP
    </span>
  </div>

  {/* WhatsApp Card */}
  <div
    className="assess-card-inner"
    onClick={() => window.open("https://wa.me/919876543210", "_blank")}
    style={{
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: "20px",
      padding: "14px 18px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      boxShadow: "0 8px 22px rgba(15, 23, 42, 0.04)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "14px",
          background: "#DCFCE7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          flexShrink: 0,
        }}
      >
        💬
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 900,
            color: "#0F172A",
            WebkitTextFillColor: "#0F172A",
          }}
        >
          WhatsApp Assessment
        </div>

        <div
          style={{
            fontSize: "11px",
            color: "#64748B",
            WebkitTextFillColor: "#64748B",
            marginTop: "2px",
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          Chat-based PHQ-9 • Reply at your pace • Get PDF report
        </div>
      </div>
    </div>

    <span
      style={{
        fontSize: "10px",
        fontWeight: 900,
        color: "#16A34A",
        WebkitTextFillColor: "#16A34A",
        background: "#DCFCE7",
        padding: "6px 12px",
        borderRadius: "999px",
        border: "1px solid #BBF7D0",
        whiteSpace: "nowrap",
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      CHAT NOW
    </span>
  </div>

  <style>{`
    @media (max-width: 520px) {
      .assess-card-inner {
        align-items: flex-start !important;
        padding: 14px !important;
      }

      .assess-card-inner > span {
        font-size: 9px !important;
        padding: 5px 9px !important;
      }
    }
  `}</style>
</div>
        </div>
      </div>
    </div>
  </div>
</section>

     <section
  aria-label="Feature cards"
  style={{
    padding: "30px 26px 32px 26px",
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18)), url('/public/You renot alone-Beach.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  <div style={{ maxWidth: "1260px", margin: "0 auto" }}>
    <div
      className="triple-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "16px",
      }}
    >
      {/* CARD 1 */}
      <div className="feature-card nri-card" onClick={() => navigate("/nri-landing")}>
        <div className="card-watermark">IN</div>

        <div className="eyebrow orange">
          <span className="dot sky" /> FOR NRIS & GLOBAL INDIANS
        </div>

        <div className="card-title orange-title">
          Find a{" "}
          <span style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}>
            Janmabhoomi
          </span>
          <br />
          Connection — Heal
        </div>

        <p className="card-desc brown">
          Therapy in your mother tongue with Indian therapists who understand your desi dilemma —
          career pressure abroad, family guilt, identity crisis, relationship bridges across continents.
        </p>

        <div className="chip-wrap">
          {["IST + Your Timezone", "Hindi · Tamil · Telugu · Kannada", "HIPAA + DPDPA", "USD / GBP / AED / SGD"].map(
            (chip) => (
              <span className="chip orange-chip" key={chip}>
                {chip}
              </span>
            )
          )}
        </div>

        <div className="price-row">
          <span className="old-price">$45/session</span>
          <span className="new-price">$29</span>
          <span className="save-badge">SAVE 35%</span>
        </div>

        <button className="card-btn orange-btn" type="button">
          IN Connect to Home — Start Free →
        </button>
      </div>

      {/* CARD 2 */}
      <div className="feature-card clinic-card" onClick={() => navigate("/my-digital-clinic")}>
        <div className="card-watermark">✚</div>

        <div className="eyebrow green">
          <span className="dot violet" /> FOR PRACTICING THERAPISTS
        </div>

        <div className="card-title green-title">MyDigitalClinic</div>

        <p className="card-desc green-text">
          Already have patients? Digitize your existing practice. Your patients, your records,
          your control. No marketplace. No patient-sharing.
        </p>

        <div className="chip-wrap">
          {["Session Notes", "Scheduling", "Prescriptions", "PHQ-9 Tracking", "DPDPA"].map((chip) => (
            <span className="chip green-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>

        <div className="free-row">
          <span className="free-badge">21 DAYS FREE</span>
          <span className="free-text">Pick only modules you need — from ₹99/mo</span>
        </div>

        <button className="card-btn green-btn" type="button">
          Configure My Clinic →
        </button>

        <div className="bottom-link">
          🌐 Want NEW patients from other cities? → <u>Explore Provider Network</u>
        </div>
      </div>

      {/* CARD 3 */}
      <div className="feature-card companion-card" onClick={() => navigate("/pet")}>
        <div className="card-watermark">♥</div>

        <div className="eyebrow purple">
          <span className="dot dark" /> DIGITAL COMPANIONS — OXYTOCIN ENGINE
        </div>

        <div className="card-title purple-title">
          Meet Your Healing
          <br />
          Companions
        </div>

        <p className="card-desc purple-text">
          Your brain releases serotonin from connection — even digital ones. Nurture a companion
          that grows with your wellness journey.
        </p>

        <div className="pet-box">
          {[
            { name: "Baby Dino", sub: "Oxytocin", icon: "🦕" },
            { name: "Retriever", sub: "Serotonin", icon: "🐕" },
            { name: "Elephant", sub: "Dopamine", icon: "🐘" },
            { name: "Chintu", sub: "Endorphins", icon: "🐱" },
          ].map((p) => (
            <div className="pet-item" key={p.name}>
              <div className="pet-icon">{p.icon}</div>
              <div className="pet-name">{p.name}</div>
              <div className="pet-sub">{p.sub}</div>
            </div>
          ))}
        </div>

        <div className="hormone-text">
          🌸 Oxytocin (love) · Serotonin (happy) · Dopamine (reward) · Endorphins (energy)
        </div>

        <button className="card-btn purple-btn" type="button">
          🐾 Name Your Pet — Adopt FREE
        </button>
      </div>
    </div>
  </div>

  <style>{`
    .triple-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .feature-card {
      position: relative;
      overflow: hidden;
      min-height: 255px;
      border-radius: 18px;
      padding: 20px 22px;
      cursor: pointer;
      box-shadow: 0 16px 40px rgba(0,0,0,0.10);
      transition: all 0.25s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 22px 55px rgba(0,0,0,0.16);
    }

    .nri-card {
      border: 2px solid #F59E0B;
      background: linear-gradient(135deg, rgba(255,237,213,0.96), rgba(255,247,237,0.9));
    }

    .clinic-card {
      border: 2px solid rgba(21,128,61,0.75);
      background: linear-gradient(135deg, rgba(220,252,231,0.96), rgba(240,253,244,0.9));
    }

    .companion-card {
      border: 2px solid rgba(124,58,237,0.85);
      background: linear-gradient(135deg, rgba(237,233,254,0.96), rgba(245,243,255,0.9));
    }

    .card-watermark {
      position: absolute;
      top: 8px;
      right: 18px;
      font-size: 64px;
      font-weight: 900;
      color: rgba(255,255,255,0.45);
      pointer-events: none;
    }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      position: relative;
      z-index: 2;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      display: inline-block;
      flex-shrink: 0;
    }

    .sky { background: #38BDF8; }
    .violet { background: #A78BFA; }
    .dark { background: #111827; }

    .orange { color: #F97316; -webkit-text-fill-color: #F97316; }
    .green { color: #15803D; -webkit-text-fill-color: #15803D; }
    .purple { color: #7C3AED; -webkit-text-fill-color: #7C3AED; }

    .card-title {
      font-size: 22px;
      font-weight: 900;
      line-height: 1.15;
      margin-top: 10px;
      position: relative;
      z-index: 2;
    }

    .orange-title { color: #9A3412; -webkit-text-fill-color: #9A3412; }
    .green-title { color: #14532D; -webkit-text-fill-color: #14532D; }
    .purple-title { color: #4C1D95; -webkit-text-fill-color: #4C1D95; }

    .card-desc {
      font-size: 12px;
      line-height: 1.6;
      font-weight: 700;
      margin: 10px 0 0 0;
      position: relative;
      z-index: 2;
    }

    .brown { color: #7C2D12; -webkit-text-fill-color: #7C2D12; }
    .green-text { color: #166534; -webkit-text-fill-color: #166534; }
    .purple-text { color: #6D28D9; -webkit-text-fill-color: #6D28D9; }

    .chip-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
      position: relative;
      z-index: 2;
    }

    .chip {
      font-size: 10px;
      font-weight: 900;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(255,255,255,0.65);
    }

    .orange-chip {
      color: #9A3412;
      -webkit-text-fill-color: #9A3412;
      border: 1px solid rgba(251,191,36,0.55);
    }

    .green-chip {
      color: #14532D;
      -webkit-text-fill-color: #14532D;
      border: 1px solid rgba(34,197,94,0.35);
    }

    .price-row, .free-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      flex-wrap: wrap;
      position: relative;
      z-index: 2;
    }

    .old-price {
      font-size: 12px;
      color: #9CA3AF;
      -webkit-text-fill-color: #9CA3AF;
      text-decoration: line-through;
      font-weight: 800;
    }

    .new-price {
      font-size: 22px;
      font-weight: 900;
      color: #B45309;
      -webkit-text-fill-color: #B45309;
    }

    .save-badge {
      font-size: 11px;
      font-weight: 900;
      color: #166534;
      -webkit-text-fill-color: #166534;
      background: rgba(187,247,208,0.7);
      border: 1px solid #BBF7D0;
      padding: 4px 10px;
      border-radius: 999px;
    }

    .free-badge {
      font-size: 10px;
      font-weight: 900;
      color: #fff;
      -webkit-text-fill-color: #fff;
      background: rgba(21,128,61,0.9);
      padding: 5px 10px;
      border-radius: 999px;
    }

    .free-text {
      font-size: 12px;
      font-weight: 900;
      color: #166534;
      -webkit-text-fill-color: #166534;
    }

    .card-btn {
      margin-top: 12px;
      width: 100%;
      border: none;
      cursor: pointer;
      border-radius: 12px;
      padding: 12px 14px;
      color: white;
      -webkit-text-fill-color: white;
      font-weight: 900;
      font-size: 12px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.12);
      position: relative;
      z-index: 2;
    }

    .orange-btn { background: linear-gradient(135deg, #C2410C, #EA580C); }
    .green-btn { background: linear-gradient(135deg, #14532D, #1F7A3D); }
    .purple-btn { background: linear-gradient(135deg, #6D28D9, #7C3AED); }

    .bottom-link {
      margin-top: 10px;
      font-size: 11px;
      font-weight: 800;
      color: #15803D;
      -webkit-text-fill-color: #15803D;
      text-align: center;
    }

    .pet-box {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 12px;
      background: rgba(255,255,255,0.7);
      border: 1px solid rgba(99,102,241,0.25);
      padding: 10px;
      border-radius: 14px;
      position: relative;
      z-index: 2;
    }

    .pet-item {
      text-align: center;
    }

    .pet-icon {
      width: 42px;
      height: 42px;
      margin: 0 auto 5px;
      border-radius: 12px;
      background: rgba(124,58,237,0.10);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .pet-name {
      font-size: 9px;
      font-weight: 900;
      color: #4C1D95;
      -webkit-text-fill-color: #4C1D95;
    }

    .pet-sub {
      font-size: 8px;
      font-weight: 900;
      color: #6D28D9;
      -webkit-text-fill-color: #6D28D9;
    }

    .hormone-text {
      font-size: 10px;
      font-weight: 800;
      color: #6D28D9;
      -webkit-text-fill-color: #6D28D9;
      margin-top: 10px;
      position: relative;
      z-index: 2;
    }

    @media (max-width: 1024px) {
      .triple-grid {
        grid-template-columns: 1fr;
      }

      .feature-card {
        min-height: auto;
      }
    }

    @media (max-width: 520px) {
      section {
        padding-left: 10px !important;
        padding-right: 10px !important;
      }

      .feature-card {
        padding: 16px;
        border-radius: 16px;
      }

      .card-title {
        font-size: 20px;
      }

      .pet-box {
        grid-template-columns: repeat(2, 1fr);
      }

      .eyebrow {
        font-size: 9px;
        letter-spacing: 1.4px;
      }
    }
  `}</style>



 <section
  aria-label="Live and upcoming group sessions"
  style={{
    padding: "10px 16px 60px 16px",
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.12)), url('/your-background-image.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  <div style={{ maxWidth: "1260px", margin: "0 auto" }}>
    <div className="live-head">
      <div className="live-title">
        <span style={{ fontSize: "18px" }}>🔥</span>
        <span>Live & Upcoming Group Sessions</span>
      </div>

      <span className="live-now-badge">3 LIVE NOW</span>
    </div>

    <div className="live-grid">
      {liveCards.map((card) => (
        <div className="live-card" key={card.title}>
          <div className="live-card-top">
            <div className="live-card-title-row">
              <div className="live-icon">{card.icon}</div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 900,
                  color: "#0F172A",
                  WebkitTextFillColor: "#0F172A",
                  lineHeight: 1.2,
                }}
              >
                {card.title}
              </div>
            </div>

            <span className="card-live-badge">{card.rightBadge}</span>
          </div>

          <div className="doctor-row">
            <div className="doctor-avatar">🧑‍⚕️</div>

            <div>
              <div className="doctor-name">{card.doctor}</div>
              <div className="doctor-info">{card.language}</div>
            </div>
          </div>

          <div className="meta-row">
            <span>⏱ Now — {card.duration || "45 min"}</span>
            <span>🗣 {card.lang || "Hindi + English"}</span>
            <span>👥 {card.participants || "12"} participants</span>
          </div>

          <div className="seat-row">
            <span>{card.seats}</span>
            <span>{card.maxSeats || "15 max"}</span>
          </div>

          <div className="seat-bar">
            <div
              className="seat-fill"
              style={{ width: card.progress || "88%" }}
            />
          </div>

          <div className="price-action-row">
            <div>
              <span className="old-session-price">
                {card.oldPrice || "₹299"}
              </span>
              <span className="new-session-price">
                {card.price || "₹149"}
              </span>
              <span className="session-unit">/session</span>
            </div>

            <button
              type="button"
              className="join-session-btn"
              style={{ background: card.buttonBg || "#EF4444" }}
            >
              {card.buttonText || "⚡ JOIN NOW"}
            </button>
          </div>

          <div className="session-note">
            {card.note || "🔥 47 people joined this week · Meera from Bengaluru says “Changed my life”"}
          </div>
        </div>
      ))}
    </div>
  </div>

  <style>{`
    .live-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }

    .live-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 900;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
    }

    .live-now-badge {
      font-size: 11px;
      font-weight: 900;
      color: #EF4444;
      -webkit-text-fill-color: #EF4444;
      background: rgba(254, 226, 226, 0.92);
      border: 1px solid rgba(239, 68, 68, 0.25);
      padding: 5px 11px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .live-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(280px, 1fr));
      gap: 14px;
      overflow-x: auto;
      padding-bottom: 4px;
      scroll-snap-type: x mandatory;
    }

    .live-card {
      scroll-snap-align: start;
      min-width: 280px;
      border-radius: 18px;
      border: 1.5px solid rgba(239, 68, 68, 0.7);
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(10px);
      box-shadow: 0 18px 55px rgba(0,0,0,0.10);
      overflow: hidden;
      transition: all 0.25s ease;
    }

    .live-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 24px 65px rgba(0,0,0,0.16);
    }

    .live-card-top {
      padding: 14px 14px 12px;
      border-bottom: 1px solid rgba(239, 68, 68, 0.18);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .live-card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .live-icon {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: rgba(226, 232, 240, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }

    .card-live-badge {
      font-size: 10px;
      font-weight: 900;
      color: #EF4444;
      -webkit-text-fill-color: #EF4444;
      background: rgba(254, 226, 226, 0.92);
      border: 1px solid rgba(239, 68, 68, 0.22);
      padding: 4px 8px;
      border-radius: 999px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .doctor-row {
      padding: 12px 14px 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .doctor-avatar {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: rgba(186, 230, 253, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      flex-shrink: 0;
    }

    .doctor-name {
      font-size: 12px;
      font-weight: 900;
      color: #0F172A;
      -webkit-text-fill-color: #0F172A;
    }

    .doctor-info {
      margin-top: 2px;
      font-size: 10px;
      font-weight: 800;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
      line-height: 1.35;
    }

    .meta-row {
      padding: 0 14px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      font-size: 10px;
      font-weight: 800;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
      line-height: 1.35;
    }

    .seat-row {
      padding: 9px 14px 3px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 900;
    }

    .seat-row span:first-child {
      color: #EF4444;
      -webkit-text-fill-color: #EF4444;
    }

    .seat-row span:last-child {
      color: #94A3B8;
      -webkit-text-fill-color: #94A3B8;
    }

    .seat-bar {
      margin: 0 14px;
      height: 4px;
      border-radius: 999px;
      background: rgba(226, 232, 240, 0.9);
      overflow: hidden;
    }

    .seat-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #EF4444, #F97316);
    }

    .price-action-row {
      padding: 12px 14px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .old-session-price {
      font-size: 11px;
      color: #94A3B8;
      -webkit-text-fill-color: #94A3B8;
      text-decoration: line-through;
      font-weight: 800;
      margin-right: 6px;
    }

    .new-session-price {
      font-size: 17px;
      font-weight: 900;
      color: #111827;
      -webkit-text-fill-color: #111827;
    }

    .session-unit {
      font-size: 10px;
      font-weight: 800;
      color: #64748B;
      -webkit-text-fill-color: #64748B;
      margin-left: 2px;
    }

    .join-session-btn {
      border: none;
      cursor: pointer;
      border-radius: 13px;
      padding: 10px 16px;
      color: white;
      -webkit-text-fill-color: white;
      font-weight: 900;
      font-size: 11px;
      white-space: nowrap;
      box-shadow: 0 14px 30px rgba(239, 68, 68, 0.25);
    }

    .session-note {
      padding: 10px 14px;
      background: rgba(254, 242, 242, 0.82);
      border-top: 1px solid rgba(239, 68, 68, 0.16);
      font-size: 10px;
      line-height: 1.4;
      font-weight: 800;
      color: #EF4444;
      -webkit-text-fill-color: #EF4444;
    }

    @media (max-width: 1100px) {
      .live-grid {
        grid-template-columns: repeat(2, minmax(280px, 1fr));
        overflow-x: visible;
      }
    }

    @media (max-width: 640px) {
      .live-head {
        align-items: flex-start;
        flex-direction: column;
      }

      .live-grid {
        grid-template-columns: 1fr;
      }

      .live-card {
        min-width: 0;
      }

      .meta-row {
        grid-template-columns: 1fr;
      }

      .price-action-row {
        align-items: stretch;
        flex-direction: column;
      }

      .join-session-btn {
        width: 100%;
      }
    }
  `}</style>
</section>



</section>

     

    <footer aria-label="Footer" className="manas-footer">
  <div className="footer-bg-glow" />

  <div className="footer-inner">
    <div className="footer-grid">
      <div>
        <div className="footer-logo-box">
          <img src="/public/Manas360-Logo_Med_optimized.jpeg" alt="MANAS360" className="footer-logo" />
        </div>

        <div className="footer-tagline">
          Holistic Mental Wellness
          <br />
          Anytime, Anywhere
        </div>

        <div className="footer-company">
          MANAS360 Mental Wellness Pvt. Ltd.
          <br />
          Bengaluru, Karnataka, India
        </div>
      </div>

      <div>
        <h4 className="footer-heading">Quick Links</h4>
        {["About Us", "How It Works", "Specialized Care", "For Providers", "MyDigitalClinic", "Careers"].map((t) => (
          <button
            key={t}
            type="button"
            className="footer-link"
            onClick={() => handleFooterRoute(footerQuickLinkRoutes, t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <h4 className="footer-heading">Legal</h4>
        {["Privacy Policy", "Terms of Service", "Cookie Policy", "DPDPA Compliance", "Refund Policy", "Disclaimer"].map((t) => (
          <button
            key={t}
            type="button"
            className="footer-link"
            onClick={() => handleFooterRoute(footerLegalRoutes, t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <h4 className="footer-heading">Get in Touch</h4>

        <a href="mailto:hello@manas360.com" className="footer-contact">
          📧 hello@manas360.com
        </a>

        <a href="tel:+91XXXXXXXXXX" className="footer-contact">
          📱 +91-XXXXXXXXXX
        </a>

        <div className="footer-contact">💬 WhatsApp Support</div>

        <div className="footer-socials">
          {["📷", "💼", "▶️", "🦄"].map((s) => (
            <div key={s} className="footer-social">
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="crisis-box">
      🆘 In Crisis? Call KIRAN: 1800-599-0019 (24/7, Free) · iCall: 9152987821 · Vandrevala:
      1860-2662-345
    </div>

    <div className="footer-bottom">
      © 2026 MANAS360 Mental Wellness Pvt. Ltd. All rights reserved · CIN: XXXXXXXX · Bengaluru,
      Karnataka, India
      <br />
      MANAS360 is a technology aggregator platform, not a healthcare provider. All therapists are
      independent practitioners.
    </div>
  </div>

  <style>{`
    .manas-footer {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18), transparent 32%),
        radial-gradient(circle at 80% 10%, rgba(124,58,237,0.12), transparent 34%),
        linear-gradient(180deg, #082B63 0%, #06224D 45%, #061B3E 100%);
      color: white;
      padding: 42px 16px 24px;
    }

    .manas-footer::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
      background-size: 42px 42px;
      opacity: 0.25;
      pointer-events: none;
    }

    .footer-bg-glow {
      position: absolute;
      width: 360px;
      height: 360px;
      right: -120px;
      top: -160px;
      background: rgba(59,130,246,0.18);
      filter: blur(70px);
      border-radius: 999px;
    }

    .footer-inner {
      position: relative;
      z-index: 2;
      max-width: 1260px;
      margin: 0 auto;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1.1fr;
      gap: 36px;
      align-items: start;
    }

    .footer-logo-box {
      width: 58px;
      height: 58px;
      border-radius: 10px;
      background: rgba(255,255,255,0.96);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16px 35px rgba(0,0,0,0.16);
      margin-bottom: 18px;
    }

    .footer-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .footer-tagline {
      font-size: 13px;
      font-weight: 800;
      line-height: 1.7;
      color: rgba(255,255,255,0.96);
      -webkit-text-fill-color: rgba(255,255,255,0.96);
      margin-bottom: 14px;
    }

    .footer-company {
      font-size: 11px;
      font-weight: 700;
      line-height: 1.55;
      color: rgba(191,219,254,0.72);
      -webkit-text-fill-color: rgba(191,219,254,0.72);
    }

    .footer-heading {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 900;
      color: #B7FF3C;
      -webkit-text-fill-color: #B7FF3C;
    }

    .footer-link {
      display: block;
      border: none;
      background: transparent;
      padding: 0;
      margin: 0 0 10px;
      cursor: pointer;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: rgba(255,255,255,0.86);
      -webkit-text-fill-color: rgba(255,255,255,0.86);
      transition: all 0.2s ease;
    }

    .footer-link:hover {
      transform: translateX(4px);
      color: #B7FF3C;
      -webkit-text-fill-color: #B7FF3C;
    }

    .footer-contact {
      display: block;
      color: rgba(255,255,255,0.88);
      -webkit-text-fill-color: rgba(255,255,255,0.88);
      text-decoration: none;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 11px;
    }

    .footer-socials {
      display: flex;
      gap: 12px;
      margin-top: 14px;
      flex-wrap: wrap;
    }

    .footer-social {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }

    .crisis-box {
      margin-top: 34px;
      border: 1px solid rgba(239,68,68,0.55);
      background: rgba(127,29,29,0.22);
      border-radius: 10px;
      padding: 14px 16px;
      text-align: center;
      font-size: 12px;
      font-weight: 900;
      color: white;
      -webkit-text-fill-color: white;
      box-shadow: 0 12px 35px rgba(0,0,0,0.12);
    }

    .footer-bottom {
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid rgba(255,255,255,0.08);
      text-align: center;
      font-size: 11px;
      line-height: 1.55;
      font-weight: 700;
      color: rgba(191,219,254,0.68);
      -webkit-text-fill-color: rgba(191,219,254,0.68);
    }

    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 560px) {
      .manas-footer {
        padding: 34px 16px 22px;
      }

      .footer-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .crisis-box {
        text-align: left;
        line-height: 1.6;
      }

      .footer-bottom {
        text-align: left;
      }
    }
  `}</style>
</footer>

      {showSearch && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.45)",
            zIndex: 200,
            display: "flex",
            justifyContent: "center",
            paddingTop: "80px"
          }}
          onClick={() => setShowSearch(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "92%",
              maxWidth: "580px",
              maxHeight: "68vh",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.22)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", borderBottom: "1px solid #E8EDF2" }}>
              <span style={{ fontSize: "16px", color: "#666680" }}>&#128270;</span>
              <input
                type="text"
                placeholder="Try 'couples therapy' or 'I feel anxious'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: "\"DM Sans\", sans-serif",
                  color: "#1A1A2E",
                  background: "transparent"
                }}
              />
              <span
                onClick={() => setShowSearch(false)}
                style={{
                  fontSize: "11px",
                  color: "#666680",
                  background: "#E8EDF2",
                  padding: "2px 8px",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                ESC
              </span>
            </div>
            <div style={{ padding: "12px 16px", maxHeight: "52vh", overflowY: "auto" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#666680",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px"
                }}
              >
                People often search for
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["I feel anxious", "couples therapy", "psychiatrist", "group sessions", "free screening"].map((tag) => (
                  <div
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid #E8EDF2",
                      fontSize: "11.5px",
                      color: "#3D3D5C",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#E8EEF7";
                      (e.currentTarget as HTMLElement).style.borderColor = "#0B2D5E";
                      (e.currentTarget as HTMLElement).style.color = "#0B2D5E";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor = "#E8EDF2";
                      (e.currentTarget as HTMLElement).style.color = "#3D3D5C";
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .brand-bar {
          background: white;
          border-bottom: 1px solid transparent;
          position: relative;
          z-index: 90;
          transition: all 0.3s ease;
        }
        .brand-bar.scrolled {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          border-bottom-color: #e2e8f0;
          box-shadow: 0 1px 10px rgba(0, 0, 0, 0.04);
        }
                @keyframes avatarFloat {
                  0% { transform: translateY(0px); }
                  50% { transform: translateY(-7px); }
                  100% { transform: translateY(0px); }
                }
                @keyframes chatFloat {
                  0% { transform: translateY(0px); }
                  50% { transform: translateY(-10px); }
                  100% { transform: translateY(0px); }
                }
                @keyframes chatTilt {
                  0% { transform: rotate(0deg); }
                  72% { transform: rotate(0deg); }
                  82% { transform: rotate(-10deg); }
                  92% { transform: rotate(10deg); }
                  100% { transform: rotate(0deg); }
                }
                .quick-nav {
                  flex-wrap: nowrap;
                  white-space: nowrap;
                  width: 100%;
                  max-width: 100%;
                  min-width: 0;
                  overflow-x: auto;
                  overflow-y: hidden;
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
                .quick-nav::-webkit-scrollbar {
                  display: none;
                }
        @media (max-width: 980px) {
          .live-grid {
            grid-template-columns: 1fr;
          }
          .assess-grid {
            grid-template-columns: 1fr;
          }
          .triple-grid {
            grid-template-columns: 1fr;
          }
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .pro-grid {
            grid-template-columns: 1fr 1fr;
          }
           .left-dock-wrap,
          .floating-left-dock,
          .floating-right-avatars {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
  
export default LandingPage;

