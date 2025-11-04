import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { PortfolioSummary, Portfolio } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SkeletonDashboard } from '../shared/LoadingSkeleton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Dashboard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [cryptoPortfolio, setCryptoPortfolio] = useState<Portfolio | null>(null);
  const [stockPortfolio, setStockPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading && !summary) {
    return <SkeletonDashboard />;
  }

  const isPositive = (summary?.total_gain_loss || 0) >= 0;

  // Prepare data for charts
  const assetTypeData = [
    { name: 'Crypto', value: summary?.crypto_value || 0, count: summary?.crypto_count || 0 },
    { name: 'Stocks', value: summary?.stock_value || 0, count: summary?.stock_count || 0 },
  ].filter(item => item.value > 0);

  // Individual asset performance for bar chart
  const allAssets = [
    ...(cryptoPortfolio?.assets || []),
    ...(stockPortfolio?.assets || []),
  ];

  const performanceData = allAssets
    .map(asset => ({
      name: asset.symbol,
      gainLoss: asset.gain_loss || 0,
      gainLossPercentage: asset.gain_loss_percentage || 0,
    }))
    .sort((a, b) => b.gainLoss - a.gainLoss)
    .slice(0, 10); // Top 10 performers

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Portfolio Dashboard
            </h1>
            {refreshing && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, <span className="font-semibold">{user?.email}</span></span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2 transition-all duration-300">
                  ${summary?.total_value.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gain/Loss</p>
                <p className={`text-3xl font-bold mt-2 transition-all duration-300 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}${summary?.total_gain_loss.toFixed(2) || '0.00'}
                </p>
                <p className={`text-sm font-semibold transition-all duration-300 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {summary?.total_gain_loss_percentage.toFixed(2)}%
                </p>
              </div>
              <div className={`p-3 rounded-full transition-all duration-300 ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                {isPositive ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/crypto')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crypto Value</p>
                <p className="text-3xl font-bold text-purple-600 mt-2 transition-all duration-300">
                  ${summary?.crypto_value.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 transition-all duration-300">{summary?.crypto_count || 0} assets</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <PieChart className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/stocks')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2 transition-all duration-300">
                  ${summary?.stock_value.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 transition-all duration-300">{summary?.stock_count || 0} assets</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <PieChart className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Distribution</h2>
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
              <div className="h-300 flex items-center justify-center text-gray-500">
                No assets to display
              </div>
            )}
          </div>

          {/* Top Performers Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performers</h2>
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
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-900">{data.name}</p>
                            <p className={`text-sm ${data.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {data.gainLoss >= 0 ? '+' : ''}${data.gainLoss.toFixed(2)}
                            </p>
                            <p className={`text-sm ${data.gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              <div className="h-300 flex items-center justify-center text-gray-500">
                No assets to display
              </div>
            )}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/crypto')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all text-left transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Crypto Portfolio</h2>
            <p className="text-purple-100">View and manage your cryptocurrency investments</p>
          </button>

          <button
            onClick={() => navigate('/stocks')}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all text-left transform hover:scale-105"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Stock Portfolio</h2>
            <p className="text-indigo-100">View and manage your stock investments</p>
          </button>
        </div>
      </main>
    </div>
  );
}
