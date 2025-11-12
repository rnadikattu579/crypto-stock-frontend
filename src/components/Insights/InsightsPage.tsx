import { useState, useEffect, useMemo } from 'react';
import {
  Lightbulb,
  Filter,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  Shield,
  PieChart as PieChartIcon,
  Activity as ActivityIcon,
  AlertCircle,
} from 'lucide-react';
import type { Portfolio, PortfolioSummary } from '../../types';
import type { Insight, PortfolioHealth, RiskAnalysis, InsightFilters, InsightCategory } from '../../types/insights';
import { calculatePortfolioHealth, analyzeRisk, generateInsights, getRiskColor, getRiskBgColor } from '../../utils/portfolioAnalysis';
import { apiService } from '../../services/api';
import { Navigation } from '../shared/Navigation';
import { LivePriceIndicator } from '../shared/LivePriceIndicator';
import { HealthScore } from './HealthScore';
import { InsightCard } from './InsightCard';
import { SkeletonDashboard } from '../shared/LoadingSkeleton';
import { usePriceUpdates, useRegisterAssets } from '../../contexts/PriceUpdateContext';

const STORAGE_KEY = 'portfolio-insights-dismissed';

const categories: InsightCategory[] = ['Performance', 'Risk', 'Diversification', 'Activity', 'Opportunities'];

export function InsightsPage() {
  const [cryptoPortfolio, setCryptoPortfolio] = useState<Portfolio | null>(null);
  const [stockPortfolio, setStockPortfolio] = useState<Portfolio | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [health, setHealth] = useState<PortfolioHealth | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get live price update hooks
  const { isLiveEnabled, applyUpdatesToPortfolio } = usePriceUpdates();

  // Register assets for live updates
  useRegisterAssets(cryptoPortfolio?.assets || [], 'crypto');
  useRegisterAssets(stockPortfolio?.assets || [], 'stock');

  // Filters
  const [filters, setFilters] = useState<InsightFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Load dismissed insights from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setDismissedInsights(data.dismissed || []);
      }
    } catch (error) {
      console.error('Error loading dismissed insights:', error);
    }
  }, []);

  // Apply live price updates to portfolios (memoized to prevent infinite loops)
  const displayCryptoPortfolio = useMemo(() => {
    return isLiveEnabled && cryptoPortfolio
      ? applyUpdatesToPortfolio(cryptoPortfolio)
      : cryptoPortfolio;
  }, [isLiveEnabled, cryptoPortfolio, applyUpdatesToPortfolio]);

  const displayStockPortfolio = useMemo(() => {
    return isLiveEnabled && stockPortfolio
      ? applyUpdatesToPortfolio(stockPortfolio)
      : stockPortfolio;
  }, [isLiveEnabled, stockPortfolio, applyUpdatesToPortfolio]);

  // Recalculate summary with live prices (memoized to prevent infinite loops)
  const displaySummary = useMemo(() => {
    return isLiveEnabled && summary ? {
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
  }, [isLiveEnabled, summary, displayCryptoPortfolio, displayStockPortfolio]);

  // Generate insights when data changes (using live updated data)
  useEffect(() => {
    if (!displaySummary) return;

    // Calculate health score with live data
    const healthData = calculatePortfolioHealth(displayCryptoPortfolio, displayStockPortfolio, displaySummary);
    setHealth(healthData);

    // Analyze risk with live data
    const risk = analyzeRisk(displayCryptoPortfolio, displayStockPortfolio, displaySummary);
    setRiskAnalysis(risk);

    // Generate insights with live data
    const generatedInsights = generateInsights(
      displayCryptoPortfolio,
      displayStockPortfolio,
      displaySummary,
      risk,
      dismissedInsights
    );

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    generatedInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setInsights(generatedInsights);
  }, [displayCryptoPortfolio, displayStockPortfolio, displaySummary, dismissedInsights, isLiveEnabled]);

  // Apply filters
  useEffect(() => {
    let filtered = [...insights];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(i => i.category === filters.category);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(i => i.priority === filters.priority);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        i =>
          i.title.toLowerCase().includes(term) ||
          i.message.toLowerCase().includes(term) ||
          i.metadata?.assetSymbol?.toLowerCase().includes(term)
      );
    }

    setFilteredInsights(filtered);
  }, [insights, filters, searchTerm]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [summaryData, cryptoData, stockData] = await Promise.all([
        apiService.getPortfolioSummary(),
        apiService.getCryptoPortfolio(),
        apiService.getStockPortfolio(),
      ]);

      setSummary(summaryData);
      setCryptoPortfolio(cryptoData);
      setStockPortfolio(stockData);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDismissInsight = (insightId: string) => {
    const newDismissed = [...dismissedInsights, insightId];
    setDismissedInsights(newDismissed);

    // Save to localStorage
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          dismissed: newDismissed,
          lastUpdated: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error saving dismissed insights:', error);
    }

    setInsights(insights.filter(i => i.id !== insightId));
  };

  const handleExportInsights = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      portfolioHealth: health,
      riskAnalysis,
      insights: filteredInsights.map(i => ({
        priority: i.priority,
        category: i.category,
        title: i.title,
        message: i.message,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-insights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  const categoryIcons = {
    Performance: TrendingUp,
    Risk: Shield,
    Diversification: PieChartIcon,
    Activity: ActivityIcon,
    Opportunities: AlertCircle,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Insights</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered analysis and recommendations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LivePriceIndicator showToggle={false} />
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExportInsights}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Health Score & Risk Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Health Score Card */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Health Score</h2>
            {health && <HealthScore health={health} />}
          </div>

          {/* Risk Analysis Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Risk Analysis</h2>
            {riskAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Concentration Risk */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Concentration Risk
                    </span>
                    <span className={`text-lg font-bold ${getRiskColor(
                      riskAnalysis.concentrationRisk > 40 ? 'high' : riskAnalysis.concentrationRisk > 25 ? 'medium' : 'low'
                    )}`}>
                      {riskAnalysis.concentrationRisk.toFixed(1)}%
                    </span>
                  </div>
                  {riskAnalysis.concentrationAsset && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Largest holding: {riskAnalysis.concentrationAsset}
                    </p>
                  )}
                </div>

                {/* Overall Risk */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Overall Risk Level
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskBgColor(riskAnalysis.overallRisk)} ${getRiskColor(riskAnalysis.overallRisk)}`}>
                      {riskAnalysis.overallRisk.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Crypto/Stock Balance */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Asset Type Balance
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Crypto</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {riskAnalysis.cryptoStockBalance.crypto.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Stocks</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {riskAnalysis.cryptoStockBalance.stock.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Volatility Score */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Volatility Score
                    </span>
                    <span className={`text-lg font-bold ${getRiskColor(
                      riskAnalysis.volatilityScore > 70 ? 'high' : riskAnalysis.volatilityScore > 50 ? 'medium' : 'low'
                    )}`}>
                      {riskAnalysis.volatilityScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        riskAnalysis.volatilityScore > 70
                          ? 'bg-red-600'
                          : riskAnalysis.volatilityScore > 50
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${riskAnalysis.volatilityScore}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
              {(filters.category || filters.priority) && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>

            {(filters.category || filters.priority || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const Icon = categoryIcons[category];
                      return (
                        <button
                          key={category}
                          onClick={() =>
                            setFilters({
                              ...filters,
                              category: filters.category === category ? undefined : category,
                            })
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            filters.category === category
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['high', 'medium', 'low'].map((priority) => (
                      <button
                        key={priority}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            priority: filters.priority === priority ? undefined : (priority as any),
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          filters.priority === priority
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {priority.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              All Insights ({filteredInsights.length})
            </h2>
          </div>

          {filteredInsights.length > 0 ? (
            <div className="space-y-3">
              {filteredInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onDismiss={handleDismissInsight}
                  showDismiss={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <Lightbulb className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No insights found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filters.category || filters.priority
                  ? 'Try adjusting your filters or search terms'
                  : 'Your portfolio is performing well with no immediate concerns'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
