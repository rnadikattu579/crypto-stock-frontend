import axios from 'axios';
import type { AuthResponse, Portfolio, PortfolioSummary, Asset, AssetCreate, ApiResponse, PortfolioHistory, TimePeriod } from '../types';

class ApiService {
  private api: ReturnType<typeof axios.create>;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: any) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  }

  // Portfolio endpoints
  async getCryptoPortfolio(): Promise<Portfolio> {
    const response = await this.api.get<ApiResponse<Portfolio>>('/portfolio/crypto');
    return response.data.data;
  }

  async getStockPortfolio(): Promise<Portfolio> {
    const response = await this.api.get<ApiResponse<Portfolio>>('/portfolio/stocks');
    return response.data.data;
  }

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const response = await this.api.get<ApiResponse<PortfolioSummary>>('/portfolio/summary');
    return response.data.data;
  }

  async addAsset(asset: AssetCreate): Promise<Asset> {
    const response = await this.api.post<ApiResponse<Asset>>('/portfolio/assets', asset);
    return response.data.data;
  }

  async updateAsset(assetId: string, updates: Partial<AssetCreate>): Promise<Asset> {
    const response = await this.api.put<ApiResponse<Asset>>(`/portfolio/assets/${assetId}`, updates);
    return response.data.data;
  }

  async deleteAsset(assetId: string): Promise<void> {
    await this.api.delete(`/portfolio/assets/${assetId}`);
  }

  // Price endpoints
  async getPrices(symbols: string[], assetType: 'crypto' | 'stock'): Promise<any[]> {
    const response = await this.api.post<ApiResponse<any[]>>('/prices', {
      symbols,
      asset_type: assetType,
    });
    return response.data.data;
  }

  // Portfolio History endpoints
  async getPortfolioHistory(
    period: TimePeriod = '30D',
    portfolioType: 'crypto' | 'stock' | 'combined' = 'combined',
    includeBenchmarks: boolean = false
  ): Promise<PortfolioHistory> {
    const response = await this.api.get<ApiResponse<PortfolioHistory>>('/portfolio/history', {
      params: {
        period,
        portfolio_type: portfolioType,
        include_benchmarks: includeBenchmarks,
      },
    });
    return response.data.data;
  }

  async createPortfolioSnapshot(portfolioType: 'crypto' | 'stock' | 'combined' = 'combined'): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>('/portfolio/history/snapshot', {
      portfolio_type: portfolioType,
    });
    return response.data.data;
  }
}

export const apiService = new ApiService();
