create table if not exists public.server_info (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  value text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.server_info enable row level security;

-- Allow authenticated users to read, admins to manage
create policy "Anyone can read server_info" on public.server_info for select using (true);
create policy "Admins can insert server_info" on public.server_info for insert with check (auth.role() = 'authenticated'); -- Needs more specific check in real app
create policy "Admins can update server_info" on public.server_info for update using (auth.role() = 'authenticated');
create policy "Admins can delete server_info" on public.server_info for delete using (auth.role() = 'authenticated');
