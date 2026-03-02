import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import { AuthProvider } from './context/AuthContext';
import { Assessment } from './pages/Assessment'
import { ResultsPage } from './pages/Results'
import { CrisisPage } from './pages/Crisis'
import { OnboardingName } from './pages/OnboardingName'
import { OnboardingEmail } from './pages/OnboardingEmail'
import SessionSocketDemo from './components/SessionSocketDemo'
import TherapistDashboard from './components/TherapistDashboard'
import AnalyticsPage from './pages/therapist/AnalyticsPage'
import LoginWidget from './components/LoginWidget'
import SessionDetailPage from './pages/therapist/SessionDetailPage'
import ProtectedRoute from './components/ProtectedRoute'
import PatientDashboardLayout from './components/layout/PatientDashboardLayout'
import DashboardPage from './pages/patient/DashboardPage'
import ProvidersPage from './pages/patient/ProvidersPage'
import ProviderDetailPage from './pages/patient/ProviderDetailPage'
import BookSessionPage from './pages/patient/BookSessionPage'
import SessionsPage from './pages/patient/SessionsPage'
import PatientSessionDetailPage from './pages/patient/SessionDetailPage'
import AIChatPage from './pages/patient/AIChatPage'
import ProfilePage from './pages/patient/ProfilePage'
import LiveSessionPage from './pages/patient/LiveSessionPage'
import AssessmentsPage from './pages/patient/AssessmentsPage'
import BillingPage from './pages/patient/BillingPage'
import DocumentsPage from './pages/patient/DocumentsPage'
import SupportPage from './pages/patient/SupportPage'
import NotificationsPage from './pages/patient/NotificationsPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'

interface AssessmentData {
  symptoms: string[];
  impact: string;
  selfHarm: string;
}

function App() {
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [userName, setUserName] = useState<string>('');

  const handleAssessmentSubmit = (data: AssessmentData, isCritical: boolean) => {
    setAssessmentData(data);
    if (isCritical) {
      window.location.href = '/#/crisis';
    } else {
      window.location.href = '/#/results';
    }
  };

  const handleOnboardingName = (data: { firstName: string; lastName: string; pronouns: string }) => {
    setUserName(data.firstName);
    window.location.href = '/#/onboarding/email';
  };

  return (
    <AuthProvider>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/assessment" element={<Assessment onSubmit={handleAssessmentSubmit} />} />
      <Route path="/results" element={<ResultsPage data={assessmentData} />} />
      <Route path="/crisis" element={<CrisisPage />} />
      <Route path="/onboarding/name" element={<OnboardingName onNext={handleOnboardingName} />} />
      <Route path="/onboarding/email" element={<OnboardingEmail userName={userName} />} />
        <Route
          path="/session-demo"
          element={
            <ProtectedRoute>
              <SessionSocketDemo sessionId={new URLSearchParams(window.location.hash.split('?')[1]).get('sessionId')} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapist-dashboard"
          element={
            <ProtectedRoute>
              <TherapistDashboard sessionId={new URLSearchParams(window.location.hash.split('?')[1]).get('sessionId')} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapist/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapist/sessions/:id"
          element={
            <ProtectedRoute>
              <SessionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/login" element={<LoginWidget initialMode="login" />} />
        <Route path="/auth/signup" element={<LoginWidget initialMode="register" />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/signup" replace />} />

        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="providers/:id" element={<ProviderDetailPage />} />
          <Route path="book/:providerId" element={<BookSessionPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/:id" element={<PatientSessionDetailPage />} />
          <Route path="sessions/:id/live" element={<LiveSessionPage />} />
          <Route path="messages" element={<AIChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="/providers" element={<Navigate to="/patient/providers" replace />} />
        <Route path="/providers/:id" element={<Navigate to="/patient/providers" replace />} />
        <Route path="/book/:providerId" element={<Navigate to="/patient/providers" replace />} />
        <Route path="/sessions" element={<Navigate to="/patient/sessions" replace />} />
        <Route path="/sessions/:id/live" element={<Navigate to="/patient/sessions" replace />} />
        <Route path="/ai-chat" element={<Navigate to="/patient/messages" replace />} />
        <Route path="/profile" element={<Navigate to="/patient/profile" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
