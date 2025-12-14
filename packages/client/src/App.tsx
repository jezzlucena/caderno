import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuthStore } from './stores/authStore'
import { useSetupStore } from './stores/setupStore'
import { useThemeStore } from './stores/themeStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SkipLink } from './components/SkipLink'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Setup } from './pages/Setup'
import { VerifyEmail } from './pages/VerifyEmail'
import { Dashboard } from './pages/Dashboard'
import { Switches } from './pages/Switches'
import { Feed } from './pages/Feed'
import { Unlock } from './pages/Unlock'
import { About } from './pages/About'
import { Terms } from './pages/Terms'
import { Privacy } from './pages/Privacy'
import { Support } from './pages/Support'
import { Compare } from './pages/Compare'
import { Profile } from './pages/Profile'
import { NotePage } from './pages/NotePage'
import { AccountSettings } from './pages/AccountSettings'
import { PlatformSettings } from './pages/PlatformSettings'
import { Notifications } from './pages/Notifications'
import { Export } from './pages/Export'
import { Import } from './pages/Import'

function App() {
  const { token, user, checkAuth } = useAuthStore()
  const { needsSetup, isLoading: setupLoading, checkSetupStatus } = useSetupStore()
  const { initTheme, syncFromUser } = useThemeStore()

  // Initialize theme from localStorage on mount
  useEffect(() => {
    initTheme()
  }, [initTheme])

  useEffect(() => {
    checkSetupStatus()
  }, [checkSetupStatus])

  useEffect(() => {
    if (token) {
      checkAuth()
    }
  }, [token, checkAuth])

  // Sync theme from user data when available
  useEffect(() => {
    if (user?.theme) {
      syncFromUser(user.theme)
    }
  }, [user?.theme, syncFromUser])

  // Show loading while checking setup status
  if (needsSetup === null || setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  // If setup is needed, show only the setup route
  if (needsSetup) {
    return (
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <SkipLink />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/unlock/:switchId" element={<Unlock />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/setup" element={<Navigate to="/" replace />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/switches"
          element={
            <ProtectedRoute>
              <Switches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform"
          element={
            <ProtectedRoute>
              <PlatformSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/export"
          element={
            <ProtectedRoute>
              <Export />
            </ProtectedRoute>
          }
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <Import />
            </ProtectedRoute>
          }
        />
        {/* Note permalink route - must be before /:username */}
        <Route path="/:username/notes/:noteId" element={<NotePage />} />
        {/* Profile route - must be last to catch /:username */}
        <Route path="/:username" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
