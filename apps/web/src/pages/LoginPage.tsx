import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert, OrbitalBackground } from '../components/ui';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, isLoading, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/entries';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      navigate(from, { replace: true });
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
            <CardTitle>{t('auth.login')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}

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
                  autoComplete="current-password"
                  className="pointer-events-auto"
                />
              </div>

              <Button
                type="submit"
                className="w-full pointer-events-auto"
                isLoading={isLoading}
              >
                {t('auth.login')}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400 transition-colors pointer-events-auto">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="link">
                {t('auth.register')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
