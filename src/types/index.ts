export enum AssetType {
  CRYPTO = 'crypto',
  STOCK = 'stock',
}

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

export interface Asset {
  asset_id: string;
  user_id: string;
  asset_type: AssetType;
  symbol: string;
  name?: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
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
