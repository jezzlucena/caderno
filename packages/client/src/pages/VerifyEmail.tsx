import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { authApi } from '../lib/api'

type VerifyState = 'loading' | 'success' | 'error'

export function VerifyEmail() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<VerifyState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const verifyAttempted = useRef(false)

  useEffect(() => {
    if (!token) {
      setState('error')
      setErrorMessage('Invalid verification link')
      return
    }

    // Prevent duplicate calls from React StrictMode
    if (verifyAttempted.current) return
    verifyAttempted.current = true

    authApi.verifyEmail(token)
      .then(() => setState('success'))
      .catch((error) => {
        setState('error')
        setErrorMessage(error.message || 'Verification failed')
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body items-center text-center">
          {state === 'loading' && (
            <>
              <span className="loading loading-spinner loading-lg"></span>
              <h2 className="card-title mt-4">Verifying your email...</h2>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="text-success text-6xl mb-4">
                <CheckCircleIcon className="w-16 h-16" />
              </div>
              <h2 className="card-title">Email Verified!</h2>
              <p className="text-base-content/70">Your email has been successfully verified.</p>
              <div className="card-actions mt-4">
                <Link to="/" className="btn btn-primary">
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="text-error text-6xl mb-4">
                <ExclamationCircleIcon className="w-16 h-16" />
              </div>
              <h2 className="card-title">Verification Failed</h2>
              <p className="text-base-content/70">{errorMessage}</p>
              <div className="card-actions mt-4">
                <Link to="/login" className="btn btn-primary">
                  Go to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
