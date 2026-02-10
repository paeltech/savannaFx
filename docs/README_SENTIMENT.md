# Sentiment Polling Feature

## Overview
The sentiment polling feature allows community members to vote on their market sentiment for various currency pairs. The system includes:

- Real-time voting on currency pairs
- Automatic polling every 10 seconds to refresh data
- Visual representation of community sentiment
- User-specific vote tracking

## Database Setup

### Required Table: `sentiment_votes`

Run the SQL migration file located at `supabase/migrations/create_sentiment_votes.sql` in your Supabase SQL editor.

The table structure:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `currency_pair` (TEXT, one of: EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, EUR/GBP, XAU/USD)
- `sentiment` (TEXT, one of: bullish, bearish, neutral)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Features:
- Unique constraint on (user_id, currency_pair) - one vote per user per pair
- Automatic timestamp updates
- Row Level Security (RLS) enabled
- Indexes for performance

## Usage

1. Navigate to `/dashboard/sentiment`
2. Select a currency pair from the dropdown
3. Click on Bullish, Neutral, or Bearish to cast your vote
4. View real-time results with percentages and progress bars
5. The system automatically refreshes every 10 seconds

## API Integration

The component uses Supabase client to:
- Fetch votes: `supabase.from("sentiment_votes").select("*").eq("currency_pair", pair)`
- Insert vote: `supabase.from("sentiment_votes").insert({...})`
- Update vote: `supabase.from("sentiment_votes").update({...}).eq("id", voteId)`

## Polling Mechanism

- Automatic refresh every 10 seconds
- Manual refresh button available
- Shows last updated timestamp
- Loading states during refresh



