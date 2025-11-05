import { useEffect, useState, useMemo, Fragment } from 'react';
import { apiService } from '../../services/api';
import type { Portfolio } from '../../types';
import { RefreshCw, Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Search, Download, ArrowUpDown, List, LayoutGrid } from 'lucide-react';
import { AddAssetModal } from '../shared/AddAssetModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonPortfolio } from '../shared/LoadingSkeleton';
import { EmptyState } from '../shared/EmptyState';
import { Navigation } from '../shared/Navigation';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
              Stock Portfolio
            </h1>
            {refreshing && (
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => loadPortfolio()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Stock
            </button>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Value</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-300">
              ${portfolio?.total_value.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-all duration-300">{portfolio?.assets.length || 0} assets</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Invested</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-300">
              ${portfolio?.total_invested.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Gain/Loss</p>
            <p className={`text-3xl font-bold transition-all duration-300 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}${portfolio?.total_gain_loss.toFixed(2) || '0.00'}
            </p>
            <p className={`text-sm font-semibold transition-all duration-300 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {portfolio?.total_gain_loss_percentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Charts */}
        {portfolio && portfolio.assets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Holdings Distribution Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Holdings Distribution</h2>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance by Asset</h2>
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
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
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
            </div>
          </div>
        )}

        {/* Assets Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Stock Assets</h2>
              {portfolio && portfolio.assets.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {portfolio && portfolio.assets.length > 0 ? (
            <>
              {viewMode === 'list' ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      onClick={() => handleSort('symbol')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Quantity
                        {sortField === 'quantity' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th
                      onClick={() => handleSort('value')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Gain/Loss
                        {sortField === 'gainLoss' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedAssets.map((asset) => {
                    const assetIsPositive = (asset.gain_loss || 0) >= 0;
                    const hasMultiplePurchases = (asset.purchase_history?.length || 0) > 1;
                    const isExpanded = expandedAssets.has(asset.asset_id);

                    return (
                      <Fragment key={asset.asset_id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {hasMultiplePurchases && (
                                <button
                                  onClick={() => toggleAssetExpansion(asset.asset_id)}
                                  className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded transition-colors"
                                  title={isExpanded ? "Collapse purchase history" : "Expand purchase history"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                  )}
                                </button>
                              )}
                              <div className="font-bold text-gray-900 dark:text-white">{asset.symbol}</div>
                              {hasMultiplePurchases && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">({asset.purchase_history?.length} purchases)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {asset.quantity.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            ${asset.purchase_price.toFixed(2)}
                            {hasMultiplePurchases && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(avg)</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            ${asset.current_price?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                            ${asset.current_value?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {assetIsPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                              <span className={`font-semibold ${assetIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {assetIsPositive ? '+' : ''}${asset.gain_loss?.toFixed(2) || '0.00'}
                              </span>
                              <span className={`text-sm ${assetIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ({asset.gain_loss_percentage?.toFixed(2)}%)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteClick(asset.asset_id!)}
                              disabled={deletingAssetId === asset.asset_id}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete asset"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Purchase History */}
                        {isExpanded && hasMultiplePurchases && (
                          <tr key={`${asset.asset_id}-history`}>
                            <td colSpan={7} className="px-6 py-4 bg-indigo-50 dark:bg-gray-900/50">
                              <div className="text-sm">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Purchase History</h4>
                                <div className="space-y-2">
                                  {asset.purchase_history?.map((purchase) => (
                                    <div
                                      key={purchase.purchase_id}
                                      className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900"
                                    >
                                      <div className="flex-1">
                                        <span className="text-gray-600 dark:text-gray-400">Date: </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {new Date(purchase.purchase_date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-gray-600 dark:text-gray-400">Quantity: </span>
                                        <span className="font-medium text-gray-900 dark:text-white">{purchase.quantity.toFixed(2)}</span>
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-gray-600 dark:text-gray-400">Price: </span>
                                        <span className="font-medium text-gray-900 dark:text-white">${purchase.purchase_price.toFixed(2)}</span>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <span className="text-gray-600 dark:text-gray-400">Total: </span>
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">${purchase.total_cost.toFixed(2)}</span>
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
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedAssets.map((asset) => {
                const assetIsPositive = (asset.gain_loss || 0) >= 0;
                return (
                  <div key={asset.asset_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">{asset.symbol}</div>
                      <button
                        onClick={() => handleDeleteClick(asset.asset_id!)}
                        disabled={deletingAssetId === asset.asset_id}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete asset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{asset.quantity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Purchase Price:</span>
                        <span className="font-medium text-gray-900 dark:text-white">${asset.purchase_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
                        <span className="font-medium text-gray-900 dark:text-white">${asset.current_price?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current Value:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">${asset.current_value?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Gain/Loss:</span>
                        <div className="flex items-center gap-1">
                          {assetIsPositive ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className={`font-semibold ${assetIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {assetIsPositive ? '+' : ''}${asset.gain_loss?.toFixed(2) || '0.00'}
                          </span>
                          <span className={`text-xs ${assetIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {filteredAndSortedAssets.map((asset) => {
                    const assetIsPositive = (asset.gain_loss || 0) >= 0;
                    return (
                      <div
                        key={asset.asset_id}
                        className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-indigo-100 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-700 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{asset.symbol.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{asset.symbol}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{asset.quantity.toFixed(4)} shares</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteClick(asset.asset_id)}
                            disabled={deletingAssetId === asset.asset_id}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete asset"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-3 border-b border-indigo-200 dark:border-gray-600">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Current Value</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              ${asset.current_value?.toFixed(2) || '0.00'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Purchase Price</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">${asset.purchase_price.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">${asset.current_price?.toFixed(2) || '0.00'}</span>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-indigo-200 dark:border-gray-600">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Gain/Loss</span>
                            <div className="flex items-center gap-2">
                              {assetIsPositive ? (
                                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                              )}
                              <div className="text-right">
                                <div className={`font-bold ${assetIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {assetIsPositive ? '+' : ''}${asset.gain_loss?.toFixed(2) || '0.00'}
                                </div>
                                <div className={`text-sm ${assetIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  ({assetIsPositive ? '+' : ''}{asset.gain_loss_percentage?.toFixed(2)}%)
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              type="portfolio"
              assetType="stock"
              onAddAsset={() => setIsModalOpen(true)}
            />
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
