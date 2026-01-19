import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Alert } from '../ui';
import { api, SmtpConfig } from '../../lib/api';

interface SmtpConfigFormProps {
  onSuccess?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  initialValues?: Partial<SmtpConfig>;
}

export function SmtpConfigForm({
  onSuccess,
  onSkip,
  showSkip = false,
  initialValues,
}: SmtpConfigFormProps) {
  const { t } = useTranslation();

  const [host, setHost] = useState(initialValues?.host || '');
  const [port, setPort] = useState(initialValues?.port?.toString() || '587');
  const [secure, setSecure] = useState(initialValues?.secure ?? false);
  const [user, setUser] = useState(initialValues?.user || '');
  const [pass, setPass] = useState(initialValues?.pass || '');
  const [fromAddress, setFromAddress] = useState(initialValues?.fromAddress || '');
  const [fromName, setFromName] = useState(initialValues?.fromName || '');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getConfig = (): SmtpConfig => ({
    host,
    port: parseInt(port, 10),
    secure,
    user,
    pass,
    fromAddress,
    fromName: fromName || undefined,
  });

  const isFormValid = () => {
    return host && port && user && pass && fromAddress;
  };

  const handleVerify = async () => {
    setError('');
    setSuccess('');
    setIsVerifying(true);

    try {
      const result = await api.verifySmtp(getConfig());
      if (result.success) {
        setSuccess(t('settings.smtpVerified'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.smtpVerifyFailed'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      setError(t('settings.enterTestEmail'));
      return;
    }

    setError('');
    setSuccess('');
    setIsSendingTest(true);

    try {
      const result = await api.sendTestEmail({
        ...getConfig(),
        recipientEmail: testEmail,
      });
      if (result.success) {
        setSuccess(t('settings.testEmailSent'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.testEmailFailed'));
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await api.updateSmtpSettings(getConfig());
      setSuccess(t('settings.smtpSaved'));
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.smtpSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('settings.smtpHost')}
          placeholder="smtp.example.com"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          required
        />
        <Input
          label={t('settings.smtpPort')}
          type="number"
          placeholder="587"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="smtp-secure"
          checked={secure}
          onChange={(e) => setSecure(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="smtp-secure" className="text-sm text-slate-700 dark:text-slate-300">
          {t('settings.smtpSecure')}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('settings.smtpUser')}
          placeholder="user@example.com"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
        />
        <Input
          label={t('settings.smtpPass')}
          type="password"
          placeholder="••••••••"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('settings.smtpFromAddress')}
          type="email"
          placeholder="noreply@example.com"
          value={fromAddress}
          onChange={(e) => setFromAddress(e.target.value)}
          required
        />
        <Input
          label={t('settings.smtpFromName')}
          placeholder="Caderno"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
        />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            label={t('settings.testEmailAddress')}
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={handleSendTest}
            isLoading={isSendingTest}
            disabled={!isFormValid() || !testEmail}
          >
            {t('settings.sendTestEmail')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {showSkip && onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            {t('onboarding.skipForNow')}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={handleVerify}
          isLoading={isVerifying}
          disabled={!isFormValid()}
        >
          {t('settings.verifySmtp')}
        </Button>
        <Button onClick={handleSave} isLoading={isSaving} disabled={!isFormValid()}>
          {t('settings.saveSmtp')}
        </Button>
      </div>
    </div>
  );
}
