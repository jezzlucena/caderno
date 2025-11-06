import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { 
  XMarkIcon, 
  ClockIcon, 
  PlusIcon, 
  TrashIcon, 
  PlayIcon, 
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PencilIcon,
  ArrowUturnLeftIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { useJournalStore, useSettingsStore } from '../../store/useStore';
import ApiKeyConfirmationModal from './ApiKeyConfirmationModal';

interface Schedule {
  id: string;
  name: string;
  execution_time: number;
  executed: boolean;
  original_duration_ms?: number;
  entry_selection_type: 'all' | 'specific' | 'date_range';
  entry_ids?: string[];
  date_range_start?: number;
  date_range_end?: number;
  recipients: Recipient[];
  executed_at?: number;
  entry_count?: number;
  logs?: ExecutionLog[];
}

interface Recipient {
  id: string;
  type: 'email' | 'sms';
  value: string;
}

interface ExecutionLog {
  id: string;
  status: 'success' | 'failed' | 'running';
  started_at: number;
  completed_at?: number;
  entry_count?: number;
  recipients_sent?: number;
  error_message?: string;
}

interface ScheduledExportsModalProps {
  onClose: () => void;
  onOpenSettings?: (screen: 'scheduledExports') => void;
}

export default function ScheduledExportsModal({ onClose, onOpenSettings }: ScheduledExportsModalProps) {
  const { t } = useTranslation();
  const { entries } = useJournalStore();
  const { scheduledExports, setScheduledExportsApiKey } = useSettingsStore();
  const [isClosing, setIsClosing] = useState(false);
  const [view, setView] = useState<'instructional' | 'list' | 'create' | 'edit' | 'detail'>('instructional');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [showApiKeyConfirmation, setShowApiKeyConfirmation] = useState(false);
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false);
  
  // Server configuration from settings
  const serverUrl = scheduledExports.serverUrl;
  const apiKey = scheduledExports.apiKey;
  
  // Schedules
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdownTrigger, setCountdownTrigger] = useState(0); // Used to trigger countdown re-renders
  
  // Ref for modal container
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Create schedule form
  const [scheduleName, setScheduleName] = useState('');
  const [durationYears, setDurationYears] = useState(0);
  const [durationMonths, setDurationMonths] = useState(0);
  const [durationWeeks, setDurationWeeks] = useState(0);
  const [durationDays, setDurationDays] = useState(0);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [selectionType, setSelectionType] = useState<'all' | 'specific' | 'date_range'>('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [recipients, setRecipients] = useState<{ type: 'email' | 'sms'; value: string }[]>([
    { type: 'email', value: '' }
  ]);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTrigger(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sync with server every 30 seconds
  useEffect(() => {
    if (view === 'list' && serverUrl && apiKey) {
      const syncInterval = setInterval(() => {
        // Silent reload without showing loading state
        fetch(`${serverUrl}/api/schedules`, {
          headers: { 'X-API-Key': apiKey }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setSchedules(data.data || []);
            }
          })
          .catch(err => console.error('Background sync failed:', err));
      }, 30000); // 30 seconds

      return () => clearInterval(syncInterval);
    }
  }, [view, serverUrl, apiKey]);

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${serverUrl}/api/schedules`, {
        headers: { 'X-API-Key': apiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSchedules(data.data || []);
          setView('list');
        } else {
          toast.error(data.error || t('scheduledExports.messages.loadSchedulesFailed'));
        }
      } else if (response.status === 401) {
        toast.error(t('scheduledExports.messages.invalidApiKey'));
        setView('instructional');
      } else {
        toast.error(t('scheduledExports.messages.loadSchedulesFailed'));
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
      toast.error(t('scheduledExports.messages.networkError'));
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, serverUrl, t]);

  const testConnection = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/health`);

      if (response.ok) {
        loadSchedules();
      } else {
        toast.error(t('scheduledExports.messages.unableToConnect'));
        setView('instructional');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error(t('scheduledExports.messages.serverConnectionFailed'));
      setView('instructional');
    }
  }, [loadSchedules, serverUrl, t]);

  useEffect(() => {
    // Check if server is configured
    if (!serverUrl || !apiKey) {
      setView('instructional');
    } else {
      testConnection();
    }
  }, [serverUrl, apiKey, testConnection]);

  const countEntries = (selectionType: 'all' | 'specific' | 'date_range', dateStart?: string, dateEnd?: string) => {
    if (selectionType === 'all') {
      return entries.length;
    }
    
    if (selectionType === 'date_range' && dateStart && dateEnd) {
      const startTimestamp = new Date(dateStart).getTime();
      const endTimestamp = new Date(dateEnd).getTime();
      return entries.filter(entry => {
        const entryTime = entry.createdAt;
        return entryTime >= startTimestamp && entryTime <= endTimestamp;
      }).length;
    }
    
    return 0;
  };

  const loadScheduleDetails = async (scheduleId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${serverUrl}/api/schedules/${scheduleId}`, {
        headers: { 'X-API-Key': apiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedSchedule(data.data);
          setView('detail');
        } else {
          toast.error(data.error || t('scheduledExports.messages.loadDetailsFailed'));
        }
      } else {
        toast.error(t('scheduledExports.messages.loadDetailsFailed'));
      }
    } catch (error) {
      console.error('Failed to load schedule details:', error);
      toast.error(t('scheduledExports.messages.loadDetailsNetworkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!scheduleName.trim()) {
      toast.error(t('scheduledExports.messages.scheduleNameRequired'));
      return;
    }

    if (!passphrase.trim()) {
      toast.error(t('scheduledExports.messages.passphraseRequired'));
      return;
    }

    // Check that at least one duration field is set
    const totalDuration = durationYears + durationMonths + durationWeeks + durationDays + durationHours + durationMinutes;
    if (totalDuration === 0) {
      toast.error(t('scheduledExports.messages.durationRequired'));
      return;
    }

    const validRecipients = recipients.filter(r => r.value.trim());
    if (validRecipients.length === 0) {
      toast.error(t('scheduledExports.messages.recipientRequired'));
      return;
    }

    // Calculate execution time from duration
    const now = Date.now();
    const originalDurationMs = 
      (durationYears * 365 * 24 * 60 * 60 * 1000) +
      (durationMonths * 30 * 24 * 60 * 60 * 1000) +
      (durationWeeks * 7 * 24 * 60 * 60 * 1000) +
      (durationDays * 24 * 60 * 60 * 1000) +
      (durationHours * 60 * 60 * 1000) +
      (durationMinutes * 60 * 1000);
    
    const executionTime = now + originalDurationMs;

    // Calculate entry count
    const entryCount = countEntries(selectionType, dateRangeStart, dateRangeEnd);
    
    if (entryCount === 0) {
      toast.error(t('scheduledExports.messages.noEntriesMatch'));
      return;
    }

    setIsLoading(true);
    
    try {
      const scheduleData = {
        name: scheduleName,
        execution_time: executionTime,
        original_duration_ms: originalDurationMs,
        entry_selection_type: selectionType,
        date_range_start: selectionType === 'date_range' && dateRangeStart ? new Date(dateRangeStart).getTime() : undefined,
        date_range_end: selectionType === 'date_range' && dateRangeEnd ? new Date(dateRangeEnd).getTime() : undefined,
        entry_count: entryCount,
        recipients: validRecipients,
        entries_data: entries,
        passphrase: passphrase
      };

      const response = await fetch(`${serverUrl}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(scheduleData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const entryWord = entryCount === 1 ? t('scheduledExports.list.entryCount_one', { count: entryCount }) : t('scheduledExports.list.entryCount_other', { count: entryCount });
        toast.success(t('scheduledExports.messages.scheduleCreatedSuccess', { count: entryCount, entryWord }));
        await loadSchedules();
        resetForm();
      } else {
        toast.error(data.error || t('scheduledExports.messages.createScheduleFailed'));
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast.error(t('scheduledExports.messages.createScheduleNetworkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateSchedule = async () => {
    if (!editingScheduleId) return;

    if (!scheduleName.trim()) {
      toast.error(t('scheduledExports.messages.scheduleNameRequired'));
      return;
    }

    if (!passphrase.trim()) {
      toast.error(t('scheduledExports.messages.passphraseRequired'));
      return;
    }

    // Check that at least one duration field is set
    const totalDuration = durationYears + durationMonths + durationWeeks + durationDays + durationHours + durationMinutes;
    if (totalDuration === 0) {
      toast.error(t('scheduledExports.messages.durationRequired'));
      return;
    }

    const validRecipients = recipients.filter(r => r.value.trim());
    if (validRecipients.length === 0) {
      toast.error(t('scheduledExports.messages.recipientRequired'));
      return;
    }

    // Calculate execution time from duration
    const now = Date.now();
    const originalDurationMs = 
      (durationYears * 365 * 24 * 60 * 60 * 1000) +
      (durationMonths * 30 * 24 * 60 * 60 * 1000) +
      (durationWeeks * 7 * 24 * 60 * 60 * 1000) +
      (durationDays * 24 * 60 * 60 * 1000) +
      (durationHours * 60 * 60 * 1000) +
      (durationMinutes * 60 * 1000);
    
    const executionTime = now + originalDurationMs;

    // Calculate entry count
    const entryCount = countEntries(selectionType, dateRangeStart, dateRangeEnd);
    
    if (entryCount === 0) {
      toast.error(t('scheduledExports.messages.noEntriesMatch'));
      return;
    }

    setIsLoading(true);
    
    try {
      const scheduleData = {
        name: scheduleName,
        execution_time: executionTime,
        original_duration_ms: originalDurationMs,
        entry_selection_type: selectionType,
        date_range_start: selectionType === 'date_range' && dateRangeStart ? new Date(dateRangeStart).getTime() : undefined,
        date_range_end: selectionType === 'date_range' && dateRangeEnd ? new Date(dateRangeEnd).getTime() : undefined,
        entry_count: entryCount,
        recipients: validRecipients,
        entries_data: entries,
        passphrase: passphrase
      };

      const response = await fetch(`${serverUrl}/api/schedules/${editingScheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(scheduleData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const entryWord = entryCount === 1 ? t('scheduledExports.list.entryCount_one', { count: entryCount }) : t('scheduledExports.list.entryCount_other', { count: entryCount });
        toast.success(t('scheduledExports.messages.scheduleUpdatedSuccess', { count: entryCount, entryWord }));
        await loadSchedules();
        resetForm();
        setEditingScheduleId(null);
      } else {
        toast.error(data.error || t('scheduledExports.messages.updateScheduleFailed'));
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error(t('scheduledExports.messages.updateScheduleNetworkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm(t('scheduledExports.messages.deleteConfirm'))) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${serverUrl}/api/schedules/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('scheduledExports.messages.scheduleDeletedSuccess'));
        await loadSchedules();
        if (selectedSchedule?.id === id) {
          setSelectedSchedule(null);
          setView('list');
        }
      } else {
        toast.error(data.error || t('scheduledExports.messages.deleteScheduleFailed'));
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error(t('scheduledExports.messages.deleteScheduleNetworkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const executeSchedule = async (id: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${serverUrl}/api/schedules/${id}/execute`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('scheduledExports.messages.executionStarted'));
        // Reload schedule details if viewing details
        if (selectedSchedule?.id === id) {
          setTimeout(() => loadScheduleDetails(id), 2000);
        }
      } else {
        toast.error(data.error || t('scheduledExports.messages.executeFailed'));
      }
    } catch (error) {
      console.error('Failed to execute schedule:', error);
      toast.error(t('scheduledExports.messages.executeNetworkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setScheduleName('');
    setDurationYears(0);
    setDurationMonths(0);
    setDurationWeeks(0);
    setDurationDays(0);
    setDurationHours(0);
    setDurationMinutes(1);
    setSelectionType('all');
    setDateRangeStart('');
    setDateRangeEnd('');
    setPassphrase('');
    setRecipients([{ type: 'email', value: '' }]);
    setView('list');
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleGenerateApiKeyClick = () => {
    // Validate server URL before showing confirmation
    if (!serverUrl.trim()) {
      toast.error(t('scheduledExports.messages.serverUrlRequired'));
      return;
    }

    // Validate URL format
    try {
      new URL(serverUrl.trim());
    } catch {
      toast.error(t('scheduledExports.messages.invalidServerUrl'));
      return;
    }

    // Show confirmation modal
    setShowApiKeyConfirmation(true);
  };

  const handleConfirmApiKeyGeneration = async () => {
    setShowApiKeyConfirmation(false);
    setIsGeneratingApiKey(true);

    try {
      // Remove trailing slash from server URL to avoid double slashes
      const baseUrl = serverUrl.trim().replace(/\/$/, '');
      
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.api_key) {
        setScheduledExportsApiKey(data.data.api_key);
        toast.success(t('scheduledExports.messages.apiKeyGeneratedSuccess'));
      } else {
        toast.error(data.message || t('scheduledExports.messages.apiKeyGenerationFailed'));
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
      toast.error(t('scheduledExports.messages.apiKeyNetworkError'));
    } finally {
      setIsGeneratingApiKey(false);
    }
  };

  const formatCountdown = (executionTime: number) => {
    // Force re-render every second by referencing countdownTrigger
    void countdownTrigger;
    const now = Date.now();
    const diff = executionTime - now;

    if (diff < 0) {
      return t('scheduledExports.time.executionTimePassed');
    }
    
    // Calculate time units
    let remainingMs = diff;
    
    const years = Math.floor(remainingMs / (365 * 24 * 60 * 60 * 1000));
    remainingMs -= years * 365 * 24 * 60 * 60 * 1000;
    
    const months = Math.floor(remainingMs / (30 * 24 * 60 * 60 * 1000));
    remainingMs -= months * 30 * 24 * 60 * 60 * 1000;
    
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    remainingMs -= days * 24 * 60 * 60 * 1000;
    
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    remainingMs -= hours * 60 * 60 * 1000;
    
    const minutes = Math.floor(remainingMs / (60 * 1000));
    remainingMs -= minutes * 60 * 1000;
    
    const seconds = Math.floor(remainingMs / 1000);
    
    // Build countdown string
    const parts = [];

    if (years > 0) {
      parts.push(years === 1 ? t('scheduledExports.time.years_one', { count: years }) : t('scheduledExports.time.years_other', { count: years }));
    }
    if (months > 0) {
      parts.push(t('scheduledExports.time.months', { count: months }));
    }
    if (days > 0) {
      parts.push(days === 1 ? t('scheduledExports.time.days_one', { count: days }) : t('scheduledExports.time.days_other', { count: days }));
    }
    
    // Always show hours:minutes:seconds if there are no years/months/days, or if we're close
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    if (parts.length > 0) {
      parts.push(timeString);
      return parts.join(', ');
    } else {
      return timeString;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const isUrgent = (executionTime: number) => {
    const now = Date.now();
    const diff = executionTime - now;
    return diff > 0 && diff < 60000; // Less than 60 seconds
  };

  const formatDuration = (durationMs: number) => {
    let remaining = durationMs;
    
    const years = Math.floor(remaining / (365 * 24 * 60 * 60 * 1000));
    remaining -= years * 365 * 24 * 60 * 60 * 1000;
    
    const months = Math.floor(remaining / (30 * 24 * 60 * 60 * 1000));
    remaining -= months * 30 * 24 * 60 * 60 * 1000;
    
    const weeks = Math.floor(remaining / (7 * 24 * 60 * 60 * 1000));
    remaining -= weeks * 7 * 24 * 60 * 60 * 1000;
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    remaining -= days * 24 * 60 * 60 * 1000;
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    remaining -= hours * 60 * 60 * 1000;
    
    const minutes = Math.floor(remaining / (60 * 1000));
    
    const parts = [];
    if (years > 0) parts.push(years === 1 ? t('scheduledExports.time.years_one', { count: years }) : t('scheduledExports.time.years_other', { count: years }));
    if (months > 0) parts.push(t('scheduledExports.time.months', { count: months }));
    if (weeks > 0) parts.push(weeks === 1 ? t('scheduledExports.time.weeks_one', { count: weeks }) : t('scheduledExports.time.weeks_other', { count: weeks }));
    if (days > 0) parts.push(days === 1 ? t('scheduledExports.time.days_one', { count: days }) : t('scheduledExports.time.days_other', { count: days }));
    if (hours > 0) parts.push(hours === 1 ? t('scheduledExports.time.hours_one', { count: hours }) : t('scheduledExports.time.hours_other', { count: hours }));
    if (minutes > 0) parts.push(t('scheduledExports.time.minutes', { count: minutes }));

    return parts.length > 0 ? parts.join(', ') : t('scheduledExports.time.minutes', { count: 0 });
  };

  const resetTimer = async (scheduleId: string, originalDurationMs: number) => {
    if (!confirm(t('scheduledExports.messages.resetTimerConfirm'))) return;

    setIsLoading(true);
    toast.error(null);

    try {
      const now = Date.now();
      const newExecutionTime = now + originalDurationMs;

      const response = await fetch(`${serverUrl}/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ execution_time: newExecutionTime })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('scheduledExports.messages.timerResetSuccess'));
        await loadSchedules();
      } else {
        toast.error(data.error || t('scheduledExports.messages.resetTimerFailed'));
      }
    } catch (error) {
      console.error('Failed to reset timer:', error);
      toast.error(t('scheduledExports.messages.resetTimerNetworkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5" />;
      case 'running':
        return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes flashRed {
          0% { color: #000000; }
          5% { color: #dc2626; }
          100% { color: #000000; }
        }
        .urgent-countdown {
          animation: flashRed 1s ease-in-out infinite;
        }
      `}</style>
      <div
        className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 ${
          isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
        }`}
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col ${
            isClosing ? 'animate-slideDown' : 'animate-slideUp'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            <ClockIcon className="inline-block w-6 h-6 mr-2" />
            {t('scheduledExports.modal.title')}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon width={24} />
          </button>
        </div>

        {view === 'instructional' && (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <ClockIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {t('scheduledExports.instructional.header')}
                </h3>
                <p className="text-gray-600">
                  {t('scheduledExports.instructional.subtitle')}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">1</span>
                  {t('scheduledExports.instructional.step1Title')}
                </h4>
                <p className="text-sm text-gray-700 ml-8" dangerouslySetInnerHTML={{ __html: t('scheduledExports.instructional.step1Description') }} />

                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">2</span>
                  {t('scheduledExports.instructional.step2Title')}
                </h4>
                <p className="text-sm text-gray-700 ml-8" dangerouslySetInnerHTML={{ __html: t('scheduledExports.instructional.step2Description') }} />
                <ul className="text-sm text-gray-700 ml-8 list-disc list-inside space-y-1 mt-1">
                  <li>{t('scheduledExports.instructional.step2Bullet1')}</li>
                  <li>{t('scheduledExports.instructional.step2Bullet2')}</li>
                </ul>

                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">3</span>
                  {t('scheduledExports.instructional.step3Title')}
                </h4>
                <p className="text-sm text-gray-700 ml-8">
                  {t('scheduledExports.instructional.step3Description')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onOpenSettings?.('scheduledExports');
                    setIsClosing(true);
                    // handleClose();
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Cog6ToothIcon width={20} />
                  <span>{t('scheduledExports.instructional.goToSettings')}</span>
                </button>

                {/* Quick Generate API Key - Only shown when Server URL is configured */}
                {serverUrl && !apiKey && (
                  <div className="relative group">
                    <button
                      onClick={handleGenerateApiKeyClick}
                      disabled={isGeneratingApiKey || !serverUrl.trim()}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!serverUrl.trim() ? t('scheduledExports.messages.serverUrlRequired') : t('scheduledExports.instructional.generateApiKey')}
                    >
                      <KeyIcon width={20} />
                      <span>{isGeneratingApiKey ? t('scheduledExports.instructional.generating') : t('scheduledExports.instructional.generateApiKey')}</span>
                    </button>
                    {!serverUrl.trim() && !isGeneratingApiKey && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                          {t('scheduledExports.instructional.serverUrlRequired')}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('scheduledExports.instructional.setupLater')}
                </button>
              </div>

              {/* Help Link */}
              <div className="text-center">
                <a
                  href="https://github.com/jezzlucena/caderno/blob/main/SCHEDULED_EXPORTS_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                >
                  {t('scheduledExports.instructional.viewGuide')}
                </a>
              </div>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">
                {schedules.length === 1
                  ? t('scheduledExports.list.scheduleCount_one', { count: schedules.length })
                  : t('scheduledExports.list.scheduleCount_other', { count: schedules.length })
                }
              </p>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                disabled={isLoading}
              >
                <PlusIcon width={18} />
                {t('scheduledExports.list.newSchedule')}
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">{t('scheduledExports.list.loading')}</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>{t('scheduledExports.list.noSchedules')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer"
                    onClick={() => loadScheduleDetails(schedule.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{schedule.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${schedule.executed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                            {schedule.executed ? t('scheduledExports.list.executed') : t('scheduledExports.list.pending')}
                          </span>
                        </div>
                        <p className={`text-sm text-gray-600 mt-1 font-mono ${!schedule.executed && isUrgent(schedule.execution_time) ? 'urgent-countdown' : ''}`}>
                          {schedule.executed ? t('scheduledExports.list.executedOn', { date: formatDate(schedule.execution_time) }) : formatCountdown(schedule.execution_time)}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-2">
                          <span>📧 {schedule.recipients.length === 1 ? t('scheduledExports.list.recipientCount_one', { count: schedule.recipients.length }) : t('scheduledExports.list.recipientCount_other', { count: schedule.recipients.length })}</span>
                          <span>📄 {(schedule.entry_count || 0) === 1 ? t('scheduledExports.list.entryCount_one', { count: schedule.entry_count || 0 }) : t('scheduledExports.list.entryCount_other', { count: schedule.entry_count || 0 })}</span>
                          {schedule.original_duration_ms && <span>⏱️ {t('scheduledExports.list.original', { duration: formatDuration(schedule.original_duration_ms) })}</span>}
                          {schedule.executed_at && <span>{t('scheduledExports.list.executedAt', { date: formatDate(schedule.executed_at) })}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {!schedule.executed && (
                          <>
                            <button
                              onClick={() => {
                                setEditingScheduleId(schedule.id);
                                // Pre-fill form with schedule data
                                setScheduleName(schedule.name);
                                setSelectionType(schedule.entry_selection_type);
                                if (schedule.date_range_start) setDateRangeStart(new Date(schedule.date_range_start).toISOString().split('T')[0]);
                                if (schedule.date_range_end) setDateRangeEnd(new Date(schedule.date_range_end).toISOString().split('T')[0]);
                                setRecipients(schedule.recipients.map(r => ({ type: r.type, value: r.value })));
                                
                                // Calculate duration from execution time
                                const now = Date.now();
                                const diff = schedule.execution_time - now;
                                if (diff > 0) {
                                  let remainingMs = diff;
                                  const years = Math.floor(remainingMs / (365 * 24 * 60 * 60 * 1000));
                                  remainingMs -= years * 365 * 24 * 60 * 60 * 1000;
                                  const months = Math.floor(remainingMs / (30 * 24 * 60 * 60 * 1000));
                                  remainingMs -= months * 30 * 24 * 60 * 60 * 1000;
                                  const weeks = Math.floor(remainingMs / (7 * 24 * 60 * 60 * 1000));
                                  remainingMs -= weeks * 7 * 24 * 60 * 60 * 1000;
                                  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
                                  remainingMs -= days * 24 * 60 * 60 * 1000;
                                  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
                                  remainingMs -= hours * 60 * 60 * 1000;
                                  const minutes = Math.floor(remainingMs / (60 * 1000));
                                  
                                  setDurationYears(years);
                                  setDurationMonths(months);
                                  setDurationWeeks(weeks);
                                  setDurationDays(days);
                                  setDurationHours(hours);
                                  setDurationMinutes(Math.max(1, minutes));
                                }
                                
                                setView('edit');
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title={t('scheduledExports.list.edit')}
                              disabled={isLoading}
                            >
                              <PencilIcon width={18} />
                            </button>
                            {schedule.original_duration_ms && (
                              <button
                                onClick={() => resetTimer(schedule.id, schedule.original_duration_ms!)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title={t('scheduledExports.list.resetTimer', { duration: formatDuration(schedule.original_duration_ms) })}
                                disabled={isLoading}
                              >
                                <ArrowUturnLeftIcon width={18} />
                              </button>
                            )}
                            <button
                              onClick={() => executeSchedule(schedule.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title={t('scheduledExports.list.runNow')}
                              disabled={isLoading}
                            >
                              <PlayIcon width={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={t('scheduledExports.list.delete')}
                          disabled={isLoading}
                        >
                          <TrashIcon width={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'detail' && selectedSchedule && (
          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => setView('list')}
              className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1 mb-4 transition-colors"
            >
              {t('scheduledExports.detail.backToList')}
            </button>

            {/* Header Card */}
            <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-lg p-4 mb-4 border-2 border-indigo-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">{selectedSchedule.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${selectedSchedule.executed ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                      {selectedSchedule.executed ? `✓ ${t('scheduledExports.list.executed')}` : `⏳ ${t('scheduledExports.list.pending')}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Countdown/Execution Display */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mt-3">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide mb-1">
                  {selectedSchedule.executed ? t('scheduledExports.detail.executionTime') : t('scheduledExports.detail.timeRemaining')}
                </p>
                <p className={`text-lg font-bold font-mono ${!selectedSchedule.executed && isUrgent(selectedSchedule.execution_time) ? 'urgent-countdown' : 'text-gray-900'}`}>
                  {selectedSchedule.executed ? formatDate(selectedSchedule.execution_time) : formatCountdown(selectedSchedule.execution_time)}
                </p>
                {selectedSchedule.original_duration_ms && !selectedSchedule.executed && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    {t('scheduledExports.detail.originalDuration', { duration: formatDuration(selectedSchedule.original_duration_ms) })}
                  </p>
                )}
              </div>
            </div>

            {/* Details Grid - Responsive Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {/* Entry Selection Tile */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-3 hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-indigo-100 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-sm">📄</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{t('scheduledExports.detail.entrySelection')}</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize truncate">{selectedSchedule.entry_selection_type.replace('_', ' ')}</p>
                  </div>
                </div>
                {selectedSchedule.entry_count !== undefined && (
                  <p className="text-xs text-gray-600 ml-9">
                    {selectedSchedule.entry_count === 1 ? t('scheduledExports.list.entryCount_one', { count: selectedSchedule.entry_count }) : t('scheduledExports.list.entryCount_other', { count: selectedSchedule.entry_count })}
                  </p>
                )}
              </div>

              {/* Recipients Tile */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-3 hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-purple-100 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-sm">📧</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{t('scheduledExports.detail.recipients')}</p>
                    <p className="text-sm font-semibold text-gray-900">{t('scheduledExports.detail.recipientsConfigured', { count: selectedSchedule.recipients.length })}</p>
                  </div>
                </div>
              </div>

              {/* Scheduled For Tile */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-3 hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-sm">📅</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{t('scheduledExports.detail.scheduledFor')}</p>
                    <p className="text-xs font-medium text-gray-900 truncate">{formatDate(selectedSchedule.execution_time)}</p>
                  </div>
                </div>
              </div>

              {/* Executed At Tile (if applicable) */}
              {selectedSchedule.executed_at && (
                <div className="bg-white border-2 border-gray-300 rounded-lg p-3 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-green-100 rounded-md flex items-center justify-center shrink-0">
                      <span className="text-sm">✓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{t('scheduledExports.detail.executedAt')}</p>
                      <p className="text-xs font-medium text-gray-900 truncate">{formatDate(selectedSchedule.executed_at)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recipients List Tile */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">{t('scheduledExports.detail.recipients')}</h4>
              <div className="space-y-2">
                {selectedSchedule.recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${recipient.type === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {recipient.type === 'email' ? '📧' : '📱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-gray-500 uppercase">{recipient.type}</p>
                      <p className="text-xs font-medium text-gray-900 truncate">{recipient.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution History Tile */}
            {selectedSchedule.logs && selectedSchedule.logs.length > 0 && (
              <div className="bg-white border-2 border-gray-300 rounded-lg p-3 mb-4">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">{t('scheduledExports.detail.executionHistory')}</h4>
                <div className="space-y-2">
                  {selectedSchedule.logs.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(log.status)}`}>
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                          <span className="text-xs text-gray-600">
                            {formatDate(log.started_at)}
                          </span>
                        </div>
                        {log.completed_at && (
                          <span className="text-[10px] font-medium text-gray-500 bg-white px-1.5 py-0.5 rounded whitespace-nowrap">
                            ⏱ {Math.round((log.completed_at - log.started_at) / 1000)}s
                          </span>
                        )}
                      </div>
                      {log.status === 'success' && (
                        <div className="flex items-center gap-3 text-xs text-gray-700">
                          <span>📄 {log.entry_count}</span>
                          <span>📧 {log.recipients_sent}</span>
                        </div>
                      )}
                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-xs text-red-700 font-medium">⚠️ {log.error_message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white pt-3 pb-2 border-t-2 border-gray-300">
              <div className="flex gap-2">
                {!selectedSchedule.executed && (
                  <>
                    <button
                      onClick={() => executeSchedule(selectedSchedule.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
                      disabled={isLoading}
                    >
                      <PlayIcon width={16} />
                      {t('scheduledExports.detail.executeNow')}
                    </button>
                    {selectedSchedule.original_duration_ms && (
                      <button
                        onClick={() => resetTimer(selectedSchedule.id, selectedSchedule.original_duration_ms!)}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
                        disabled={isLoading}
                        title={t('scheduledExports.list.resetTimer', { duration: formatDuration(selectedSchedule.original_duration_ms) })}
                      >
                        <ArrowUturnLeftIcon width={16} />
                        {t('scheduledExports.detail.reset')}
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => deleteSchedule(selectedSchedule.id)}
                  className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
                  disabled={isLoading}
                >
                  <TrashIcon width={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <button
              onClick={() => setView('list')}
              className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
            >
              {t('scheduledExports.form.backToList')}
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scheduledExports.form.scheduleNameLabel')}
              </label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder={t('scheduledExports.form.scheduleNamePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scheduledExports.form.whenToRunLabel')}
              </label>
              <p className="text-xs text-gray-500 mb-3">
                {t('scheduledExports.form.whenToRunDescription')}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.yearsLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={durationYears}
                    onChange={(e) => setDurationYears(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.monthsLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Math.max(0, Math.min(12, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.weeksLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Math.max(0, Math.min(4, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.daysLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(0, Math.min(7, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.hoursLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.minutesLabel')}</label>
                  <input
                    type="number"
                    min="1"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(1, Math.min(59, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scheduledExports.form.entrySelectionLabel')}
              </label>
              <select
                value={selectionType}
                onChange={(e) => setSelectionType(e.target.value as 'all' | 'specific' | 'date_range')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">{t('scheduledExports.form.allEntries')}</option>
                <option value="date_range">{t('scheduledExports.form.dateRange')}</option>
              </select>
            </div>

            {selectionType === 'date_range' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduledExports.form.startDate')}
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduledExports.form.endDate')}
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scheduledExports.form.passphraseLabel')}
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={t('scheduledExports.form.passphrasePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('scheduledExports.form.passphraseNote')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scheduledExports.form.recipientsLabel')}
              </label>
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={recipient.type}
                    onChange={(e) => {
                      const newRecipients = [...recipients];
                      newRecipients[index].type = e.target.value as 'email' | 'sms';
                      setRecipients(newRecipients);
                    }}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="email">{t('scheduledExports.form.emailType')}</option>
                    <option value="sms">{t('scheduledExports.form.smsType')}</option>
                  </select>
                  <input
                    type={recipient.type === 'email' ? 'email' : 'tel'}
                    value={recipient.value}
                    onChange={(e) => {
                      const newRecipients = [...recipients];
                      newRecipients[index].value = e.target.value;
                      setRecipients(newRecipients);
                    }}
                    placeholder={recipient.type === 'email' ? t('scheduledExports.form.emailPlaceholder') : t('scheduledExports.form.smsPlaceholder')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {recipients.length > 1 && (
                    <button
                      onClick={() => setRecipients(recipients.filter((_, i) => i !== index))}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon width={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setRecipients([...recipients, { type: 'email', value: '' }])}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <PlusIcon width={16} />
                {t('scheduledExports.form.addRecipient')}
              </button>
            </div>

            <button
              onClick={createSchedule}
              disabled={!scheduleName.trim() || recipients.filter(r => r.value.trim()).length === 0 || isLoading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('scheduledExports.form.creating') : t('scheduledExports.form.createButton')}
            </button>
          </div>
        )}

        {view === 'edit' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <button
              onClick={() => {
                resetForm();
                setEditingScheduleId(null);
                setView('list');
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
            >
              {t('scheduledExports.form.backToList')}
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800" dangerouslySetInnerHTML={{ __html: t('scheduledExports.form.editingNotice') }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scheduledExports.form.scheduleNameLabel')}
              </label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder={t('scheduledExports.form.scheduleNamePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scheduledExports.form.whenToRunLabel')}
              </label>
              <p className="text-xs text-gray-500 mb-3">
                {t('scheduledExports.form.whenToRunDescription')}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.yearsLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={durationYears}
                    onChange={(e) => setDurationYears(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.monthsLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Math.max(0, Math.min(12, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.weeksLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Math.max(0, Math.min(4, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.daysLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(0, Math.min(7, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.hoursLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('scheduledExports.form.minutesLabel')}</label>
                  <input
                    type="number"
                    min="1"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(1, Math.min(59, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scheduledExports.form.entrySelectionLabel')}
              </label>
              <select
                value={selectionType}
                onChange={(e) => setSelectionType(e.target.value as 'all' | 'specific' | 'date_range')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">{t('scheduledExports.form.allEntries')}</option>
                <option value="date_range">{t('scheduledExports.form.dateRange')}</option>
              </select>
            </div>

            {selectionType === 'date_range' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduledExports.form.startDate')}
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('scheduledExports.form.endDate')}
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scheduledExports.form.passphraseLabel')}
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={t('scheduledExports.form.passphrasePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('scheduledExports.form.passphraseUpdateNote')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scheduledExports.form.recipientsLabel')}
              </label>
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={recipient.type}
                    onChange={(e) => {
                      const newRecipients = [...recipients];
                      newRecipients[index].type = e.target.value as 'email' | 'sms';
                      setRecipients(newRecipients);
                    }}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="email">{t('scheduledExports.form.emailType')}</option>
                    <option value="sms">{t('scheduledExports.form.smsType')}</option>
                  </select>
                  <input
                    type={recipient.type === 'email' ? 'email' : 'tel'}
                    value={recipient.value}
                    onChange={(e) => {
                      const newRecipients = [...recipients];
                      newRecipients[index].value = e.target.value;
                      setRecipients(newRecipients);
                    }}
                    placeholder={recipient.type === 'email' ? t('scheduledExports.form.emailPlaceholder') : t('scheduledExports.form.smsPlaceholder')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {recipients.length > 1 && (
                    <button
                      onClick={() => setRecipients(recipients.filter((_, i) => i !== index))}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon width={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setRecipients([...recipients, { type: 'email', value: '' }])}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <PlusIcon width={16} />
                {t('scheduledExports.form.addRecipient')}
              </button>
            </div>

            <button
              onClick={updateSchedule}
              disabled={!scheduleName.trim() || recipients.filter(r => r.value.trim()).length === 0 || isLoading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('scheduledExports.form.updating') : t('scheduledExports.form.updateButton')}
            </button>
          </div>
        )}
        </div>
      </div>
      
      {/* API Key Confirmation Modal */}
      <ApiKeyConfirmationModal 
        isOpen={showApiKeyConfirmation}
        onClose={() => setShowApiKeyConfirmation(false)}
        onConfirm={handleConfirmApiKeyGeneration}
      />
    </>
  );
}
