import type { Asset } from '../types';

export interface PriceUpdate {
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  changeAmount: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
  timestamp: number;
}

export interface PriceUpdateSettings {
  enabled: boolean;
  updateInterval: number; // in milliseconds (5000, 10000, 30000, 60000)
}

class PriceUpdateService {
  private updateInterval: number = 10000; // Default: 10 seconds
  private volatilityMin: number = 0.005; // 0.5%
  private volatilityMax: number = 0.02; // 2%
  private priceHistory: Map<string, number[]> = new Map();

  /**
   * Simulates a realistic price update for an asset
   * Uses a random walk with slight momentum and mean reversion
   */
  simulatePriceUpdate(currentPrice: number, symbol: string): number {
    // Get price history for momentum calculation
    const history = this.priceHistory.get(symbol) || [];

    // Calculate momentum (trend from recent prices)
    let momentum = 0;
    if (history.length >= 3) {
      const recent = history.slice(-3);
      momentum = (recent[recent.length - 1] - recent[0]) / recent[0];
    }

    // Generate random change with volatility
    const volatility = this.volatilityMin + Math.random() * (this.volatilityMax - this.volatilityMin);
    const randomChange = (Math.random() - 0.5) * 2 * volatility;

    // Apply momentum (30% weight) and mean reversion (slight pull back to average)
    const momentumWeight = 0.3;
    const trendBias = momentum * momentumWeight;

    // Calculate final change percentage
    const changePercentage = randomChange + trendBias;

    // Apply change to price
    let newPrice = currentPrice * (1 + changePercentage);

    // Ensure price doesn't go below a reasonable minimum (5% of original)
    const minPrice = currentPrice * 0.05;
    newPrice = Math.max(newPrice, minPrice);

    // Update price history
    history.push(newPrice);
    if (history.length > 10) {
      history.shift(); // Keep only last 10 prices
    }
    this.priceHistory.set(symbol, history);

    return newPrice;
  }

  /**
   * Simulates price updates for multiple assets
   */
  simulatePortfolioPriceUpdates(assets: Asset[]): PriceUpdate[] {
    const updates: PriceUpdate[] = [];
    const timestamp = Date.now();

    assets.forEach((asset) => {
      const previousPrice = asset.current_price || asset.purchase_price;
      const newPrice = this.simulatePriceUpdate(previousPrice, asset.symbol);

      const changeAmount = newPrice - previousPrice;
      const changePercentage = (changeAmount / previousPrice) * 100;

      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (Math.abs(changePercentage) > 0.01) { // More than 0.01% change
        trend = changePercentage > 0 ? 'up' : 'down';
      }

      updates.push({
        symbol: asset.symbol,
        currentPrice: newPrice,
        previousPrice,
        changeAmount,
        changePercentage,
        trend,
        timestamp,
      });
    });

    return updates;
  }

  /**
   * Apply price updates to assets
   */
  applyPriceUpdates(assets: Asset[], updates: PriceUpdate[]): Asset[] {
    const updateMap = new Map(updates.map(u => [u.symbol, u]));

    return assets.map(asset => {
      const update = updateMap.get(asset.symbol);
      if (!update) return asset;

      const currentPrice = update.currentPrice;
      const currentValue = asset.quantity * currentPrice;
      const totalCost = asset.quantity * asset.purchase_price;
      const gainLoss = currentValue - totalCost;
      const gainLossPercentage = (gainLoss / totalCost) * 100;

      return {
        ...asset,
        current_price: currentPrice,
        current_value: currentValue,
        gain_loss: gainLoss,
        gain_loss_percentage: gainLossPercentage,
      };
    });
  }

  /**
   * Reset price history (useful when changing symbols or refreshing)
   */
  resetPriceHistory(symbol?: string): void {
    if (symbol) {
      this.priceHistory.delete(symbol);
    } else {
      this.priceHistory.clear();
    }
  }

  /**
   * Set volatility range
   */
  setVolatility(min: number, max: number): void {
    this.volatilityMin = Math.max(0, Math.min(min, 0.1)); // Cap at 10%
    this.volatilityMax = Math.max(0, Math.min(max, 0.1)); // Cap at 10%
  }

  /**
   * Get update interval
   */
  getUpdateInterval(): number {
    return this.updateInterval;
  }

  /**
   * Set update interval
   */
  setUpdateInterval(interval: number): void {
    this.updateInterval = interval;
  }
}

export const priceUpdateService = new PriceUpdateService();
