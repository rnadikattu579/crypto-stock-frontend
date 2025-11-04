import { useEffect, useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { Portfolio, Asset } from '../../types';
import { RefreshCw, Plus, ArrowLeft, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Search, Download, ArrowUpDown } from 'lucide-react';
import { AddAssetModal } from '../shared/AddAssetModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonPortfolio } from '../shared/LoadingSkeleton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

type SortField = 'symbol' | 'quantity' | 'value' | 'gainLoss';
type SortDirection = 'asc' | 'desc';

export function StockPortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const navigate = useNavigate();
  const toast = useToast();

  const toggleAssetExpansion = (assetId: string) => {
    setExpandedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

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
      const data = await apiService.getStockPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load stock portfolio', err);
      if (!isAutoRefresh) {
        toast.error('Failed to load stock portfolio. Please try again.');
      }
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
      toast.success('Asset deleted successfully');
    } catch (err) {
      console.error('Failed to delete asset', err);
      toast.error('Failed to delete asset. Please try again.');
    } finally {
      setDeletingAssetId(null);
      setAssetToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setAssetToDelete(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedAssets = useMemo(() => {
    if (!portfolio) return [];

    let filtered = portfolio.assets.filter(asset =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'value':
          aVal = a.current_value || 0;
          bVal = b.current_value || 0;
          break;
        case 'gainLoss':
          aVal = a.gain_loss || 0;
          bVal = b.gain_loss || 0;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      } else {
        return sortDirection === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    return sorted;
  }, [portfolio, searchQuery, sortField, sortDirection]);

  const exportToCSV = () => {
    if (!portfolio || portfolio.assets.length === 0) {
      toast.warning('No assets to export');
      return;
    }

    const headers = ['Symbol', 'Quantity', 'Purchase Price', 'Current Price', 'Current Value', 'Gain/Loss', 'Gain/Loss %', 'Purchase Date'];
    const rows = portfolio.assets.map(asset => [
      asset.symbol,
      asset.quantity.toFixed(2),
      asset.purchase_price.toFixed(2),
      (asset.current_price || 0).toFixed(2),
      (asset.current_value || 0).toFixed(2),
      (asset.gain_loss || 0).toFixed(2),
      (asset.gain_loss_percentage || 0).toFixed(2),
      new Date(asset.purchase_date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Portfolio exported successfully');
  };


  if (loading && !portfolio) {
    return <SkeletonPortfolio />;
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Stock Portfolio
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
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
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
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Stock
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Your Stock Assets</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {portfolio && portfolio.assets.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('symbol')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Symbol
                        {sortField === 'symbol' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('quantity')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Quantity
                        {sortField === 'quantity' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th
                      onClick={() => handleSort('value')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Current Value
                        {sortField === 'value' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('gainLoss')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Gain/Loss
                        {sortField === 'gainLoss' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedAssets.map((asset) => {
                    const assetIsPositive = (asset.gain_loss || 0) >= 0;
                    const hasMultiplePurchases = (asset.purchase_history?.length || 0) > 1;
                    const isExpanded = expandedAssets.has(asset.asset_id);

                    return (
                      <Fragment key={asset.asset_id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {hasMultiplePurchases && (
                                <button
                                  onClick={() => toggleAssetExpansion(asset.asset_id)}
                                  className="p-1 hover:bg-indigo-100 rounded transition-colors"
                                  title={isExpanded ? "Collapse purchase history" : "Expand purchase history"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-indigo-600" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-indigo-600" />
                                  )}
                                </button>
                              )}
                              <div className="font-bold text-gray-900">{asset.symbol}</div>
                              {hasMultiplePurchases && (
                                <span className="text-xs text-gray-500">({asset.purchase_history?.length} purchases)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {asset.quantity.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            ${asset.purchase_price.toFixed(2)}
                            {hasMultiplePurchases && <span className="text-xs text-gray-400 ml-1">(avg)</span>}
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

                        {/* Expanded Purchase History */}
                        {isExpanded && hasMultiplePurchases && (
                          <tr key={`${asset.asset_id}-history`}>
                            <td colSpan={7} className="px-6 py-4 bg-indigo-50">
                              <div className="text-sm">
                                <h4 className="font-semibold text-gray-900 mb-3">Purchase History</h4>
                                <div className="space-y-2">
                                  {asset.purchase_history?.map((purchase) => (
                                    <div
                                      key={purchase.purchase_id}
                                      className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100"
                                    >
                                      <div className="flex-1">
                                        <span className="text-gray-600">Date: </span>
                                        <span className="font-medium text-gray-900">
                                          {new Date(purchase.purchase_date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-gray-600">Quantity: </span>
                                        <span className="font-medium text-gray-900">{purchase.quantity.toFixed(2)}</span>
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-gray-600">Price: </span>
                                        <span className="font-medium text-gray-900">${purchase.purchase_price.toFixed(2)}</span>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <span className="text-gray-600">Total: </span>
                                        <span className="font-semibold text-indigo-600">${purchase.total_cost.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredAndSortedAssets.map((asset) => {
                const assetIsPositive = (asset.gain_loss || 0) >= 0;
                return (
                  <div key={asset.asset_id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-lg text-gray-900">{asset.symbol}</div>
                      <button
                        onClick={() => handleDeleteClick(asset.asset_id!)}
                        disabled={deletingAssetId === asset.asset_id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete asset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium text-gray-900">{asset.quantity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Price:</span>
                        <span className="font-medium text-gray-900">${asset.purchase_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Price:</span>
                        <span className="font-medium text-gray-900">${asset.current_price?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Value:</span>
                        <span className="font-semibold text-gray-900">${asset.current_value?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Gain/Loss:</span>
                        <div className="flex items-center gap-1">
                          {assetIsPositive ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`font-semibold ${assetIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {assetIsPositive ? '+' : ''}${asset.gain_loss?.toFixed(2) || '0.00'}
                          </span>
                          <span className={`text-xs ${assetIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                            ({asset.gain_loss_percentage?.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No stock assets yet</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Your First Stock
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assetType="stock"
        onSuccess={() => loadPortfolio()}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        title="Delete Asset"
        message="Are you sure you want to delete this stock asset? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </div>
  );
}
