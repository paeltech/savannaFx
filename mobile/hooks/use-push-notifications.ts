import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import {
  setNotificationHandler,
  registerForPushNotificationsAsync,
  getPushPlatform,
  getRouteFromPushData,
} from '../lib/push-notifications';

/**
 * Registers push token with backend and sets up notification listeners.
 * Call once when user is authenticated (e.g. in root layout when session exists).
 */
export function usePushNotifications(userId: string | undefined) {
  const listenerRefs = useRef<{ received: Notifications.EventSubscription; response: Notifications.EventSubscription } | null>(null);

  useEffect(() => {
    if (!userId) return;

    setNotificationHandler();

    let isMounted = true;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!isMounted || !token) {
        if (__DEV__ && !token) console.warn('[Push] No token – check logs above. Use a dev build on a physical device.');
        return;
      }

      const platform = getPushPlatform();
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          expo_push_token: token,
          platform,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: ['user_id', 'expo_push_token'],
        }
      );

      if (error) {
        if (__DEV__) console.error('[Push] Failed to save token to push_tokens:', error.message, error.details);
        return;
      }
      if (__DEV__) console.log('[Push] Token saved to push_tokens for user', userId);
    })();

    const received = Notifications.addNotificationReceivedListener(() => {
      // Optional: refresh in-app notification list or badge
    });

    const response = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      const route = getRouteFromPushData(data);
      if (route) router.push(route as never);
      const notificationId = data?.notification_id as string | undefined;
      if (notificationId) {
        supabase.from('notifications').update({ read: true }).eq('id', notificationId).then(() => {});
      }
    });

    listenerRefs.current = { received, response };

    return () => {
      isMounted = false;
      received.remove();
      response.remove();
      listenerRefs.current = null;
    };
  }, [userId]);
}

/**
 * Handle app opened from quit state via notification tap.
 * Call once on app startup (e.g. in root layout).
 */
export async function handleInitialNotificationResponse(): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return;

  const data = response.notification.request.content.data as Record<string, unknown> | null;
  const route = getRouteFromPushData(data);
  if (route) router.push(route as never);
  const notificationId = data?.notification_id as string | undefined;
  if (notificationId) {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  }
}
