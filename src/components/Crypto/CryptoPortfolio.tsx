import { useEffect, useState, useMemo, Fragment, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { Portfolio } from '../../types';
import { RefreshCw, Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Search, Download, ArrowUpDown, List, LayoutGrid, Filter, X, Save, Upload } from 'lucide-react';
import { usePriceUpdates, useRegisterAssets } from '../../contexts/PriceUpdateContext';
import { LivePriceIndicator } from '../shared/LivePriceIndicator';
import { PriceChangeIndicator } from '../shared/PriceChangeIndicator';
import { AddAssetModal } from '../shared/AddAssetModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ImportModal } from '../shared/ImportModal';
import { ExportModal } from '../shared/ExportModal';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonPortfolio } from '../shared/LoadingSkeleton';
import { EmptyState } from '../shared/EmptyState';
import { Navigation } from '../shared/Navigation';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#84cc16'];

type SortField = 'symbol' | 'quantity' | 'value' | 'gainLoss' | 'purchaseDate';
type SortDirection = 'asc' | 'desc';
type QuickFilter = 'all' | 'gainers' | 'losers' | 'highValue';

interface FilterState {
  performance: 'all' | 'gainers' | 'losers' | 'breakEven';
  minValue: string;
  maxValue: string;
  minQuantity: string;
  maxQuantity: string;
  startDate: string;
  endDate: string;
}

interface FilterPreset {
  name: string;
  filters: FilterState;
}

const DEFAULT_FILTERS: FilterState = {
  performance: 'all',
  minValue: '',
  maxValue: '',
  minQuantity: '',
  maxQuantity: '',
  startDate: '',
  endDate: '',
};

const PRESET_FILTERS: FilterPreset[] = [
  {
    name: 'My Winners',
    filters: { ...DEFAULT_FILTERS, performance: 'gainers' },
  },
  {
    name: 'Need Attention',
    filters: { ...DEFAULT_FILTERS, performance: 'losers' },
  },
  {
    name: 'Recent Purchases',
    filters: {
      ...DEFAULT_FILTERS,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
  },
  {
    name: 'High Value',
    filters: { ...DEFAULT_FILTERS, minValue: '1000' },
  },
];

export function CryptoPortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const toast = useToast();
  const { applyUpdatesToPortfolio, isLiveEnabled } = usePriceUpdates();

  // Register assets for live updates
  useRegisterAssets(portfolio?.assets || [], 'crypto');

  // Load saved state from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('crypto-filters');
    const savedPresets = localStorage.getItem('crypto-filter-presets');
    const savedQuickFilter = localStorage.getItem('crypto-quick-filter');

    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }

    if (savedPresets) {
      try {
        setCustomPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error('Failed to parse saved presets', e);
      }
    }

    if (savedQuickFilter) {
      setQuickFilter(savedQuickFilter as QuickFilter);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('crypto-filters', JSON.stringify(filters));
  }, [filters]);

  // Save quick filter to localStorage
  useEffect(() => {
    localStorage.setItem('crypto-quick-filter', quickFilter);
  }, [quickFilter]);

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
      const data = await apiService.getCryptoPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load crypto portfolio', err);
      if (!isAutoRefresh) {
        toast.error('Failed to load crypto portfolio. Please try again.');
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

  const applyQuickFilter = useCallback((filter: QuickFilter) => {
    setQuickFilter(filter);
    switch (filter) {
      case 'gainers':
        setFilters({ ...DEFAULT_FILTERS, performance: 'gainers' });
        break;
      case 'losers':
        setFilters({ ...DEFAULT_FILTERS, performance: 'losers' });
        break;
      case 'highValue':
        setFilters({ ...DEFAULT_FILTERS, minValue: '1000' });
        break;
      default:
        setFilters(DEFAULT_FILTERS);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setQuickFilter('all');
    setSearchQuery('');
    setDebouncedSearchQuery('');
  }, []);

  const savePreset = useCallback(() => {
    if (!presetName.trim()) {
      toast.warning('Please enter a preset name');
      return;
    }

    const newPreset: FilterPreset = {
      name: presetName,
      filters: { ...filters },
    };

    const updatedPresets = [...customPresets, newPreset];
    setCustomPresets(updatedPresets);
    localStorage.setItem('crypto-filter-presets', JSON.stringify(updatedPresets));
    setShowSavePreset(false);
    setPresetName('');
    toast.success('Filter preset saved successfully');
  }, [presetName, filters, customPresets, toast]);

  const loadPreset = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters);
    setQuickFilter('all');
    toast.success(`Loaded preset: ${preset.name}`);
  }, [toast]);

  const deletePreset = useCallback((index: number) => {
    const updatedPresets = customPresets.filter((_, i) => i !== index);
    setCustomPresets(updatedPresets);
    localStorage.setItem('crypto-filter-presets', JSON.stringify(updatedPresets));
    toast.success('Preset deleted');
  }, [customPresets, toast]);

  const getActiveFilterSummary = useCallback(() => {
    const summary: string[] = [];

    if (filters.performance !== 'all') {
      summary.push(`Performance: ${filters.performance}`);
    }
    if (filters.minValue) {
      summary.push(`Min Value: $${filters.minValue}`);
    }
    if (filters.maxValue) {
      summary.push(`Max Value: $${filters.maxValue}`);
    }
    if (filters.minQuantity) {
      summary.push(`Min Quantity: ${filters.minQuantity}`);
    }
    if (filters.maxQuantity) {
      summary.push(`Max Quantity: ${filters.maxQuantity}`);
    }
    if (filters.startDate) {
      summary.push(`From: ${new Date(filters.startDate).toLocaleDateString()}`);
    }
    if (filters.endDate) {
      summary.push(`To: ${new Date(filters.endDate).toLocaleDateString()}`);
    }

    return summary;
  }, [filters]);

  const filteredAndSortedAssets = useMemo(() => {
    // Apply live price updates if enabled
    const displayPortfolio = isLiveEnabled && portfolio
      ? applyUpdatesToPortfolio(portfolio)
      : portfolio;

    if (!displayPortfolio) return [];

    let filtered = displayPortfolio.assets.filter(asset => {
      // Search filter
      if (debouncedSearchQuery && !asset.symbol.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        return false;
      }

      // Performance filter
      if (filters.performance !== 'all') {
        const gainLoss = asset.gain_loss || 0;
        if (filters.performance === 'gainers' && gainLoss <= 0) return false;
        if (filters.performance === 'losers' && gainLoss >= 0) return false;
        if (filters.performance === 'breakEven' && gainLoss !== 0) return false;
      }

      // Value range filter
      const currentValue = asset.current_value || 0;
      if (filters.minValue && currentValue < parseFloat(filters.minValue)) return false;
      if (filters.maxValue && currentValue > parseFloat(filters.maxValue)) return false;

      // Quantity range filter
      if (filters.minQuantity && asset.quantity < parseFloat(filters.minQuantity)) return false;
      if (filters.maxQuantity && asset.quantity > parseFloat(filters.maxQuantity)) return false;

      // Date range filter
      const purchaseDate = new Date(asset.purchase_date);
      if (filters.startDate && purchaseDate < new Date(filters.startDate)) return false;
      if (filters.endDate && purchaseDate > new Date(filters.endDate + 'T23:59:59')) return false;

      return true;
    });

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
        case 'purchaseDate':
          aVal = new Date(a.purchase_date).getTime();
          bVal = new Date(b.purchase_date).getTime();
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
  }, [portfolio, isLiveEnabled, applyUpdatesToPortfolio, debouncedSearchQuery, filters, sortField, sortDirection]);

  const handleImport = async (data: Array<{ symbol: string; quantity: number; purchasePrice: number; purchaseDate: string }>) => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        await apiService.addAsset({
          asset_type: 'crypto',
          symbol: item.symbol,
          quantity: item.quantity,
          purchase_price: item.purchasePrice,
          purchase_date: item.purchaseDate,
        });
        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push(`${item.symbol}: ${error.message || 'Failed to import'}`);
      }
    }

    // Reload portfolio after import
    await loadPortfolio();

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} asset(s)`);
    }

    if (failedCount > 0) {
      toast.error(`Failed to import ${failedCount} asset(s)`);
    }

    if (errors.length > 0 && errors.length <= 5) {
      errors.forEach(error => toast.error(error));
    }
  };

  if (loading && !portfolio) {
    return <SkeletonPortfolio />;
  }

  // Apply live price updates if enabled
  const displayPortfolio = isLiveEnabled && portfolio
    ? applyUpdatesToPortfolio(portfolio)
    : portfolio;

  const isPositive = (displayPortfolio?.total_gain_loss || 0) >= 0;

  // Prepare data for charts
  const holdingsData = displayPortfolio?.assets.map(asset => ({
    name: asset.symbol,
    value: asset.current_value || 0,
    percentage: ((asset.current_value || 0) / (displayPortfolio.total_value || 1)) * 100,
  })) || [];

  const performanceData = displayPortfolio?.assets.map(asset => ({
    name: asset.symbol,
    gainLoss: asset.gain_loss || 0,
    gainLossPercentage: asset.gain_loss_percentage || 0,
  })).sort((a, b) => b.gainLoss - a.gainLoss) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                Crypto Portfolio
              </h1>
              {refreshing && (
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
            <LivePriceIndicator showToggle={true} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title="Import from CSV"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Crypto
            </button>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Value</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-300">
              ${displayPortfolio?.total_value.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-all duration-300">{displayPortfolio?.assets.length || 0} assets</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Invested</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-300">
              ${displayPortfolio?.total_invested.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Gain/Loss</p>
            <p className={`text-3xl font-bold transition-all duration-300 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}${displayPortfolio?.total_gain_loss.toFixed(2) || '0.00'}
            </p>
            <p className={`text-sm font-semibold transition-all duration-300 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {displayPortfolio?.total_gain_loss_percentage.toFixed(2)}%
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
          {/* Header with Search and Filter Controls */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Crypto Assets</h2>
                {portfolio && portfolio.assets.length > 0 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Enhanced Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search by symbol... (e.g., BTC)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        showFilters
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {getActiveFilterSummary().length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-full">
                          {getActiveFilterSummary().length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Filter Chips */}
              {portfolio && portfolio.assets.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => applyQuickFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      quickFilter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => applyQuickFilter('gainers')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      quickFilter === 'gainers'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300'
                    }`}
                  >
                    Gainers
                  </button>
                  <button
                    onClick={() => applyQuickFilter('losers')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      quickFilter === 'losers'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300'
                    }`}
                  >
                    Losers
                  </button>
                  <button
                    onClick={() => applyQuickFilter('highValue')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      quickFilter === 'highValue'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    High Value (&gt;$1000)
                  </button>
                </div>
              )}

              {/* Results Summary */}
              {portfolio && portfolio.assets.length > 0 && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredAndSortedAssets.length} of {portfolio.assets.length} assets
                    </span>
                    {getActiveFilterSummary().length > 0 && (
                      <>
                        <span className="text-sm text-gray-400 dark:text-gray-500">|</span>
                        <span className="text-sm text-purple-600 dark:text-purple-400">
                          Filtered by: {getActiveFilterSummary().join(', ')}
                        </span>
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline"
                        >
                          Clear all
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && portfolio && portfolio.assets.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Performance Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Performance
                  </label>
                  <select
                    value={filters.performance}
                    onChange={(e) => setFilters({ ...filters, performance: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="gainers">Gainers Only</option>
                    <option value="losers">Losers Only</option>
                    <option value="breakEven">Break Even</option>
                  </select>
                </div>

                {/* Min Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Value ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minValue}
                    onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Max Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Value ($)
                  </label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={filters.maxValue}
                    onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Min Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    step="0.01"
                    value={filters.minQuantity}
                    onChange={(e) => setFilters({ ...filters, minQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Max Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="No limit"
                    step="0.01"
                    value={filters.maxQuantity}
                    onChange={(e) => setFilters({ ...filters, maxQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Date From
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Date To
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Filter Presets */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quick Presets
                  </label>
                  <button
                    onClick={() => setShowSavePreset(!showSavePreset)}
                    className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save Current
                  </button>
                </div>

                {showSavePreset && (
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Preset name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={savePreset}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSavePreset(false);
                        setPresetName('');
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {PRESET_FILTERS.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => loadPreset(preset)}
                      className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                  {customPresets.map((preset, index) => (
                    <div key={index} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <button
                        onClick={() => loadPreset(preset)}
                        className="px-3 py-1.5 text-indigo-700 dark:text-indigo-300 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-l-lg transition-colors"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => deletePreset(index)}
                        className="px-2 py-1.5 text-indigo-700 dark:text-indigo-300 hover:text-red-600 dark:hover:text-red-400 rounded-r-lg transition-colors"
                        title="Delete preset"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                                  className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded transition-colors"
                                  title={isExpanded ? "Collapse purchase history" : "Expand purchase history"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
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
                            {asset.quantity.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            ${asset.purchase_price.toFixed(2)}
                            {hasMultiplePurchases && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(avg)</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <PriceChangeIndicator
                              symbol={asset.symbol}
                              currentPrice={asset.current_price || asset.purchase_price}
                              showIcon={true}
                            />
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
                            <td colSpan={7} className="px-6 py-4 bg-purple-50 dark:bg-gray-900/50">
                              <div className="text-sm">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Purchase History</h4>
                                <div className="space-y-2">
                                  {asset.purchase_history?.map((purchase) => (
                                    <div
                                      key={purchase.purchase_id}
                                      className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-100 dark:border-purple-900"
                                    >
                                      <div className="flex-1">
                                        <span className="text-gray-600 dark:text-gray-400">Date: </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {new Date(purchase.purchase_date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-gray-600 dark:text-gray-400">Quantity: </span>
                                        <span className="font-medium text-gray-900 dark:text-white">{purchase.quantity.toFixed(4)}</span>
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-gray-600 dark:text-gray-400">Price: </span>
                                        <span className="font-medium text-gray-900 dark:text-white">${purchase.purchase_price.toFixed(2)}</span>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <span className="text-gray-600 dark:text-gray-400">Total: </span>
                                        <span className="font-semibold text-purple-600 dark:text-purple-400">${purchase.total_cost.toFixed(2)}</span>
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
                        <span className="font-medium text-gray-900 dark:text-white">{asset.quantity.toFixed(4)}</span>
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
                        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-purple-100 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-600 dark:bg-purple-700 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{asset.symbol.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{asset.symbol}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{asset.quantity.toFixed(4)} units</p>
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
                          <div className="flex justify-between items-center pb-3 border-b border-purple-200 dark:border-gray-600">
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

                          <div className="flex justify-between items-center pt-3 border-t border-purple-200 dark:border-gray-600">
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
              assetType="crypto"
              onAddAsset={() => setIsModalOpen(true)}
            />
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

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        assetType="crypto"
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        assets={filteredAndSortedAssets}
        assetType="crypto"
        portfolioTotals={{
          totalValue: portfolio?.total_value || 0,
          totalInvested: portfolio?.total_invested || 0,
          totalGainLoss: portfolio?.total_gain_loss || 0,
          totalGainLossPercentage: portfolio?.total_gain_loss_percentage || 0,
        }}
      />
    </div>
  );
}
