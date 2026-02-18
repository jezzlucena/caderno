import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSafetyTimerStore } from '../stores';
import { api } from '../lib/api';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  Modal,
} from '../components/ui';

type DurationUnit = 'minutes' | 'hours' | 'days' | 'weeks';

// Convert minutes to best fitting unit for display
function minutesToBestUnit(minutes: number): { value: number; unit: DurationUnit } {
  if (minutes >= 10080 && minutes % 10080 === 0) {
    return { value: minutes / 10080, unit: 'weeks' };
  }
  if (minutes >= 1440 && minutes % 1440 === 0) {
    return { value: minutes / 1440, unit: 'days' };
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    return { value: minutes / 60, unit: 'hours' };
  }
  return { value: minutes, unit: 'minutes' };
}

// Convert value + unit to minutes
function toMinutes(value: number, unit: DurationUnit): number {
  switch (unit) {
    case 'minutes': return value;
    case 'hours': return value * 60;
    case 'days': return value * 1440;
    case 'weeks': return value * 10080;
  }
}

export function SafetyTimerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    status,
    isLoading,
    error,
    fetchStatus,
    updateTimer,
    checkIn,
    addRecipient,
    deleteRecipient,
    addReminder,
    deleteReminder,
    clearError,
  } = useSafetyTimerStore();

  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    email: '',
    personalMessage: '',
    entryFilter: 'all' as 'all' | 'tagged',
    filterTag: '',
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderValue, setReminderValue] = useState(1);
  const [reminderUnit, setReminderUnit] = useState<DurationUnit>('days');

  // Duration configuration state
  const [durationValue, setDurationValue] = useState(30);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('days');

  // Countdown state
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Calculate remaining time components
  const calculateCountdown = useCallback((targetDate: Date) => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }, []);

  // Update countdown every second
  useEffect(() => {
    if (!status?.isEnabled || !status?.nextDeliveryAt) {
      setCountdown(null);
      return;
    }

    const targetDate = new Date(status.nextDeliveryAt);
    setCountdown(calculateCountdown(targetDate));

    const interval = setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [status?.isEnabled, status?.nextDeliveryAt, calculateCountdown]);

  // Update local state when status loads
  useEffect(() => {
    if (status) {
      const { value, unit } = minutesToBestUnit(status.timerDurationMinutes);
      setDurationValue(value);
      setDurationUnit(unit);
    }
  }, [status]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Fetch available tags when add recipient modal opens
  useEffect(() => {
    if (showAddRecipient) {
      api.getTags().then(({ tags }) => setAvailableTags(tags)).catch(() => {});
    }
  }, [showAddRecipient]);

  const handleCheckIn = async () => {
    await checkIn();
  };

  const handleToggleTimer = async () => {
    if (!status) return;
    await updateTimer({ isEnabled: !status.isEnabled });
  };

  const handleDurationSave = useCallback(async () => {
    const minutes = toMinutes(durationValue, durationUnit);
    if (minutes > 0) {
      await updateTimer({ timerDurationMinutes: minutes });
    }
  }, [durationValue, durationUnit, updateTimer]);

  const handleAddRecipient = async () => {
    const { filterTag, ...rest } = recipientForm;
    await addRecipient({
      ...rest,
      filterTags: rest.entryFilter === 'tagged' && filterTag ? [filterTag] : undefined,
    });
    setShowAddRecipient(false);
    setRecipientForm({
      name: '',
      email: '',
      personalMessage: '',
      entryFilter: 'all',
      filterTag: '',
    });
  };

  const handleAddReminder = async () => {
    const reminderMinutes = toMinutes(reminderValue, reminderUnit);
    await addReminder({ reminderMinutesBefore: reminderMinutes });
    setShowAddReminder(false);
    setReminderValue(1);
    setReminderUnit('days');
  };

  const formatReminderTime = (minutes: number): string => {
    const { value, unit } = minutesToBestUnit(minutes);
    const unitLabel = t(`safetyTimer.${unit}`);
    return `${value} ${unitLabel}`;
  };

  const isReminderValid = (): boolean => {
    if (!status) return false;
    const reminderMinutes = toMinutes(reminderValue, reminderUnit);
    return reminderMinutes > 0 && reminderMinutes < status.timerDurationMinutes;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">
          {t('safetyTimer.title')}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400 transition-colors">
          {t('safetyTimer.description')}
        </p>
      </div>

      {error && (
        <Alert variant="error" className="flex items-center justify-between">
          {error}
          <button onClick={clearError} className="text-red-700 hover:text-red-900">
            &times;
          </button>
        </Alert>
      )}

      {status && (
        <>
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('safetyTimer.status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium">
                    {status.isEnabled ? (
                      <span className="text-green-600 dark:text-green-400 transition-colors">
                        {t('safetyTimer.active')}
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        {t('safetyTimer.disabled')}
                      </span>
                    )}
                  </p>
                  {status.isEnabled && countdown && (
                    <div className="mt-3 flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-200 transition-colors">
                          {countdown.days}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 transition-colors">
                          {t('safetyTimer.countdownDays')}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-200 transition-colors">
                          {countdown.hours.toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 transition-colors">
                          {t('safetyTimer.countdownHours')}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-200 transition-colors">
                          {countdown.minutes.toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 transition-colors">
                          {t('safetyTimer.countdownMinutes')}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-4xl font-bold text-slate-800 dark:text-slate-200 transition-colors">
                          {countdown.seconds.toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 transition-colors">
                          {t('safetyTimer.countdownSeconds')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!status.isEnabled && status.recipients.length === 0 && (
                    <div className="relative group">
                      <svg
                        className="h-5 w-5 text-slate-400 dark:text-slate-500 cursor-help"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 rounded-lg bg-slate-800 dark:bg-slate-700 px-3 py-2 text-xs text-white shadow-lg z-10">
                        {t('safetyTimer.enableHint')}
                      </div>
                    </div>
                  )}
                  <Button
                    variant={status.isEnabled ? 'secondary' : 'primary'}
                    onClick={handleToggleTimer}
                    disabled={!status.isEnabled && status.recipients.length === 0}
                  >
                    {status.isEnabled
                      ? t('safetyTimer.disable')
                      : t('safetyTimer.enable')}
                  </Button>
                </div>
              </div>

              {status.isEnabled && (
                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        {t('safetyTimer.nextDelivery')}: {formatDate(status.nextDeliveryAt)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        {t('safetyTimer.lastCheckIn')}: {formatDate(status.lastResetAt)}
                      </p>
                    </div>
                    <Button onClick={handleCheckIn} isLoading={isLoading}>
                      {t('safetyTimer.checkIn')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{t('safetyTimer.configuration')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="label">{t('safetyTimer.timerDuration')}</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={durationValue}
                    onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24"
                  />
                  <Select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                    options={[
                      { value: 'minutes', label: t('safetyTimer.minutes') },
                      { value: 'hours', label: t('safetyTimer.hours') },
                      { value: 'days', label: t('safetyTimer.daysUnit') },
                      { value: 'weeks', label: t('safetyTimer.weeks') },
                    ]}
                    className="w-32"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleDurationSave}
                    disabled={isLoading}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle>{t('safetyTimer.recipients')}</CardTitle>
              <CardDescription>{t('safetyTimer.recipientsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.recipients.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
                  {t('safetyTimer.noRecipients')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {status.recipients.map((recipient) => (
                    <li
                      key={recipient.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 transition-colors">
                          {recipient.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
                          {recipient.email}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
                          {recipient.entryFilter === 'all'
                            ? t('safetyTimer.allEntries')
                            : recipient.filterTags?.[0]
                              ? t('safetyTimer.entriesWithTag', { tag: recipient.filterTags[0] })
                              : t('safetyTimer.taggedEntries')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRecipient(recipient.id)}
                      >
                        {t('common.remove')}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setShowAddRecipient(true)}
                disabled={status.recipients.length >= 10}
              >
                {t('safetyTimer.addRecipient')}
              </Button>
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle>{t('safetyTimer.reminders')}</CardTitle>
              <CardDescription>{t('safetyTimer.remindersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {(status.reminders || []).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
                  {t('safetyTimer.noReminders')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {status.reminders.map((reminder) => (
                    <li
                      key={reminder.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 transition-colors">
                          {t('safetyTimer.reminderBefore', { time: formatReminderTime(reminder.reminderMinutesBefore) })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReminder(reminder.id)}
                      >
                        {t('common.remove')}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setShowAddReminder(true)}
                disabled={(status.reminders || []).length >= 10}
              >
                {t('safetyTimer.addReminder')}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Recipient Modal */}
      <Modal
        isOpen={showAddRecipient}
        onClose={() => setShowAddRecipient(false)}
        title={t('safetyTimer.addRecipient')}
      >
        <div className="space-y-4">
          <Input
            label={t('safetyTimer.recipientName')}
            value={recipientForm.name}
            onChange={(e) =>
              setRecipientForm({ ...recipientForm, name: e.target.value })
            }
            required
          />
          <Input
            label={t('safetyTimer.recipientEmail')}
            type="email"
            value={recipientForm.email}
            onChange={(e) =>
              setRecipientForm({ ...recipientForm, email: e.target.value })
            }
            required
          />
          <div>
            <label className="label">{t('safetyTimer.personalMessage')}</label>
            <textarea
              className="input min-h-[100px]"
              value={recipientForm.personalMessage}
              onChange={(e) =>
                setRecipientForm({ ...recipientForm, personalMessage: e.target.value })
              }
              placeholder={t('safetyTimer.personalMessagePlaceholder')}
            />
          </div>
          <Select
            label={t('safetyTimer.entryFilter')}
            value={recipientForm.entryFilter}
            onChange={(e) =>
              setRecipientForm({
                ...recipientForm,
                entryFilter: e.target.value as 'all' | 'tagged',
                filterTag: e.target.value === 'all' ? '' : recipientForm.filterTag,
              })
            }
            options={[
              { value: 'all', label: t('safetyTimer.allEntries') },
              { value: 'tagged', label: t('safetyTimer.entriesWithTagOption') },
            ]}
          />
          {recipientForm.entryFilter === 'tagged' && (
            <Select
              label={t('safetyTimer.selectTag')}
              value={recipientForm.filterTag}
              onChange={(e) =>
                setRecipientForm({
                  ...recipientForm,
                  filterTag: e.target.value,
                })
              }
              options={[
                { value: '', label: t('safetyTimer.selectTagPlaceholder') },
                ...availableTags.map((tag) => ({ value: tag, label: tag })),
              ]}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddRecipient(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddRecipient}
              disabled={
                !recipientForm.name ||
                !recipientForm.email ||
                (recipientForm.entryFilter === 'tagged' && !recipientForm.filterTag)
              }
            >
              {t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* SMTP Required Modal */}
      <Modal
        isOpen={!!status && !status.smtpConfigured}
        onClose={() => navigate('/entries')}
        title={t('safetyTimer.smtpRequiredTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
            {t('safetyTimer.smtpRequiredMessage')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate('/entries')}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => navigate('/settings')}>
              {t('safetyTimer.goToSettings')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={showAddReminder}
        onClose={() => setShowAddReminder(false)}
        title={t('safetyTimer.addReminder')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
            {t('safetyTimer.reminderExplanation')}
          </p>
          <div>
            <label className="label">{t('safetyTimer.reminderTime')}</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={reminderValue}
                onChange={(e) => setReminderValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24"
              />
              <Select
                value={reminderUnit}
                onChange={(e) => setReminderUnit(e.target.value as DurationUnit)}
                options={[
                  { value: 'minutes', label: t('safetyTimer.minutes') },
                  { value: 'hours', label: t('safetyTimer.hours') },
                  { value: 'days', label: t('safetyTimer.daysUnit') },
                  { value: 'weeks', label: t('safetyTimer.weeks') },
                ]}
                className="w-32"
              />
            </div>
            {!isReminderValid() && reminderValue > 0 && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 transition-colors">
                {t('safetyTimer.reminderTooLong')}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddReminder(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddReminder}
              disabled={!isReminderValid()}
            >
              {t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
