import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { Portfolio } from '../../types';
import { RefreshCw, Plus, ArrowLeft, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { AddAssetModal } from '../shared/AddAssetModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#84cc16'];

export function CryptoPortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadPortfolio();

    // Auto-refresh portfolio every 30 seconds for real-time prices
    const interval = setInterval(() => {
      loadPortfolio(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadPortfolio = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const data = await apiService.getCryptoPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load crypto portfolio', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteClick = (assetId: string) => {
    setAssetToDelete(assetId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    try {
      setDeletingAssetId(assetToDelete);
      setConfirmDialogOpen(false);
      await apiService.deleteAsset(assetToDelete);
      await loadPortfolio();
    } catch (err) {
      console.error('Failed to delete asset', err);
      alert('Failed to delete asset. Please try again.');
    } finally {
      setDeletingAssetId(null);
      setAssetToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setAssetToDelete(null);
  };

  if (loading && !portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  const isPositive = (portfolio?.total_gain_loss || 0) >= 0;

  // Prepare data for charts
  const holdingsData = portfolio?.assets.map(asset => ({
    name: asset.symbol,
    value: asset.current_value || 0,
    percentage: ((asset.current_value || 0) / (portfolio.total_value || 1)) * 100,
  })) || [];

  const performanceData = portfolio?.assets.map(asset => ({
    name: asset.symbol,
    gainLoss: asset.gain_loss || 0,
    gainLossPercentage: asset.gain_loss_percentage || 0,
  })).sort((a, b) => b.gainLoss - a.gainLoss) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Crypto Portfolio
              </h1>
              {refreshing && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadPortfolio()}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Crypto
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Value</p>
            <p className="text-3xl font-bold text-gray-900 transition-all duration-300">
              ${portfolio?.total_value.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-500 mt-1 transition-all duration-300">{portfolio?.assets.length || 0} assets</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Invested</p>
            <p className="text-3xl font-bold text-gray-900 transition-all duration-300">
              ${portfolio?.total_invested.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Gain/Loss</p>
            <p className={`text-3xl font-bold transition-all duration-300 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}${portfolio?.total_gain_loss.toFixed(2) || '0.00'}
            </p>
            <p className={`text-sm font-semibold transition-all duration-300 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio?.total_gain_loss_percentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Charts */}
        {portfolio && portfolio.assets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Holdings Distribution Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Holdings Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={holdingsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percentage }) => `${name}: $${value.toFixed(2)} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {holdingsData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Asset</h2>
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
            </div>
          </div>
        )}

        {/* Assets Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Crypto Assets</h2>
          </div>

          {portfolio && portfolio.assets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gain/Loss
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.assets.map((asset) => {
                    const assetIsPositive = (asset.gain_loss || 0) >= 0;
                    return (
                      <tr key={asset.asset_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{asset.symbol}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {asset.quantity.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          ${asset.purchase_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          ${asset.current_price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                          ${asset.current_value?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {assetIsPositive ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`font-semibold ${assetIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {assetIsPositive ? '+' : ''}${asset.gain_loss?.toFixed(2) || '0.00'}
                            </span>
                            <span className={`text-sm ${assetIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                              ({asset.gain_loss_percentage?.toFixed(2)}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteClick(asset.asset_id!)}
                            disabled={deletingAssetId === asset.asset_id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete asset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No crypto assets yet</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Your First Crypto
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assetType="crypto"
        onSuccess={() => loadPortfolio()}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        title="Delete Asset"
        message="Are you sure you want to delete this crypto asset? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </div>
  );
}
