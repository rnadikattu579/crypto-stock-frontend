import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowRight, Bell } from 'lucide-react';
import type { Portfolio, PortfolioSummary } from '../../types';
import type { Insight, PortfolioHealth } from '../../types/insights';
import { calculatePortfolioHealth, analyzeRisk, generateInsights } from '../../utils/portfolioAnalysis';
import { HealthScore } from './HealthScore';
import { InsightCard } from './InsightCard';

interface PortfolioInsightsWidgetProps {
  cryptoPortfolio: Portfolio | null;
  stockPortfolio: Portfolio | null;
  summary: PortfolioSummary | null;
}

const STORAGE_KEY = 'portfolio-insights-dismissed';

export function PortfolioInsightsWidget({
  cryptoPortfolio,
  stockPortfolio,
  summary,
}: PortfolioInsightsWidgetProps) {
  const navigate = useNavigate();
  const [health, setHealth] = useState<PortfolioHealth | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const [hasNewInsights, setHasNewInsights] = useState(false);

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

  // Calculate health, risk, and generate insights
  useEffect(() => {
    if (!summary) return;

    // Calculate health score
    const healthData = calculatePortfolioHealth(
      cryptoPortfolio,
      stockPortfolio,
      summary,
      false, // hasRecentActivity - can be enhanced with transaction data
      0 // alertsCount - can be fetched from alerts
    );
    setHealth(healthData);

    // Analyze risk
    const risk = analyzeRisk(cryptoPortfolio, stockPortfolio, summary);

    // Generate insights
    const generatedInsights = generateInsights(
      cryptoPortfolio,
      stockPortfolio,
      summary,
      risk,
      dismissedInsights
    );

    // Sort by priority (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    generatedInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setInsights(generatedInsights);

    // Check for new insights
    const previousInsightIds = dismissedInsights;
    const newInsightIds = generatedInsights.map(i => i.id);
    const hasNew = newInsightIds.some(id => !previousInsightIds.includes(id));
    setHasNewInsights(hasNew);
  }, [cryptoPortfolio, stockPortfolio, summary, dismissedInsights]);

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

    // Remove from current insights
    setInsights(insights.filter(i => i.id !== insightId));
  };

  const topInsights = insights.slice(0, 3);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Portfolio Insights</h3>
          {hasNewInsights && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/insights')}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Health Score - Compact View */}
      {health && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <HealthScore health={health} compact={true} />
        </div>
      )}

      {/* Top Insights */}
      {topInsights.length > 0 ? (
        <div className="space-y-3">
          {topInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={handleDismissInsight}
              showDismiss={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
            <Lightbulb className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            No new insights at the moment
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Your portfolio is looking good!
          </p>
        </div>
      )}

      {/* View More Button */}
      {insights.length > 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/insights')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Bell className="h-4 w-4" />
            {insights.length - 3} more insight{insights.length - 3 !== 1 ? 's' : ''} available
          </button>
        </div>
      )}
    </div>
  );
}
