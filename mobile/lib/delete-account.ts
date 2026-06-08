import { supabase } from './supabase';

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Permanently deletes the signed-in user's account via the delete-user-account Edge Function.
 */
export async function deleteUserAccount(userId: string): Promise<DeleteAccountResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, message: 'You must be signed in to delete your account.' };
  }

  const { data, error } = await supabase.functions.invoke('delete-user-account', {
    body: { userId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('delete-user-account invoke error:', error);
    return {
      ok: false,
      message: error.message || 'Could not delete account. Please try again or contact support.',
    };
  }

  const payload = data as { success?: boolean; error?: string } | null;
  if (payload?.error) {
    return { ok: false, message: payload.error };
  }
  if (!payload?.success) {
    return { ok: false, message: 'Account deletion did not complete. Please contact support.' };
  }

  return { ok: true };
}
