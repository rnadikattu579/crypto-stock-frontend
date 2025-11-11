import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { PortfolioSummary, Portfolio } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw } from 'lucide-react';
import { usePriceUpdates, useRegisterAssets } from '../../contexts/PriceUpdateContext';
import { LivePriceIndicator } from '../shared/LivePriceIndicator';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SkeletonDashboard } from '../shared/LoadingSkeleton';
import { EmptyState } from '../shared/EmptyState';
import { Navigation } from '../shared/Navigation';
import { QuickActions } from './QuickActions';
import { TopPerformers } from './TopPerformers';
import { PortfolioInsightsWidget } from '../Insights/PortfolioInsightsWidget';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Dashboard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [cryptoPortfolio, setCryptoPortfolio] = useState<Portfolio | null>(null);
  const [stockPortfolio, setStockPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { applyUpdatesToPortfolio, isLiveEnabled } = usePriceUpdates();

  // Register all assets for live updates
  useRegisterAssets(cryptoPortfolio?.assets || [], 'crypto');
  useRegisterAssets(stockPortfolio?.assets || [], 'stock');

  useEffect(() => {
    loadData();

    // Auto-refresh dashboard every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const [summaryData, cryptoData, stockData] = await Promise.all([
        apiService.getPortfolioSummary(),
        apiService.getCryptoPortfolio(),
        apiService.getStockPortfolio(),
      ]);
      setSummary(summaryData);
      setCryptoPortfolio(cryptoData);
      setStockPortfolio(stockData);
      setError('');
    } catch (err: any) {
      setError('Failed to load portfolio data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading && !summary) {
    return <SkeletonDashboard />;
  }

  // Apply live price updates if enabled
  const displayCryptoPortfolio = isLiveEnabled && cryptoPortfolio
    ? applyUpdatesToPortfolio(cryptoPortfolio)
    : cryptoPortfolio;

  const displayStockPortfolio = isLiveEnabled && stockPortfolio
    ? applyUpdatesToPortfolio(stockPortfolio)
    : stockPortfolio;

  // Recalculate summary with live prices
  const displaySummary = isLiveEnabled && summary ? {
    ...summary,
    crypto_value: displayCryptoPortfolio?.total_value || 0,
    stock_value: displayStockPortfolio?.total_value || 0,
    total_value: (displayCryptoPortfolio?.total_value || 0) + (displayStockPortfolio?.total_value || 0),
    total_invested: (displayCryptoPortfolio?.total_invested || 0) + (displayStockPortfolio?.total_invested || 0),
    total_gain_loss: (displayCryptoPortfolio?.total_gain_loss || 0) + (displayStockPortfolio?.total_gain_loss || 0),
    total_gain_loss_percentage: ((displayCryptoPortfolio?.total_value || 0) + (displayStockPortfolio?.total_value || 0)) > 0
      ? (((displayCryptoPortfolio?.total_gain_loss || 0) + (displayStockPortfolio?.total_gain_loss || 0)) /
         ((displayCryptoPortfolio?.total_invested || 0) + (displayStockPortfolio?.total_invested || 0))) * 100
      : 0,
  } : summary;

  const isPositive = (displaySummary?.total_gain_loss || 0) >= 0;
  const totalAssets = (displayCryptoPortfolio?.assets.length || 0) + (displayStockPortfolio?.assets.length || 0);

  // Prepare data for charts
  const assetTypeData = [
    { name: 'Crypto', value: displaySummary?.crypto_value || 0, count: displaySummary?.crypto_count || 0 },
    { name: 'Stocks', value: displaySummary?.stock_value || 0, count: displaySummary?.stock_count || 0 },
  ].filter(item => item.value > 0);

  // Individual asset performance for bar chart
  const displayAllAssets = [
    ...(displayCryptoPortfolio?.assets || []),
    ...(displayStockPortfolio?.assets || []),
  ];

  const performanceData = displayAllAssets
    .map(asset => ({
      name: asset.symbol,
      gainLoss: asset.gain_loss || 0,
      gainLossPercentage: asset.gain_loss_percentage || 0,
    }))
    .sort((a, b) => b.gainLoss - a.gainLoss)
    .slice(0, 10); // Top 10 performers

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Live Price Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            {refreshing && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
            <LivePriceIndicator showToggle={true} />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 transition-all duration-300">
                  ${displaySummary?.total_value.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Gain/Loss</p>
                <p className={`text-3xl font-bold mt-2 transition-all duration-300 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isPositive ? '+' : ''}${displaySummary?.total_gain_loss.toFixed(2) || '0.00'}
                </p>
                <p className={`text-sm font-semibold transition-all duration-300 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {displaySummary?.total_gain_loss_percentage.toFixed(2)}%
                </p>
              </div>
              <div className={`p-3 rounded-full transition-all duration-300 ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {isPositive ? (
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/crypto')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Crypto Value</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2 transition-all duration-300">
                  ${displaySummary?.crypto_value.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-all duration-300">{displaySummary?.crypto_count || 0} assets</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <PieChart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/stocks')}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock Value</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2 transition-all duration-300">
                  ${displaySummary?.stock_value.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-all duration-300">{displaySummary?.stock_count || 0} assets</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <PieChart className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Empty State or Content */}
        {totalAssets === 0 ? (
          <EmptyState type="dashboard" />
        ) : (
          <>
            {/* Quick Actions */}
            <div className="mb-8">
              <QuickActions />
            </div>

            {/* Top Performers */}
            <div className="mb-8">
              <TopPerformers cryptoPortfolio={displayCryptoPortfolio} stockPortfolio={displayStockPortfolio} />
            </div>

            {/* Portfolio Insights */}
            <div className="mb-8">
              <PortfolioInsightsWidget cryptoPortfolio={displayCryptoPortfolio} stockPortfolio={displayStockPortfolio} summary={displaySummary} />
            </div>
          </>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Portfolio Distribution</h2>
            {assetTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={assetTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => `${name}: $${value.toFixed(2)} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetTypeData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No assets to display
              </div>
            )}
          </div>

          {/* Top Performers Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Performers</h2>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-700 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
                            <p className={`text-sm ${data.gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {data.gainLoss >= 0 ? '+' : ''}${data.gainLoss.toFixed(2)}
                            </p>
                            <p className={`text-sm ${data.gainLossPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {data.gainLossPercentage >= 0 ? '+' : ''}{data.gainLossPercentage.toFixed(2)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="gainLoss" name="Gain/Loss ($)">
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.gainLoss >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No assets to display
              </div>
            )}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/crypto')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all text-left transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Crypto Portfolio</h2>
            <p className="text-purple-100 dark:text-purple-200">View and manage your cryptocurrency investments</p>
          </button>

          <button
            onClick={() => navigate('/stocks')}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all text-left transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Stock Portfolio</h2>
            <p className="text-indigo-100 dark:text-indigo-200">View and manage your stock investments</p>
          </button>
        </div>
      </main>
    </div>
  );
}
