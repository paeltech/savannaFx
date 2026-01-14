/**
 * Shared notification utility functions
 * Platform-agnostic utilities that work in both web and mobile
 */
import type { NotificationType } from '../types/notification';

/**
 * Format relative time (e.g., "5m ago", "2h ago", "3d ago")
 * Works in both web and mobile contexts
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
