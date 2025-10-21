import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, BarChart3, Zap, PieChart, DollarSign, ArrowRight } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Digital Asset Portfolio Tracker</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 text-white font-medium hover:text-gray-200 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2.5 bg-white text-indigo-900 font-semibold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Your Complete
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Digital Asset
                </span>
                Portfolio
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                Track, analyze, and grow your cryptocurrency and stock investments in one powerful platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border-2 border-white/20 hover:bg-white/20 transition-all"
                >
                  Sign In
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-sm text-gray-400">Real-time Updates</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-white">100+</div>
                  <div className="text-sm text-gray-400">Assets Supported</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-white">Secure</div>
                  <div className="text-sm text-gray-400">Bank-Level</div>
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative">
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                {/* Mock Dashboard */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">Portfolio Overview</h3>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      +12.5%
                    </div>
                  </div>

                  {/* Value Card */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="text-gray-400 text-sm mb-2">Total Value</div>
                    <div className="text-4xl font-bold text-white">$45,234.67</div>
                    <div className="text-green-400 text-sm mt-2 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      +$5,234.67 (12.5%)
                    </div>
                  </div>

                  {/* Asset Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <DollarSign className="h-4 w-4 text-orange-400" />
                        </div>
                        <span className="text-white font-medium">BTC</span>
                      </div>
                      <div className="text-white font-bold">$32,450</div>
                      <div className="text-green-400 text-xs">+8.2%</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-white font-medium">AAPL</span>
                      </div>
                      <div className="text-white font-bold">$8,540</div>
                      <div className="text-green-400 text-xs">+3.1%</div>
                    </div>
                  </div>

                  {/* Chart Preview */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-center h-24">
                      <BarChart3 className="h-16 w-16 text-purple-400 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-xl animate-float">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-6 -left-6 p-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-xl animate-float animation-delay-2000">
                <PieChart className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to manage your portfolio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you track and grow your digital assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Analytics</h3>
              <p className="text-gray-600">
                Track your portfolio performance with live price updates and detailed charts
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl w-fit mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bank-Level Security</h3>
              <p className="text-gray-600">
                Your data is encrypted and protected with industry-leading security standards
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl w-fit mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Get instant updates and seamless performance across all your devices
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl w-fit mb-4">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Portfolio Insights</h3>
              <p className="text-gray-600">
                Visualize your holdings with beautiful charts and detailed breakdowns
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl w-fit mb-4">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Asset Support</h3>
              <p className="text-gray-600">
                Track cryptocurrencies and stocks all in one convenient platform
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Tracking</h3>
              <p className="text-gray-600">
                Monitor gains, losses, and overall portfolio performance at a glance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to take control of your portfolio?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of investors tracking their digital assets with confidence
          </p>
          <button
            onClick={() => navigate('/register')}
            className="group px-8 py-4 bg-white text-indigo-900 font-bold rounded-full hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-2"
          >
            Start Tracking Now
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2025 Digital Asset Portfolio Tracker. All rights reserved.</p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
