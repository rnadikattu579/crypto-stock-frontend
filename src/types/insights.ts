export type InsightType =
  | 'concentration_risk'
  | 'performance_alert'
  | 'diversification_tip'
  | 'rebalancing'
  | 'tax_optimization'
  | 'profit_taking'
  | 'buy_opportunity'
  | 'alert_recommendation'
  | 'success'
  | 'info';

export type InsightPriority = 'high' | 'medium' | 'low';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  category: InsightCategory;
  actionable: boolean;
  actionLabel?: string;
  actionPath?: string;
  learnMoreContent?: string;
  timestamp: number;
  dismissed: boolean;
  metadata?: {
    assetSymbol?: string;
    percentage?: number;
    value?: number;
    sector?: string;
    [key: string]: any;
  };
}

export type InsightCategory =
  | 'Performance'
  | 'Risk'
  | 'Diversification'
  | 'Activity'
  | 'Opportunities';

export interface HealthScoreBreakdown {
  diversification: number;
  performance: number;
  riskManagement: number;
  activity: number;
}

export interface PortfolioHealth {
  overallScore: number;
  breakdown: HealthScoreBreakdown;
  riskLevel: RiskLevel;
  diversificationScore: number;
  suggestions: string[];
}

export interface RiskAnalysis {
  concentrationRisk: number;
  concentrationAsset?: string;
  correlationRisk: number;
  cryptoStockBalance: {
    crypto: number;
    stock: number;
  };
  volatilityScore: number;
  overallRisk: RiskLevel;
}

export interface InsightFilters {
  category?: InsightCategory;
  priority?: InsightPriority;
  type?: InsightType;
  searchTerm?: string;
}

export interface InsightHistory {
  insights: Insight[];
  lastUpdated: number;
  dismissedInsights: string[];
}
