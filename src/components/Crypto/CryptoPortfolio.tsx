import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { Portfolio, AssetCreate, AssetType } from '../../types';
import { ArrowLeft, Plus, TrendingUp, TrendingDown } from 'lucide-react';

export function CryptoPortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCryptoPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load crypto portfolio', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const isPositive = (portfolio?.total_gain_loss || 0) >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Crypto Portfolio</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Crypto
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">${portfolio?.total_value.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invested</p>
              <p className="text-3xl font-bold text-gray-900">${portfolio?.total_invested.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gain/Loss</p>
              <p className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}${portfolio?.total_gain_loss.toFixed(2)}
              </p>
              <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                ({portfolio?.total_gain_loss_percentage.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gain/Loss</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolio?.assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No crypto assets yet. Click "Add Crypto" to get started.
                  </td>
                </tr>
              ) : (
                portfolio?.assets.map((asset) => {
                  const assetPositive = (asset.gain_loss || 0) >= 0;
                  return (
                    <tr key={asset.asset_id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{asset.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{asset.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${asset.purchase_price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${asset.current_price?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${asset.current_value?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${assetPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {assetPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                          {assetPositive ? '+' : ''}${asset.gain_loss?.toFixed(2) || '0.00'}
                          <span className="ml-2">({asset.gain_loss_percentage?.toFixed(2)}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
