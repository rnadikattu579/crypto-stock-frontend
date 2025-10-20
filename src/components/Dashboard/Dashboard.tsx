import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { PortfolioSummary } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export function Dashboard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPortfolioSummary();
      setSummary(data);
    } catch (err: any) {
      setError('Failed to load portfolio summary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const isPositive = (summary?.total_gain_loss || 0) >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${summary?.total_value.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}${summary?.total_gain_loss.toFixed(2) || '0.00'}
                </p>
                <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {summary?.total_gain_loss_percentage.toFixed(2)}%
                </p>
              </div>
              {isPositive ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crypto Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${summary?.crypto_value.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500">{summary?.crypto_count || 0} assets</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${summary?.stock_value.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500">{summary?.stock_count || 0} assets</p>
              </div>
              <PieChart className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/crypto')}
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow text-left"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">Crypto Portfolio</h2>
            <p className="text-gray-600">View and manage your cryptocurrency investments</p>
          </button>

          <button
            onClick={() => navigate('/stocks')}
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow text-left"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">Stock Portfolio</h2>
            <p className="text-gray-600">View and manage your stock investments</p>
          </button>
        </div>
      </main>
    </div>
  );
}
