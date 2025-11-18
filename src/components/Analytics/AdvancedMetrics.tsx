import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Award
} from 'lucide-react';
import { apiService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import type { MetricsResponse, BenchmarkResponse } from '../../types';

export function AdvancedMetrics() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(365);
  const [metricsData, setMetricsData] = useState<MetricsResponse | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResponse | null>(null);

  const periods = [
    { value: 30, label: '30D' },
    { value: 90, label: '90D' },
    { value: 365, label: '1Y' }
  ];

  useEffect(() => {
    loadData();
  }, [periodDays]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metrics, benchmarks] = await Promise.all([
        apiService.getAdvancedMetrics(periodDays),
        apiService.getBenchmarkComparison(['SP500', 'BTC'], periodDays)
      ]);
      setMetricsData(metrics);
      setBenchmarkData(benchmarks);
    } catch (error) {
      console.error('Failed to load advanced metrics', error);
      toast.error('Failed to load advanced metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const metrics = metricsData?.metrics;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Metrics</h3>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodDays(p.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                periodDays === p.value
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!metrics ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {metricsData?.message || 'Need more historical data to calculate metrics'}
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Sharpe Ratio"
              value={metrics.sharpe_ratio.toFixed(2)}
              icon={<Award className="h-5 w-5" />}
              description="Risk-adjusted return"
              good={metrics.sharpe_ratio > 1}
              bad={metrics.sharpe_ratio < 0}
            />
            <MetricCard
              label="Sortino Ratio"
              value={metrics.sortino_ratio.toFixed(2)}
              icon={<TrendingUp className="h-5 w-5" />}
              description="Downside risk-adjusted"
              good={metrics.sortino_ratio > 1}
              bad={metrics.sortino_ratio < 0}
            />
            <MetricCard
              label="Volatility"
              value={`${metrics.annualized_volatility.toFixed(1)}%`}
              icon={<Activity className="h-5 w-5" />}
              description="Annual std deviation"
              good={metrics.annualized_volatility < 20}
              bad={metrics.annualized_volatility > 40}
            />
            <MetricCard
              label="Max Drawdown"
              value={`${metrics.max_drawdown.toFixed(1)}%`}
              icon={<TrendingDown className="h-5 w-5" />}
              description="Largest drop from peak"
              good={metrics.max_drawdown < 15}
              bad={metrics.max_drawdown > 30}
            />
          </div>

          {/* Returns Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Returns</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Return</p>
                <p className={`text-xl font-bold ${
                  metrics.total_return >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {metrics.total_return >= 0 ? '+' : ''}{metrics.total_return.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Annualized</p>
                <p className={`text-xl font-bold ${
                  metrics.annualized_return >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {metrics.annualized_return >= 0 ? '+' : ''}{metrics.annualized_return.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Best Day</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  +{metrics.best_day.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Worst Day</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {metrics.worst_day.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Trading Days</h4>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {metrics.positive_days}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Positive</p>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${metrics.win_rate}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {metrics.win_rate.toFixed(1)}% Win Rate
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {metrics.negative_days}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Negative</p>
              </div>
            </div>
          </div>

          {/* Benchmark Comparison */}
          {benchmarkData && benchmarkData.comparisons.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Benchmark Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 dark:text-gray-400">
                      <th className="pb-3">Asset</th>
                      <th className="pb-3 text-right">Return</th>
                      <th className="pb-3 text-right">Volatility</th>
                      <th className="pb-3 text-right">Sharpe</th>
                      <th className="pb-3 text-right">Max DD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkData.comparisons.map((comp) => (
                      <tr key={comp.symbol} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {comp.symbol === 'PORTFOLIO' ? (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            ) : (
                              <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            )}
                            <span className={`font-medium ${
                              comp.symbol === 'PORTFOLIO'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {comp.name}
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          comp.total_return >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {comp.total_return >= 0 ? '+' : ''}{comp.total_return.toFixed(2)}%
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {comp.volatility.toFixed(1)}%
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {comp.sharpe_ratio.toFixed(2)}
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {comp.max_drawdown.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Alpha & Beta */}
              {benchmarkData.comparisons[0]?.alpha !== undefined && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Alpha vs S&P 500</p>
                    <p className={`text-lg font-bold ${
                      (benchmarkData.comparisons[0]?.alpha ?? 0) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(benchmarkData.comparisons[0]?.alpha ?? 0) >= 0 ? '+' : ''}
                      {(benchmarkData.comparisons[0]?.alpha ?? 0).toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-400">Excess return</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Beta vs S&P 500</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {(benchmarkData.comparisons[0]?.beta ?? 1).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">Market sensitivity</p>
                  </div>
                </div>
              )}

              {/* Outperforming */}
              {benchmarkData.outperforming.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Outperforming: {benchmarkData.outperforming.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  icon,
  description,
  good,
  bad
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  good?: boolean;
  bad?: boolean;
}) {
  let bgColor = 'bg-gray-100 dark:bg-gray-700';
  let textColor = 'text-gray-600 dark:text-gray-400';
  let valueColor = 'text-gray-900 dark:text-white';

  if (good) {
    bgColor = 'bg-green-100 dark:bg-green-900/30';
    textColor = 'text-green-600 dark:text-green-400';
    valueColor = 'text-green-600 dark:text-green-400';
  } else if (bad) {
    bgColor = 'bg-red-100 dark:bg-red-900/30';
    textColor = 'text-red-600 dark:text-red-400';
    valueColor = 'text-red-600 dark:text-red-400';
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${bgColor}`}>
          <span className={textColor}>{icon}</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}
