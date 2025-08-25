-- Create devices table
create table devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default timezone('utc', now())
);

create index on devices (user_id);

alter table devices enable row level security;

create policy "Individuals can manage own devices"
  on devices
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
