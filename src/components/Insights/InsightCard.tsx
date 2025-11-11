import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  TrendingDown,
  Lightbulb,
  Scale,
  Receipt,
  TrendingUp as TrendingUpIcon,
  ShoppingCart,
  Bell,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import type { Insight } from '../../types/insights';
import { getPriorityColor } from '../../utils/portfolioAnalysis';

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (insightId: string) => void;
  showDismiss?: boolean;
}

const iconMap = {
  concentration_risk: AlertTriangle,
  performance_alert: TrendingDown,
  diversification_tip: Lightbulb,
  rebalancing: Scale,
  tax_optimization: Receipt,
  profit_taking: TrendingUpIcon,
  buy_opportunity: ShoppingCart,
  alert_recommendation: Bell,
  success: CheckCircle,
  info: Info,
};

const colorMap = {
  concentration_risk: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-900 dark:text-red-100',
  },
  performance_alert: {
    bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
    text: 'text-orange-900 dark:text-orange-100',
  },
  diversification_tip: {
    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-900 dark:text-blue-100',
  },
  rebalancing: {
    bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    text: 'text-purple-900 dark:text-purple-100',
  },
  tax_optimization: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-600 dark:text-indigo-400',
    text: 'text-indigo-900 dark:text-indigo-100',
  },
  profit_taking: {
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-900 dark:text-green-100',
  },
  buy_opportunity: {
    bg: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    icon: 'text-teal-600 dark:text-teal-400',
    text: 'text-teal-900 dark:text-teal-100',
  },
  alert_recommendation: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    text: 'text-yellow-900 dark:text-yellow-100',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-900 dark:text-green-100',
  },
  info: {
    bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    icon: 'text-gray-600 dark:text-gray-400',
    text: 'text-gray-900 dark:text-gray-100',
  },
};

export function InsightCard({ insight, onDismiss, showDismiss = true }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const Icon = iconMap[insight.type] || Info;
  const colors = colorMap[insight.type] || colorMap.info;

  const handleAction = () => {
    if (insight.actionPath) {
      navigate(insight.actionPath);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(insight.id);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all hover:shadow-md ${colors.bg} ${
        insight.actionable ? 'cursor-pointer' : ''
      }`}
      onClick={insight.actionable ? handleAction : undefined}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`font-semibold ${colors.text}`}>{insight.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(insight.priority)}`}>
                  {insight.priority.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {insight.category}
                </span>
              </div>
            </div>
            {showDismiss && onDismiss && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          {/* Message */}
          <p className={`text-sm mb-3 ${colors.text}`}>{insight.message}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {insight.actionable && insight.actionLabel && (
              <button
                onClick={handleAction}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${colors.icon} hover:opacity-80 bg-white dark:bg-gray-800 border border-current`}
              >
                {insight.actionLabel}
              </button>
            )}

            {insight.learnMoreContent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
              >
                Learn More
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Expandable Learn More Section */}
          {expanded && insight.learnMoreContent && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {insight.learnMoreContent}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
