import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { startRegistration } from '@simplewebauthn/browser';
import { useSettingsStore } from '../stores';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  Modal,
} from '../components/ui';
import { SmtpConfigForm } from '../components/settings';
import { api, Passkey, SmtpSettingsResponse } from '../lib/api';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const {
    preferences,
    error,
    fetchPreferences,
    updatePreferences,
    clearError,
  } = useSettingsStore();

  const [showSmtpForm, setShowSmtpForm] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettingsResponse | null>(null);
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);
  const [showClearSmtpConfirm, setShowClearSmtpConfirm] = useState(false);

  // Passkey state
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [passkeyAlert, setPasskeyAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddPasskey, setShowAddPasskey] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [deletePasskeyId, setDeletePasskeyId] = useState<string | null>(null);
  const [isDeletingPasskey, setIsDeletingPasskey] = useState(false);

  const fetchPasskeys = useCallback(async () => {
    setIsLoadingPasskeys(true);
    try {
      const { passkeys: list } = await api.listPasskeys();
      setPasskeys(list);
    } catch {
      setPasskeys([]);
    } finally {
      setIsLoadingPasskeys(false);
    }
  }, []);

  const handleAddPasskey = async () => {
    setIsAddingPasskey(true);
    setPasskeyAlert(null);
    try {
      const options = await api.getPasskeyRegistrationOptions(passkeyName || undefined);
      const response = await startRegistration({ optionsJSON: options });
      await api.verifyPasskeyRegistration(response, passkeyName || undefined);
      setPasskeyAlert({ type: 'success', message: t('settings.passkeyAdded') });
      setShowAddPasskey(false);
      setPasskeyName('');
      fetchPasskeys();
    } catch (error) {
      console.error('Error adding passkey:', error);
      setPasskeyAlert({ type: 'error', message: t('settings.passkeyAddFailed') });
    } finally {
      setIsAddingPasskey(false);
    }
  };

  const confirmDeletePasskey = async () => {
    if (!deletePasskeyId) return;
    setIsDeletingPasskey(true);
    setPasskeyAlert(null);
    try {
      await api.deletePasskey(deletePasskeyId);
      setPasskeyAlert({ type: 'success', message: t('settings.passkeyDeleted') });
      setDeletePasskeyId(null);
      fetchPasskeys();
    } catch {
      setPasskeyAlert({ type: 'error', message: t('settings.passkeyDeleteFailed') });
    } finally {
      setIsDeletingPasskey(false);
    }
  };

  const fetchSmtpSettings = useCallback(async () => {
    setIsLoadingSmtp(true);
    try {
      const settings = await api.getSmtpSettings();
      setSmtpSettings(settings);
    } catch {
      // If fetch fails, just show empty form
      setSmtpSettings(null);
    } finally {
      setIsLoadingSmtp(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
    fetchSmtpSettings();
    fetchPasskeys();
  }, [fetchPreferences, fetchSmtpSettings, fetchPasskeys]);

  const handleShowSmtpForm = async () => {
    await fetchSmtpSettings();
    setShowSmtpForm(true);
  };

  const handleClearSmtp = () => {
    setShowClearSmtpConfirm(true);
  };

  const confirmClearSmtp = async () => {
    setIsLoadingSmtp(true);
    try {
      await api.deleteSmtpSettings();
      setSmtpSettings(null);
    } catch {
      // ignore
    } finally {
      setIsLoadingSmtp(false);
      setShowClearSmtpConfirm(false);
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updatePreferences({ theme });
  };

  const handleLanguageChange = async (language: 'en' | 'es' | 'pt-BR') => {
    await updatePreferences({ language });
    i18n.changeLanguage(language);
  };

  const handleFontSizeChange = async (size: number) => {
    await updatePreferences({ editorFontSize: size });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">
        {t('settings.title')}
      </h1>

      {error && (
        <Alert variant="error" className="flex items-center justify-between">
          {error}
          <button onClick={clearError} className="text-red-700 hover:text-red-900">
            &times;
          </button>
        </Alert>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label={t('settings.theme')}
            value={preferences.theme}
            onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
            options={[
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
              { value: 'system', label: t('settings.themeSystem') },
            ]}
          />

          <Select
            label={t('settings.language')}
            value={preferences.language}
            onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'es' | 'pt-BR')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
              { value: 'pt-BR', label: 'Português (Brasil)' },
            ]}
          />

          <div>
            <label className="label">{t('settings.editorFontSize')}</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="12"
                max="24"
                value={preferences.editorFontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                {preferences.editorFontSize}px
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.dataManagement')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = '/api/v1/export/json';
              }}
            >
              {t('settings.exportJson')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = '/api/v1/export/pdf';
              }}
            >
              {t('settings.exportPdf')}
            </Button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
            {t('settings.exportDescription')}
          </p>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.emailConfiguration')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 transition-colors">
            {t('settings.emailConfigDescription')}
          </p>
          {showSmtpForm ? (
            <div className="space-y-4">
              <SmtpConfigForm
                onSuccess={() => {
                  setShowSmtpForm(false);
                  fetchSmtpSettings();
                }}
                initialValues={smtpSettings?.config ? {
                  host: smtpSettings.config.host,
                  port: smtpSettings.config.port,
                  secure: smtpSettings.config.secure,
                  user: smtpSettings.config.user,
                  fromAddress: smtpSettings.config.fromAddress,
                  fromName: smtpSettings.config.fromName,
                } : undefined}
              />
              <Button variant="ghost" onClick={() => setShowSmtpForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleShowSmtpForm}
                isLoading={isLoadingSmtp}
              >
                {smtpSettings?.configured
                  ? t('settings.editSmtp')
                  : t('settings.configureSmtp')}
              </Button>
              {smtpSettings?.configured && (
                <Button
                  variant="danger"
                  onClick={handleClearSmtp}
                  isLoading={isLoadingSmtp}
                >
                  {t('settings.clearSmtp')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear SMTP Confirmation Modal */}
      <Modal
        isOpen={showClearSmtpConfirm}
        onClose={() => setShowClearSmtpConfirm(false)}
        title={t('settings.clearSmtpConfirmTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
            {t('settings.clearSmtpConfirmMessage')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowClearSmtpConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmClearSmtp} isLoading={isLoadingSmtp}>
              {t('settings.clearSmtp')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Passkeys */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.passkeys')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 transition-colors">
            {t('settings.passkeysDescription')}
          </p>

          {passkeyAlert && (
            <Alert variant={passkeyAlert.type === 'success' ? 'success' : 'error'} className="mb-4">
              {passkeyAlert.message}
            </Alert>
          )}

          {isLoadingPasskeys ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : passkeys.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 transition-colors">
              {t('settings.noPasskeys')}
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100 transition-colors truncate">
                      {passkey.name}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 transition-colors">
                      <p>{t('settings.passkeyDeviceType')}: {passkey.deviceType}</p>
                      <p>{t('settings.passkeyCreated')}: {new Date(passkey.createdAt).toLocaleDateString()}</p>
                      <p>
                        {t('settings.passkeyLastUsed')}:{' '}
                        {passkey.lastUsedAt
                          ? new Date(passkey.lastUsedAt).toLocaleDateString()
                          : t('settings.passkeyNeverUsed')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletePasskeyId(passkey.id)}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showAddPasskey ? (
            <div className="space-y-3">
              <Input
                label={t('settings.passkeyName')}
                placeholder={t('settings.passkeyNamePlaceholder')}
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleAddPasskey} isLoading={isAddingPasskey}>
                  {t('settings.addPasskey')}
                </Button>
                <Button variant="ghost" onClick={() => { setShowAddPasskey(false); setPasskeyName(''); }}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowAddPasskey(true)}>
              {t('settings.addPasskey')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Passkey Confirmation Modal */}
      <Modal
        isOpen={!!deletePasskeyId}
        onClose={() => setDeletePasskeyId(null)}
        title={t('settings.deletePasskeyConfirm')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
            {t('settings.deletePasskeyWarning')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletePasskeyId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDeletePasskey} isLoading={isDeletingPasskey}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
            <p>
              <strong>Caderno</strong> - {t('settings.aboutDescription')}
            </p>
            <p>{t('settings.version')}: 1.0.0</p>
            <p>
              <a
                href="https://github.com/jezzlucena/caderno"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                {t('settings.viewSource')}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
