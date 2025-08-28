-- Create profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz default timezone('utc', now())
);

alter table profiles enable row level security;

create policy "Individuals can manage own profile"
  on profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow anonymous username availability checks
create policy "Anyone can read usernames"
  on profiles
  for select
  using (true);
