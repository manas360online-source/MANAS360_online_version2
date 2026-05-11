export const FREE_SCREENING_OPTIONS = [
  { optionIndex: 0, label: "Not at all", points: 0 },
  { optionIndex: 1, label: "Several days", points: 1 },
  { optionIndex: 2, label: "More than half the days", points: 2 },
  { optionIndex: 3, label: "Nearly every day", points: 3 },
];

export const FREE_SCREENING_QUESTIONS = [
  {
    id: "q1",
    question: "Over the last 2 weeks, how often have you felt down, depressed, or hopeless?",
    options: FREE_SCREENING_OPTIONS,
  },
  {
    id: "q2",
    question: "Over the last 2 weeks, how often have you felt nervous, anxious, or on edge?",
    options: FREE_SCREENING_OPTIONS,
  },
  {
    id: "q3",
    question: "How would you rate your overall sleep quality in the past week?",
    options: [
      { optionIndex: 0, label: "Very good - I sleep well most nights", points: 0 },
      { optionIndex: 1, label: "Fairly good - Some difficulties but manageable", points: 1 },
      { optionIndex: 2, label: "Fairly bad - Frequent sleep problems", points: 2 },
      { optionIndex: 3, label: "Very bad - Severe sleep difficulties", points: 3 },
    ],
  },
  {
    id: "q4",
    question: "How often do you feel overwhelmed by daily responsibilities?",
    options: [
      { optionIndex: 0, label: "Rarely or never", points: 0 },
      { optionIndex: 1, label: "Sometimes (once or twice a week)", points: 1 },
      { optionIndex: 2, label: "Often (3-5 days a week)", points: 2 },
      { optionIndex: 3, label: "Almost always (daily)", points: 3 },
    ],
  },
  {
    id: "q5",
    question: "In the past month, how satisfied have you been with your relationships and social connections?",
    options: [
      { optionIndex: 0, label: "Very satisfied - Strong support system", points: 0 },
      { optionIndex: 1, label: "Somewhat satisfied - Adequate connections", points: 1 },
      { optionIndex: 2, label: "Somewhat dissatisfied - Limited support", points: 2 },
      { optionIndex: 3, label: "Very dissatisfied - Feeling isolated", points: 3 },
    ],
  },
];

export const getFreeScreeningSeverity = (score: number) => {
  if (score >= 12) {
    return {
      level: "Severe",
      color: "red",
      title: "Urgent professional support recommended",
      message:
        "You are experiencing significant mental health difficulties. Please book a session with a psychiatrist or psychologist urgently.",
      action: "🚨 Book session now",
    };
  }

  if (score >= 8) {
    return {
      level: "Moderate",
      color: "amber",
      title: "Professional help suggested",
      message:
        "Your score shows moderate symptoms. Speaking with a mental health professional may help you feel better.",
      action: "⚠⚠ Book a session",
    };
  }

  if (score >= 4) {
    return {
      level: "Mild",
      color: "sage",
      title: "Self-care recommended",
      message:
        "You may be experiencing mild stress or mood changes. Meditation, exercise, journaling, and routine support can help.",
      action: "⚠ Explore support",
    };
  }

  return {
    level: "Minimal",
    color: "green",
    title: "You appear to be doing well",
    message:
      "Your responses suggest minimal mental health concerns. Continue healthy habits and keep monitoring.",
    action: "✓ Keep monitoring",
  };
};