import { useEffect, useState, useMemo } from 'react';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Search, ArrowUpDown, List, LayoutGrid, ShoppingCart, X } from 'lucide-react';
import { Navigation } from '../shared/Navigation';
import { useToast } from '../../contexts/ToastContext';

interface WatchlistItem {
  id: string;
  symbol: string;
  assetType: 'crypto' | 'stock';
  targetPrice?: number;
  notes?: string;
  addedAt: string;
  currentPrice?: number;
  change24h?: number;
  changePercent24h?: number;
}

type SortField = 'symbol' | 'price' | 'change';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'crypto' | 'stock';

export function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [newItem, setNewItem] = useState({
    symbol: '',
    assetType: 'crypto' as 'crypto' | 'stock',
    targetPrice: '',
    notes: '',
  });
  const toast = useToast();

  useEffect(() => {
    loadWatchlist();
    // Simulate price updates every 10 seconds
    const interval = setInterval(() => {
      updatePrices();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadWatchlist = () => {
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      const items = JSON.parse(saved);
      // Initialize with mock prices
      const itemsWithPrices = items.map((item: WatchlistItem) => ({
        ...item,
        currentPrice: item.currentPrice || generateMockPrice(item.assetType),
        change24h: item.change24h || generateMockChange(),
        changePercent24h: item.changePercent24h || (Math.random() * 20 - 10),
      }));
      setWatchlist(itemsWithPrices);
    }
  };

  const generateMockPrice = (assetType: 'crypto' | 'stock') => {
    return assetType === 'crypto'
      ? Math.random() * 50000 + 1000
      : Math.random() * 500 + 50;
  };

  const generateMockChange = () => {
    return (Math.random() * 200 - 100);
  };

  const updatePrices = () => {
    setWatchlist(prev => prev.map(item => {
      const priceChange = (Math.random() * 10 - 5) / 100;
      const newPrice = (item.currentPrice || 0) * (1 + priceChange);
      const change = newPrice - (item.currentPrice || 0);
      const changePercent = (change / (item.currentPrice || 1)) * 100;

      return {
        ...item,
        currentPrice: newPrice,
        change24h: change,
        changePercent24h: changePercent,
      };
    }));
  };

  const saveWatchlist = (items: WatchlistItem[]) => {
    localStorage.setItem('watchlist', JSON.stringify(items));
    setWatchlist(items);
  };

  const handleAddToWatchlist = () => {
    if (!newItem.symbol) {
      toast.error('Please enter a symbol');
      return;
    }

    // Check if already exists
    if (watchlist.some(item => item.symbol.toUpperCase() === newItem.symbol.toUpperCase())) {
      toast.error('This asset is already in your watchlist');
      return;
    }

    const item: WatchlistItem = {
      id: Date.now().toString(),
      symbol: newItem.symbol.toUpperCase(),
      assetType: newItem.assetType,
      targetPrice: newItem.targetPrice ? parseFloat(newItem.targetPrice) : undefined,
      notes: newItem.notes || undefined,
      addedAt: new Date().toISOString(),
      currentPrice: generateMockPrice(newItem.assetType),
      change24h: generateMockChange(),
      changePercent24h: Math.random() * 20 - 10,
    };

    const updated = [...watchlist, item];
    saveWatchlist(updated);
    setShowAddModal(false);
    setNewItem({
      symbol: '',
      assetType: 'crypto',
      targetPrice: '',
      notes: '',
    });
    toast.success(`${item.symbol} added to watchlist`);

    // If target price is set, create an alert
    if (item.targetPrice) {
      const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
      const alert = {
        id: Date.now().toString() + '-alert',
        symbol: item.symbol,
        assetType: item.assetType,
        targetPrice: item.targetPrice,
        condition: 'above' as const,
        triggered: false,
        createdAt: new Date().toISOString(),
      };
      alerts.push(alert);
      localStorage.setItem('priceAlerts', JSON.stringify(alerts));
      toast.success('Price alert created');
    }
  };

  const handleRemove = (id: string) => {
    const item = watchlist.find(i => i.id === id);
    const updated = watchlist.filter(i => i.id !== id);
    saveWatchlist(updated);
    toast.success(`${item?.symbol} removed from watchlist`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = watchlist.filter(item => {
      const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || item.assetType === filterType;
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case 'price':
          aVal = a.currentPrice || 0;
          bVal = b.currentPrice || 0;
          break;
        case 'change':
          aVal = a.changePercent24h || 0;
          bVal = b.changePercent24h || 0;
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
  }, [watchlist, searchQuery, sortField, sortDirection, filterType]);

  const stats = useMemo(() => {
    const cryptoCount = watchlist.filter(i => i.assetType === 'crypto').length;
    const stockCount = watchlist.filter(i => i.assetType === 'stock').length;
    const avgChange = watchlist.reduce((sum, item) => sum + (item.changePercent24h || 0), 0) / (watchlist.length || 1);

    return {
      total: watchlist.length,
      crypto: cryptoCount,
      stocks: stockCount,
      avgChange,
    };
  }, [watchlist]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
              Watchlist
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Track assets you're interested in</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Add to Watchlist
          </button>
        </div>

        {/* Statistics Cards */}
        {watchlist.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Watched</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Crypto Assets</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.crypto}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Stock Assets</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.stocks}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Avg 24h Change</p>
              <p className={`text-3xl font-bold ${stats.avgChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {watchlist.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by symbol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Asset Type Filter */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                      filterType === 'all'
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('crypto')}
                    className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                      filterType === 'crypto'
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Crypto
                  </button>
                  <button
                    onClick={() => setFilterType('stock')}
                    className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                      filterType === 'stock'
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Stocks
                  </button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>

                {/* Sort Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSort('symbol')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortField === 'symbol'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Symbol
                      {sortField === 'symbol' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </button>
                  <button
                    onClick={() => handleSort('price')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortField === 'price'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Price
                      {sortField === 'price' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </button>
                  <button
                    onClick={() => handleSort('change')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortField === 'change'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      24h Change
                      {sortField === 'change' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist Items */}
        {filteredAndSortedItems.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedItems.map((item) => {
                  const isPositive = (item.changePercent24h || 0) >= 0;
                  const isAboveTarget = item.targetPrice && item.currentPrice && item.currentPrice >= item.targetPrice;

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            item.assetType === 'crypto'
                              ? 'bg-purple-100 dark:bg-purple-900'
                              : 'bg-indigo-100 dark:bg-indigo-900'
                          }`}>
                            <span className={`font-bold text-lg ${
                              item.assetType === 'crypto'
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }`}>
                              {item.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.symbol}</h3>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              item.assetType === 'crypto'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                                : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                            }`}>
                              {item.assetType.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${item.currentPrice?.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">24h Change</span>
                          <div className="flex items-center gap-1">
                            {isPositive ? (
                              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                            <span className={`font-bold ${
                              isPositive
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {isPositive ? '+' : ''}{item.changePercent24h?.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {item.targetPrice && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Target Price</span>
                            <span className={`font-semibold ${
                              isAboveTarget
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              ${item.targetPrice.toFixed(2)}
                              {isAboveTarget && ' ✓'}
                            </span>
                          </div>
                        )}

                        {item.notes && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">{item.notes}</p>
                          </div>
                        )}
                      </div>

                      <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:shadow-md transition-all"
                        onClick={() => {
                          toast.info('Add to Portfolio feature coming soon!');
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Portfolio
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Symbol / Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          24h Change
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Target Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredAndSortedItems.map((item) => {
                        const isPositive = (item.changePercent24h || 0) >= 0;
                        const isAboveTarget = item.targetPrice && item.currentPrice && item.currentPrice >= item.targetPrice;

                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="font-bold text-gray-900 dark:text-white">{item.symbol}</div>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  item.assetType === 'crypto'
                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                                    : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                                }`}>
                                  {item.assetType.toUpperCase()}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                ${item.currentPrice?.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isPositive ? (
                                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                                <div>
                                  <div className={`font-bold ${
                                    isPositive
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {isPositive ? '+' : ''}${item.change24h?.toFixed(2)}
                                  </div>
                                  <div className={`text-sm ${
                                    isPositive
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    ({isPositive ? '+' : ''}{item.changePercent24h?.toFixed(2)}%)
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.targetPrice ? (
                                <div className={`font-semibold ${
                                  isAboveTarget
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  ${item.targetPrice.toFixed(2)}
                                  {isAboveTarget && ' ✓'}
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                  onClick={() => {
                                    toast.info('Add to Portfolio feature coming soon!');
                                  }}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  Add
                                </button>
                                <button
                                  onClick={() => handleRemove(item.id)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Remove from watchlist"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : watchlist.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full p-6 mb-6 bg-blue-100 dark:bg-blue-900">
                <Eye className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Assets in Watchlist</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                Start tracking assets you're interested in. Add them to your watchlist to monitor prices and changes.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5" />
                Add Your First Asset
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12">
            <div className="text-center">
              <Search className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Results Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Add to Watchlist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 animate-slideUp">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add to Watchlist</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Symbol
                </label>
                <input
                  type="text"
                  required
                  value={newItem.symbol}
                  onChange={(e) => setNewItem({ ...newItem, symbol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="BTC, AAPL, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Asset Type
                </label>
                <select
                  value={newItem.assetType}
                  onChange={(e) => setNewItem({ ...newItem, assetType: e.target.value as 'crypto' | 'stock' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="crypto">Cryptocurrency</option>
                  <option value="stock">Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Price (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.targetPrice}
                  onChange={(e) => setNewItem({ ...newItem, targetPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Set a price alert (will also create an alert on Alerts page)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Why are you tracking this asset?"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddToWatchlist}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
