/**
 * Shared Notification types
 * Used by both web and mobile apps
 */
export type NotificationType = 'signal' | 'event' | 'announcement' | 'system';

export interface NotificationData {
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface Notification extends NotificationData {
  id: string;
  user_id: string;
  read: boolean;
  deleted: boolean;
  created_at: string;
  read_at: string | null;
  deleted_at: string | null;
}
