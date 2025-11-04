import { Plus, TrendingUp, Briefcase, PieChart } from 'lucide-react';

interface EmptyStateProps {
  type: 'portfolio' | 'dashboard';
  assetType?: 'crypto' | 'stock';
  onAddAsset?: () => void;
}

export function EmptyState({ type, assetType, onAddAsset }: EmptyStateProps) {
  if (type === 'portfolio') {
    const isCrypto = assetType === 'crypto';
    const Icon = isCrypto ? TrendingUp : Briefcase;
    const title = isCrypto ? 'No Crypto Assets Yet' : 'No Stock Assets Yet';
    const description = isCrypto
      ? 'Start building your cryptocurrency portfolio by adding your first digital asset'
      : 'Start tracking your stock investments by adding your first stock';

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className={`rounded-full p-6 mb-6 ${isCrypto ? 'bg-purple-100' : 'bg-indigo-100'}`}>
          <Icon className={`h-16 w-16 ${isCrypto ? 'text-purple-600' : 'text-indigo-600'}`} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 text-center max-w-md">{description}</p>

        <button
          onClick={onAddAsset}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors ${
            isCrypto
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <Plus className="h-5 w-5" />
          Add Your First {isCrypto ? 'Crypto' : 'Stock'}
        </button>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-2">1</div>
            <h4 className="font-semibold text-gray-900 mb-1">Click Add Button</h4>
            <p className="text-sm text-gray-600">Start by clicking the add button above</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-2">2</div>
            <h4 className="font-semibold text-gray-900 mb-1">Enter Details</h4>
            <p className="text-sm text-gray-600">Fill in asset symbol, quantity, and purchase price</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-2">3</div>
            <h4 className="font-semibold text-gray-900 mb-1">Track Performance</h4>
            <p className="text-sm text-gray-600">Watch your portfolio grow in real-time</p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard empty state
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="rounded-full p-8 bg-gradient-to-br from-blue-100 to-indigo-100 mb-6">
        <PieChart className="h-20 w-20 text-indigo-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Your Portfolio Tracker</h2>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
        Start your investment journey by adding your first crypto or stock assets.
        Track performance, analyze trends, and make informed decisions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-8 text-white cursor-pointer hover:shadow-xl transition-all transform hover:scale-105">
          <TrendingUp className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Add Crypto Assets</h3>
          <p className="text-purple-100">Track Bitcoin, Ethereum, and other cryptocurrencies</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-8 text-white cursor-pointer hover:shadow-xl transition-all transform hover:scale-105">
          <Briefcase className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Add Stock Assets</h3>
          <p className="text-indigo-100">Monitor stocks, ETFs, and other securities</p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-4xl">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-blue-600">📊</span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Real-time Tracking</h4>
          <p className="text-sm text-gray-600">Live price updates every 30 seconds</p>
        </div>
        <div className="text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-green-600">📈</span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Performance Analytics</h4>
          <p className="text-sm text-gray-600">Detailed charts and insights</p>
        </div>
        <div className="text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-purple-600">💰</span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Gain/Loss Tracking</h4>
          <p className="text-sm text-gray-600">Monitor your profits and losses</p>
        </div>
        <div className="text-center">
          <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-orange-600">📱</span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Mobile Friendly</h4>
          <p className="text-sm text-gray-600">Access anywhere, anytime</p>
        </div>
      </div>
    </div>
  );
}
