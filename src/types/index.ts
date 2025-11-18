export const AssetType = {
  CRYPTO: 'crypto',
  STOCK: 'stock',
} as const;

export type AssetType = typeof AssetType[keyof typeof AssetType];

export interface User {
  user_id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PurchaseEntry {
  purchase_id: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  total_cost: number;
}

export interface Asset {
  asset_id: string;
  user_id: string;
  asset_type: AssetType;
  symbol: string;
  name?: string;
  quantity: number;
  purchase_price: number;  // Average purchase price
  purchase_date: string;  // Earliest purchase date
  purchase_history?: PurchaseEntry[];  // Individual purchase entries
  current_price?: number;
  current_value?: number;
  gain_loss?: number;
  gain_loss_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface AssetCreate {
  asset_type: AssetType;
  symbol: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
}

export interface Portfolio {
  user_id: string;
  assets: Asset[];
  total_value: number;
  total_invested: number;
  total_gain_loss: number;
  total_gain_loss_percentage: number;
}

export interface PortfolioSummary {
  crypto_count: number;
  stock_count: number;
  total_assets: number;
  crypto_value: number;
  stock_value: number;
  total_value: number;
  total_invested: number;
  total_gain_loss: number;
  total_gain_loss_percentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  detail?: string;
}

// Portfolio History Types
export type TimePeriod = '24H' | '7D' | '30D' | '90D' | '1Y' | 'ALL';

export interface HistoricalDataPoint {
  date: string;
  timestamp: string;
  portfolio_value: number;
  crypto_value?: number;
  stock_value?: number;
  invested_value?: number;
  gain_loss?: number;
  gain_loss_percentage?: number;
}

export interface PortfolioHistory {
  user_id: string;
  period: TimePeriod;
  start_date: string;
  end_date: string;
  data_points: HistoricalDataPoint[];
  current_value: number;
  period_change: number;
  period_change_percentage: number;
}

// Transaction Types
export const TransactionType = {
  BUY: 'buy',
  SELL: 'sell',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const CostBasisMethod = {
  FIFO: 'fifo',
  LIFO: 'lifo',
  AVERAGE: 'average',
} as const;

export type CostBasisMethod = typeof CostBasisMethod[keyof typeof CostBasisMethod];

export interface Transaction {
  transaction_id: string;
  user_id: string;
  asset_id: string;
  symbol: string;
  asset_type: AssetType;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  total_value: number;
  fees: number;
  notes?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  asset_id: string;
  symbol: string;
  asset_type: AssetType;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  fees?: number;
  notes?: string;
  transaction_date: string;
}

export interface TransactionUpdate {
  quantity?: number;
  price?: number;
  fees?: number;
  notes?: string;
  transaction_date?: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  total_count: number;
  total_bought: number;
  total_sold: number;
  realized_gains: number;
  unrealized_gains: number;
}

export interface CostBasisCalculation {
  asset_id: string;
  symbol: string;
  total_quantity: number;
  total_cost: number;
  average_cost_per_unit: number;
  method: CostBasisMethod;
  remaining_lots: Array<{
    date: string;
    quantity: number;
    price: number;
    total_cost: number;
  }>;
}

// Tax Reporting Types
export interface TaxSummary {
  tax_year: number;
  summary: {
    total_proceeds: number;
    total_cost_basis: number;
    short_term: {
      gains: number;
      losses: number;
      net: number;
    };
    long_term: {
      gains: number;
      losses: number;
      net: number;
    };
    total_net_gain_loss: number;
    wash_sale_disallowed: number;
    adjusted_net_gain_loss: number;
  };
  capital_gains: CapitalGain[];
  wash_sales: WashSale[];
  transaction_count: {
    buys: number;
    sells: number;
    total: number;
  };
}

export interface CapitalGain {
  transaction_id: string;
  symbol: string;
  asset_type: AssetType;
  quantity: number;
  acquisition_date: string;
  sale_date: string;
  proceeds: number;
  cost_basis: number;
  gain_loss: number;
  holding_period: 'short_term' | 'long_term';
  days_held: number;
}

export interface WashSale {
  sell_transaction_id: string;
  symbol: string;
  sale_date: string;
  loss_amount: number;
  disallowed_loss: number;
  replacement_purchases: Array<{
    date: string;
    quantity: number;
    price: number;
  }>;
}

export interface Form8949Entry {
  description: string;
  date_acquired: string;
  date_sold: string;
  proceeds: number;
  cost_basis: number;
  adjustment_code: string;
  adjustment_amount: number;
  gain_or_loss: number;
  holding_period: 'short_term' | 'long_term';
  asset_type: AssetType;
  symbol: string;
}

export interface UnrealizedGains {
  as_of_date: string;
  total_unrealized_gain_loss: number;
  holdings: Array<{
    symbol: string;
    asset_type: AssetType;
    quantity: number;
    cost_basis: number;
    current_value: number;
    unrealized_gain_loss: number;
    gain_loss_percentage: number;
    holding_period: 'short_term' | 'long_term' | 'unknown';
  }>;
}

export interface TaxLossHarvestingOpportunity {
  symbol: string;
  asset_type: AssetType;
  unrealized_loss: number;
  quantity: number;
  current_value: number;
  cost_basis: number;
  potential_tax_savings_estimate: number;
  wash_sale_risk: boolean;
  holding_period: 'short_term' | 'long_term' | 'unknown';
}

// Portfolio Rebalancing Types
export interface TargetAllocation {
  allocation_id: string;
  asset_type: AssetType;
  symbol?: string;
  category?: string;
  target_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface RebalanceRecommendation {
  symbol?: string;
  category?: string;
  asset_type: AssetType;
  target_percentage: number;
  current_percentage: number;
  drift: number;
  current_value: number;
  target_value: number;
  value_difference: number;
  quantity_change?: number;
  current_price?: number;
  action: 'buy' | 'sell' | 'hold';
}

export interface RebalanceCalculation {
  status: string;
  portfolio_value: number;
  additional_investment: number;
  total_with_investment: number;
  total_target_percentage: number;
  max_drift: number;
  needs_rebalancing: boolean;
  recommendations: RebalanceRecommendation[];
  message?: string;
}

export interface PortfolioDrift {
  status: string;
  drift_threshold: number;
  max_drift: number;
  needs_rebalancing: boolean;
  drifted_items: RebalanceRecommendation[];
  total_items: number;
  message?: string;
}

// Advanced Analytics Types
export interface AdvancedMetrics {
  sharpe_ratio: number;
  sortino_ratio: number;
  volatility: number;
  annualized_volatility: number;
  max_drawdown: number;
  total_return: number;
  annualized_return: number;
  avg_daily_return: number;
  best_day: number;
  worst_day: number;
  positive_days: number;
  negative_days: number;
  win_rate: number;
}

export interface MetricsResponse {
  status: string;
  period_days: number;
  data_points: number;
  metrics: AdvancedMetrics | null;
  message?: string;
}

export interface BenchmarkComparison {
  name: string;
  symbol: string;
  total_return: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  data_points: number;
  alpha?: number;
  beta?: number;
}

export interface BenchmarkResponse {
  status: string;
  period_days: number;
  comparisons: BenchmarkComparison[];
  outperforming: string[];
  message?: string;
}

export interface RiskAnalysis {
  risk_analysis: {
    '30_day': AdvancedMetrics | null;
    '90_day': AdvancedMetrics | null;
    '365_day': AdvancedMetrics | null;
  };
  risk_score: number;
  risk_level: string;
}
