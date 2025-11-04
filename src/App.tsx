import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/shared/Toast';
import { TimeoutWarningDialog } from './components/shared/TimeoutWarningDialog';
import { LandingPage } from './components/Landing/LandingPage';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CryptoPortfolio } from './components/Crypto/CryptoPortfolio';
import { StockPortfolio } from './components/Stocks/StockPortfolio';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  // Auto logout after 5 minutes of inactivity with 30-second warning
  useIdleTimeout({
    onWarning: () => {
      setShowWarning(true);
    },
    onIdle: () => {
      logout();
      navigate('/');
    },
    idleTime: 5 * 60 * 1000, // 5 minutes
    warningTime: 30 * 1000, // 30 seconds before timeout
  });

  const handleContinueSession = () => {
    setShowWarning(false);
    // User activity will reset the timer automatically
  };

  return isAuthenticated ? (
    <>
      {children}
      <TimeoutWarningDialog
        isOpen={showWarning}
        onContinue={handleContinueSession}
        countdownSeconds={30}
      />
    </>
  ) : (
    <Navigate to="/" />
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/crypto"
            element={
              <PrivateRoute>
                <CryptoPortfolio />
              </PrivateRoute>
            }
          />
          <Route
            path="/stocks"
            element={
              <PrivateRoute>
                <StockPortfolio />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
