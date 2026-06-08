import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isInvalidRefreshTokenError } from '../lib/supabase';
import { setNotificationHandler } from '../lib/push-notifications';
import { usePushNotifications, handleInitialNotificationResponse } from '../hooks/use-push-notifications';

type Props = { children: React.ReactNode };

/**
 * Subscribes to auth state, registers push token when user is logged in,
 * and handles notification tap when app was opened from quit state.
 */
export function PushNotificationProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setNotificationHandler();
  }, []);

  useEffect(() => {
    const getInitial = async () => {
      const { data: { session: s }, error } = await supabase.auth.getSession();
      if (error && isInvalidRefreshTokenError(error)) {
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        return;
      }
      setSession(s);
    };
    getInitial();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  usePushNotifications(session?.user?.id);

  useEffect(() => {
    handleInitialNotificationResponse();
  }, []);

  return <>{children}</>;
}
