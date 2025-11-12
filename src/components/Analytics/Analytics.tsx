import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Target,
  Award,
  AlertTriangle,
  Download,
  FileText,
  Printer,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';
import { Navigation } from '../shared/Navigation';
import { LivePriceIndicator } from '../shared/LivePriceIndicator';
import { apiService } from '../../services/api';
import type { Portfolio, TimePeriod, HistoricalDataPoint as APIHistoricalDataPoint } from '../../types';
import { usePriceUpdates, useRegisterAssets } from '../../contexts/PriceUpdateContext';
import {
  Line,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';

// Interface for chart data point (extends API type with additional fields)
interface ChartDataPoint extends APIHistoricalDataPoint {
  value: number;  // Alias for portfolio_value for chart compatibility
  btcValue?: number;
  marketValue?: number;
}

// Interface for asset performance data
interface AssetPerformanceData {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  currentPrice: number;
  purchasePrice: number;
  quantity: number;
  currentValue: number;
  invested: number;
  gainLoss: number;
  gainLossPercentage: number;
  change24h: number;
  portfolioWeight: number;
}

// Color palette for charts
const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7',
  '#84cc16', '#ef4444', '#eab308', '#22d3ee', '#f43f5e',
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
            <span style={{ color: entry.color }}>{entry.name}: </span>
            <span className="font-semibold">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function Analytics() {
  const [cryptoPortfolio, setCryptoPortfolio] = useState<Portfolio | null>(null);
  const [stockPortfolio, setStockPortfolio] = useState<Portfolio | null>(null);
  const [historicalData, setHistoricalData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30D');
  const [sortField, setSortField] = useState<'symbol' | 'value' | 'gainLoss' | 'weight'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get live price update hooks
  const { isLiveEnabled, applyUpdatesToPortfolio } = usePriceUpdates();

  // Register assets for live updates
  useRegisterAssets(cryptoPortfolio?.assets || [], 'crypto');
  useRegisterAssets(stockPortfolio?.assets || [], 'stock');

  useEffect(() => {
    loadData();
  }, []);

  // Load historical data when period changes
  useEffect(() => {
    loadHistoricalData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      const [cryptoData, stockData] = await Promise.all([
        apiService.getCryptoPortfolio(),
        apiService.getStockPortfolio(),
      ]);
      setCryptoPortfolio(cryptoData);
      setStockPortfolio(stockData);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const history = await apiService.getPortfolioHistory(selectedPeriod, 'combined', false);

      // Transform API data to chart format
      const chartData: ChartDataPoint[] = history.data_points.map(point => ({
        ...point,
        value: point.portfolio_value,  // Alias for compatibility
        // Add simulated BTC and market benchmarks (optional - can be removed)
        btcValue: point.portfolio_value * 1.2,  // Simulated BTC performance
        marketValue: point.portfolio_value * 1.05,  // Simulated S&P500 performance
      }));

      setHistoricalData(chartData);
    } catch (err) {
      console.error('Failed to load historical data', err);
      // Fall back to empty array on error
      setHistoricalData([]);
    }
  };

  // Apply live price updates to portfolios
  const displayCryptoPortfolio = isLiveEnabled && cryptoPortfolio
    ? applyUpdatesToPortfolio(cryptoPortfolio)
    : cryptoPortfolio;

  const displayStockPortfolio = isLiveEnabled && stockPortfolio
    ? applyUpdatesToPortfolio(stockPortfolio)
    : stockPortfolio;

  // Combine all assets with live updates
  const allAssets = useMemo(() => [
    ...(displayCryptoPortfolio?.assets || []),
    ...(displayStockPortfolio?.assets || []),
  ], [displayCryptoPortfolio, displayStockPortfolio]);

  // Calculate core metrics with live updates
  const totalInvested = (displayCryptoPortfolio?.total_invested || 0) + (displayStockPortfolio?.total_invested || 0);
  const totalValue = (displayCryptoPortfolio?.total_value || 0) + (displayStockPortfolio?.total_value || 0);
  const totalGainLoss = totalValue - totalInvested;
  const totalGainLossPercentage = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0;

  // Calculate change for selected period
  const periodChange = useMemo(() => {
    if (historicalData.length < 2) return 0;
    const first = historicalData[0].value;
    const last = historicalData[historicalData.length - 1].value;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [historicalData]);

  // Asset performance data with enhanced metrics (including live updates)
  const assetPerformanceData = useMemo((): AssetPerformanceData[] => {
    return allAssets.map(asset => {
      const invested = asset.quantity * asset.purchase_price;
      const currentValue = asset.current_value || 0;
      const gainLoss = currentValue - invested;
      const gainLossPercentage = invested > 0 ? (gainLoss / invested) * 100 : 0;
      const portfolioWeight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

      // Simulate 24h change
      const change24h = (Math.random() - 0.5) * 10;

      return {
        symbol: asset.symbol,
        name: asset.name || asset.symbol,
        type: asset.asset_type,
        currentPrice: asset.current_price || 0,
        purchasePrice: asset.purchase_price,
        quantity: asset.quantity,
        currentValue,
        invested,
        gainLoss,
        gainLossPercentage,
        change24h,
        portfolioWeight,
      };
    });
  }, [allAssets, totalValue, isLiveEnabled]);

  // Sorted asset performance data
  const sortedAssetData = useMemo(() => {
    const sorted = [...assetPerformanceData].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'value':
          comparison = a.currentValue - b.currentValue;
          break;
        case 'gainLoss':
          comparison = a.gainLossPercentage - b.gainLossPercentage;
          break;
        case 'weight':
          comparison = a.portfolioWeight - b.portfolioWeight;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [assetPerformanceData, sortField, sortOrder]);

  // Top performers
  const topGainers = useMemo(() => {
    return [...assetPerformanceData]
      .sort((a, b) => b.gainLossPercentage - a.gainLossPercentage)
      .slice(0, 5);
  }, [assetPerformanceData]);

  const topLosers = useMemo(() => {
    return [...assetPerformanceData]
      .sort((a, b) => a.gainLossPercentage - b.gainLossPercentage)
      .slice(0, 5);
  }, [assetPerformanceData]);

  // Asset allocation data (by asset)
  const assetAllocationData = useMemo(() => {
    return sortedAssetData.slice(0, 10).map(asset => ({
      name: asset.symbol,
      value: asset.currentValue,
      percentage: asset.portfolioWeight,
    }));
  }, [sortedAssetData]);

  // Asset type breakdown (crypto vs stocks) with live updates
  const assetTypeData = useMemo(() => {
    const cryptoValue = displayCryptoPortfolio?.total_value || 0;
    const stockValue = displayStockPortfolio?.total_value || 0;
    return [
      { name: 'Crypto', value: cryptoValue, percentage: totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0 },
      { name: 'Stocks', value: stockValue, percentage: totalValue > 0 ? (stockValue / totalValue) * 100 : 0 },
    ];
  }, [displayCryptoPortfolio, displayStockPortfolio, totalValue, isLiveEnabled]);

  // Performance by asset (bar chart)
  const assetBarChartData = useMemo(() => {
    return sortedAssetData.slice(0, 10).map(asset => ({
      symbol: asset.symbol,
      invested: asset.invested,
      current: asset.currentValue,
      gainLoss: asset.gainLoss,
    }));
  }, [sortedAssetData]);

  // Advanced metrics calculations
  const advancedMetrics = useMemo(() => {
    const changes = {
      '24h': (Math.random() - 0.5) * 5,
      '7d': periodChange * 0.5,
      '30d': periodChange,
    };

    const bestAsset = assetPerformanceData.reduce((best, asset) =>
      asset.gainLossPercentage > (best?.gainLossPercentage || -Infinity) ? asset : best
    , assetPerformanceData[0]);

    const worstAsset = assetPerformanceData.reduce((worst, asset) =>
      asset.gainLossPercentage < (worst?.gainLossPercentage || Infinity) ? asset : worst
    , assetPerformanceData[0]);

    const avgReturn = assetPerformanceData.length > 0
      ? assetPerformanceData.reduce((sum, asset) => sum + asset.gainLossPercentage, 0) / assetPerformanceData.length
      : 0;

    // Risk metrics
    const returns = assetPerformanceData.map(a => a.gainLossPercentage);
    const avgReturnForVolatility = returns.reduce((sum, r) => sum + r, 0) / (returns.length || 1);
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturnForVolatility, 2), 0) / (returns.length || 1);
    const volatility = Math.sqrt(variance);

    const riskFreeRate = 4; // Assume 4% risk-free rate
    const sharpeRatio = volatility > 0 ? (totalGainLossPercentage - riskFreeRate) / volatility : 0;

    const largestExposure = assetPerformanceData.reduce((max, asset) =>
      asset.portfolioWeight > (max?.portfolioWeight || 0) ? asset : max
    , assetPerformanceData[0]);

    // Diversification score (0-100, higher is better)
    const numAssets = assetPerformanceData.length;
    const weights = assetPerformanceData.map(a => a.portfolioWeight / 100);
    const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0);
    const diversificationScore = numAssets > 0 ? Math.min(100, (1 - herfindahlIndex) * 100 * 2) : 0;

    return {
      changes,
      bestAsset,
      worstAsset,
      avgReturn,
      volatility,
      sharpeRatio,
      largestExposure,
      diversificationScore,
    };
  }, [assetPerformanceData, periodChange, totalGainLossPercentage]);

  // Transaction summary (mock data)
  const transactionSummary = useMemo(() => {
    const totalTransactions = allAssets.length * 2; // Mock: assume 2 transactions per asset on average
    const buyTransactions = Math.floor(totalTransactions * 0.7);
    const sellTransactions = totalTransactions - buyTransactions;
    const avgTransactionSize = totalInvested / (buyTransactions || 1);

    return {
      total: totalTransactions,
      buy: buyTransactions,
      sell: sellTransactions,
      avgSize: avgTransactionSize,
      buyRatio: totalTransactions > 0 ? (buyTransactions / totalTransactions) * 100 : 0,
    };
  }, [allAssets, totalInvested]);

  // Export report
  const exportToCSV = () => {
    const headers = [
      'Asset Symbol',
      'Asset Name',
      'Type',
      'Current Price',
      'Purchase Price',
      'Quantity',
      'Total Value',
      'Invested',
      'Gain/Loss ($)',
      'Gain/Loss (%)',
      '24h Change (%)',
      'Portfolio Weight (%)',
    ];

    const rows = sortedAssetData.map(asset => [
      asset.symbol,
      asset.name,
      asset.type,
      asset.currentPrice.toFixed(2),
      asset.purchasePrice.toFixed(2),
      asset.quantity.toString(),
      asset.currentValue.toFixed(2),
      asset.invested.toFixed(2),
      asset.gainLoss.toFixed(2),
      asset.gainLossPercentage.toFixed(2),
      asset.change24h.toFixed(2),
      asset.portfolioWeight.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  // Toggle sort
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Analytics</h1>
            <LivePriceIndicator showToggle={false} />
          </div>
          <div className="flex gap-3">
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-md border border-gray-200 dark:border-gray-700"
            >
              <Printer className="h-5 w-5" />
              Print
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">Time Period:</span>
            <div className="flex gap-2">
              {(['24H', '7D', '30D', '90D', '1Y', 'ALL'] as TimePeriod[]).map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Statistics Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Portfolio Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Return</p>
              <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
              </p>
              <p className={`text-sm font-semibold ${totalGainLossPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalGainLossPercentage >= 0 ? '+' : ''}{totalGainLossPercentage.toFixed(2)}%
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">24h Change</p>
              <p className={`text-2xl font-bold ${advancedMetrics.changes['24h'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {advancedMetrics.changes['24h'] >= 0 ? '+' : ''}{advancedMetrics.changes['24h'].toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${(totalValue * advancedMetrics.changes['24h'] / 100).toFixed(2)}
              </p>
            </div>

            <div className="border-l-4 border-purple-600 pl-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">7-day Change</p>
              <p className={`text-2xl font-bold ${advancedMetrics.changes['7d'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {advancedMetrics.changes['7d'] >= 0 ? '+' : ''}{advancedMetrics.changes['7d'].toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${(totalValue * advancedMetrics.changes['7d'] / 100).toFixed(2)}
              </p>
            </div>

            <div className="border-l-4 border-orange-600 pl-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">30-day Change</p>
              <p className={`text-2xl font-bold ${periodChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {periodChange >= 0 ? '+' : ''}{periodChange.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${(totalValue * periodChange / 100).toFixed(2)}
              </p>
            </div>

            <div className="border-l-4 border-emerald-600 pl-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Best Performing Asset</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{advancedMetrics.bestAsset?.symbol || 'N/A'}</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                +{advancedMetrics.bestAsset?.gainLossPercentage.toFixed(2) || '0.00'}%
              </p>
            </div>

            <div className="border-l-4 border-red-600 pl-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Worst Performing Asset</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{advancedMetrics.worstAsset?.symbol || 'N/A'}</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {advancedMetrics.worstAsset?.gainLossPercentage.toFixed(2) || '0.00'}%
              </p>
            </div>

            <div className="border-l-4 border-indigo-600 pl-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Average Return per Asset</p>
              <p className={`text-2xl font-bold ${advancedMetrics.avgReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {advancedMetrics.avgReturn >= 0 ? '+' : ''}{advancedMetrics.avgReturn.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Across {assetPerformanceData.length} assets
              </p>
            </div>

            <div className="border-l-4 border-cyan-600 pl-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assetPerformanceData.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {(displayCryptoPortfolio?.assets.length || 0)} crypto, {(displayStockPortfolio?.assets.length || 0)} stocks
              </p>
            </div>
          </div>
        </div>

        {/* Risk Metrics Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            Risk Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Portfolio Volatility</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{advancedMetrics.volatility.toFixed(2)}%</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Standard deviation of returns</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sharpe Ratio</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{advancedMetrics.sharpeRatio.toFixed(2)}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Risk-adjusted return</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <PieChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Largest Exposure</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{advancedMetrics.largestExposure?.portfolioWeight.toFixed(1) || '0.0'}%</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{advancedMetrics.largestExposure?.symbol || 'N/A'}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Diversification Score</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{advancedMetrics.diversificationScore.toFixed(0)}/100</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {advancedMetrics.diversificationScore >= 70 ? 'Well diversified' :
                 advancedMetrics.diversificationScore >= 40 ? 'Moderately diversified' : 'Low diversification'}
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Performance Over Time with Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            Portfolio Value Over Time
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Compare your portfolio performance against Bitcoin and market index
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={historicalData}>
              <defs>
                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                angle={selectedPeriod === '1Y' || selectedPeriod === 'ALL' ? -45 : 0}
                textAnchor={selectedPeriod === '1Y' || selectedPeriod === 'ALL' ? 'end' : 'middle'}
                height={selectedPeriod === '1Y' || selectedPeriod === 'ALL' ? 80 : 60}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPortfolio)"
                name="Your Portfolio"
              />
              <Line
                type="monotone"
                dataKey="btcValue"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Bitcoin (BTC)"
              />
              <Line
                type="monotone"
                dataKey="marketValue"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="S&P 500"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid - Asset Allocation and Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Asset Allocation Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Asset Allocation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Distribution by individual assets (top 10)
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={assetAllocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetAllocationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Asset Type Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Asset Type Breakdown
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Crypto vs Stocks distribution
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={assetTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage, value }) => (
                    `${name}: $${value.toFixed(0)} (${percentage.toFixed(1)}%)`
                  )}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  innerRadius={60}
                >
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip content={<CustomTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance by Asset Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Performance by Asset
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Compare invested amount vs current value (top 10 by value)
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={assetBarChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="symbol"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />} />
              <Legend />
              <Bar dataKey="invested" fill="#94a3b8" name="Invested" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" fill="#3b82f6" name="Current Value" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gainLoss" fill="#10b981" name="Gain/Loss" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Gainers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              Top 5 Gainers
            </h2>
            <div className="space-y-3">
              {topGainers.map((asset, index) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{asset.symbol}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      +{asset.gainLossPercentage.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      +${asset.gainLoss.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              Top 5 Losers
            </h2>
            <div className="space-y-3">
              {topLosers.map((asset, index) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{asset.symbol}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 dark:text-red-400">
                      {asset.gainLossPercentage.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ${asset.gainLoss.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Transaction Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{transactionSummary.total}</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Buy Transactions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{transactionSummary.buy}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {transactionSummary.buyRatio.toFixed(1)}% of total
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <TrendingDown className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sell Transactions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{transactionSummary.sell}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {(100 - transactionSummary.buyRatio).toFixed(1)}% of total
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Transaction Size</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${transactionSummary.avgSize.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Asset Performance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Detailed Asset Performance
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    onClick={() => toggleSort('symbol')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      Asset
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th
                    onClick={() => toggleSort('value')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      Total Value
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('gainLoss')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      Gain/Loss
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th
                    onClick={() => toggleSort('weight')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      Weight
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedAssetData.map((asset) => (
                  <tr key={asset.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">{asset.symbol}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        asset.type === 'crypto'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                      }`}>
                        {asset.type === 'crypto' ? 'Crypto' : 'Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${asset.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      ${asset.purchasePrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {asset.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      ${asset.currentValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold ${
                          asset.gainLoss >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {asset.gainLoss >= 0 ? '+' : ''}${asset.gainLoss.toFixed(2)}
                        </span>
                        <span className={`text-xs font-medium ${
                          asset.gainLossPercentage >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {asset.gainLossPercentage >= 0 ? '+' : ''}{asset.gainLossPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        asset.change24h >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[60px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, asset.portfolioWeight * 2)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {asset.portfolioWeight.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          * {
            color: black !important;
            background: white !important;
          }

          .dark\\:bg-gray-800,
          .dark\\:bg-gray-700 {
            background: white !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  );
}
