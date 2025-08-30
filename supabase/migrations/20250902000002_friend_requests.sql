-- Create friend_requests table
create table friend_requests (
  sender uuid references profiles(id) on delete cascade,
  receiver uuid references profiles(id) on delete cascade,
  status text check (status in ('pending','accepted','declined')) default 'pending',
  created_at timestamptz default timezone('utc', now()),
  primary key (sender, receiver)
);

alter table friend_requests enable row level security;

create policy "Sender can manage requests" on friend_requests
  for all
  using (auth.uid() = sender)
  with check (auth.uid() = sender);

create policy "Receiver can update" on friend_requests
  for update
  using (auth.uid() = receiver)
  with check (auth.uid() = receiver);

create policy "Individuals can view their requests" on friend_requests
  for select
  using (auth.uid() = sender or auth.uid() = receiver);
