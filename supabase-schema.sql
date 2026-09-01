-- Run in Supabase SQL Editor

-- Websites table
create table if not exists websites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete cascade,
  domain text not null,
  label text,
  status text default 'pending' check (status in ('pending','analyzing','active','paused')),
  notes text,
  unique (user_id, domain)
);

-- RLS
alter table websites enable row level security;

-- Users can view their own websites
create policy "Users can view own websites"
  on websites for select
  using (auth.uid() = user_id);

-- Users can insert their own websites
create policy "Users can insert own websites"
  on websites for insert
  with check (auth.uid() = user_id);

-- Users can update their own websites
create policy "Users can update own websites"
  on websites for update
  using (auth.uid() = user_id);

-- Users can delete their own websites
create policy "Users can delete own websites"
  on websites for delete
  using (auth.uid() = user_id);

-- Contact requests table
create table if not exists contact_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  message text not null
);

alter table contact_requests enable row level security;

create policy "Anyone can insert contact requests"
  on contact_requests for insert
  with check (true);
