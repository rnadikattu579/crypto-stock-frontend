import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface NotificationPreferences {
  user_id: string;
  email: string;
  email_verified: boolean;
  daily_digest_enabled: boolean;
  weekly_report_enabled: boolean;
  price_alerts_enabled: boolean;
  milestone_enabled: boolean;
  large_movement_enabled: boolean;
  transaction_confirmation_enabled: boolean;
  goal_progress_enabled: boolean;
  price_alert_frequency: 'immediate' | 'daily' | 'weekly' | 'disabled';
  digest_time: string;
  weekly_day: number;
  timezone: string;
  max_emails_per_day: number;
  emails_sent_today: number;
  last_email_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesUpdate {
  email?: string;
  daily_digest_enabled?: boolean;
  weekly_report_enabled?: boolean;
  price_alerts_enabled?: boolean;
  milestone_enabled?: boolean;
  large_movement_enabled?: boolean;
  transaction_confirmation_enabled?: boolean;
  goal_progress_enabled?: boolean;
  price_alert_frequency?: 'immediate' | 'daily' | 'weekly' | 'disabled';
  digest_time?: string;
  weekly_day?: number;
  timezone?: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  notification_type: string;
  status: string;
  to_email: string;
  subject: string;
  html_content: string;
  plain_content?: string;
  data?: Record<string, any>;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  created_at: string;
}

export interface NotificationHistory {
  notifications: Notification[];
  count: number;
  limit: number;
  offset: number;
}

export interface TestEmailRequest {
  notification_type: 'daily_digest' | 'weekly_report' | 'price_alert' | 'milestone' | 'transaction_confirmation' | 'welcome';
}

export interface EmailConfig {
  valid: boolean;
  issues: string[];
  config: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string | null;
    email_from: string;
    email_enabled: boolean;
    template_dir: string;
  };
}

class NotificationService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await axios.get(`${API_URL}/notifications/preferences`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  async updatePreferences(updates: NotificationPreferencesUpdate): Promise<NotificationPreferences> {
    const response = await axios.post(`${API_URL}/notifications/preferences`, updates, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  async sendTestEmail(notification_type: TestEmailRequest['notification_type']): Promise<void> {
    await axios.post(
      `${API_URL}/notifications/test`,
      { notification_type },
      {
        headers: this.getAuthHeader(),
      }
    );
  }

  async getHistory(
    type?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationHistory> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await axios.get(`${API_URL}/notifications/history?${params.toString()}`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }

  async getEmailConfig(): Promise<EmailConfig> {
    const response = await axios.get(`${API_URL}/notifications/config`, {
      headers: this.getAuthHeader(),
    });
    return response.data.data;
  }
}

export default new NotificationService();
