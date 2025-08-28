-- Create devices table
create table devices (
  id text primary key,
  profile_id uuid references profiles(id) on delete cascade default auth.uid(),
  last_seen timestamptz default timezone('utc', now())
);

create index on devices (profile_id);

alter table devices enable row level security;

create policy "Individuals can manage own devices"
  on devices
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
