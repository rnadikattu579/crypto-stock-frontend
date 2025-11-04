import { Lightbulb, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { Portfolio } from '../../types';

interface PortfolioInsightsProps {
  cryptoPortfolio: Portfolio | null;
  stockPortfolio: Portfolio | null;
  summary: any;
}

export function PortfolioInsights({ cryptoPortfolio, stockPortfolio, summary }: PortfolioInsightsProps) {
  const totalAssets = (cryptoPortfolio?.assets.length || 0) + (stockPortfolio?.assets.length || 0);
  const cryptoPercent = summary?.crypto_value / summary?.total_value * 100 || 0;
  const stockPercent = summary?.stock_value / summary?.total_value * 100 || 0;

  const insights = [];

  // Diversification insight
  if (totalAssets === 0) {
    insights.push({
      type: 'info',
      icon: Info,
      title: 'Get Started',
      message: 'Add your first asset to start tracking your portfolio performance.',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600',
    });
  } else if (totalAssets < 5) {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Diversification Tip',
      message: 'Consider adding more assets to your portfolio for better diversification.',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconColor: 'text-yellow-600',
    });
  } else {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      title: 'Well Diversified',
      message: `Great! You have ${totalAssets} assets in your portfolio.`,
      color: 'bg-green-50 border-green-200 text-green-800',
      iconColor: 'text-green-600',
    });
  }

  // Balance insight
  if (cryptoPercent > 0 && stockPercent > 0) {
    if (cryptoPercent > 80 || stockPercent > 80) {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Portfolio Balance',
        message: 'Your portfolio is heavily weighted towards one asset type. Consider rebalancing.',
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        iconColor: 'text-blue-600',
      });
    }
  }

  // Performance insight
  const totalGainLoss = summary?.total_gain_loss || 0;
  if (totalGainLoss > 0) {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      title: 'Positive Returns',
      message: `Your portfolio is up $${Math.abs(totalGainLoss).toFixed(2)}. Keep up the good work!`,
      color: 'bg-green-50 border-green-200 text-green-800',
      iconColor: 'text-green-600',
    });
  } else if (totalGainLoss < 0) {
    insights.push({
      type: 'info',
      icon: Info,
      title: 'Market Fluctuation',
      message: 'Portfolio is down, but remember to think long-term. Markets are cyclical.',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600',
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-6 w-6 text-yellow-500" />
        <h3 className="text-lg font-bold text-gray-900">Portfolio Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`flex gap-3 p-4 rounded-lg border ${insight.color}`}
          >
            <insight.icon className={`h-5 w-5 flex-shrink-0 ${insight.iconColor}`} />
            <div>
              <h4 className="font-semibold mb-1">{insight.title}</h4>
              <p className="text-sm">{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
