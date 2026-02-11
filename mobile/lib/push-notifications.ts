import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_CHANNEL_ID = 'default';

/**
 * Configure how notifications are presented when app is in foreground.
 * Call once at app startup.
 */
export function setNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldAnnotate: true,
    }),
  });
}

/**
 * Create Android notification channel (required for Android 8+).
 * Call before requesting token on Android.
 */
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F4C464',
  });
}

/**
 * Register for push notifications and return Expo push token.
 * Returns null if not a physical device, permission denied, or projectId missing.
 */
const LOG_PUSH = __DEV__;

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await setupAndroidChannel();

  if (!Device.isDevice) {
    if (LOG_PUSH) console.warn('[Push] Not a physical device – push requires a real device (no emulator/Expo Go)');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (LOG_PUSH) console.warn('[Push] Permission denied – enable notifications in device settings for this app');
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } })?.easConfig?.projectId;

  if (!projectId) {
    console.warn('[Push] No EAS projectId – set extra.eas.projectId in app.json and use a dev/production build');
    return null;
  }

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    if (LOG_PUSH) console.log('[Push] Token obtained');
    return tokenResult.data;
  } catch (e) {
    console.warn('[Push] getExpoPushTokenAsync failed:', e);
    return null;
  }
}

/**
 * Get platform for push_tokens table.
 */
export function getPushPlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/**
 * Map push notification data (from Expo payload) to an in-app route.
 * Matches logic in app/notifications.tsx getActionRoute.
 */
export function getRouteFromPushData(data: Record<string, unknown> | null): string | null {
  if (!data || typeof data !== 'object') return null;
  const type = data.notification_type as string | undefined;
  const meta = (data.metadata as Record<string, unknown>) ?? {};
  switch (type) {
    case 'signal':
      return meta.signal_id ? `/signals/${meta.signal_id}` : '/signals';
    case 'event':
      return meta.event_id ? `/events/${meta.event_id}` : '/events';
    case 'announcement':
      return meta.analysis_id ? `/analysis/${meta.analysis_id}` : '/analysis';
    default:
      return (data.action_url as string) || null;
  }
}

export { DEFAULT_CHANNEL_ID };
