import { useState, type FormEvent } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import type { AssetCreate } from '../../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: 'crypto' | 'stock';
  onSuccess: () => void;
}

export function AddAssetModal({ isOpen, onClose, assetType, onSuccess }: AddAssetModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [error, setError] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    purchase_date: new Date().toISOString().split('T')[0],
  });

  const fetchCurrentPrice = async (symbol: string) => {
    if (!symbol.trim()) return;

    setFetchingPrice(true);
    setError('');
    setCurrentPrice(null);

    try {
      const prices = await apiService.getPrices([symbol.toUpperCase()], assetType);
      if (prices && prices.length > 0 && prices[0].price !== null && prices[0].price !== undefined) {
        if (prices[0].price === 0) {
          setError(`Could not fetch price for ${symbol.toUpperCase()}. Please check the symbol.`);
        } else {
          setCurrentPrice(prices[0].price);
        }
      } else {
        setError(`Could not fetch price for ${symbol.toUpperCase()}. Please check the symbol.`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to fetch price for ${symbol}`);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPrice) {
      setError('Please fetch the current price first');
      return;
    }

    setLoading(true);

    try {
      const asset: AssetCreate = {
        symbol: formData.symbol.toUpperCase(),
        quantity: parseFloat(formData.quantity),
        purchase_price: currentPrice,
        purchase_date: formData.purchase_date,
        asset_type: assetType,
      };

      await apiService.addAsset(asset);

      // Reset form
      setFormData({
        symbol: '',
        quantity: '',
        purchase_date: new Date().toISOString().split('T')[0],
      });
      setCurrentPrice(null);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add asset');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Add {assetType === 'crypto' ? 'Cryptocurrency' : 'Stock'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {assetType === 'crypto' ? 'Symbol (e.g., BTC, ETH)' : 'Ticker (e.g., AAPL, TSLA)'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.symbol}
                onChange={(e) => {
                  setFormData({ ...formData, symbol: e.target.value });
                  setCurrentPrice(null);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={assetType === 'crypto' ? 'BTC' : 'AAPL'}
              />
              <button
                type="button"
                onClick={() => fetchCurrentPrice(formData.symbol)}
                disabled={!formData.symbol.trim() || fetchingPrice}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${fetchingPrice ? 'animate-spin' : ''}`} />
                {fetchingPrice ? 'Fetching...' : 'Get Price'}
              </button>
            </div>
          </div>

          {currentPrice !== null && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-600">Current Price</p>
              <p className="text-2xl font-bold text-green-600">${currentPrice.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Real-time price from {assetType === 'crypto' ? 'CoinGecko' : 'Yahoo Finance'}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              required
              step="any"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.5"
            />
            {currentPrice && formData.quantity && (
              <p className="text-sm text-gray-600 mt-1">
                Total: ${(currentPrice * parseFloat(formData.quantity || '0')).toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              required
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
