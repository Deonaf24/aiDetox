ALTER TABLE public.events ADD COLUMN user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events" ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT
  USING (auth.uid() = user_id);
