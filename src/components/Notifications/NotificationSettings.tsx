import React, { useState, useEffect } from 'react';
import { Bell, Mail, CheckCircle, AlertCircle, Send, Clock, Globe } from 'lucide-react';
import notificationService, {
  type NotificationPreferences,
  type NotificationPreferencesUpdate,
} from '../../services/notificationService';

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error: any) {
      console.error('Failed to load preferences:', error);
      showMessage('error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdate = async (updates: NotificationPreferencesUpdate) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const updated = await notificationService.updatePreferences(updates);
      setPreferences(updated);
      showMessage('success', 'Preferences updated successfully');
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      showMessage('error', 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (type: any) => {
    try {
      setTestLoading(type);
      await notificationService.sendTestEmail(type);
      showMessage('success', `Test ${type.replace('_', ' ')} email sent!`);
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      showMessage('error', 'Failed to send test email');
    } finally {
      setTestLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <p className="text-gray-600 dark:text-gray-400">Failed to load notification preferences</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Email Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={preferences.email}
              onChange={(e) => handleUpdate({ email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {!preferences.email_verified && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                Email not verified. Check your inbox for verification link.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline mr-2" size={16} />
                Daily Digest Time
              </label>
              <input
                type="time"
                value={preferences.digest_time}
                onChange={(e) => handleUpdate({ digest_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="inline mr-2" size={16} />
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => handleUpdate({ timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notification Preferences
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              key: 'daily_digest_enabled',
              label: 'Daily Digest',
              description: 'Receive a daily summary of your portfolio performance',
              testType: 'daily_digest',
            },
            {
              key: 'weekly_report_enabled',
              label: 'Weekly Report',
              description: 'Get a detailed weekly analysis every Monday',
              testType: 'weekly_report',
            },
            {
              key: 'price_alerts_enabled',
              label: 'Price Alerts',
              description: 'Get notified when assets reach your target prices',
              testType: 'price_alert',
            },
            {
              key: 'milestone_enabled',
              label: 'Portfolio Milestones',
              description: 'Celebrate when your portfolio hits major milestones',
              testType: 'milestone',
            },
            {
              key: 'large_movement_enabled',
              label: 'Large Movements',
              description: 'Alert when portfolio changes more than 5% in 24h',
              testType: null,
            },
            {
              key: 'transaction_confirmation_enabled',
              label: 'Transaction Confirmations',
              description: 'Confirm when you add or remove assets',
              testType: 'transaction_confirmation',
            },
            {
              key: 'goal_progress_enabled',
              label: 'Goal Progress',
              description: 'Track progress towards your investment goals',
              testType: null,
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                      onChange={(e) =>
                        handleUpdate({ [item.key]: e.target.checked } as any)
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      disabled={saving}
                    />
                    <span className="ml-3">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
              {item.testType && (
                <button
                  onClick={() => handleTestEmail(item.testType)}
                  disabled={testLoading !== null}
                  className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 flex items-center gap-1"
                >
                  {testLoading === item.testType ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  ) : (
                    <Send size={12} />
                  )}
                  Test
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limiting Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Email Rate Limiting</p>
            <p>
              You can receive up to {preferences.max_emails_per_day} emails per day. Today you've
              received {preferences.emails_sent_today} email(s).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
