-- =============================================================================
-- IN-APP NOTIFICATION TRIGGERS
-- Creates notifications in the notifications table for various events
-- =============================================================================

-- Function to create in-app notifications for new signals
CREATE OR REPLACE FUNCTION create_signal_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications for active signals
  IF NEW.status = 'active' THEN
    -- Insert a notification for all users who have push_signals enabled
    INSERT INTO notifications (user_id, notification_type, title, message, metadata)
    SELECT 
      np.user_id,
      'signal',
      '🚀 New Trading Signal: ' || NEW.trading_pair,
      CASE 
        WHEN NEW.signal_type = 'buy' THEN 'BUY signal for ' || NEW.trading_pair || ' at ' || NEW.entry_price
        WHEN NEW.signal_type = 'sell' THEN 'SELL signal for ' || NEW.trading_pair || ' at ' || NEW.entry_price
        ELSE 'New signal for ' || NEW.trading_pair
      END,
      jsonb_build_object(
        'signal_id', NEW.id,
        'trading_pair', NEW.trading_pair,
        'signal_type', NEW.signal_type,
        'entry_price', NEW.entry_price,
        'stop_loss', NEW.stop_loss,
        'take_profit_1', NEW.take_profit_1,
        'take_profit_2', NEW.take_profit_2,
        'confidence_level', NEW.confidence_level
      )
    FROM notification_preferences np
    WHERE np.push_signals = true;
    
    RAISE NOTICE 'Created notifications for new signal: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail signal creation
    RAISE WARNING 'Failed to create signal notifications: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create in-app notifications for new trade analyses
CREATE OR REPLACE FUNCTION create_analysis_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for all users who have push_analyses enabled
  INSERT INTO notifications (user_id, notification_type, title, message, metadata)
  SELECT 
    np.user_id,
    'announcement',
    '📊 New Trade Analysis: ' || NEW.trading_pair,
    NEW.title || ' - ' || COALESCE(NEW.summary, 'View detailed market analysis'),
    jsonb_build_object(
      'analysis_id', NEW.id,
      'trading_pair', NEW.trading_pair,
      'risk_level', NEW.risk_level,
      'price', NEW.price
    )
  FROM notification_preferences np
  WHERE np.push_analyses = true;
  
  RAISE NOTICE 'Created notifications for new analysis: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create analysis notifications: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create in-app notifications for new events
CREATE OR REPLACE FUNCTION create_event_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications for published events
  IF NEW.status = 'published' THEN
    -- Insert a notification for all users who have push_events enabled
    INSERT INTO notifications (user_id, notification_type, title, message, metadata)
    SELECT 
      np.user_id,
      'event',
      '📅 New Event: ' || NEW.title,
      NEW.description || ' - ' || TO_CHAR(NEW.event_date, 'Mon DD, YYYY at HH24:MI'),
      jsonb_build_object(
        'event_id', NEW.id,
        'event_type', NEW.event_type,
        'event_date', NEW.event_date,
        'location', NEW.location,
        'is_online', NEW.is_online
      )
    FROM notification_preferences np
    WHERE np.push_events = true;
    
    RAISE NOTICE 'Created notifications for new event: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create event notifications: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CREATE TRIGGERS
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_signal_created_notification ON signals;
DROP TRIGGER IF EXISTS on_analysis_created_notification ON trade_analyses;
DROP TRIGGER IF EXISTS on_event_created_notification ON events;

-- Create trigger for signals
CREATE TRIGGER on_signal_created_notification
  AFTER INSERT ON signals
  FOR EACH ROW
  EXECUTE FUNCTION create_signal_notifications();

-- Create trigger for trade analyses
CREATE TRIGGER on_analysis_created_notification
  AFTER INSERT ON trade_analyses
  FOR EACH ROW
  EXECUTE FUNCTION create_analysis_notifications();

-- Create trigger for events
CREATE TRIGGER on_event_created_notification
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_notifications();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON FUNCTION create_signal_notifications() IS 'Creates in-app notifications for all users when a new signal is created';
COMMENT ON FUNCTION create_analysis_notifications() IS 'Creates in-app notifications for all users when a new analysis is published';
COMMENT ON FUNCTION create_event_notifications() IS 'Creates in-app notifications for all users when a new event is published';

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ In-app notification triggers created successfully!';
  RAISE NOTICE '✓ Signals will now create notifications for users with push_signals enabled';
  RAISE NOTICE '✓ Analyses will now create notifications for users with push_analyses enabled';
  RAISE NOTICE '✓ Events will now create notifications for users with push_events enabled';
END $$;
