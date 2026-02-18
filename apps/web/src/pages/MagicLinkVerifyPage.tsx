import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores';
import { Card, CardContent, Alert, OrbitalBackground } from '../components/ui';

export function MagicLinkVerifyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyMagicLink } = useAuthStore();

  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError(t('auth.magicLinkInvalid'));
      setIsVerifying(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await verifyMagicLink(token);
        if (!cancelled) {
          navigate('/entries', { replace: true });
        }
      } catch {
        if (!cancelled) {
          setError(t('auth.magicLinkInvalid'));
          setIsVerifying(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, verifyMagicLink, navigate, t]);

  return (
    <>
      <OrbitalBackground className="z-0" />
      <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden pointer-events-none">
        <Card variant="glass" className="relative z-10 w-full max-w-md">
          <CardContent className="py-8 text-center">
            {isVerifying ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 transition-colors">
                  {t('auth.verifyingMagicLink')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}
                <Link
                  to="/login"
                  className="link pointer-events-auto"
                >
                  {t('auth.backToLogin')}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
