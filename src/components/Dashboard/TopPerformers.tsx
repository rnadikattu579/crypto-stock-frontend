import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Portfolio } from '../../types';

interface TopPerformersProps {
  cryptoPortfolio: Portfolio | null;
  stockPortfolio: Portfolio | null;
}

export function TopPerformers({ cryptoPortfolio, stockPortfolio }: TopPerformersProps) {
  const allAssets = [
    ...(cryptoPortfolio?.assets || []),
    ...(stockPortfolio?.assets || []),
  ];

  const topGainers = [...allAssets]
    .filter((a) => (a.gain_loss || 0) > 0)
    .sort((a, b) => (b.gain_loss_percentage || 0) - (a.gain_loss_percentage || 0))
    .slice(0, 3);

  const topLosers = [...allAssets]
    .filter((a) => (a.gain_loss || 0) < 0)
    .sort((a, b) => (a.gain_loss_percentage || 0) - (b.gain_loss_percentage || 0))
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Gainers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">Top Gainers</h3>
        </div>
        {topGainers.length > 0 ? (
          <div className="space-y-3">
            {topGainers.map((asset, index) => (
              <div
                key={asset.asset_id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{asset.symbol}</div>
                    <div className="text-sm text-gray-600">
                      ${asset.current_value?.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    +{asset.gain_loss_percentage?.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    +${asset.gain_loss?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No gains yet</p>
        )}
      </div>

      {/* Top Losers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-bold text-gray-900">Top Losers</h3>
        </div>
        {topLosers.length > 0 ? (
          <div className="space-y-3">
            {topLosers.map((asset, index) => (
              <div
                key={asset.asset_id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{asset.symbol}</div>
                    <div className="text-sm text-gray-600">
                      ${asset.current_value?.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    {asset.gain_loss_percentage?.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    ${asset.gain_loss?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No losses yet</p>
        )}
      </div>
    </div>
  );
}
