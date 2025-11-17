import { useState, useMemo, useEffect } from 'react';
import { Navigation } from '../shared/Navigation';
import { apiService } from '../../services/api';
import { Transaction } from '../../types';
import { toast } from 'react-hot-toast';
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
  FileText,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

type SortField = 'date' | 'value' | 'symbol';
type SortOrder = 'asc' | 'desc';

export function TransactionHistory() {
  // State for transactions from API
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssetType, setFilterAssetType] = useState<'all' | 'crypto' | 'stock'>('all');
  const [filterTransactionType, setFilterTransactionType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load transactions from API
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTransactions({ limit: 500 });
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Failed to load transactions', error);
      toast.error('Failed to load transactions. Please try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique assets for filter dropdown
  const uniqueAssets = useMemo(() => {
    const assets = new Set(transactions.map(t => t.symbol));
    return Array.from(assets).sort();
  }, [transactions]);

  // Apply filters and sorting
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.symbol.toLowerCase().includes(query) ||
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
      filtered = filtered.filter(t => t.symbol === filterAsset);
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
          comparison = a.symbol.localeCompare(b.symbol);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchQuery, filterAssetType, filterTransactionType, filterAsset, dateFrom, dateTo, sortField, sortOrder]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const buyTransactions = filteredAndSortedTransactions.filter(t => t.transaction_type === 'buy');
    const sellTransactions = filteredAndSortedTransactions.filter(t => t.transaction_type === 'sell');

    const totalInvested = buyTransactions.reduce((sum, t) => sum + t.total_value + t.fees, 0);
    const totalSold = sellTransactions.reduce((sum, t) => sum + t.total_value - t.fees, 0);

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
    const headers = ['Date & Time', 'Asset Symbol', 'Type', 'Asset Type', 'Quantity', 'Price per Unit', 'Total Value', 'Fees', 'Notes'];
    const rows = filteredAndSortedTransactions.map(t => [
      new Date(t.transaction_date).toLocaleString(),
      t.symbol,
      t.transaction_type.toUpperCase(),
      t.asset_type.toUpperCase(),
      t.quantity.toString(),
      `$${t.price.toFixed(2)}`,
      `$${t.total_value.toFixed(2)}`,
      `$${t.fees.toFixed(2)}`,
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

  // Delete transaction
  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await apiService.deleteTransaction(transactionId);
      toast.success('Transaction deleted successfully');
      loadTransactions(); // Reload transactions
    } catch (error) {
      console.error('Failed to delete transaction', error);
      toast.error('Failed to delete transaction');
    }
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
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={filteredAndSortedTransactions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Download className="h-5 w-5" />
              Export to CSV
            </button>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">No transactions found</p>
                        <p className="text-sm">Try adjusting your filters or add a new transaction</p>
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
                        <span className="font-bold text-gray-900 dark:text-white">{transaction.symbol}</span>
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
                        ${transaction.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        ${transaction.total_value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {transaction.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteTransaction(transaction.transaction_id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                <p className="text-sm text-center">Try adjusting your filters or add a new transaction</p>
              </div>
            </div>
          ) : (
            filteredAndSortedTransactions.map((transaction) => (
              <div key={transaction.transaction_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{transaction.symbol}</h3>
                  </div>
                  <div className="flex gap-2">
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
                    <button
                      onClick={() => deleteTransaction(transaction.transaction_id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
                      ${transaction.price.toFixed(2)}
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
            Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
          </div>
        )}
      </main>
    </div>
  );
}
