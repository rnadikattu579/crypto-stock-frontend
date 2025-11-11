import { useState, useMemo } from 'react';
import { Navigation } from '../shared/Navigation';
import {
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUpDown,
  X,
  FileText
} from 'lucide-react';

// Transaction type definition
export interface Transaction {
  transaction_id: string;
  asset_symbol: string;
  asset_name: string;
  asset_type: 'crypto' | 'stock';
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price_per_unit: number;
  total_value: number;
  transaction_date: string;
  notes?: string;
}

// Mock transaction data
const mockTransactions: Transaction[] = [
  {
    transaction_id: '1',
    asset_symbol: 'BTC',
    asset_name: 'Bitcoin',
    asset_type: 'crypto',
    transaction_type: 'buy',
    quantity: 0.5,
    price_per_unit: 45000,
    total_value: 22500,
    transaction_date: '2025-01-15T10:30:00Z',
    notes: 'Initial Bitcoin purchase'
  },
  {
    transaction_id: '2',
    asset_symbol: 'ETH',
    asset_name: 'Ethereum',
    asset_type: 'crypto',
    transaction_type: 'buy',
    quantity: 5,
    price_per_unit: 3200,
    total_value: 16000,
    transaction_date: '2025-01-14T14:20:00Z',
    notes: 'Bought during market dip'
  },
  {
    transaction_id: '3',
    asset_symbol: 'AAPL',
    asset_name: 'Apple Inc.',
    asset_type: 'stock',
    transaction_type: 'buy',
    quantity: 10,
    price_per_unit: 180.50,
    total_value: 1805,
    transaction_date: '2025-01-10T09:15:00Z'
  },
  {
    transaction_id: '4',
    asset_symbol: 'TSLA',
    asset_name: 'Tesla Inc.',
    asset_type: 'stock',
    transaction_type: 'buy',
    quantity: 5,
    price_per_unit: 250.75,
    total_value: 1253.75,
    transaction_date: '2025-01-08T11:45:00Z',
    notes: 'Long-term investment'
  },
  {
    transaction_id: '5',
    asset_symbol: 'SOL',
    asset_name: 'Solana',
    asset_type: 'crypto',
    transaction_type: 'buy',
    quantity: 50,
    price_per_unit: 95.50,
    total_value: 4775,
    transaction_date: '2024-12-28T16:30:00Z'
  },
  {
    transaction_id: '6',
    asset_symbol: 'GOOGL',
    asset_name: 'Alphabet Inc.',
    asset_type: 'stock',
    transaction_type: 'buy',
    quantity: 8,
    price_per_unit: 142.30,
    total_value: 1138.40,
    transaction_date: '2024-12-20T10:00:00Z',
    notes: 'Tech sector diversification'
  },
  {
    transaction_id: '7',
    asset_symbol: 'BTC',
    asset_name: 'Bitcoin',
    asset_type: 'crypto',
    transaction_type: 'buy',
    quantity: 0.25,
    price_per_unit: 43500,
    total_value: 10875,
    transaction_date: '2024-12-15T13:20:00Z'
  },
  {
    transaction_id: '8',
    asset_symbol: 'MSFT',
    asset_name: 'Microsoft Corporation',
    asset_type: 'stock',
    transaction_type: 'buy',
    quantity: 12,
    price_per_unit: 375.80,
    total_value: 4509.60,
    transaction_date: '2024-12-10T14:30:00Z'
  },
  {
    transaction_id: '9',
    asset_symbol: 'ADA',
    asset_name: 'Cardano',
    asset_type: 'crypto',
    transaction_type: 'buy',
    quantity: 1000,
    price_per_unit: 0.65,
    total_value: 650,
    transaction_date: '2024-12-05T09:45:00Z',
    notes: 'Small cap crypto investment'
  },
  {
    transaction_id: '10',
    asset_symbol: 'NVDA',
    asset_name: 'NVIDIA Corporation',
    asset_type: 'stock',
    transaction_type: 'buy',
    quantity: 6,
    price_per_unit: 495.20,
    total_value: 2971.20,
    transaction_date: '2024-11-28T15:10:00Z'
  },
  {
    transaction_id: '11',
    asset_symbol: 'ETH',
    asset_name: 'Ethereum',
    asset_type: 'crypto',
    transaction_type: 'sell',
    quantity: 2,
    price_per_unit: 3500,
    total_value: 7000,
    transaction_date: '2024-11-20T11:30:00Z',
    notes: 'Partial profit taking'
  },
  {
    transaction_id: '12',
    asset_symbol: 'AAPL',
    asset_name: 'Apple Inc.',
    asset_type: 'stock',
    transaction_type: 'buy',
    quantity: 5,
    price_per_unit: 175.30,
    total_value: 876.50,
    transaction_date: '2024-11-15T10:20:00Z'
  },
  {
    transaction_id: '13',
    asset_symbol: 'DOT',
    asset_name: 'Polkadot',
    asset_type: 'crypto',
    transaction_type: 'buy',
    quantity: 200,
    price_per_unit: 7.85,
    total_value: 1570,
    transaction_date: '2024-11-10T12:00:00Z'
  },
  {
    transaction_id: '14',
    asset_symbol: 'TSLA',
    asset_name: 'Tesla Inc.',
    asset_type: 'stock',
    transaction_type: 'sell',
    quantity: 2,
    price_per_unit: 265.50,
    total_value: 531,
    transaction_date: '2024-11-05T14:45:00Z',
    notes: 'Rebalancing portfolio'
  },
  {
    transaction_id: '15',
    asset_symbol: 'BNB',
    asset_name: 'Binance Coin',
    asset_type: 'crypto',
    transaction_type: 'buy',
    quantity: 10,
    price_per_unit: 320.50,
    total_value: 3205,
    transaction_date: '2024-10-28T16:15:00Z'
  }
];

type SortField = 'date' | 'value' | 'symbol';
type SortOrder = 'asc' | 'desc';

export function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssetType, setFilterAssetType] = useState<'all' | 'crypto' | 'stock'>('all');
  const [filterTransactionType, setFilterTransactionType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [loading] = useState(false);

  // Get unique assets for filter dropdown
  const uniqueAssets = useMemo(() => {
    const assets = new Set(mockTransactions.map(t => t.asset_symbol));
    return Array.from(assets).sort();
  }, []);

  // Apply filters and sorting
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...mockTransactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.asset_symbol.toLowerCase().includes(query) ||
        t.asset_name.toLowerCase().includes(query) ||
        (t.notes?.toLowerCase().includes(query))
      );
    }

    // Asset type filter
    if (filterAssetType !== 'all') {
      filtered = filtered.filter(t => t.asset_type === filterAssetType);
    }

    // Transaction type filter
    if (filterTransactionType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filterTransactionType);
    }

    // Asset filter
    if (filterAsset !== 'all') {
      filtered = filtered.filter(t => t.asset_symbol === filterAsset);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.transaction_date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.transaction_date) <= new Date(dateTo));
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
          break;
        case 'value':
          comparison = a.total_value - b.total_value;
          break;
        case 'symbol':
          comparison = a.asset_symbol.localeCompare(b.asset_symbol);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [searchQuery, filterAssetType, filterTransactionType, filterAsset, dateFrom, dateTo, sortField, sortOrder]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const buyTransactions = filteredAndSortedTransactions.filter(t => t.transaction_type === 'buy');
    const sellTransactions = filteredAndSortedTransactions.filter(t => t.transaction_type === 'sell');

    const totalInvested = buyTransactions.reduce((sum, t) => sum + t.total_value, 0);
    const totalSold = sellTransactions.reduce((sum, t) => sum + t.total_value, 0);

    return {
      totalTransactions: filteredAndSortedTransactions.length,
      totalBuy: buyTransactions.length,
      totalSell: sellTransactions.length,
      totalInvested,
      totalSold
    };
  }, [filteredAndSortedTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date & Time', 'Asset Symbol', 'Asset Name', 'Type', 'Asset Type', 'Quantity', 'Price per Unit', 'Total Value', 'Notes'];
    const rows = filteredAndSortedTransactions.map(t => [
      new Date(t.transaction_date).toLocaleString(),
      t.asset_symbol,
      t.asset_name,
      t.transaction_type.toUpperCase(),
      t.asset_type.toUpperCase(),
      t.quantity.toString(),
      `$${t.price_per_unit.toFixed(2)}`,
      `$${t.total_value.toFixed(2)}`,
      t.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterAssetType('all');
    setFilterTransactionType('all');
    setFilterAsset('all');
    setDateFrom('');
    setDateTo('');
  };

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
          <button
            onClick={exportToCSV}
            disabled={filteredAndSortedTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Download className="h-5 w-5" />
            Export to CSV
          </button>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalTransactions}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invested</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${statistics.totalInvested.toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Buy Transactions</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalBuy}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sell Transactions</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalSell}</p>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by asset symbol or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  showFilters
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="h-5 w-5" />
                Filters
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asset Type
                  </label>
                  <select
                    value={filterAssetType}
                    onChange={(e) => setFilterAssetType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Assets</option>
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={filterTransactionType}
                    onChange={(e) => setFilterTransactionType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Specific Asset
                  </label>
                  <select
                    value={filterAsset}
                    onChange={(e) => setFilterAsset(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Assets</option>
                    {uniqueAssets.map(asset => (
                      <option key={asset} value={asset}>{asset}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions Table - Desktop View */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    onClick={() => toggleSort('date')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date & Time
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('symbol')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      Asset Symbol
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Asset Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price per Unit
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">No transactions found</p>
                        <p className="text-sm">Try adjusting your filters or search query</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTransactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-white">{transaction.asset_symbol}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{transaction.asset_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.transaction_type === 'buy'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}>
                          {transaction.transaction_type === 'buy' ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {transaction.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.asset_type === 'crypto'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        }`}>
                          {transaction.asset_type === 'crypto' ? 'Crypto' : 'Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${transaction.price_per_unit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        ${transaction.total_value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {transaction.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions Cards - Mobile View */}
        <div className="lg:hidden space-y-4">
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12">
              <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium">No transactions found</p>
                <p className="text-sm text-center">Try adjusting your filters or search query</p>
              </div>
            </div>
          ) : (
            filteredAndSortedTransactions.map((transaction) => (
              <div key={transaction.transaction_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{transaction.asset_symbol}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.asset_name}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.transaction_type === 'buy'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}>
                    {transaction.transaction_type === 'buy' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {transaction.transaction_type.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Asset Type</p>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.asset_type === 'crypto'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                    }`}>
                      {transaction.asset_type === 'crypto' ? 'Crypto' : 'Stock'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quantity</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price per Unit</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${transaction.price_per_unit.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${transaction.total_value.toFixed(2)}
                    </p>
                  </div>
                  {transaction.notes && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Count */}
        {filteredAndSortedTransactions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedTransactions.length} of {mockTransactions.length} transactions
          </div>
        )}
      </main>
    </div>
  );
}
