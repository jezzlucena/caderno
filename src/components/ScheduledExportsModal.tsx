import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, PlusIcon, TrashIcon, PlayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
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
}

interface Recipient {
  id: string;
  type: 'email' | 'sms';
  value: string;
}

interface ScheduledExportsModalProps {
  onClose: () => void;
  onOpenSettings?: (screen: 'scheduledExports') => void;
}

export default function ScheduledExportsModal({ onClose, onOpenSettings }: ScheduledExportsModalProps) {
  const { entries } = useJournalStore();
  const { scheduledExports } = useSettingsStore();
  const [isClosing, setIsClosing] = useState(false);
  const [view, setView] = useState<'instructional' | 'list' | 'create'>('instructional');
  
  // Server configuration from settings
  const serverUrl = scheduledExports.serverUrl;
  const apiKey = scheduledExports.apiKey;
  
  // Schedules
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create schedule form
  const [scheduleName, setScheduleName] = useState('');
  const [cronExpression, setCronExpression] = useState('0 9 * * 1');
  const [selectionType, setSelectionType] = useState<'all' | 'specific' | 'date_range'>('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
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

  const testConnection = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/auth/verify`, {
        headers: { 'X-API-Key': apiKey }
      });
      
      if (response.ok) {
        loadSchedules();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/schedules`, {
        headers: { 'X-API-Key': apiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.data || []);
        setView('list');
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async () => {
    try {
      const scheduleData = {
        name: scheduleName,
        cron_expression: cronExpression,
        entry_selection_type: selectionType,
        date_range_start: selectionType === 'date_range' && dateRangeStart ? new Date(dateRangeStart).getTime() : undefined,
        date_range_end: selectionType === 'date_range' && dateRangeEnd ? new Date(dateRangeEnd).getTime() : undefined,
        recipients: recipients.filter(r => r.value),
        entries_data: entries,
        passphrase: 'user-passphrase-here' // TODO: Get from user
      };

      const response = await fetch(`${serverUrl}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        loadSchedules();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`${serverUrl}/api/schedules/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });

      if (response.ok) {
        loadSchedules();
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const executeSchedule = async (id: string) => {
    try {
      await fetch(`${serverUrl}/api/schedules/${id}/execute`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey }
      });
      alert('Schedule execution started! Check your email shortly.');
    } catch (error) {
      console.error('Failed to execute schedule:', error);
    }
  };

  const resetForm = () => {
    setScheduleName('');
    setCronExpression('0 9 * * 1');
    setSelectionType('all');
    setDateRangeStart('');
    setDateRangeEnd('');
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

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onClick={handleClose}
    >
      <div
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
                    <li>Navigate to the <code className="bg-white px-2 py-0.5 rounded">caderno-server</code> folder</li>
                    <li>Run <code className="bg-white px-2 py-0.5 rounded">npm install</code></li>
                    <li>Configure your <code className="bg-white px-2 py-0.5 rounded">.env</code> file</li>
                    <li>Start the server with <code className="bg-white px-2 py-0.5 rounded">npm run dev</code></li>
                  </ul>
                </div>

                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">3</span>
                  Generate API Key
                </h4>
                <div className="text-sm text-gray-700 ml-8">
                  <p className="mb-2">Run this command to generate your API key:</p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs">
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
              <p className="text-gray-600">{schedules.length} schedules configured</p>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon width={18} />
                New Schedule
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No schedules yet. Create one to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{schedule.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatCronExpression(schedule.cron_expression)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Recipients: {schedule.recipients.length} | 
                          Type: {schedule.entry_selection_type}
                          {schedule.last_run && ` | Last run: ${new Date(schedule.last_run).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => executeSchedule(schedule.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Run now"
                        >
                          <PlayIcon width={18} />
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
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

        {view === 'create' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <button
              onClick={() => setView('list')}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

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
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => setRecipients(recipients.filter((_, i) => i !== index))}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon width={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setRecipients([...recipients, { type: 'email', value: '' }])}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                + Add recipient
              </button>
            </div>

            <button
              onClick={createSchedule}
              disabled={!scheduleName || recipients.filter(r => r.value).length === 0}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Create Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
