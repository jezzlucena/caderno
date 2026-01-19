import { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useOnboardingStore } from './stores';
import { Layout, ProtectedRoute } from './components/layout';
import {
  LoginPage,
  RegisterPage,
  EntriesPage,
  EntryEditPage,
  SafetyTimerPage,
  SettingsPage,
  OnboardingPage,
} from './pages';

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading: authLoading, refreshAuth } = useAuthStore();
  const { status, isLoading: onboardingLoading, fetchStatus } = useOnboardingStore();

  useEffect(() => {
    fetchStatus();
    refreshAuth();
  }, [fetchStatus, refreshAuth]);

  if (authLoading || onboardingLoading) {
    return <LoadingSpinner />;
  }

  // If onboarding is not complete, redirect to onboarding
  if (status && !status.isComplete && !status.hasUser) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route
          path="login"
          element={
            isAuthenticated ? (
              <Navigate to="/entries" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="register"
          element={
            isAuthenticated ? (
              <Navigate to="/entries" replace />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route path="onboarding" element={<OnboardingPage />} />

        {/* Protected routes */}
        <Route
          index
          element={
            isAuthenticated ? (
              <Navigate to="/entries" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="entries"
          element={
            <ProtectedRoute>
              <EntriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="entries/:id"
          element={
            <ProtectedRoute>
              <EntryEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="safety-timer"
          element={
            <ProtectedRoute>
              <SafetyTimerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppRoutes />
    </Suspense>
  );
}
