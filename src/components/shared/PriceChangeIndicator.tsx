import { usePriceUpdates } from '../../contexts/PriceUpdateContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PriceChangeIndicatorProps {
  symbol: string;
  currentPrice: number;
  showIcon?: boolean;
  className?: string;
}

export function PriceChangeIndicator({
  symbol,
  currentPrice,
  showIcon = true,
  className = '',
}: PriceChangeIndicatorProps) {
  const { priceUpdates, isLiveEnabled } = usePriceUpdates();
  const [isFlashing, setIsFlashing] = useState(false);
  const [previousPrice, setPreviousPrice] = useState(currentPrice);

  const update = priceUpdates.get(symbol);
  const displayPrice = update?.currentPrice || currentPrice;
  const trend = update?.trend || 'neutral';
  const changePercentage = update?.changePercentage || 0;

  // Flash animation when price changes
  useEffect(() => {
    if (isLiveEnabled && displayPrice !== previousPrice) {
      setIsFlashing(true);
      setPreviousPrice(displayPrice);

      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [displayPrice, previousPrice, isLiveEnabled]);

  const getTrendColor = () => {
    if (!isLiveEnabled) return 'text-gray-900 dark:text-white';
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-900 dark:text-white';
    }
  };

  const getFlashColor = () => {
    switch (trend) {
      case 'up':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'down':
        return 'bg-red-100 dark:bg-red-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getTrendIcon = () => {
    if (!showIcon || !isLiveEnabled) return null;

    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 transition-all duration-300 ${getTrendColor()} ${
        isFlashing ? `${getFlashColor()} px-2 py-1 rounded` : ''
      } ${className}`}
    >
      {getTrendIcon()}
      <span className="font-semibold">${displayPrice.toFixed(2)}</span>
      {isLiveEnabled && Math.abs(changePercentage) > 0.01 && (
        <span className="text-xs opacity-75">
          ({changePercentage > 0 ? '+' : ''}
          {changePercentage.toFixed(2)}%)
        </span>
      )}
    </div>
  );
}
