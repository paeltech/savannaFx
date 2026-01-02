-- Add chart_image_url column to trade_analyses table
-- Run this migration in Supabase SQL Editor

ALTER TABLE trade_analyses 
ADD COLUMN IF NOT EXISTS chart_image_url TEXT;

-- Create index for chart_image_url queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_trade_analyses_chart_image_url 
ON trade_analyses(chart_image_url) 
WHERE chart_image_url IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trade_analyses' 
AND column_name = 'chart_image_url';
