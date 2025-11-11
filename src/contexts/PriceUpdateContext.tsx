import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { priceUpdateService, type PriceUpdate } from '../services/priceUpdateService';
import type { Asset, Portfolio } from '../types';

export type ConnectionStatus = 'connected' | 'disconnected' | 'updating';

interface PriceUpdateContextType {
  // State
  isLiveEnabled: boolean;
  connectionStatus: ConnectionStatus;
  lastUpdateTime: number | null;
  priceUpdates: Map<string, PriceUpdate>;
  updateInterval: number;

  // Actions
  enableLivePrices: () => void;
  disableLivePrices: () => void;
  toggleLivePrices: () => void;
  setUpdateInterval: (interval: number) => void;
  applyUpdatesToPortfolio: (portfolio: Portfolio) => Portfolio;
  applyUpdatesToAssets: (assets: Asset[]) => Asset[];
  manualRefresh: () => void;
  resetPriceHistory: (symbol?: string) => void;
}

const PriceUpdateContext = createContext<PriceUpdateContextType | undefined>(undefined);

interface PriceUpdateProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  LIVE_ENABLED: 'livePricesEnabled',
  UPDATE_INTERVAL: 'priceUpdateInterval',
};

export function PriceUpdateProvider({ children }: PriceUpdateProviderProps) {
  // Load settings from localStorage
  const [isLiveEnabled, setIsLiveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LIVE_ENABLED);
    return saved ? JSON.parse(saved) : false;
  });

  const [updateInterval, setUpdateIntervalState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UPDATE_INTERVAL);
    return saved ? parseInt(saved, 10) : 10000; // Default: 10 seconds
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [priceUpdates, setPriceUpdates] = useState<Map<string, PriceUpdate>>(new Map());
  const [cryptoAssets, setCryptoAssets] = useState<Asset[]>([]);
  const [stockAssets, setStockAssets] = useState<Asset[]>([]);

  // Simulate fetching initial asset data (this would come from your actual data source)
  useEffect(() => {
    // This is a placeholder - in real implementation, this would be populated
    // by the Dashboard, CryptoPortfolio, or StockPortfolio components
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LIVE_ENABLED, JSON.stringify(isLiveEnabled));
  }, [isLiveEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UPDATE_INTERVAL, updateInterval.toString());
    priceUpdateService.setUpdateInterval(updateInterval);
  }, [updateInterval]);

  // Perform price update
  const performUpdate = useCallback(() => {
    if (!isLiveEnabled) return;

    setConnectionStatus('updating');

    // Combine all assets for update
    const allAssets = [...cryptoAssets, ...stockAssets];

    if (allAssets.length === 0) {
      setConnectionStatus('connected');
      return;
    }

    try {
      // Simulate price updates
      const updates = priceUpdateService.simulatePortfolioPriceUpdates(allAssets);

      // Convert to Map for easy lookup
      const updateMap = new Map(updates.map(u => [u.symbol, u]));
      setPriceUpdates(updateMap);

      setLastUpdateTime(Date.now());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to update prices:', error);
      setConnectionStatus('disconnected');
    }
  }, [isLiveEnabled, cryptoAssets, stockAssets]);

  // Set up interval for live updates
  useEffect(() => {
    if (!isLiveEnabled) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connected');

    // Perform initial update
    performUpdate();

    // Set up interval
    const intervalId = setInterval(performUpdate, updateInterval);

    return () => {
      clearInterval(intervalId);
      setConnectionStatus('disconnected');
    };
  }, [isLiveEnabled, updateInterval, performUpdate]);

  // Actions
  const enableLivePrices = useCallback(() => {
    setIsLiveEnabled(true);
  }, []);

  const disableLivePrices = useCallback(() => {
    setIsLiveEnabled(false);
    setConnectionStatus('disconnected');
  }, []);

  const toggleLivePrices = useCallback(() => {
    setIsLiveEnabled(prev => !prev);
  }, []);

  const setUpdateInterval = useCallback((interval: number) => {
    setUpdateIntervalState(interval);
  }, []);

  const applyUpdatesToAssets = useCallback((assets: Asset[]): Asset[] => {
    if (!isLiveEnabled || priceUpdates.size === 0) {
      return assets;
    }

    return assets.map(asset => {
      const update = priceUpdates.get(asset.symbol);
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
  }, [isLiveEnabled, priceUpdates]);

  const applyUpdatesToPortfolio = useCallback((portfolio: Portfolio): Portfolio => {
    if (!isLiveEnabled || priceUpdates.size === 0) {
      return portfolio;
    }

    const updatedAssets = applyUpdatesToAssets(portfolio.assets);

    // Recalculate portfolio totals
    const totalValue = updatedAssets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
    const totalInvested = updatedAssets.reduce((sum, asset) => sum + (asset.quantity * asset.purchase_price), 0);
    const totalGainLoss = totalValue - totalInvested;
    const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      ...portfolio,
      assets: updatedAssets,
      total_value: totalValue,
      total_invested: totalInvested,
      total_gain_loss: totalGainLoss,
      total_gain_loss_percentage: totalGainLossPercentage,
    };
  }, [isLiveEnabled, priceUpdates, applyUpdatesToAssets]);

  const manualRefresh = useCallback(() => {
    performUpdate();
  }, [performUpdate]);

  const resetPriceHistory = useCallback((symbol?: string) => {
    priceUpdateService.resetPriceHistory(symbol);
  }, []);

  // Register assets for updates (called by portfolio components)
  const registerAssetsForUpdates = useCallback((assets: Asset[], type: 'crypto' | 'stock') => {
    if (type === 'crypto') {
      setCryptoAssets(assets);
    } else {
      setStockAssets(assets);
    }
  }, []);

  const value = useMemo<PriceUpdateContextType>(
    () => ({
      isLiveEnabled,
      connectionStatus,
      lastUpdateTime,
      priceUpdates,
      updateInterval,
      enableLivePrices,
      disableLivePrices,
      toggleLivePrices,
      setUpdateInterval,
      applyUpdatesToPortfolio,
      applyUpdatesToAssets,
      manualRefresh,
      resetPriceHistory,
    }),
    [
      isLiveEnabled,
      connectionStatus,
      lastUpdateTime,
      priceUpdates,
      updateInterval,
      enableLivePrices,
      disableLivePrices,
      toggleLivePrices,
      setUpdateInterval,
      applyUpdatesToPortfolio,
      applyUpdatesToAssets,
      manualRefresh,
      resetPriceHistory,
    ]
  );

  // Expose registerAssetsForUpdates through window for components to use
  useEffect(() => {
    (window as any).__registerAssetsForUpdates = registerAssetsForUpdates;
    return () => {
      delete (window as any).__registerAssetsForUpdates;
    };
  }, [registerAssetsForUpdates]);

  return (
    <PriceUpdateContext.Provider value={value}>
      {children}
    </PriceUpdateContext.Provider>
  );
}

export function usePriceUpdates() {
  const context = useContext(PriceUpdateContext);
  if (context === undefined) {
    throw new Error('usePriceUpdates must be used within a PriceUpdateProvider');
  }
  return context;
}

// Hook for getting live price for a specific symbol
export function useLivePrice(symbol: string, fallbackPrice: number) {
  const { priceUpdates, isLiveEnabled } = usePriceUpdates();

  if (!isLiveEnabled) {
    return fallbackPrice;
  }

  const update = priceUpdates.get(symbol);
  return update?.currentPrice || fallbackPrice;
}

// Hook for components to register their assets for live updates
export function useRegisterAssets(assets: Asset[], type: 'crypto' | 'stock') {
  useEffect(() => {
    const registerFn = (window as any).__registerAssetsForUpdates;
    if (registerFn && assets.length > 0) {
      registerFn(assets, type);
    }
  }, [assets, type]);
}
