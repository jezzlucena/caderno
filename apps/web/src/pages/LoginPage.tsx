import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert, OrbitalBackground } from '../components/ui';

interface AuthMethods {
  password: boolean;
  passkey: boolean;
  magicLink: boolean;
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithPasskey, requestMagicLink, getAuthMethods, error, isLoading, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'methods'>('email');
  const [methods, setMethods] = useState<AuthMethods | null>(null);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/entries';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setMethodsLoading(true);
    try {
      const result = await getAuthMethods(email);
      setMethods(result);
      setStep('methods');
    } catch {
      // If fetching methods fails, fall back to showing password field
      setMethods({ password: true, passkey: false, magicLink: false });
      setStep('methods');
    } finally {
      setMethodsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error is handled by store
    }
  };

  const handleMagicLink = async () => {
    clearError();
    setMagicLinkLoading(true);
    try {
      await requestMagicLink(email);
      setMagicLinkSent(true);
    } catch {
      setMagicLinkSent(false);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handlePasskey = async () => {
    clearError();
    setPasskeyLoading(true);
    try {
      await loginWithPasskey(email);
      navigate(from, { replace: true });
    } catch {
      // Error is handled by store
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setMethods(null);
    setPassword('');
    setMagicLinkSent(false);
    clearError();
  };

  const hasMultipleMethods = methods
    ? [methods.password, methods.passkey, methods.magicLink].filter(Boolean).length > 1
    : false;

  return (
    <>
      <OrbitalBackground className="z-0" />
      <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden pointer-events-none">
        <Card variant="glass" className="relative z-10 w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('auth.login')}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}

            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full pointer-events-auto"
                  isLoading={methodsLoading}
                >
                  {t('common.continue')}
                </Button>
              </form>
            )}

            {step === 'methods' && methods && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors pointer-events-auto"
                >
                  &larr; {email}
                </button>

                {methods.password && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                )}

                {methods.password && (methods.magicLink || methods.passkey) && hasMultipleMethods && (
                  <div className="relative pointer-events-none">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/80 dark:bg-slate-800/80 px-2 text-slate-500 dark:text-slate-400">
                        {t('auth.orDivider')}
                      </span>
                    </div>
                  </div>
                )}

                {methods.magicLink && (
                  <div>
                    {magicLinkSent ? (
                      <Alert variant="success">
                        {t('auth.magicLinkSent')}
                      </Alert>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full pointer-events-auto"
                        onClick={handleMagicLink}
                        isLoading={magicLinkLoading}
                      >
                        {t('auth.sendMagicLink')}
                      </Button>
                    )}
                  </div>
                )}

                {methods.passkey && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full pointer-events-auto"
                    onClick={handlePasskey}
                    isLoading={passkeyLoading}
                  >
                    {t('auth.signInWithPasskey')}
                  </Button>
                )}
              </div>
            )}

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
