import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, user, isLoading, checkAuth } = useAuthStore()
  const location = useLocation()

  // Verify token validity on mount
  useEffect(() => {
    if (token && !user && !isLoading) {
      checkAuth()
    }
  }, [token, user, isLoading, checkAuth])

  // Show loading while checking auth
  if (isLoading || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  // Redirect if no valid session
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
