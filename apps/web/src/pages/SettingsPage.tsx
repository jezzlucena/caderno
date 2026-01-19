import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores';
import {
  Button,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
} from '../components/ui';
import { SmtpConfigForm } from '../components/settings';
import { api, SmtpSettingsResponse } from '../lib/api';

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
  }, [fetchPreferences, fetchSmtpSettings]);

  const handleShowSmtpForm = async () => {
    await fetchSmtpSettings();
    setShowSmtpForm(true);
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
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
              <span className="w-12 text-sm text-slate-600 dark:text-slate-400">
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {t('settings.emailConfigDescription')}
          </p>
          {showSmtpForm ? (
            <div className="space-y-4">
              <SmtpConfigForm
                onSuccess={() => setShowSmtpForm(false)}
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
            <Button
              variant="secondary"
              onClick={handleShowSmtpForm}
              isLoading={isLoadingSmtp}
            >
              {smtpSettings?.configured
                ? t('settings.editSmtp')
                : t('settings.configureSmtp')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
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
