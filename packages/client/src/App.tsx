import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyEmail } from './pages/VerifyEmail'
import { Dashboard } from './pages/Dashboard'
import { Switches } from './pages/Switches'
import { Unlock } from './pages/Unlock'
import { Federation } from './pages/Federation'
import { About } from './pages/About'
import { Terms } from './pages/Terms'
import { Privacy } from './pages/Privacy'
import { Profile } from './pages/Profile'
import { AccountSettings } from './pages/AccountSettings'

function App() {
  const { token, checkAuth } = useAuthStore()

  useEffect(() => {
    if (token) {
      checkAuth()
    }
  }, [token, checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/unlock/:switchId" element={<Unlock />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
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
          path="/federation"
          element={
            <ProtectedRoute>
              <Federation />
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
        {/* Profile route - must be last to catch /:username */}
        <Route path="/:username" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
