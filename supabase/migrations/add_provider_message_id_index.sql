-- Add index on provider_message_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_notification_logs_provider_message_id 
ON notification_logs(provider_message_id) 
WHERE provider_message_id IS NOT NULL;

-- Add index on status and notification_type for filtering
CREATE INDEX IF NOT EXISTS idx_notification_logs_status_type 
ON notification_logs(status, notification_type);
