-- Remove unused leaderboard functions
DROP FUNCTION IF EXISTS public.lb_noassist_streak(p_since timestamp with time zone);
DROP FUNCTION IF EXISTS public.lb_saves(p_since timestamp with time zone);
