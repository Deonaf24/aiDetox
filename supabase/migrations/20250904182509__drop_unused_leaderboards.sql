-- Drop unused leaderboard functions
DROP FUNCTION IF EXISTS public.lb_noassist_streak(timestamp with time zone);
DROP FUNCTION IF EXISTS public.lb_saves(timestamp with time zone);
