-- Migration: stylist auto-assignment function
-- Purpose: After inserting an appointment with no stylist, assign one automatically based on service specialties with round-robin selection
-- Notes:
-- - Runs as SECURITY INVOKER to respect RLS (appointment update allowed for owner via existing policy)
-- - Reads public.stylists (read-open by policy), does not read other users' appointments
-- - Deterministic selection using hashtext of appointment id modulo number of matching stylists

begin;

create or replace function public.assign_stylist_for_appointment(appointment_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  appt_service text;
  required_specialty text;
  chosen_profile_id uuid;
  total integer;
  offset_idx integer;
begin
  -- Fetch the appointment's service only if it belongs to the current user and has no stylist yet
  select a.service_id into appt_service
  from public.appointments a
  where a.id = appointment_id
    and a.user_id = auth.uid()
    and a.stylist_id is null
  limit 1;

  -- If not found (different owner or already has stylist), exit early
  if appt_service is null then
    return;
  end if;

  -- Map service_id to a required specialty slug
  required_specialty := case appt_service
    when 'full-color' then 'color'
    when 'highlights' then 'color'
    when 'basic-cut' then 'cut'
    when 'restyle' then 'cut'
    when 'blowout' then 'styling'
    when 'keratin' then 'treatment'
    else null
  end;

  -- Count candidate stylists (active + matching specialty when provided)
  select count(*) into total
  from public.stylists s
  where s.is_active = true
    and (required_specialty is null or s.specialties @> array[required_specialty]::text[]);

  if total > 0 then
    -- Deterministic offset using Postgres hashtext (int4)
    offset_idx := abs(hashtext(appointment_id::text)) % total;

    -- Pick a stylist using modulo-based offset for simple round-robin across candidates
    select s.profile_id into chosen_profile_id
    from public.stylists s
    where s.is_active = true
      and (required_specialty is null or s.specialties @> array[required_specialty]::text[])
    order by s.profile_id
    offset offset_idx
    limit 1;
  end if;

  -- Fallback to any active stylist if no match was found
  if chosen_profile_id is null then
    select s.profile_id into chosen_profile_id
    from public.stylists s
    where s.is_active = true
    order by s.profile_id
    limit 1;
  end if;

  -- Update the appointment for the current user (owner-only per RLS), only if still unassigned
  if chosen_profile_id is not null then
    update public.appointments a
    set stylist_id = chosen_profile_id
    where a.id = appointment_id
      and a.user_id = auth.uid()
      and a.stylist_id is null;
  end if;
end;
$$;

commit;