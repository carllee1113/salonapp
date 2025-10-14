-- Migration: appointment_slots, triggers, and availability RPCs
-- Description:
--  - Adds public.appointment_slots table storing 30-min expanded slots per appointment
--  - Enforces unique booking per stylist/date/slot using a partial unique index
--  - Adds SECURITY DEFINER functions:
--      * get_service_duration_minutes(service_id text) -> int
--      * expand_appointment_slots(appointment_id uuid) -> void
--      * is_stylist_time_range_available(stylist_id uuid, day date, start_time text, duration_minutes int) -> boolean
--      * get_stylist_busy_slots(stylist_id uuid, day date) -> text[]
--  - Adds AFTER INSERT/UPDATE trigger on public.appointments to expand slots
-- Security notes:
--  - appointment_slots has RLS enabled; no public policies. Reads/writes occur via SECURITY DEFINER functions
--  - Unique index prevents double-booking under concurrency

begin;

-- Table: appointment_slots
create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  stylist_id uuid not null references public.profiles(user_id) on delete cascade,
  date date not null,
  slot_time text not null,
  created_at timestamptz not null default now(),
  constraint slot_time_len check (char_length(slot_time) between 4 and 8)
);

-- Enable RLS; do not expose any direct policies
alter table public.appointment_slots enable row level security;

-- Unique booking per stylist/date/slot (ignore rows with NULL stylist)
create unique index if not exists appointment_slots_unique_stylist_date_time
  on public.appointment_slots (stylist_id, date, slot_time)
  where stylist_id is not null;

-- Map service_id to duration (minutes)
create or replace function public.get_service_duration_minutes(service_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Adjust mappings as your catalog evolves
  return case service_id
    when 'blowout' then 45
    when 'highlights' then 120
    when 'full-color' then 90
    when 'basic-cut' then 30
    when 'restyle' then 60
    when 'keratin' then 120
    else 30 -- default to 30 minutes
  end;
end;
$$;

-- Expand a single appointment into 30-min slots in appointment_slots
create or replace function public.expand_appointment_slots(appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  appt_service text;
  appt_stylist uuid;
  appt_date date;
  appt_time_text text;
  appt_time time;
  duration_minutes integer;
  slots_needed integer;
  i integer;
  slot_time_text text;
  stylist_active boolean;
begin
  -- Load appointment
  select a.service_id, a.stylist_id, a.date, a.time
    into appt_service, appt_stylist, appt_date, appt_time_text
  from public.appointments a
  where a.id = appointment_id
  limit 1;

  -- If not found or no stylist assigned, exit
  if appt_service is null or appt_stylist is null then
    return;
  end if;

  -- Only proceed for active stylists
  select s.is_active into stylist_active
  from public.stylists s
  where s.profile_id = appt_stylist
  limit 1;

  if stylist_active is not true then
    return;
  end if;

  -- Compute duration and slotsNeeded
  duration_minutes := public.get_service_duration_minutes(appt_service);
  if duration_minutes is null or duration_minutes <= 0 then
    duration_minutes := 30;
  end if;
  slots_needed := (duration_minutes + 29) / 30; -- ceil

  -- Normalize time and clear previous expansion
  appt_time := appt_time_text::time;

  delete from public.appointment_slots where appointment_id = appointment_id;

  -- Insert each 30-min slot
  for i in 0..(slots_needed - 1) loop
    slot_time_text := to_char((appt_time + make_interval(mins => i * 30))::time, 'HH24:MI');
    insert into public.appointment_slots(appointment_id, stylist_id, date, slot_time)
    values (appointment_id, appt_stylist, appt_date, slot_time_text);
  end loop;
end;
$$;

-- Trigger wrapper to call expansion
create or replace function public.appointments_expand_slots_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.expand_appointment_slots(new.id);
  return new;
end;
$$;

-- AFTER INSERT: expand immediately (if stylist assigned)
create trigger appointments_expand_slots_after_insert
after insert on public.appointments
for each row execute function public.appointments_expand_slots_trigger();

-- AFTER UPDATE of key fields: re-expand to reflect changes
create trigger appointments_expand_slots_after_update
after update of service_id, stylist_id, date, time on public.appointments
for each row execute function public.appointments_expand_slots_trigger();

-- Check availability over a time range
create or replace function public.is_stylist_time_range_available(
  in_stylist_id uuid,
  in_day date,
  in_start_time text,
  in_duration_minutes integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  slots_needed integer;
  i integer;
  start_t time;
  slot_t text;
  stylist_active boolean;
  conflict_count integer := 0;
begin
  if in_stylist_id is null then
    return false; -- explicit stylist required for range check
  end if;

  -- Only consider active stylists
  select s.is_active into stylist_active
  from public.stylists s
  where s.profile_id = in_stylist_id
  limit 1;
  if stylist_active is not true then
    return false;
  end if;

  if in_duration_minutes is null or in_duration_minutes <= 0 then
    in_duration_minutes := 30;
  end if;
  slots_needed := (in_duration_minutes + 29) / 30;
  start_t := in_start_time::time;

  for i in 0..(slots_needed - 1) loop
    slot_t := to_char((start_t + make_interval(mins => i * 30))::time, 'HH24:MI');
    select count(*) into conflict_count
    from public.appointment_slots
    where stylist_id = in_stylist_id
      and date = in_day
      and slot_time = slot_t;
    if conflict_count > 0 then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

-- Fetch busy slots for a stylist/day
create or replace function public.get_stylist_busy_slots(
  in_stylist_id uuid,
  in_day date
) returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  stylist_active boolean;
  result text[] := array[]::text[];
begin
  if in_stylist_id is null then
    return result;
  end if;

  select s.is_active into stylist_active
  from public.stylists s
  where s.profile_id = in_stylist_id
  limit 1;
  if stylist_active is not true then
    return result;
  end if;

  select coalesce(array_agg(slot_time order by slot_time), array[]::text[])
    into result
  from public.appointment_slots
  where stylist_id = in_stylist_id
    and date = in_day;

  return result;
end;
$$;

commit;