-- Create lb_offgrid_streak function
CREATE OR REPLACE FUNCTION public.lb_offgrid_streak(p_since timestamptz)
RETURNS TABLE(identity uuid, value bigint)
LANGUAGE sql STABLE AS $$
  SELECT profile_id AS identity,
         DATE_PART('day', NOW() - COALESCE(MAX(at) FILTER (WHERE event = 'proceed'), p_since))::bigint AS value
  FROM events
  WHERE at >= p_since
  GROUP BY profile_id;
$$;

GRANT EXECUTE ON FUNCTION public.lb_offgrid_streak(timestamptz) TO anon;
