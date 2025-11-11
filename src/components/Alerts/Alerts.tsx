import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Repeat, Percent, DollarSign, Activity } from 'lucide-react';
import { Navigation } from '../shared/Navigation';
import { useToast } from '../../contexts/ToastContext';

type AlertType = 'price' | 'percentage' | 'multi-condition';
type PriceCondition = 'above' | 'below';
type PercentageCondition = 'gain' | 'loss';
type RecurringSchedule = 'once' | 'daily' | 'weekly';

interface MultiCondition {
  type: 'price' | 'volume' | 'marketCap';
  condition: 'above' | 'below';
  value: number;
}

interface PriceAlert {
  id: string;
  symbol: string;
  assetType: 'crypto' | 'stock';
  alertType: AlertType;

  // Price alerts
  targetPrice?: number;
  condition?: PriceCondition;

  // Percentage alerts
  percentageChange?: number;
  percentageCondition?: PercentageCondition;
  basePrice?: number; // Reference price for percentage calculation

  // Multi-condition alerts
  conditions?: MultiCondition[];
  conditionOperator?: 'AND' | 'OR'; // All conditions or any condition

  // Common fields
  recurring: RecurringSchedule;
  lastChecked?: string;
  triggered: boolean;
  triggeredAt?: string;
  notificationSent: boolean;
  notes?: string;
  createdAt: string;
}

export function Alerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('price');
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    assetType: 'crypto' as 'crypto' | 'stock',
    targetPrice: '',
    condition: 'above' as PriceCondition,
    percentageChange: '',
    percentageCondition: 'gain' as PercentageCondition,
    basePrice: '',
    recurring: 'once' as RecurringSchedule,
    notes: '',
  });
  const [multiConditions, setMultiConditions] = useState<MultiCondition[]>([
    { type: 'price', condition: 'above', value: 0 }
  ]);
  const [conditionOperator, setConditionOperator] = useState<'AND' | 'OR'>('AND');
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
    if (!newAlert.symbol) {
      toast.error('Please enter an asset symbol');
      return;
    }

    // Validate based on alert type
    if (alertType === 'price' && !newAlert.targetPrice) {
      toast.error('Please enter a target price');
      return;
    }

    if (alertType === 'percentage' && (!newAlert.percentageChange || !newAlert.basePrice)) {
      toast.error('Please enter percentage change and base price');
      return;
    }

    if (alertType === 'multi-condition' && multiConditions.some(c => c.value === 0)) {
      toast.error('Please fill in all condition values');
      return;
    }

    const baseAlert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol.toUpperCase(),
      assetType: newAlert.assetType,
      alertType,
      recurring: newAlert.recurring,
      triggered: false,
      notificationSent: false,
      notes: newAlert.notes,
      createdAt: new Date().toISOString(),
    };

    let alert: PriceAlert;

    switch (alertType) {
      case 'price':
        alert = {
          ...baseAlert,
          targetPrice: parseFloat(newAlert.targetPrice),
          condition: newAlert.condition,
        };
        break;

      case 'percentage':
        alert = {
          ...baseAlert,
          percentageChange: parseFloat(newAlert.percentageChange),
          percentageCondition: newAlert.percentageCondition,
          basePrice: parseFloat(newAlert.basePrice),
        };
        break;

      case 'multi-condition':
        alert = {
          ...baseAlert,
          conditions: [...multiConditions],
          conditionOperator,
        };
        break;

      default:
        toast.error('Invalid alert type');
        return;
    }

    const updatedAlerts = [...alerts, alert];
    saveAlerts(updatedAlerts);
    setShowModal(false);
    resetForm();
    toast.success('Alert created successfully');
  };

  const resetForm = () => {
    setNewAlert({
      symbol: '',
      assetType: 'crypto',
      targetPrice: '',
      condition: 'above',
      percentageChange: '',
      percentageCondition: 'gain',
      basePrice: '',
      recurring: 'once',
      notes: '',
    });
    setMultiConditions([{ type: 'price', condition: 'above', value: 0 }]);
    setConditionOperator('AND');
    setAlertType('price');
  };

  const handleDeleteAlert = (id: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== id);
    saveAlerts(updatedAlerts);
    toast.success('Alert deleted');
  };

  const handleToggleTriggered = (id: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === id
        ? {
            ...alert,
            triggered: !alert.triggered,
            triggeredAt: !alert.triggered ? new Date().toISOString() : undefined,
          }
        : alert
    );
    saveAlerts(updatedAlerts);
  };

  const addMultiCondition = () => {
    setMultiConditions([...multiConditions, { type: 'price', condition: 'above', value: 0 }]);
  };

  const removeMultiCondition = (index: number) => {
    if (multiConditions.length > 1) {
      setMultiConditions(multiConditions.filter((_, i) => i !== index));
    }
  };

  const updateMultiCondition = (index: number, field: keyof MultiCondition, value: any) => {
    const updated = [...multiConditions];
    updated[index] = { ...updated[index], [field]: value };
    setMultiConditions(updated);
  };

  // Simulated recurring check system
  useEffect(() => {
    const checkRecurringAlerts = () => {
      const now = new Date();
      const updatedAlerts = alerts.map(alert => {
        if (alert.triggered || alert.recurring === 'once') return alert;

        const lastChecked = alert.lastChecked ? new Date(alert.lastChecked) : new Date(alert.createdAt);
        const hoursSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);

        let shouldCheck = false;
        if (alert.recurring === 'daily' && hoursSinceLastCheck >= 24) {
          shouldCheck = true;
        } else if (alert.recurring === 'weekly' && hoursSinceLastCheck >= 168) {
          shouldCheck = true;
        }

        if (shouldCheck) {
          return { ...alert, lastChecked: now.toISOString() };
        }

        return alert;
      });

      if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
        saveAlerts(updatedAlerts);
      }
    };

    const interval = setInterval(checkRecurringAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [alerts]);

  const getAlertDescription = (alert: PriceAlert): string => {
    switch (alert.alertType) {
      case 'price':
        return `Price goes ${alert.condition} $${alert.targetPrice?.toLocaleString()}`;
      case 'percentage':
        return `${alert.percentageCondition === 'gain' ? 'Gains' : 'Loses'} ${alert.percentageChange}% from $${alert.basePrice}`;
      case 'multi-condition':
        const condCount = alert.conditions?.length || 0;
        return `${condCount} conditions (${alert.conditionOperator})`;
      default:
        return 'Unknown alert type';
    }
  };

  const getAlertIcon = (alert: PriceAlert) => {
    switch (alert.alertType) {
      case 'price':
        return alert.condition === 'above' ? <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" /> : <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />;
      case 'percentage':
        return <Percent className="h-8 w-8 text-purple-600 dark:text-purple-400" />;
      case 'multi-condition':
        return <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell className="h-8 w-8 text-gray-600 dark:text-gray-400" />;
    }
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const recurringAlerts = alerts.filter(a => a.recurring !== 'once');

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <Repeat className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recurring</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{recurringAlerts.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                  <div className="flex items-center gap-4 flex-1">
                    {getAlertIcon(alert)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{alert.symbol}</h3>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {alert.assetType}
                        </span>
                        {alert.recurring !== 'once' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            {alert.recurring}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getAlertDescription(alert)}
                      </p>
                      {alert.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                          {alert.notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Created: {new Date(alert.createdAt).toLocaleDateString()}
                        {alert.lastChecked && ` • Last checked: ${new Date(alert.lastChecked).toLocaleDateString()}`}
                      </p>

                      {/* Multi-condition details */}
                      {alert.alertType === 'multi-condition' && alert.conditions && (
                        <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Conditions ({alert.conditionOperator}):
                          </p>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {alert.conditions.map((cond, idx) => (
                              <li key={idx}>
                                • {cond.type} goes {cond.condition} {cond.value.toLocaleString()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleTriggered(alert.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
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
                        {getAlertDescription(alert)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Alert</h2>

            {/* Alert Type Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setAlertType('price')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  alertType === 'price'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price Alert
                </div>
              </button>
              <button
                onClick={() => setAlertType('percentage')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  alertType === 'percentage'
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Percentage Alert
                </div>
              </button>
              <button
                onClick={() => setAlertType('multi-condition')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  alertType === 'multi-condition'
                    ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Multi-Condition
                </div>
              </button>
            </div>

            <div className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asset Symbol *
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
                    Asset Type *
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
              </div>

              {/* Price Alert Fields */}
              {alertType === 'price' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Condition *
                      </label>
                      <select
                        value={newAlert.condition}
                        onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as PriceCondition })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="above">Price goes above</option>
                        <option value="below">Price goes below</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Price ($) *
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
                </>
              )}

              {/* Percentage Alert Fields */}
              {alertType === 'percentage' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Percentage Change (%) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newAlert.percentageChange}
                        onChange={(e) => setNewAlert({ ...newAlert, percentageChange: e.target.value })}
                        placeholder="e.g., 10"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Condition *
                      </label>
                      <select
                        value={newAlert.percentageCondition}
                        onChange={(e) => setNewAlert({ ...newAlert, percentageCondition: e.target.value as PercentageCondition })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="gain">Gain</option>
                        <option value="loss">Loss</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAlert.basePrice}
                      onChange={(e) => setNewAlert({ ...newAlert, basePrice: e.target.value })}
                      placeholder="e.g., 45000"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Reference price to calculate percentage from
                    </p>
                  </div>
                </>
              )}

              {/* Multi-Condition Alert Fields */}
              {alertType === 'multi-condition' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Condition Operator
                    </label>
                    <select
                      value={conditionOperator}
                      onChange={(e) => setConditionOperator(e.target.value as 'AND' | 'OR')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="AND">All conditions must be met (AND)</option>
                      <option value="OR">Any condition can be met (OR)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Conditions *
                    </label>
                    {multiConditions.map((condition, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <select
                            value={condition.type}
                            onChange={(e) => updateMultiCondition(index, 'type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="price">Price</option>
                            <option value="volume">Volume</option>
                            <option value="marketCap">Market Cap</option>
                          </select>
                          <select
                            value={condition.condition}
                            onChange={(e) => updateMultiCondition(index, 'condition', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="above">Above</option>
                            <option value="below">Below</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            value={condition.value || ''}
                            onChange={(e) => updateMultiCondition(index, 'value', parseFloat(e.target.value) || 0)}
                            placeholder="Value"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        {multiConditions.length > 1 && (
                          <button
                            onClick={() => removeMultiCondition(index)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addMultiCondition}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Add Condition
                    </button>
                  </div>
                </>
              )}

              {/* Common Fields - Recurring and Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule
                </label>
                <select
                  value={newAlert.recurring}
                  onChange={(e) => setNewAlert({ ...newAlert, recurring: e.target.value as RecurringSchedule })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="once">One-time alert</option>
                  <option value="daily">Check daily</option>
                  <option value="weekly">Check weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={newAlert.notes}
                  onChange={(e) => setNewAlert({ ...newAlert, notes: e.target.value })}
                  placeholder="Add notes about this alert..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
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
