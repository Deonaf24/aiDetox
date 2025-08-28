-- Create lb_saves function
CREATE OR REPLACE FUNCTION public.lb_saves(p_since timestamptz)
RETURNS TABLE(identity uuid, value bigint)
LANGUAGE sql STABLE AS $$
  SELECT profile_id AS identity,
         COUNT(*)::bigint AS value
  FROM events
  WHERE event = 'close' AND at >= p_since
  GROUP BY profile_id;
$$;

GRANT EXECUTE ON FUNCTION public.lb_saves(timestamptz) TO anon;
