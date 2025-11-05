import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { Navigation } from '../shared/Navigation';
import { apiService } from '../../services/api';
import type { Portfolio } from '../../types';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function Analytics() {
  const [cryptoPortfolio, setCryptoPortfolio] = useState<Portfolio | null>(null);
  const [stockPortfolio, setStockPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

  const allAssets = [
    ...(cryptoPortfolio?.assets || []),
    ...(stockPortfolio?.assets || []),
  ];

  // Calculate metrics
  const totalInvested = (cryptoPortfolio?.total_invested || 0) + (stockPortfolio?.total_invested || 0);
  const totalValue = (cryptoPortfolio?.total_value || 0) + (stockPortfolio?.total_value || 0);
  const totalGainLoss = totalValue - totalInvested;
  const roi = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0;

  // Prepare data for charts
  const assetPerformanceData = allAssets.map(asset => ({
    name: asset.symbol,
    invested: asset.quantity * asset.purchase_price,
    current: asset.current_value || 0,
    gainLoss: asset.gain_loss || 0,
  })).sort((a, b) => b.current - a.current);

  // Monthly performance simulation (in real app, this would come from backend)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      value: totalInvested * (1 + (Math.random() * 0.2 - 0.05) * (i + 1)),
    };
  });

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Portfolio Analytics</h1>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invested</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalInvested.toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Value</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalValue.toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Gain/Loss</p>
            </div>
            <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <PieChartIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ROI</p>
            </div>
            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Portfolio Performance Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Portfolio Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Performance Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Asset Performance Comparison</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={assetPerformanceData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="invested" stroke="#8884d8" name="Invested" />
              <Line type="monotone" dataKey="current" stroke="#82ca9d" name="Current Value" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Breakdown Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Asset Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gain/Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ROI</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {assetPerformanceData.map((asset) => {
                  const roi = asset.invested > 0 ? ((asset.gainLoss / asset.invested) * 100) : 0;
                  const isPositive = asset.gainLoss >= 0;

                  return (
                    <tr key={asset.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{asset.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {cryptoPortfolio?.assets.some(a => a.symbol === asset.name) ? 'Crypto' : 'Stock'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">${asset.invested.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">${asset.current.toFixed(2)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isPositive ? '+' : ''}${asset.gainLoss.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isPositive ? '+' : ''}{roi.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
