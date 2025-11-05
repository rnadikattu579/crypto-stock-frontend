import { User, Bell, Shield, Download, Moon, Sun } from 'lucide-react';
import { Navigation } from '../shared/Navigation';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

export function Settings() {
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    weeklyReports: true,
    portfolioUpdates: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>
        {/* Profile Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition-colors">
              Update Profile
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Price Alerts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when assets reach target prices</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, priceAlerts: !notifications.priceAlerts })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.priceAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.priceAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Weekly Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive weekly portfolio performance summaries</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, weeklyReports: !notifications.weeklyReports })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.weeklyReports ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Portfolio Updates</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time updates on portfolio changes</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, portfolioUpdates: !notifications.portfolioUpdates })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.portfolioUpdates ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.portfolioUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            {darkMode ? <Moon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> : <Sun className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Toggle dark mode interface</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data & Privacy</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
              <Download className="h-5 w-5" />
              Export All Data
            </button>
            <button className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg transition-colors">
              Delete Account
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Deleting your account will permanently remove all your data. This action cannot be undone.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
