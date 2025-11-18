import axios from 'axios';
import type {
  AuthResponse,
  Portfolio,
  PortfolioSummary,
  Asset,
  AssetCreate,
  ApiResponse,
  PortfolioHistory,
  TimePeriod,
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  TransactionHistory,
  CostBasisCalculation,
  CostBasisMethod,
  AssetType,
  TransactionType,
  TaxSummary,
  Form8949Entry,
  UnrealizedGains,
  TaxLossHarvestingOpportunity,
  TargetAllocation,
  RebalanceCalculation,
  PortfolioDrift,
  MetricsResponse,
  BenchmarkResponse,
  RiskAnalysis
} from '../types';

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

  // Transaction endpoints
  async getTransactions(filters?: {
    asset_id?: string;
    asset_type?: AssetType;
    transaction_type?: TransactionType;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; count: number }> {
    const response = await this.api.get<ApiResponse<{ transactions: Transaction[]; count: number }>>('/transactions', {
      params: filters,
    });
    return response.data.data;
  }

  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await this.api.get<ApiResponse<Transaction>>(`/transactions/${transactionId}`);
    return response.data.data;
  }

  async createTransaction(transaction: TransactionCreate): Promise<Transaction> {
    const response = await this.api.post<ApiResponse<Transaction>>('/transactions', transaction);
    return response.data.data;
  }

  async updateTransaction(transactionId: string, updates: TransactionUpdate): Promise<Transaction> {
    const response = await this.api.put<ApiResponse<Transaction>>(`/transactions/${transactionId}`, updates);
    return response.data.data;
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await this.api.delete(`/transactions/${transactionId}`);
  }

  async getTransactionHistory(filters?: {
    asset_id?: string;
    asset_type?: AssetType;
  }): Promise<TransactionHistory> {
    const response = await this.api.get<ApiResponse<TransactionHistory>>('/transactions/history', {
      params: filters,
    });
    return response.data.data;
  }

  async getCostBasis(assetId: string, method: CostBasisMethod = 'fifo'): Promise<CostBasisCalculation> {
    const response = await this.api.get<ApiResponse<CostBasisCalculation>>('/transactions/cost-basis', {
      params: {
        asset_id: assetId,
        method,
      },
    });
    return response.data.data;
  }

  // Tax endpoints
  async getTaxSummary(year?: number): Promise<TaxSummary> {
    const response = await this.api.get<ApiResponse<TaxSummary>>('/tax/summary', {
      params: year ? { year } : undefined,
    });
    return response.data.data;
  }

  async getForm8949(year?: number): Promise<{ tax_year: number; entries: Form8949Entry[] }> {
    const response = await this.api.get<ApiResponse<{ tax_year: number; entries: Form8949Entry[] }>>('/tax/form-8949', {
      params: year ? { year } : undefined,
    });
    return response.data.data;
  }

  async getUnrealizedGains(): Promise<UnrealizedGains> {
    const response = await this.api.get<ApiResponse<UnrealizedGains>>('/tax/unrealized');
    return response.data.data;
  }

  async getTaxLossHarvesting(): Promise<{
    opportunities: TaxLossHarvestingOpportunity[];
    total_potential_loss: number;
  }> {
    const response = await this.api.get<ApiResponse<{
      opportunities: TaxLossHarvestingOpportunity[];
      total_potential_loss: number;
    }>>('/tax/harvesting');
    return response.data.data;
  }

  // Rebalancing endpoints
  async getTargetAllocations(): Promise<{
    targets: TargetAllocation[];
    total_percentage: number;
    is_valid: boolean;
  }> {
    const response = await this.api.get<ApiResponse<{
      targets: TargetAllocation[];
      total_percentage: number;
      is_valid: boolean;
    }>>('/rebalance/targets');
    return response.data.data;
  }

  async setTargetAllocation(
    asset_type: string,
    target_percentage: number,
    symbol?: string,
    category?: string
  ): Promise<TargetAllocation> {
    const response = await this.api.post<ApiResponse<TargetAllocation>>('/rebalance/targets', {
      asset_type,
      target_percentage,
      symbol,
      category
    });
    return response.data.data;
  }

  async deleteTargetAllocation(allocationId: string): Promise<void> {
    await this.api.delete(`/rebalance/targets/${allocationId}`);
  }

  async calculateRebalance(additionalInvestment: number = 0): Promise<RebalanceCalculation> {
    const response = await this.api.get<ApiResponse<RebalanceCalculation>>('/rebalance/calculate', {
      params: additionalInvestment ? { additional_investment: additionalInvestment } : undefined
    });
    return response.data.data;
  }

  async getPortfolioDrift(): Promise<PortfolioDrift> {
    const response = await this.api.get<ApiResponse<PortfolioDrift>>('/rebalance/drift');
    return response.data.data;
  }

  // Advanced Analytics endpoints
  async getAdvancedMetrics(periodDays: number = 365): Promise<MetricsResponse> {
    const response = await this.api.get<ApiResponse<MetricsResponse>>('/analytics/metrics', {
      params: { period: periodDays }
    });
    return response.data.data;
  }

  async getBenchmarkComparison(
    benchmarks: string[] = ['SP500', 'BTC'],
    periodDays: number = 365
  ): Promise<BenchmarkResponse> {
    const response = await this.api.get<ApiResponse<BenchmarkResponse>>('/analytics/benchmarks', {
      params: {
        benchmarks: benchmarks.join(','),
        period: periodDays
      }
    });
    return response.data.data;
  }

  async getRiskAnalysis(): Promise<RiskAnalysis> {
    const response = await this.api.get<ApiResponse<RiskAnalysis>>('/analytics/risk');
    return response.data.data;
  }
}

export const apiService = new ApiService();
