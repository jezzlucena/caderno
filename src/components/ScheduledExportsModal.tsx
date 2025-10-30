import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  ClockIcon, 
  PlusIcon, 
  TrashIcon, 
  PlayIcon, 
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useJournalStore, useSettingsStore } from '../store/useStore';

interface Schedule {
  id: string;
  name: string;
  cron_expression: string;
  enabled: boolean;
  entry_selection_type: 'all' | 'specific' | 'date_range';
  entry_ids?: string[];
  date_range_start?: number;
  date_range_end?: number;
  recipients: Recipient[];
  last_run?: number;
  next_run?: number;
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
  const { entries } = useJournalStore();
  const { scheduledExports } = useSettingsStore();
  const [isClosing, setIsClosing] = useState(false);
  const [view, setView] = useState<'instructional' | 'list' | 'create' | 'detail'>('instructional');
  
  // Server configuration from settings
  const serverUrl = scheduledExports.serverUrl;
  const apiKey = scheduledExports.apiKey;
  
  // Schedules
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Ref for modal container to enable auto-scroll to messages
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Create schedule form
  const [scheduleName, setScheduleName] = useState('');
  const [cronExpression, setCronExpression] = useState('0 9 * * 1');
  const [selectionType, setSelectionType] = useState<'all' | 'specific' | 'date_range'>('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [recipients, setRecipients] = useState<{ type: 'email' | 'sms'; value: string }[]>([
    { type: 'email', value: '' }
  ]);

  useEffect(() => {
    // Check if server is configured
    if (!serverUrl || !apiKey) {
      setView('instructional');
    } else {
      testConnection();
    }
  }, [serverUrl, apiKey]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // Auto-scroll to top when error or success message appears
  useEffect(() => {
    if ((error || successMessage) && modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error, successMessage]);

  const testConnection = async () => {
    try {
      const response = await fetch(`${serverUrl}/health`);
      
      if (response.ok) {
        loadSchedules();
      } else {
        setError('Unable to connect to server. Please check your configuration.');
        setView('instructional');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setError('Server connection failed. Make sure the server is running.');
      setView('instructional');
    }
  };

  const loadSchedules = async () => {
    setIsLoading(true);
    setError(null);
    
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
          setError(data.error || 'Failed to load schedules');
        }
      } else if (response.status === 401) {
        setError('Invalid API key. Please check your settings.');
        setView('instructional');
      } else {
        setError('Failed to load schedules. Server returned an error.');
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
      setError('Network error. Please check your connection and server URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadScheduleDetails = async (scheduleId: string) => {
    setIsLoading(true);
    setError(null);
    
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
          setError(data.error || 'Failed to load schedule details');
        }
      } else {
        setError('Failed to load schedule details');
      }
    } catch (error) {
      console.error('Failed to load schedule details:', error);
      setError('Network error while loading schedule details');
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!scheduleName.trim()) {
      setError('Schedule name is required');
      return;
    }

    if (!passphrase.trim()) {
      setError('Encryption passphrase is required');
      return;
    }

    const validRecipients = recipients.filter(r => r.value.trim());
    if (validRecipients.length === 0) {
      setError('At least one recipient is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const scheduleData = {
        name: scheduleName,
        cron_expression: cronExpression,
        entry_selection_type: selectionType,
        date_range_start: selectionType === 'date_range' && dateRangeStart ? new Date(dateRangeStart).getTime() : undefined,
        date_range_end: selectionType === 'date_range' && dateRangeEnd ? new Date(dateRangeEnd).getTime() : undefined,
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
        setSuccessMessage('Schedule created successfully!');
        await loadSchedules();
        resetForm();
      } else {
        setError(data.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      setError('Network error. Failed to create schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/api/schedules/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Schedule deleted successfully');
        await loadSchedules();
        if (selectedSchedule?.id === id) {
          setSelectedSchedule(null);
          setView('list');
        }
      } else {
        setError(data.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      setError('Network error. Failed to delete schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeSchedule = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/api/schedules/${id}/execute`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Schedule execution started! Check your email shortly.');
        // Reload schedule details if viewing details
        if (selectedSchedule?.id === id) {
          setTimeout(() => loadScheduleDetails(id), 2000);
        }
      } else {
        setError(data.error || 'Failed to execute schedule');
      }
    } catch (error) {
      console.error('Failed to execute schedule:', error);
      setError('Network error. Failed to execute schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleScheduleEnabled = async (id: string, enabled: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/api/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ enabled })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Schedule ${enabled ? 'enabled' : 'disabled'} successfully`);
        await loadSchedules();
      } else {
        setError(data.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      setError('Network error. Failed to update schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setScheduleName('');
    setCronExpression('0 9 * * 1');
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

  const formatCronExpression = (cron: string) => {
    const presets: Record<string, string> = {
      '0 9 * * 1': 'Every Monday at 9 AM',
      '0 0 1 * *': 'First day of each month',
      '0 12 * * *': 'Every day at noon',
      '0 */6 * * *': 'Every 6 hours'
    };
    return presets[cron] || cron;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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
            Scheduled Exports
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon width={24} />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-green-400 hover:text-green-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {view === 'instructional' && (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <ClockIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Set Up Scheduled Exports
                </h3>
                <p className="text-gray-600">
                  Automate your journal exports with scheduled PDF generation and delivery
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">1</span>
                  Configure Server Connection
                </h4>
                <p className="text-sm text-gray-700 ml-8">
                  Go to <strong>Settings → Scheduled Exports</strong> to enter your server URL and API key
                </p>

                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">2</span>
                  Set Up Your Server
                </h4>
                <div className="text-sm text-gray-700 ml-8 space-y-2">
                  <p>If you haven't set up your server yet:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Navigate to the <code className="bg-white px-2 py-0.5 rounded">caderno/server</code> folder</li>
                    <li>Run <code className="bg-white px-2 py-0.5 rounded">npm install</code></li>
                    <li>Configure your <code className="bg-white px-2 py-0.5 rounded">.env</code> file with SMTP settings</li>
                    <li>Start the server with <code className="bg-white px-2 py-0.5 rounded">npm run dev</code></li>
                  </ul>
                </div>

                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">3</span>
                  Generate API Key
                </h4>
                <div className="text-sm text-gray-700 ml-8">
                  <p className="mb-2">Run this command to generate your API key:</p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    curl -X POST http://localhost:3001/api/auth/register
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (onOpenSettings) {
                      onOpenSettings('scheduledExports');
                    }
                    handleClose();
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Cog6ToothIcon width={20} />
                  <span>Go to Settings to Configure</span>
                </button>
                
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  I'll Set This Up Later
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
                  View Full Setup Guide →
                </a>
              </div>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">
                {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured
              </p>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                disabled={isLoading}
              >
                <PlusIcon width={18} />
                New Schedule
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No schedules yet. Create one to get started!</p>
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
                          <span className={`px-2 py-0.5 text-xs rounded-full ${schedule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {schedule.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCronExpression(schedule.cron_expression)}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-2">
                          <span>📧 {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}</span>
                          <span>📝 {schedule.entry_selection_type}</span>
                          {schedule.last_run && <span>Last run: {formatDate(schedule.last_run)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleScheduleEnabled(schedule.id, !schedule.enabled)}
                          className={`p-2 rounded transition-colors ${schedule.enabled ? 'text-gray-600 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'}`}
                          title={schedule.enabled ? 'Disable' : 'Enable'}
                          disabled={isLoading}
                        >
                          <ClockIcon width={18} />
                        </button>
                        <button
                          onClick={() => executeSchedule(schedule.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Run now"
                          disabled={isLoading}
                        >
                          <PlayIcon width={18} />
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
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
          <div className="flex-1 overflow-y-auto space-y-4">
            <button
              onClick={() => setView('list')}
              className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
            >
              ← Back to list
            </button>

            <div className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedSchedule.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatCronExpression(selectedSchedule.cron_expression)}
                  </p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${selectedSchedule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {selectedSchedule.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Entry Selection</p>
                <p className="text-gray-800">{selectedSchedule.entry_selection_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recipients</p>
                <p className="text-gray-800">{selectedSchedule.recipients.length} configured</p>
              </div>
              {selectedSchedule.last_run && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Run</p>
                  <p className="text-gray-800">{formatDate(selectedSchedule.last_run)}</p>
                </div>
              )}
              {selectedSchedule.next_run && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Next Run</p>
                  <p className="text-gray-800">{formatDate(selectedSchedule.next_run)}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Recipients</h4>
              <div className="space-y-1">
                {selectedSchedule.recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {recipient.type}
                    </span>
                    <span className="text-gray-700">{recipient.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedSchedule.logs && selectedSchedule.logs.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Execution History</h4>
                <div className="space-y-2">
                  {selectedSchedule.logs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDate(log.started_at)}
                          </span>
                        </div>
                        {log.completed_at && (
                          <span className="text-xs text-gray-500">
                            Duration: {Math.round((log.completed_at - log.started_at) / 1000)}s
                          </span>
                        )}
                      </div>
                      {log.status === 'success' && (
                        <div className="mt-2 text-sm text-gray-600">
                          Sent {log.entry_count} entries to {log.recipients_sent} recipients
                        </div>
                      )}
                      {log.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {log.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => executeSchedule(selectedSchedule.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                disabled={isLoading}
              >
                <PlayIcon width={18} />
                Execute Now
              </button>
              <button
                onClick={() => toggleScheduleEnabled(selectedSchedule.id, !selectedSchedule.enabled)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                {selectedSchedule.enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => deleteSchedule(selectedSchedule.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <TrashIcon width={20} />
              </button>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <button
              onClick={() => setView('list')}
              className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
            >
              ← Back to list
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Name
              </label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="Weekly Export"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="0 9 * * 1">Every Monday at 9 AM</option>
                <option value="0 0 1 * *">First day of each month</option>
                <option value="0 12 * * *">Every day at noon</option>
                <option value="0 */6 * * *">Every 6 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Selection
              </label>
              <select
                value={selectionType}
                onChange={(e) => setSelectionType(e.target.value as 'all' | 'specific' | 'date_range')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All entries</option>
                <option value="date_range">Date range</option>
              </select>
            </div>

            {selectionType === 'date_range' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
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
                    End Date
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
                Encryption Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter a secure passphrase"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                This passphrase will be used to encrypt your journal entries. Keep it secure!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients
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
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                  <input
                    type={recipient.type === 'email' ? 'email' : 'tel'}
                    value={recipient.value}
                    onChange={(e) => {
                      const newRecipients = [...recipients];
                      newRecipients[index].value = e.target.value;
                      setRecipients(newRecipients);
                    }}
                    placeholder={recipient.type === 'email' ? 'user@example.com' : '+1234567890'}
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
                Add recipient
              </button>
            </div>

            <button
              onClick={createSchedule}
              disabled={!scheduleName.trim() || recipients.filter(r => r.value.trim()).length === 0 || isLoading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
