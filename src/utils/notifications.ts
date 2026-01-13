import supabase from "@/integrations/supabase/client";
import { TrendingUp, Calendar, Megaphone, Settings } from "lucide-react";

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

/**
 * Create a notification for a single user
 */
export async function createNotificationForUser(
  userId: string,
  notificationData: NotificationData
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      ...notificationData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create notifications for multiple users (bulk insert)
 */
export async function createNotificationForUsers(
  userIds: string[],
  notificationData: NotificationData
) {
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    ...notificationData,
  }));

  const { data, error } = await supabase
    .from("notifications")
    .insert(notifications)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Get icon component for notification type
 */
export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'signal':
      return TrendingUp;
    case 'event':
      return Calendar;
    case 'announcement':
      return Megaphone;
    case 'system':
      return Settings;
    default:
      return Settings;
  }
}

/**
 * Get notification type color
 */
export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case 'signal':
      return 'text-gold';
    case 'event':
      return 'text-blue-400';
    case 'announcement':
      return 'text-purple-400';
    case 'system':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Format relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return date.toLocaleDateString();
}

/**
 * Format notification message for signal
 */
export function formatSignalNotification(signal: {
  title: string;
  trading_pair: string;
  signal_type: string;
  entry_price: string;
}) {
  const emoji = signal.signal_type === 'buy' ? '📈' : '📉';
  return {
    title: `${emoji} New Signal: ${signal.trading_pair}`,
    message: `${signal.title} - Entry at ${signal.entry_price}`,
  };
}

/**
 * Format notification message for event
 */
export function formatEventNotification(event: {
  title: string;
  event_type: string;
  start_date: string;
}) {
  return {
    title: `📅 New Event: ${event.title}`,
    message: `${event.event_type} starting ${new Date(event.start_date).toLocaleDateString()}`,
  };
}
