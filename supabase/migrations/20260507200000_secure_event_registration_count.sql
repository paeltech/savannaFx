-- Aggregate registration counts correctly for anon/authenticated clients (RLS hides other users' rows).
CREATE OR REPLACE FUNCTION public.get_event_registration_count(event_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = event_uuid AND status = 'published') THEN
    RETURN 0;
  END IF;
  SELECT COUNT(*)::INTEGER INTO n
  FROM public.event_registrations
  WHERE event_id = event_uuid
    AND registration_status IN ('pending', 'confirmed');
  RETURN COALESCE(n, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_event_registration_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_registration_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_event_registration_count(UUID) TO authenticated;
