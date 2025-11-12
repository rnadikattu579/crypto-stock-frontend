import React from 'react';
import { X, Bell, TrendingUp, TrendingDown, Target, Mail, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import type { InAppNotification } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: InAppNotification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const { markAsRead, clearNotification } = useNotifications();
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'price_alert':
        return <Bell className="text-red-500" size={20} />;
      case 'milestone':
        return <Target className="text-purple-500" size={20} />;
      case 'large_movement':
        return notification.message.includes('increased') ? (
          <TrendingUp className="text-green-500" size={20} />
        ) : (
          <TrendingDown className="text-red-500" size={20} />
        );
      case 'transaction_confirmation':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'goal_progress':
        return <Target className="text-blue-500" size={20} />;
      case 'daily_digest':
      case 'weekly_report':
        return <Mail className="text-blue-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const handleClick = () => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotification(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            <button
              onClick={handleDelete}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear notification"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
            {!notification.read && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                New
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
