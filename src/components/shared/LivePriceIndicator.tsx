import { usePriceUpdates } from '../../contexts/PriceUpdateContext';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LivePriceIndicatorProps {
  showToggle?: boolean;
  className?: string;
}

export function LivePriceIndicator({ showToggle = true, className = '' }: LivePriceIndicatorProps) {
  const {
    isLiveEnabled,
    connectionStatus,
    lastUpdateTime,
    toggleLivePrices,
  } = usePriceUpdates();

  const getStatusColor = () => {
    if (!isLiveEnabled) return 'bg-gray-400 dark:bg-gray-600';
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'updating':
        return 'bg-blue-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    if (!isLiveEnabled) return 'Live prices disabled';
    switch (connectionStatus) {
      case 'connected':
        return 'Live prices active';
      case 'updating':
        return 'Updating prices...';
      case 'disconnected':
        return 'Connection lost';
      default:
        return 'Unknown status';
    }
  };

  const getStatusIcon = () => {
    if (!isLiveEnabled) {
      return <WifiOff className="h-4 w-4" />;
    }
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'updating':
        return <Activity className="h-4 w-4 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`h-2 w-2 rounded-full ${getStatusColor()} ${connectionStatus === 'updating' ? 'animate-pulse' : ''}`} />
        <div className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {getStatusText()}
          </span>
        </div>
        {isLiveEnabled && lastUpdateTime && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 border-l border-gray-300 dark:border-gray-600 pl-2">
            {formatDistanceToNow(lastUpdateTime, { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Toggle Button */}
      {showToggle && (
        <button
          onClick={toggleLivePrices}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isLiveEnabled
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
          title={isLiveEnabled ? 'Disable live prices' : 'Enable live prices'}
        >
          {isLiveEnabled ? (
            <>
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>Live</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
              <span>Paused</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
