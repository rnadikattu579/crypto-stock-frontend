export type NotificationType =
  | 'daily_digest'
  | 'weekly_report'
  | 'price_alert'
  | 'milestone'
  | 'large_movement'
  | 'transaction_confirmation'
  | 'goal_progress'
  | 'welcome'
  | 'email_verification';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'opened' | 'clicked';

export type NotificationFrequency = 'immediate' | 'daily' | 'weekly' | 'disabled';

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}
