-- Add profile_id IS NOT NULL filters to leaderboard functions
CREATE OR REPLACE FUNCTION "public"."lb_noassist_streak"("p_since" timestamp with time zone DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone)
RETURNS TABLE("identity" "uuid", "value" bigint)
LANGUAGE "sql" STABLE
AS $$
  select
    e.profile_id as identity,
    date_part(
      'day',
      now() - coalesce(
        max(at) filter (
          where domain = any (
            array[
              'chatgpt.com',
              'chat.openai.com',
              'claude.ai',
              'gemini.google.com',
              'perplexity.ai',
              'copilot.microsoft.com',
              'poe.com',
              'character.ai',
              'huggingface.co',
              'openrouter.ai'
            ]  -- AI domains
          )
        ),
        p_since
      )
    )::bigint as value
  from public.events e
  where at >= p_since
    and e.profile_id is not null
  group by e.profile_id
  order by value desc
  limit 100;
$$;

CREATE OR REPLACE FUNCTION "public"."lb_offgrid_streak"("p_since" timestamp with time zone DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone)
RETURNS TABLE("identity" "uuid", "value" bigint)
LANGUAGE "sql" STABLE
AS $$
  SELECT profile_id AS identity,
         DATE_PART(
           'day',
           NOW() - COALESCE(MAX(at) FILTER (WHERE event = 'proceed'), p_since)
         )::bigint AS value
  FROM public.events
  WHERE at >= p_since
    AND profile_id IS NOT NULL
  GROUP BY profile_id
  ORDER BY value DESC
  LIMIT 100;
$$;
