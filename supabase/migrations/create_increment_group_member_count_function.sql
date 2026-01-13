-- Create function to increment group member count atomically
CREATE OR REPLACE FUNCTION increment_group_member_count(group_jid_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE whatsapp_groups
  SET member_count = member_count + 1
  WHERE group_jid = group_jid_param;
END;
$$ LANGUAGE plpgsql;
