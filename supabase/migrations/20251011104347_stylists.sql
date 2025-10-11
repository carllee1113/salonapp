-- Migration: stylists table (Option B)
-- Purpose: Dedicated table for stylist profiles, separate from general user profiles.
-- RLS: Open read access (anon + authenticated). Write operations restricted to server-side (service role bypasses RLS).

begin;

-- Table schema
create table if not exists public.stylists (
  -- One-to-one with public.profiles, which references auth.users
  profile_id uuid primary key references public.profiles(user_id) on delete cascade,
  display_name text not null,
  bio text,
  specialties text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.stylists_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists stylists_updated_at on public.stylists;
create trigger stylists_updated_at
before update on public.stylists
for each row execute function public.stylists_touch_updated_at();

-- RLS policies
alter table public.stylists enable row level security;

-- Allow read to all (anon + authenticated)
create policy "Read stylists"
on public.stylists
for select
to public
using (true);

-- (Optional) Allow a stylist to update their own record (uncomment when you want stylists to self-manage)
-- create policy "Stylists can update own record"
-- on public.stylists
-- for update
-- to authenticated
-- using (auth.uid() = profile_id)
-- with check (auth.uid() = profile_id);

-- No insert/delete policies: restricted to service role only (server-side) which bypasses RLS

commit;