# Setting Up Sentiment Voting Table

## Quick Setup Instructions

The `sentiment_votes` table needs to be created in your Supabase database. Follow these steps:

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/create_sentiment_votes.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

4. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see `sentiment_votes` table listed
   - Verify the columns: `id`, `user_id`, `currency_pair`, `sentiment`, `created_at`, `updated_at`

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

Or manually:

```bash
supabase db execute -f supabase/migrations/create_sentiment_votes.sql
```

## SQL Migration File Location

The migration file is located at:
```
supabase/migrations/create_sentiment_votes.sql
```

## What the Migration Creates

1. **Table**: `sentiment_votes` with columns:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `currency_pair` (TEXT, constrained to valid pairs)
   - `sentiment` (TEXT, constrained to: bullish, bearish, neutral)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **Constraints**:
   - Unique constraint: one vote per user per currency pair
   - Check constraints for valid currency pairs and sentiments

3. **Indexes**: For performance optimization

4. **Row Level Security (RLS)**:
   - Anyone can read votes
   - Users can only insert/update/delete their own votes

5. **Trigger**: Automatically updates `updated_at` timestamp

## Troubleshooting

### Error: "relation does not exist"
- Make sure you've run the SQL migration
- Check that you're connected to the correct Supabase project
- Verify the table exists in Table Editor

### Error: "permission denied"
- Check that RLS policies are created correctly
- Verify your user has the correct permissions

### Error: "function does not exist"
- Make sure the `update_updated_at_column()` function was created
- Re-run the migration if needed

## Testing

After running the migration:

1. Navigate to `/dashboard/sentiment` in your app
2. Select a currency pair
3. Try voting - it should work without errors
4. Check Supabase Table Editor to see votes being created

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the Dashboard
2. Verify the SQL syntax is correct
3. Ensure you have the correct permissions in Supabase



