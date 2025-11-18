import { useState, useEffect } from 'react';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  ChevronDown,
  RefreshCw,
  DollarSign,
  Clock,
  Scissors
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Navigation } from '../shared/Navigation';
import type {
  TaxSummary,
  Form8949Entry,
  UnrealizedGains,
  TaxLossHarvestingOpportunity
} from '../../types';

type TabType = 'summary' | 'form8949' | 'unrealized' | 'harvesting';

export function TaxReports() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data states
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [form8949Data, setForm8949Data] = useState<{ tax_year: number; entries: Form8949Entry[] } | null>(null);
  const [unrealizedGains, setUnrealizedGains] = useState<UnrealizedGains | null>(null);
  const [harvestingData, setHarvestingData] = useState<{
    opportunities: TaxLossHarvestingOpportunity[];
    total_potential_loss: number;
  } | null>(null);

  // Available years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'summary':
          const summary = await apiService.getTaxSummary(selectedYear);
          setTaxSummary(summary);
          break;
        case 'form8949':
          const form = await apiService.getForm8949(selectedYear);
          setForm8949Data(form);
          break;
        case 'unrealized':
          const unrealized = await apiService.getUnrealizedGains();
          setUnrealizedGains(unrealized);
          break;
        case 'harvesting':
          const harvesting = await apiService.getTaxLossHarvesting();
          setHarvestingData(harvesting);
          break;
      }
    } catch (error) {
      console.error('Failed to load tax data', error);
      toast.error('Failed to load tax data');
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}.csv`);
  };

  const tabs = [
    { id: 'summary' as TabType, label: 'Tax Summary', icon: FileText },
    { id: 'form8949' as TabType, label: 'Form 8949', icon: FileText },
    { id: 'unrealized' as TabType, label: 'Unrealized', icon: TrendingUp },
    { id: 'harvesting' as TabType, label: 'Tax Loss Harvesting', icon: Scissors },
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
                Tax Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Capital gains, losses, and tax optimization
              </p>
            </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
        <nav className="flex space-x-4 min-w-max">
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
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'summary' && taxSummary && (
              <TaxSummaryTab data={taxSummary} formatCurrency={formatCurrency} />
            )}
            {activeTab === 'form8949' && form8949Data && (
              <Form8949Tab
                data={form8949Data}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onExport={() => exportToCSV(form8949Data.entries, `form-8949-${selectedYear}`)}
              />
            )}
            {activeTab === 'unrealized' && unrealizedGains && (
              <UnrealizedTab
                data={unrealizedGains}
                formatCurrency={formatCurrency}
                onExport={() => exportToCSV(unrealizedGains.holdings, 'unrealized-gains')}
              />
            )}
            {activeTab === 'harvesting' && harvestingData && (
              <HarvestingTab
                data={harvestingData}
                formatCurrency={formatCurrency}
              />
            )}
          </>
        )}
      </div>
        </div>
      </main>
    </div>
  );
}

// Tax Summary Tab Component
function TaxSummaryTab({
  data,
  formatCurrency
}: {
  data: TaxSummary;
  formatCurrency: (n: number) => string;
}) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Proceeds</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(summary.total_proceeds)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Cost Basis</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(summary.total_cost_basis)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              summary.total_net_gain_loss >= 0
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {summary.total_net_gain_loss >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Net Gain/Loss</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${
            summary.total_net_gain_loss >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(summary.total_net_gain_loss)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Wash Sales</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(summary.wash_sale_disallowed)}
          </p>
        </div>
      </div>

      {/* Short-term vs Long-term */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Short-Term (under 1 year)</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Gains</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {formatCurrency(summary.short_term.gains)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Losses</span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                -{formatCurrency(summary.short_term.losses)}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <span className="font-medium text-gray-900 dark:text-white">Net</span>
              <span className={`font-bold ${
                summary.short_term.net >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(summary.short_term.net)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Long-Term (over 1 year)</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Gains</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {formatCurrency(summary.long_term.gains)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Losses</span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                -{formatCurrency(summary.long_term.losses)}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <span className="font-medium text-gray-900 dark:text-white">Net</span>
              <span className={`font-bold ${
                summary.long_term.net >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(summary.long_term.net)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Adjusted Total */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold opacity-90">Adjusted Net Gain/Loss</h3>
            <p className="text-sm opacity-75">After wash sale adjustments</p>
          </div>
          <p className="text-3xl sm:text-4xl font-bold">
            {formatCurrency(summary.adjusted_net_gain_loss)}
          </p>
        </div>
      </div>

      {/* Transaction Count */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.transaction_count.buys}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Buys</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data.transaction_count.sells}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sells</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.transaction_count.total}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          </div>
        </div>
      </div>

      {/* Wash Sales Detail */}
      {data.wash_sales.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wash Sales Detected</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Sale Date</th>
                  <th className="pb-3 text-right">Loss Amount</th>
                  <th className="pb-3 text-right">Disallowed</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.wash_sales.map((ws, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{ws.symbol}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{ws.sale_date}</td>
                    <td className="py-3 text-right text-red-600">{formatCurrency(ws.loss_amount)}</td>
                    <td className="py-3 text-right text-orange-600">{formatCurrency(ws.disallowed_loss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Form 8949 Tab Component
function Form8949Tab({
  data,
  formatCurrency,
  formatDate,
  onExport
}: {
  data: { tax_year: number; entries: Form8949Entry[] };
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  onExport: () => void;
}) {
  const shortTermEntries = data.entries.filter(e => e.holding_period === 'short_term');
  const longTermEntries = data.entries.filter(e => e.holding_period === 'long_term');

  const renderTable = (entries: Form8949Entry[], title: string) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No entries</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-400">
                <th className="pb-3">Description</th>
                <th className="pb-3">Acquired</th>
                <th className="pb-3">Sold</th>
                <th className="pb-3 text-right">Proceeds</th>
                <th className="pb-3 text-right">Cost Basis</th>
                <th className="pb-3 text-right">Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{entry.description}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{formatDate(entry.date_acquired)}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{formatDate(entry.date_sold)}</td>
                  <td className="py-3 text-right">{formatCurrency(entry.proceeds)}</td>
                  <td className="py-3 text-right">{formatCurrency(entry.cost_basis)}</td>
                  <td className={`py-3 text-right font-medium ${
                    entry.gain_or_loss >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(entry.gain_or_loss)}
                    {entry.adjustment_code && (
                      <span className="ml-1 text-xs text-orange-600">({entry.adjustment_code})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-400">
          IRS Form 8949 - Sales and Other Dispositions of Capital Assets
        </p>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {renderTable(shortTermEntries, 'Part I - Short-Term (held 1 year or less)')}
      {renderTable(longTermEntries, 'Part II - Long-Term (held more than 1 year)')}
    </div>
  );
}

// Unrealized Gains Tab Component
function UnrealizedTab({
  data,
  formatCurrency,
  onExport
}: {
  data: UnrealizedGains;
  formatCurrency: (n: number) => string;
  onExport: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            As of {new Date(data.as_of_date).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Total */}
      <div className={`bg-gradient-to-r ${
        data.total_unrealized_gain_loss >= 0
          ? 'from-green-600 to-emerald-600'
          : 'from-red-600 to-rose-600'
      } rounded-xl p-6 text-white`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold opacity-90">Total Unrealized Gain/Loss</h3>
            <p className="text-sm opacity-75">If you sold all positions today</p>
          </div>
          <p className="text-3xl sm:text-4xl font-bold">
            {formatCurrency(data.total_unrealized_gain_loss)}
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Holdings</h3>
        {data.holdings.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No holdings</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400">
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Quantity</th>
                  <th className="pb-3 text-right">Cost Basis</th>
                  <th className="pb-3 text-right">Current Value</th>
                  <th className="pb-3 text-right">Unrealized</th>
                  <th className="pb-3 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {data.holdings.map((holding, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{holding.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        holding.asset_type === 'crypto'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {holding.asset_type}
                      </span>
                    </td>
                    <td className="py-3 text-right">{holding.quantity.toFixed(4)}</td>
                    <td className="py-3 text-right">{formatCurrency(holding.cost_basis)}</td>
                    <td className="py-3 text-right">{formatCurrency(holding.current_value)}</td>
                    <td className={`py-3 text-right font-medium ${
                      holding.unrealized_gain_loss >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(holding.unrealized_gain_loss)}
                    </td>
                    <td className={`py-3 text-right ${
                      holding.gain_loss_percentage >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {holding.gain_loss_percentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Tax Loss Harvesting Tab Component
function HarvestingTab({
  data,
  formatCurrency
}: {
  data: { opportunities: TaxLossHarvestingOpportunity[]; total_potential_loss: number };
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <Scissors className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-200">Tax Loss Harvesting</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              These positions have unrealized losses that could be sold to offset capital gains.
              Be aware of wash sale rules when repurchasing similar assets within 30 days.
            </p>
          </div>
        </div>
      </div>

      {/* Total Potential */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold opacity-90">Total Potential Loss Harvest</h3>
            <p className="text-sm opacity-75">Available losses to realize</p>
          </div>
          <p className="text-3xl sm:text-4xl font-bold">
            {formatCurrency(data.total_potential_loss)}
          </p>
        </div>
      </div>

      {/* Opportunities */}
      {data.opportunities.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Harvesting Opportunities
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            All your positions are currently profitable. Check back when markets dip.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.opportunities.map((opp, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{opp.symbol}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      opp.asset_type === 'crypto'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {opp.asset_type}
                    </span>
                    {opp.wash_sale_risk && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        Wash Sale Risk
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                      <p className="font-medium text-gray-900 dark:text-white">{opp.quantity.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Cost Basis</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(opp.cost_basis)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Current Value</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(opp.current_value)}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    -{formatCurrency(opp.unrealized_loss)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Est. tax savings: {formatCurrency(opp.potential_tax_savings_estimate)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
