import { useState, useEffect } from 'react';
import {
  Target,
  Calculator,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  DollarSign,
  PieChart
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Navigation } from '../shared/Navigation';
import type {
  TargetAllocation,
  RebalanceCalculation,
  RebalanceRecommendation
} from '../../types';

type TabType = 'targets' | 'calculator';

export function Rebalancing() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [loading, setLoading] = useState(true);

  // Data states
  const [targets, setTargets] = useState<TargetAllocation[]>([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [rebalanceData, setRebalanceData] = useState<RebalanceCalculation | null>(null);
  const [additionalInvestment, setAdditionalInvestment] = useState(0);

  // New target form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTarget, setNewTarget] = useState({
    asset_type: 'crypto',
    symbol: '',
    target_percentage: 0
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'targets') {
        const data = await apiService.getTargetAllocations();
        setTargets(data.targets);
        setTotalPercentage(data.total_percentage);
      } else {
        const data = await apiService.calculateRebalance(additionalInvestment);
        setRebalanceData(data);
      }
    } catch (error) {
      console.error('Failed to load data', error);
      toast.error('Failed to load rebalancing data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTarget = async () => {
    if (!newTarget.target_percentage) {
      toast.error('Please enter a target percentage');
      return;
    }

    try {
      await apiService.setTargetAllocation(
        newTarget.asset_type,
        newTarget.target_percentage,
        newTarget.symbol || undefined
      );
      toast.success('Target allocation saved');
      setShowAddForm(false);
      setNewTarget({ asset_type: 'crypto', symbol: '', target_percentage: 0 });
      loadData();
    } catch (error) {
      toast.error('Failed to save target allocation');
    }
  };

  const handleDeleteTarget = async (allocationId: string) => {
    try {
      await apiService.deleteTargetAllocation(allocationId);
      toast.success('Target allocation deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete target allocation');
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const data = await apiService.calculateRebalance(additionalInvestment);
      setRebalanceData(data);
    } catch (error) {
      toast.error('Failed to calculate rebalancing');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const tabs = [
    { id: 'calculator' as TabType, label: 'Rebalance Calculator', icon: Calculator },
    { id: 'targets' as TabType, label: 'Target Allocations', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Portfolio Rebalancing
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Set targets and get buy/sell recommendations
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-gray-700 dark:text-gray-300">Refresh</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : activeTab === 'targets' ? (
              <TargetsTab
                targets={targets}
                totalPercentage={totalPercentage}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
                newTarget={newTarget}
                setNewTarget={setNewTarget}
                onAdd={handleAddTarget}
                onDelete={handleDeleteTarget}
              />
            ) : (
              <CalculatorTab
                data={rebalanceData}
                additionalInvestment={additionalInvestment}
                setAdditionalInvestment={setAdditionalInvestment}
                onCalculate={handleCalculate}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Targets Tab Component
function TargetsTab({
  targets,
  totalPercentage,
  showAddForm,
  setShowAddForm,
  newTarget,
  setNewTarget,
  onAdd,
  onDelete
}: {
  targets: TargetAllocation[];
  totalPercentage: number;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  newTarget: { asset_type: string; symbol: string; target_percentage: number };
  setNewTarget: (target: any) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <div className="space-y-6">
      {/* Validation Banner */}
      {!isValid && targets.length > 0 && (
        <div className={`p-4 rounded-lg border ${
          totalPercentage > 100
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex gap-3">
            <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
              totalPercentage > 100 ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div>
              <p className={`font-medium ${
                totalPercentage > 100
                  ? 'text-red-900 dark:text-red-200'
                  : 'text-yellow-900 dark:text-yellow-200'
              }`}>
                {totalPercentage > 100 ? 'Allocations exceed 100%' : 'Allocations do not sum to 100%'}
              </p>
              <p className={`text-sm ${
                totalPercentage > 100
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                Current total: {totalPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Target
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Target Allocation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Asset Type
              </label>
              <select
                value={newTarget.asset_type}
                onChange={(e) => setNewTarget({ ...newTarget, asset_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="crypto">Crypto</option>
                <option value="stock">Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol (optional)
              </label>
              <input
                type="text"
                value={newTarget.symbol}
                onChange={(e) => setNewTarget({ ...newTarget, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., BTC, AAPL"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={newTarget.target_percentage}
                onChange={(e) => setNewTarget({ ...newTarget, target_percentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Targets List */}
      {targets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Target Allocations
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Set target percentages for your assets to get rebalancing recommendations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {targets.map((target) => (
            <div key={target.allocation_id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    target.asset_type === 'crypto'
                      ? 'bg-orange-100 dark:bg-orange-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Target className={`h-5 w-5 ${
                      target.asset_type === 'crypto'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {target.symbol || target.asset_type.charAt(0).toUpperCase() + target.asset_type.slice(1)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {target.asset_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {target.target_percentage}%
                  </span>
                  <button
                    onClick={() => onDelete(target.allocation_id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className={`p-4 rounded-lg ${
            isValid
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
              <span className={`text-xl font-bold ${
                isValid
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {totalPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Calculator Tab Component
function CalculatorTab({
  data,
  additionalInvestment,
  setAdditionalInvestment,
  onCalculate,
  formatCurrency
}: {
  data: RebalanceCalculation | null;
  additionalInvestment: number;
  setAdditionalInvestment: (val: number) => void;
  onCalculate: () => void;
  formatCurrency: (n: number) => string;
}) {
  if (!data || data.status !== 'calculated') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {data?.message || 'No Rebalancing Data'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Set target allocations first, then calculate your rebalancing recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Investment Input */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Investment</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                value={additionalInvestment}
                onChange={(e) => setAdditionalInvestment(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={onCalculate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Calculate
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.portfolio_value)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target Total</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(data.total_with_investment)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Max Drift</p>
          <p className={`text-xl font-bold ${
            data.needs_rebalancing ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}>
            {data.max_drift.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Status */}
      {data.needs_rebalancing ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-200">
                Rebalancing Recommended
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your portfolio has drifted more than 5% from your target allocation.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex gap-3">
            <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-200">
                Portfolio is Balanced
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your allocations are within the 5% drift threshold.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
        <div className="space-y-4">
          {data.recommendations.map((rec, idx) => (
            <RecommendationCard key={idx} rec={rec} formatCurrency={formatCurrency} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Recommendation Card
function RecommendationCard({
  rec,
  formatCurrency
}: {
  rec: RebalanceRecommendation;
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            rec.action === 'buy'
              ? 'bg-green-100 dark:bg-green-900/30'
              : rec.action === 'sell'
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {rec.action === 'buy' ? (
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : rec.action === 'sell' ? (
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <ArrowRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {rec.symbol || rec.category || rec.asset_type}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {rec.current_percentage.toFixed(2)}% <ArrowRight className="inline h-3 w-3" /> {rec.target_percentage.toFixed(2)}%
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${
            rec.action === 'buy'
              ? 'text-green-600 dark:text-green-400'
              : rec.action === 'sell'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {rec.action === 'buy' ? '+' : rec.action === 'sell' ? '-' : ''}
            {formatCurrency(Math.abs(rec.value_difference))}
          </p>
          {rec.quantity_change && rec.action !== 'hold' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {rec.action === 'buy' ? 'Buy' : 'Sell'} {Math.abs(rec.quantity_change).toFixed(4)} units
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
