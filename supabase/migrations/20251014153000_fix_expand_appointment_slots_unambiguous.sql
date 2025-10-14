-- Migration: ensure expand_appointment_slots is unambiguous and correct
-- Description:
--  - Re-defines expand_appointment_slots(appointment_id uuid)
--  - Qualifies table column references and normalizes time

begin;

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

  -- Qualify column to avoid ambiguity with parameter name
  delete from public.appointment_slots s where s.appointment_id = appointment_id;

  -- Insert each 30-min slot
  for i in 0..(slots_needed - 1) loop
    slot_time_text := to_char((appt_time + make_interval(mins => i * 30))::time, 'HH24:MI');
    insert into public.appointment_slots(appointment_id, stylist_id, date, slot_time)
    values (appointment_id, appt_stylist, appt_date, slot_time_text);
  end loop;
end;
$$;

commit;