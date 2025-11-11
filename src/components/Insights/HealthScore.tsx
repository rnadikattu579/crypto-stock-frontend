import { Shield, TrendingUp, PieChart, Activity } from 'lucide-react';
import type { PortfolioHealth } from '../../types/insights';
import { getScoreColor, getScoreGradient, getRiskColor, getRiskBgColor } from '../../utils/portfolioAnalysis';

interface HealthScoreProps {
  health: PortfolioHealth;
  compact?: boolean;
}

export function HealthScore({ health, compact = false }: HealthScoreProps) {
  const { overallScore, breakdown, riskLevel, suggestions } = health;

  const scoreCategories = [
    { label: 'Diversification', value: breakdown.diversification, icon: PieChart, weight: '30%' },
    { label: 'Performance', value: breakdown.performance, icon: TrendingUp, weight: '25%' },
    { label: 'Risk Management', value: breakdown.riskManagement, icon: Shield, weight: '25%' },
    { label: 'Activity', value: breakdown.activity, icon: Activity, weight: '20%' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {/* Circular Score */}
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallScore / 100)}`}
              className={`${getScoreColor(overallScore)} transition-all duration-1000`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Health</div>
            </div>
          </div>
        </div>

        {/* Risk Indicator */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Shield className={`h-5 w-5 ${getRiskColor(riskLevel)}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Level</span>
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskBgColor(riskLevel)} ${getRiskColor(riskLevel)}`}>
            {riskLevel.toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score with Circular Progress */}
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 mb-4">
          <svg className="transform -rotate-90 w-40 h-40">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={getScoreGradient(overallScore)} />
              </linearGradient>
            </defs>
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="url(#scoreGradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - overallScore / 100)}`}
              className="transition-all duration-1000 drop-shadow-lg"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Health Score</div>
            </div>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getRiskBgColor(riskLevel)}`}>
          <Shield className={`h-5 w-5 ${getRiskColor(riskLevel)}`} />
          <span className={`text-sm font-bold ${getRiskColor(riskLevel)}`}>
            {riskLevel.toUpperCase()} RISK
          </span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score Breakdown</h4>
        {scoreCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{category.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({category.weight})</span>
                </div>
                <span className={`font-semibold ${getScoreColor(category.value)}`}>
                  {category.value}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getScoreGradient(category.value)} transition-all duration-1000 rounded-full`}
                  style={{ width: `${category.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Improvement Suggestions</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
