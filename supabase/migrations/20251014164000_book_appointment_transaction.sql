-- Migration: transactional booking RPC
-- Description:
--  - Adds public.book_appointment(...) to perform booking atomically:
--      * inserts appointment for current user
--      * assigns stylist (given or auto) respecting RLS
--      * expands appointment slots
--      * returns the created appointment id
--  - If any step fails, the function raises and the entire booking is rolled back

begin;

create or replace function public.book_appointment(
  in_service_id text,
  in_date date,
  in_time text,
  in_notes text default null,
  in_stylist_id uuid default null
) returns uuid
language plpgsql
security invoker
as $$
declare
  new_id uuid;
  chosen_stylist uuid;
  appt_service text;
  total integer;
  offset_idx integer;
begin
  -- Insert base appointment row for current user
  insert into public.appointments(user_id, service_id, stylist_id, date, time, notes)
  values (auth.uid(), in_service_id, null, in_date, in_time, in_notes)
  returning id into new_id;

  if new_id is null then
    raise exception 'Failed to create appointment';
  end if;

  -- Determine stylist: use provided or auto-assign based on service specialty
  if in_stylist_id is not null then
    chosen_stylist := in_stylist_id;
  else
    appt_service := in_service_id;

    -- Map service_id to required specialty
    -- Keep in sync with assign_stylist_for_appointment
    declare required_specialty text;
    begin
      required_specialty := case appt_service
        when 'full-color' then 'color'
        when 'highlights' then 'color'
        when 'basic-cut' then 'cut'
        when 'restyle' then 'cut'
        when 'blowout' then 'styling'
        when 'keratin' then 'treatment'
        else null
      end;

      select count(*) into total
      from public.stylists s
      where s.is_active = true
        and (required_specialty is null or s.specialties @> array[required_specialty]::text[]);

      if total > 0 then
        offset_idx := abs(hashtext(new_id::text)) % total;
        select s.profile_id into chosen_stylist
        from public.stylists s
        where s.is_active = true
          and (required_specialty is null or s.specialties @> array[required_specialty]::text[])
        order by s.profile_id
        offset offset_idx
        limit 1;
      end if;

      if chosen_stylist is null then
        select s.profile_id into chosen_stylist
        from public.stylists s
        where s.is_active = true
        order by s.profile_id
        limit 1;
      end if;
    end;
  end if;

  -- Update stylist on the newly created appointment (owner-only via RLS)
  if chosen_stylist is not null then
    update public.appointments a
    set stylist_id = chosen_stylist
    where a.id = new_id
      and a.user_id = auth.uid()
      and a.stylist_id is null;
  end if;

  -- Expand slots; function is SECURITY DEFINER and handles RLS for appointment_slots
  perform public.expand_appointment_slots(new_id);

  return new_id;
exception
  when others then
    -- Any error aborts the booking to avoid half-created rows
    raise;
end;
$$;

commit;