-- Migration: RPC to fetch user appointments with stylist name in one call
-- Purpose: Reduce client round-trips by joining appointments to stylists

begin;

create or replace function public.get_user_appointments_with_stylist()
returns table (
  id uuid,
  user_id uuid,
  service_id text,
  stylist_id uuid,
  stylist_name text,
  date date,
  time_text text,
  notes text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    a.id,
    a.user_id,
    a.service_id,
    a.stylist_id,
    s.display_name as stylist_name,
    a.date,
    a.time::text as time_text,
    a.notes,
    a.created_at
  from public.appointments a
  left join public.stylists s
    on s.profile_id = a.stylist_id
  where a.user_id = auth.uid()
  order by a.date asc, a.time asc
$$;

commit;