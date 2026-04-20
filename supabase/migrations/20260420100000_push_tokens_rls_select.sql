-- PostgREST upsert with resolution=merge-duplicates must SELECT existing rows to resolve
-- conflicts. Without a SELECT policy, authenticated clients get 42501 on upsert even when
-- INSERT/UPDATE policies exist (see push_tokens migration).

CREATE POLICY "Users can select own push tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can select own push tokens" ON push_tokens IS
  'Required for client upsert; users may only read their own token rows.';
