import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert, OrbitalBackground } from '../components/ui';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, error, isLoading, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 12) {
      setValidationError(t('auth.passwordTooShort'));
      return;
    }

    try {
      await register(email, password);
      navigate('/entries', { replace: true });
    } catch {
      // Error is handled by store
    }
  };

  return (
    <>
      <OrbitalBackground className="z-0" />
      <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden pointer-events-none">
        <Card variant="glass" className="relative z-10 w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('auth.register')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || validationError) && (
                <Alert variant="error">{error || validationError}</Alert>
              )}

              <div className="space-y-1">
                <Input
                  label={t('auth.email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pointer-events-auto"
                />
              </div>

              <div className="space-y-1">
                <Input
                  label={t('auth.password')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pointer-events-auto"
                />
              </div>

              <div className="space-y-1">
                <Input
                  label={t('auth.confirmPassword')}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pointer-events-auto"
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
                {t('auth.passwordRequirements')}
              </p>

              <Button
                type="submit"
                className="w-full pointer-events-auto"
                isLoading={isLoading}
              >
                {t('auth.register')}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400 transition-colors pointer-events-auto">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="link">
                {t('auth.login')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
