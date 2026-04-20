import { createClient } from '@supabase/supabase-js';
import type { AuthError } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../../shared/constants/supabase';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Detect stale SecureStore session (revoked user, rotated keys, simulator reinstall, etc.). */
export function isInvalidRefreshTokenError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as AuthError & { code?: string };
  const msg = (e.message || '').toLowerCase();
  const code = (e.code || '').toLowerCase();
  return (
    msg.includes('refresh token') ||
    msg.includes('invalid grant') ||
    code === 'refresh_token_not_found' ||
    code === 'invalid_refresh_token'
  );
}

/**
 * Clears local session when refresh fails so the app stops retrying and the user can sign in again.
 * Call once early in startup (e.g. root layout after fonts load).
 */
export async function recoverFromInvalidRefreshToken(): Promise<void> {
  try {
    const { error } = await supabase.auth.getSession();
    if (error && isInvalidRefreshTokenError(error)) {
      await supabase.auth.signOut({ scope: 'local' });
    }
  } catch (e) {
    if (isInvalidRefreshTokenError(e)) {
      await supabase.auth.signOut({ scope: 'local' });
    }
  }
}
