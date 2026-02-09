import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { usePushNotifications, handleInitialNotificationResponse } from '../hooks/use-push-notifications';

type Props = { children: React.ReactNode };

/**
 * Subscribes to auth state, registers push token when user is logged in,
 * and handles notification tap when app was opened from quit state.
 */
export function PushNotificationProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getInitial = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
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
