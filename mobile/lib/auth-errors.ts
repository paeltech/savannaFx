import type { AuthError } from '@supabase/supabase-js';

export function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const lower = msg.toLowerCase();
  return (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('timeout')
  );
}

export function formatAuthErrorMessage(err: unknown): string {
  if (isNetworkError(err)) {
    return (
      'Could not reach the server. Check your internet connection, disable VPN if enabled, and try again.'
    );
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as AuthError).message || '');
    if (msg) return msg;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return 'Something went wrong. Please try again.';
}
