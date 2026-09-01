-- suchmaschinen.pro tables, added to the shared "PAN21 Counter" Supabase project.
-- Prefixed with sq_ to match the network convention (pc_, so_, ps_, sa_, lc_, ws_, sq_...).
-- Already applied directly via Supabase migration; kept here for reference/documentation.

create table if not exists sq_websites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete cascade,
  domain text not null,
  label text,
  status text default 'pending' check (status in ('pending','analyzing','active','paused')),
  notes text,
  unique (user_id, domain)
);

alter table sq_websites enable row level security;

create policy "Users can view own sq_websites"
  on sq_websites for select
  using (auth.uid() = user_id);

create policy "Users can insert own sq_websites"
  on sq_websites for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sq_websites"
  on sq_websites for update
  using (auth.uid() = user_id);

create policy "Users can delete own sq_websites"
  on sq_websites for delete
  using (auth.uid() = user_id);

create table if not exists sq_contact_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  message text not null
);

alter table sq_contact_requests enable row level security;

create policy "Anyone can insert sq_contact_requests"
  on sq_contact_requests for insert
  with check (true);
