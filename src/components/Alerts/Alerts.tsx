import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';
import { Navigation } from '../shared/Navigation';
import { useToast } from '../../contexts/ToastContext';

interface PriceAlert {
  id: string;
  symbol: string;
  assetType: 'crypto' | 'stock';
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice?: number;
  triggered: boolean;
  createdAt: string;
}

export function Alerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    assetType: 'crypto' as 'crypto' | 'stock',
    targetPrice: '',
    condition: 'above' as 'above' | 'below',
  });
  const toast = useToast();

  useEffect(() => {
    // Load alerts from localStorage
    const savedAlerts = localStorage.getItem('priceAlerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  const saveAlerts = (updatedAlerts: PriceAlert[]) => {
    localStorage.setItem('priceAlerts', JSON.stringify(updatedAlerts));
    setAlerts(updatedAlerts);
  };

  const handleCreateAlert = () => {
    if (!newAlert.symbol || !newAlert.targetPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol.toUpperCase(),
      assetType: newAlert.assetType,
      targetPrice: parseFloat(newAlert.targetPrice),
      condition: newAlert.condition,
      triggered: false,
      createdAt: new Date().toISOString(),
    };

    const updatedAlerts = [...alerts, alert];
    saveAlerts(updatedAlerts);
    setShowModal(false);
    setNewAlert({
      symbol: '',
      assetType: 'crypto',
      targetPrice: '',
      condition: 'above',
    });
    toast.success('Price alert created successfully');
  };

  const handleDeleteAlert = (id: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== id);
    saveAlerts(updatedAlerts);
    toast.success('Alert deleted');
  };

  const handleToggleTriggered = (id: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === id ? { ...alert, triggered: !alert.triggered } : alert
    );
    saveAlerts(updatedAlerts);
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Price Alerts</h1>
            <p className="text-gray-600 dark:text-gray-400">Get notified when assets reach your target prices</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Create Alert
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeAlerts.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Triggered</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{triggeredAlerts.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alerts</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{alerts.length}</p>
          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Alerts</h2>
            <div className="space-y-3">
              {activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-4">
                    {alert.condition === 'above' ? (
                      <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{alert.symbol}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Alert when price goes{' '}
                        <span className="font-semibold">{alert.condition}</span>{' '}
                        <span className="font-bold">${alert.targetPrice.toLocaleString()}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Created: {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTriggered(alert.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Mark Triggered
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Triggered Alerts</h2>
            <div className="space-y-3">
              {triggeredAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 opacity-75"
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{alert.symbol}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Target: ${alert.targetPrice.toLocaleString()} ({alert.condition})
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">✓ Triggered</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <Bell className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No alerts yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first price alert to get notified</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Alert
            </button>
          </div>
        )}
      </main>

      {/* Create Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Price Alert</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asset Symbol
                </label>
                <input
                  type="text"
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., BTC, ETH, AAPL"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asset Type
                </label>
                <select
                  value={newAlert.assetType}
                  onChange={(e) => setNewAlert({ ...newAlert, assetType: e.target.value as 'crypto' | 'stock' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="crypto">Cryptocurrency</option>
                  <option value="stock">Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                <select
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as 'above' | 'below' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                  placeholder="e.g., 50000"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
