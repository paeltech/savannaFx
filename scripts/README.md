# Export Phone Numbers Script

This directory contains scripts to export phone numbers from the database to CSV format.

## Method 1: TypeScript Script (Recommended)

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get your Supabase Service Role Key:
   - Go to Supabase Dashboard → Settings → API
   - Copy the "service_role" key (keep it secret!)

### Usage

Run the export script:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here npm run export:phones
```

Or set the environment variable first:

```bash
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
npm run export:phones
```

### Output

The script will create a CSV file named `phone-numbers-export-YYYY-MM-DD.csv` in the project root directory.

The CSV includes:
- User ID
- Email (if available)
- Phone Number
- Phone Verified status
- WhatsApp Notifications Enabled
- Email Notifications Enabled
- Created At
- Updated At

## Method 2: SQL Script (Alternative)

If you prefer to export directly from Supabase SQL Editor:

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `export-phone-numbers.sql`
3. Run the query
4. Click "Download CSV" or copy the results

### SQL Export Options

The SQL script provides three options:

1. **Simple Query**: Returns all phone numbers with user details (copy results manually)
2. **COPY Command**: Exports directly to CSV file (requires superuser privileges)
3. **Summary Statistics**: Shows counts of verified phones, WhatsApp enabled, etc.

## Security Notes

⚠️ **Important**: The service role key has full database access and bypasses Row Level Security (RLS). Keep it secure and never commit it to version control.

- ✅ Safe to use for administrative exports
- ✅ Required to access `auth.users` table for emails
- ❌ Never expose in client-side code
- ❌ Never commit to git

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY environment variable is required"

Make sure you've set the environment variable before running the script.

### "Failed to fetch user profiles"

- Verify your Supabase URL is correct
- Check that the service role key is valid
- Ensure you have network access to Supabase

### "Could not fetch emails"

The script will still export phone numbers even if emails can't be fetched. You can:
- Use the SQL script method instead
- Check that the `get_all_users_with_roles` function exists in your database
- Verify RLS policies allow service role access

## Example Output

```csv
User ID,Email,Phone Number,Phone Verified,WhatsApp Notifications Enabled,Email Notifications Enabled,Created At,Updated At
123e4567-e89b-12d3-a456-426614174000,user@example.com,+255712345678,true,true,true,2024-01-15T10:30:00Z,2024-01-15T10:30:00Z
```
