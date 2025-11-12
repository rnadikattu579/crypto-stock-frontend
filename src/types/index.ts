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
