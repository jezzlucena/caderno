import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore, useAuthStore } from '../stores';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
} from '../components/ui';
import { SmtpConfigForm } from '../components/settings';

export function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { status, currentStep, setStep, completeOnboarding } =
    useOnboardingStore();
  const { register, error: authError, isLoading: authLoading, clearError } =
    useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [instanceName, setInstanceName] = useState('Caderno');
  const [language, setLanguage] = useState<'en' | 'es' | 'pt-BR'>('en');
  const [validationError, setValidationError] = useState('');

  // Note: fetchStatus is already called by AppRoutes, no need to call it here

  useEffect(() => {
    if (status?.isComplete) {
      navigate('/login');
    }
  }, [status, navigate]);

  const handleCreateAccount = async () => {
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
      setStep(currentStep + 1);
    } catch {
      // Error handled by store
    }
  };

  const handleLanguageSelect = (lang: 'en' | 'es' | 'pt-BR') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding(instanceName);
      navigate('/entries');
    } catch {
      // Error handled by store
    }
  };

  const steps = [
    {
      title: t('onboarding.welcome'),
      description: t('onboarding.welcomeDescription'),
      content: (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary-600">Caderno</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400 transition-colors">
            {t('onboarding.welcomeMessage')}
          </p>
          <Button className="mt-6" onClick={() => setStep(1)}>
            {t('onboarding.getStarted')}
          </Button>
        </div>
      ),
    },
    {
      title: t('onboarding.createAccount'),
      description: t('onboarding.createAccountDescription'),
      content: (
        <div className="space-y-4">
          {(authError || validationError) && (
            <Alert variant="error">{authError || validationError}</Alert>
          )}
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <p className="text-xs text-slate-500">{t('auth.passwordRequirements')}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              {t('common.back')}
            </Button>
            <Button
              onClick={handleCreateAccount}
              isLoading={authLoading}
              disabled={!email || !password || !confirmPassword}
            >
              {t('onboarding.createAccount')}
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: t('onboarding.smtpSetup'),
      description: t('onboarding.smtpDescription'),
      content: (
        <div className="space-y-4">
          <Alert variant="info">{t('onboarding.smtpOptional')}</Alert>
          <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
            {t('onboarding.smtpExplanation')}
          </p>
          <SmtpConfigForm
            onSuccess={() => setStep(3)}
            onSkip={() => setStep(3)}
            showSkip={true}
          />
          <Button variant="ghost" onClick={() => setStep(1)}>
            {t('common.back')}
          </Button>
        </div>
      ),
    },
    {
      title: t('onboarding.chooseLanguage'),
      description: t('onboarding.languageDescription'),
      content: (
        <div className="space-y-4">
          <div className="grid gap-2">
            {[
              { code: 'en', name: 'English' },
              { code: 'es', name: 'Español' },
              { code: 'pt-BR', name: 'Português (Brasil)' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code as 'en' | 'es' | 'pt-BR')}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  language === lang.code
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 transition-colors'
                    : 'border-slate-200 hover:border-primary-300 dark:border-slate-700 transition-colors'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              {t('common.back')}
            </Button>
            <Button onClick={() => setStep(4)}>{t('common.continue')}</Button>
          </div>
        </div>
      ),
    },
    {
      title: t('onboarding.complete'),
      description: t('onboarding.completeDescription'),
      content: (
        <div className="space-y-4">
          <Input
            label={t('onboarding.instanceName')}
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="Caderno"
          />
          <p className="text-sm text-slate-500">{t('onboarding.instanceNameHint')}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(3)}>
              {t('common.back')}
            </Button>
            <Button onClick={handleComplete}>{t('onboarding.finish')}</Button>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  // Use wider card for SMTP step
  const cardWidth = currentStep === 2 ? 'max-w-2xl' : 'max-w-md';

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className={`w-full ${cardWidth}`}>
        <CardHeader>
          <div className="mb-4 flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index <= currentStep
                    ? 'bg-primary-600'
                    : 'bg-slate-200 dark:bg-slate-700 transition-colors'
                }`}
              />
            ))}
          </div>
          <CardTitle>{current.title}</CardTitle>
          <CardDescription>{current.description}</CardDescription>
        </CardHeader>
        <CardContent>{current.content}</CardContent>
      </Card>
    </div>
  );
}
