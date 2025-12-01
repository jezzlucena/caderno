import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuthStore } from './stores/authStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyEmail } from './pages/VerifyEmail'
import { Dashboard } from './pages/Dashboard'
import { Switches } from './pages/Switches'
import { Feed } from './pages/Feed'
import { Unlock } from './pages/Unlock'
import { About } from './pages/About'
import { Terms } from './pages/Terms'
import { Privacy } from './pages/Privacy'
import { Support } from './pages/Support'
import { Profile } from './pages/Profile'
import { NotePage } from './pages/NotePage'
import { AccountSettings } from './pages/AccountSettings'
import { PlatformSettings } from './pages/PlatformSettings'

function App() {
  const { token, checkAuth } = useAuthStore()

  useEffect(() => {
    if (token) {
      checkAuth()
    }
  }, [token, checkAuth])

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
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/unlock/:switchId" element={<Unlock />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
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
        {/* Note permalink route - must be before /:username */}
        <Route path="/:username/notes/:noteId" element={<NotePage />} />
        {/* Profile route - must be last to catch /:username */}
        <Route path="/:username" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
