-- Friend requests schema
create table friend_requests (
  sender uuid references profiles(id) on delete cascade,
  receiver uuid references profiles(id) on delete cascade,
  status text check (status in ('pending','accepted','declined')) default 'pending',
  created_at timestamptz default timezone('utc', now()),
  primary key (sender, receiver)
);

-- Add username column to profiles
alter table profiles add column username text unique;
