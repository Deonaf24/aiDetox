ALTER TABLE public.events RENAME COLUMN user_id TO profile_id;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_user_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Individuals can manage own events" ON public.events;
CREATE POLICY "Individuals can manage own events"
  ON public.events
  FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);
DROP INDEX IF EXISTS events_user_id_idx;
CREATE INDEX events_profile_id_idx ON public.events (profile_id);
