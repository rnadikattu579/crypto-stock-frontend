import type { Portfolio, Asset, PortfolioSummary } from '../types';
import type {
  Insight,
  PortfolioHealth,
  RiskAnalysis,
  RiskLevel,
  InsightPriority,
  HealthScoreBreakdown,
} from '../types/insights';

/**
 * Portfolio Analysis Utility
 * Provides comprehensive portfolio analysis including health scores,
 * risk analysis, and actionable insights generation.
 */

// ==================== Health Score Calculation ====================

/**
 * Calculate Portfolio Health Score (0-100)
 *
 * Breakdown:
 * - Diversification (30%): Based on number of assets and distribution
 * - Performance (25%): Based on overall returns and trending
 * - Risk Management (25%): Based on volatility and concentration
 * - Activity (20%): Based on recent transactions and engagement
 */
export function calculatePortfolioHealth(
  cryptoPortfolio: Portfolio | null,
  stockPortfolio: Portfolio | null,
  summary: PortfolioSummary | null,
  hasRecentActivity: boolean = false,
  alertsCount: number = 0
): PortfolioHealth {
  const diversificationScore = calculateDiversificationScore(cryptoPortfolio, stockPortfolio);
  const performanceScore = calculatePerformanceScore(summary);
  const riskManagementScore = calculateRiskManagementScore(cryptoPortfolio, stockPortfolio, summary);
  const activityScore = calculateActivityScore(hasRecentActivity, alertsCount);

  // Weighted overall score
  const overallScore = Math.round(
    diversificationScore * 0.3 +
    performanceScore * 0.25 +
    riskManagementScore * 0.25 +
    activityScore * 0.2
  );

  const breakdown: HealthScoreBreakdown = {
    diversification: diversificationScore,
    performance: performanceScore,
    riskManagement: riskManagementScore,
    activity: activityScore,
  };

  const riskAnalysis = analyzeRisk(cryptoPortfolio, stockPortfolio, summary);

  const suggestions = generateHealthSuggestions(breakdown, riskAnalysis);

  return {
    overallScore,
    breakdown,
    riskLevel: riskAnalysis.overallRisk,
    diversificationScore,
    suggestions,
  };
}

// ==================== Component Score Calculations ====================

function calculateDiversificationScore(
  cryptoPortfolio: Portfolio | null,
  stockPortfolio: Portfolio | null
): number {
  const totalAssets = (cryptoPortfolio?.assets.length || 0) + (stockPortfolio?.assets.length || 0);

  if (totalAssets === 0) return 0;

  // Base score on number of assets (max at 15 assets)
  const assetCountScore = Math.min((totalAssets / 15) * 50, 50);

  // Balance between crypto and stocks (max 50 points)
  const hasBoth = (cryptoPortfolio?.assets.length || 0) > 0 && (stockPortfolio?.assets.length || 0) > 0;
  let balanceScore = 0;

  if (hasBoth) {
    const cryptoCount = cryptoPortfolio?.assets.length || 0;
    const stockCount = stockPortfolio?.assets.length || 0;
    const ratio = Math.min(cryptoCount, stockCount) / Math.max(cryptoCount, stockCount);
    balanceScore = ratio * 50;
  } else if (totalAssets >= 5) {
    // If only one type but well diversified within that type
    balanceScore = 25;
  }

  return Math.round(assetCountScore + balanceScore);
}

function calculatePerformanceScore(summary: PortfolioSummary | null): number {
  if (!summary || summary.total_value === 0) return 50; // Neutral if no data

  const gainLossPercentage = summary.total_gain_loss_percentage || 0;

  // Score based on performance
  // -50% or worse = 0 points
  // 0% = 50 points (break-even)
  // +50% or better = 100 points
  const score = Math.max(0, Math.min(100, 50 + gainLossPercentage));

  return Math.round(score);
}

function calculateRiskManagementScore(
  cryptoPortfolio: Portfolio | null,
  stockPortfolio: Portfolio | null,
  summary: PortfolioSummary | null
): number {
  let score = 100;

  const allAssets = [
    ...(cryptoPortfolio?.assets || []),
    ...(stockPortfolio?.assets || []),
  ];

  if (allAssets.length === 0) return 50; // Neutral if no assets

  // Penalize concentration (largest holding > 40% of portfolio)
  const concentrationRisk = calculateConcentrationRisk(allAssets, summary);
  if (concentrationRisk > 40) {
    score -= 30;
  } else if (concentrationRisk > 30) {
    score -= 20;
  } else if (concentrationRisk > 20) {
    score -= 10;
  }

  // Penalize extreme imbalance between crypto and stocks
  if (summary) {
    const cryptoPercent = (summary.crypto_value / summary.total_value) * 100 || 0;
    const stockPercent = (summary.stock_value / summary.total_value) * 100 || 0;

    if (cryptoPercent > 90 || stockPercent > 90) {
      score -= 20;
    } else if (cryptoPercent > 80 || stockPercent > 80) {
      score -= 10;
    }
  }

  return Math.max(0, Math.round(score));
}

function calculateActivityScore(hasRecentActivity: boolean, alertsCount: number): number {
  let score = 50; // Base score

  // Bonus for recent activity
  if (hasRecentActivity) {
    score += 25;
  }

  // Bonus for having alerts set (shows engagement)
  if (alertsCount > 0) {
    score += Math.min(25, alertsCount * 5);
  }

  return Math.min(100, Math.round(score));
}

// ==================== Risk Analysis ====================

export function analyzeRisk(
  cryptoPortfolio: Portfolio | null,
  stockPortfolio: Portfolio | null,
  summary: PortfolioSummary | null
): RiskAnalysis {
  const allAssets = [
    ...(cryptoPortfolio?.assets || []),
    ...(stockPortfolio?.assets || []),
  ];

  const concentrationRisk = calculateConcentrationRisk(allAssets, summary);
  const concentrationAsset = findLargestHolding(allAssets);

  const cryptoPercent = summary ? (summary.crypto_value / summary.total_value) * 100 || 0 : 0;
  const stockPercent = summary ? (summary.stock_value / summary.total_value) * 100 || 0 : 0;

  // Correlation risk: How balanced is crypto vs stocks
  const correlationRisk = Math.abs(50 - Math.max(cryptoPercent, stockPercent));

  // Volatility score based on asset types and concentration
  const volatilityScore = calculateVolatilityScore(cryptoPercent, concentrationRisk);

  // Determine overall risk level
  let overallRisk: RiskLevel = 'low';
  if (concentrationRisk > 40 || cryptoPercent > 80 || volatilityScore > 70) {
    overallRisk = 'high';
  } else if (concentrationRisk > 25 || cryptoPercent > 60 || volatilityScore > 50) {
    overallRisk = 'medium';
  }

  return {
    concentrationRisk,
    concentrationAsset,
    correlationRisk,
    cryptoStockBalance: {
      crypto: cryptoPercent,
      stock: stockPercent,
    },
    volatilityScore,
    overallRisk,
  };
}

function calculateConcentrationRisk(assets: Asset[], summary: PortfolioSummary | null): number {
  if (assets.length === 0 || !summary || summary.total_value === 0) return 0;

  const largestValue = Math.max(...assets.map(a => a.current_value || 0));
  return (largestValue / summary.total_value) * 100;
}

function findLargestHolding(assets: Asset[]): string | undefined {
  if (assets.length === 0) return undefined;

  const largest = assets.reduce((max, asset) =>
    (asset.current_value || 0) > (max.current_value || 0) ? asset : max
  );

  return largest.symbol;
}

function calculateVolatilityScore(cryptoPercent: number, concentrationRisk: number): number {
  // Crypto is inherently more volatile
  const cryptoVolatility = (cryptoPercent / 100) * 60;
  const concentrationVolatility = (concentrationRisk / 100) * 40;

  return Math.round(cryptoVolatility + concentrationVolatility);
}

// ==================== Insight Generation ====================

export function generateInsights(
  cryptoPortfolio: Portfolio | null,
  stockPortfolio: Portfolio | null,
  summary: PortfolioSummary | null,
  riskAnalysis: RiskAnalysis,
  dismissedInsights: string[] = []
): Insight[] {
  const insights: Insight[] = [];
  const allAssets = [
    ...(cryptoPortfolio?.assets || []),
    ...(stockPortfolio?.assets || []),
  ];

  // Concentration Risk Insights
  if (riskAnalysis.concentrationRisk > 40) {
    insights.push({
      id: 'concentration-high',
      type: 'concentration_risk',
      priority: 'high',
      title: 'High Concentration Risk',
      message: `Your portfolio is heavily concentrated in ${riskAnalysis.concentrationAsset} (${riskAnalysis.concentrationRisk.toFixed(1)}%). Consider diversifying to reduce risk.`,
      category: 'Risk',
      actionable: true,
      actionLabel: 'View Portfolio',
      actionPath: '/dashboard',
      learnMoreContent: 'Concentration risk occurs when too much of your portfolio is invested in a single asset. This can lead to significant losses if that asset performs poorly. Financial experts generally recommend keeping individual holdings below 20-25% of your total portfolio.',
      timestamp: Date.now(),
      dismissed: false,
      metadata: {
        assetSymbol: riskAnalysis.concentrationAsset,
        percentage: riskAnalysis.concentrationRisk,
      },
    });
  } else if (riskAnalysis.concentrationRisk > 25) {
    insights.push({
      id: 'concentration-medium',
      type: 'concentration_risk',
      priority: 'medium',
      title: 'Moderate Concentration',
      message: `${riskAnalysis.concentrationAsset} represents ${riskAnalysis.concentrationRisk.toFixed(1)}% of your portfolio. Consider gradual diversification.`,
      category: 'Risk',
      actionable: true,
      actionLabel: 'Review Holdings',
      actionPath: '/analytics',
      timestamp: Date.now(),
      dismissed: false,
      metadata: {
        assetSymbol: riskAnalysis.concentrationAsset,
        percentage: riskAnalysis.concentrationRisk,
      },
    });
  }

  // Performance Alerts
  allAssets.forEach(asset => {
    const gainLossPercent = asset.gain_loss_percentage || 0;

    // Significant drop
    if (gainLossPercent < -15) {
      insights.push({
        id: `performance-drop-${asset.asset_id}`,
        type: 'performance_alert',
        priority: 'high',
        title: 'Significant Loss Alert',
        message: `${asset.symbol} has dropped ${Math.abs(gainLossPercent).toFixed(2)}%. Review your position and consider your strategy.`,
        category: 'Performance',
        actionable: true,
        actionLabel: 'View Asset',
        actionPath: asset.asset_type === 'crypto' ? '/crypto' : '/stocks',
        learnMoreContent: 'Significant losses require careful evaluation. Consider: Is this a temporary market fluctuation? Has the fundamental thesis changed? Should you average down, hold, or cut losses?',
        timestamp: Date.now(),
        dismissed: false,
        metadata: {
          assetSymbol: asset.symbol,
          percentage: gainLossPercent,
          value: asset.gain_loss,
        },
      });
    }

    // Strong gains - profit taking opportunity
    if (gainLossPercent > 30) {
      insights.push({
        id: `profit-taking-${asset.asset_id}`,
        type: 'profit_taking',
        priority: 'medium',
        title: 'Profit Taking Opportunity',
        message: `${asset.symbol} has gained ${gainLossPercent.toFixed(2)}%. Consider taking some profits to lock in gains.`,
        category: 'Opportunities',
        actionable: true,
        actionLabel: 'Manage Position',
        actionPath: asset.asset_type === 'crypto' ? '/crypto' : '/stocks',
        learnMoreContent: 'Taking profits is a key risk management strategy. Consider selling 25-50% of your position to secure gains while maintaining exposure to potential upside.',
        timestamp: Date.now(),
        dismissed: false,
        metadata: {
          assetSymbol: asset.symbol,
          percentage: gainLossPercent,
          value: asset.gain_loss,
        },
      });
    }
  });

  // Diversification Tips
  const totalAssets = allAssets.length;
  const hasCrypto = (cryptoPortfolio?.assets.length || 0) > 0;
  const hasStocks = (stockPortfolio?.assets.length || 0) > 0;

  if (totalAssets === 0) {
    insights.push({
      id: 'get-started',
      type: 'info',
      priority: 'high',
      title: 'Start Your Portfolio',
      message: 'Add your first asset to begin tracking performance and receiving personalized insights.',
      category: 'Activity',
      actionable: true,
      actionLabel: 'Add Asset',
      actionPath: '/dashboard',
      timestamp: Date.now(),
      dismissed: false,
    });
  } else if (totalAssets < 5) {
    insights.push({
      id: 'diversification-low',
      type: 'diversification_tip',
      priority: 'medium',
      title: 'Increase Diversification',
      message: `You have ${totalAssets} asset${totalAssets === 1 ? '' : 's'}. Consider adding more assets for better risk distribution.`,
      category: 'Diversification',
      actionable: true,
      actionLabel: 'Add Assets',
      actionPath: '/dashboard',
      learnMoreContent: 'Diversification is one of the most important principles in investing. By spreading your investments across different assets, you reduce the risk that a single asset\'s poor performance will significantly impact your portfolio.',
      timestamp: Date.now(),
      dismissed: false,
    });
  }

  if (!hasCrypto && hasStocks) {
    insights.push({
      id: 'no-crypto-exposure',
      type: 'diversification_tip',
      priority: 'low',
      title: 'No Cryptocurrency Exposure',
      message: 'Consider adding some cryptocurrency for diversification. Start with established coins like Bitcoin or Ethereum.',
      category: 'Diversification',
      actionable: true,
      actionLabel: 'Explore Crypto',
      actionPath: '/crypto',
      learnMoreContent: 'Cryptocurrencies can provide portfolio diversification due to their low correlation with traditional assets. However, they are highly volatile. Consider allocating only 5-10% of your portfolio to crypto.',
      timestamp: Date.now(),
      dismissed: false,
    });
  }

  if (!hasStocks && hasCrypto) {
    insights.push({
      id: 'no-stock-exposure',
      type: 'diversification_tip',
      priority: 'medium',
      title: 'No Stock Market Exposure',
      message: 'Your portfolio is 100% cryptocurrency. Consider adding stocks for better balance and reduced volatility.',
      category: 'Diversification',
      actionable: true,
      actionLabel: 'Explore Stocks',
      actionPath: '/stocks',
      learnMoreContent: 'Stocks represent ownership in established companies and tend to be less volatile than crypto. A balanced portfolio typically includes both asset classes to manage risk while maintaining growth potential.',
      timestamp: Date.now(),
      dismissed: false,
    });
  }

  // Rebalancing Suggestions
  if (riskAnalysis.cryptoStockBalance.crypto > 70 || riskAnalysis.cryptoStockBalance.stock > 70) {
    const heavyAsset = riskAnalysis.cryptoStockBalance.crypto > 70 ? 'cryptocurrency' : 'stocks';
    const lightAsset = heavyAsset === 'cryptocurrency' ? 'stocks' : 'cryptocurrency';

    insights.push({
      id: 'rebalancing-needed',
      type: 'rebalancing',
      priority: 'medium',
      title: 'Portfolio Rebalancing Recommended',
      message: `Your portfolio is heavily weighted towards ${heavyAsset}. Consider rebalancing by adding more ${lightAsset}.`,
      category: 'Risk',
      actionable: true,
      actionLabel: 'View Analytics',
      actionPath: '/analytics',
      learnMoreContent: 'Regular rebalancing helps maintain your desired asset allocation and risk level. Most experts recommend rebalancing quarterly or when allocations drift more than 5-10% from targets.',
      timestamp: Date.now(),
      dismissed: false,
    });
  }

  // Alert Recommendations
  const topAssets = allAssets
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .slice(0, 3);

  if (topAssets.length > 0) {
    insights.push({
      id: 'set-alerts',
      type: 'alert_recommendation',
      priority: 'low',
      title: 'Set Price Alerts',
      message: `Set price alerts for your top holdings (${topAssets.map(a => a.symbol).join(', ')}) to stay informed of significant price movements.`,
      category: 'Activity',
      actionable: true,
      actionLabel: 'Manage Alerts',
      actionPath: '/alerts',
      timestamp: Date.now(),
      dismissed: false,
    });
  }

  // Tax Optimization (if assets with losses exist)
  const assetsWithLosses = allAssets.filter(a => (a.gain_loss || 0) < -100);
  if (assetsWithLosses.length > 0) {
    insights.push({
      id: 'tax-loss-harvest',
      type: 'tax_optimization',
      priority: 'low',
      title: 'Tax Loss Harvesting Opportunity',
      message: `You have ${assetsWithLosses.length} asset${assetsWithLosses.length === 1 ? '' : 's'} with losses. Consider tax-loss harvesting before year-end.`,
      category: 'Opportunities',
      actionable: true,
      actionLabel: 'Review Assets',
      actionPath: '/analytics',
      learnMoreContent: 'Tax-loss harvesting involves selling investments at a loss to offset capital gains taxes. This strategy can reduce your tax bill while allowing you to maintain similar market exposure.',
      timestamp: Date.now(),
      dismissed: false,
      metadata: {
        count: assetsWithLosses.length,
      },
    });
  }

  // Success insights for positive performance
  if (summary && summary.total_gain_loss > 0) {
    insights.push({
      id: 'positive-performance',
      type: 'success',
      priority: 'low',
      title: 'Portfolio Performing Well',
      message: `Your portfolio is up $${summary.total_gain_loss.toFixed(2)} (${summary.total_gain_loss_percentage.toFixed(2)}%). Great job!`,
      category: 'Performance',
      actionable: false,
      timestamp: Date.now(),
      dismissed: false,
      metadata: {
        value: summary.total_gain_loss,
        percentage: summary.total_gain_loss_percentage,
      },
    });
  }

  // Filter out dismissed insights
  return insights.filter(insight => !dismissedInsights.includes(insight.id));
}

// ==================== Health Suggestions ====================

function generateHealthSuggestions(
  breakdown: HealthScoreBreakdown,
  riskAnalysis: RiskAnalysis
): string[] {
  const suggestions: string[] = [];

  if (breakdown.diversification < 50) {
    suggestions.push('Increase portfolio diversification by adding more assets');
  }

  if (breakdown.performance < 40) {
    suggestions.push('Review underperforming assets and consider reallocation');
  }

  if (breakdown.riskManagement < 60) {
    suggestions.push('Reduce concentration risk by rebalancing your holdings');
  }

  if (breakdown.activity < 50) {
    suggestions.push('Stay engaged with your portfolio through regular reviews and alerts');
  }

  if (riskAnalysis.overallRisk === 'high') {
    suggestions.push('Your risk level is high - consider reducing exposure to volatile assets');
  }

  if (suggestions.length === 0) {
    suggestions.push('Your portfolio is well-managed. Keep monitoring and stay disciplined!');
  }

  return suggestions;
}

// ==================== Utility Functions ====================

export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'text-green-600 dark:text-green-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'high':
      return 'text-red-600 dark:text-red-400';
  }
}

export function getRiskBgColor(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'high':
      return 'bg-red-100 dark:bg-red-900/30';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-600';
  if (score >= 60) return 'from-blue-500 to-indigo-600';
  if (score >= 40) return 'from-yellow-500 to-orange-600';
  return 'from-red-500 to-rose-600';
}

export function getPriorityColor(priority: InsightPriority): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  }
}
