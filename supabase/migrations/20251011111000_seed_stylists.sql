-- Migration: seed initial stylists
-- Purpose: Insert 3 demo stylists into public.stylists (and ensure corresponding profiles exist)
-- Notes:
-- - Uses existing auth.users as source for user_ids. Inserts up to 3 stylists.
-- - Profiles are created if missing; preferences set to stylist role and availability.
-- - Safe to re-run thanks to ON CONFLICT DO NOTHING.

BEGIN;

WITH selected_users AS (
  SELECT id AS user_id, row_number() OVER (ORDER BY created_at) AS rn
  FROM auth.users
  WHERE id NOT IN (SELECT profile_id FROM public.stylists)
  ORDER BY created_at
  LIMIT 3
),
seed_data AS (
  SELECT * FROM (
    VALUES
      (1, 'Ava Cole', 'Balayage specialist with a focus on low-maintenance color.', ARRAY['color','balayage','toning']),
      (2, 'Marco Nguyen', 'Precision cuts and fades; loves modern, clean looks.', ARRAY['cut','fade','styling']),
      (3, 'Lina Park', 'Curly-hair expert; healthy curls, diffusing and treatments.', ARRAY['cut','curly','treatment'])
  ) AS t(rn, display_name, bio, specialties)
)
-- Ensure profiles exist for selected users
INSERT INTO public.profiles (user_id, full_name, preferences, avatar_url)
SELECT su.user_id,
       sd.display_name,
       jsonb_build_object('role','stylist','specialties', sd.specialties, 'available', true),
       NULL
FROM selected_users su
JOIN seed_data sd USING (rn)
ON CONFLICT (user_id) DO NOTHING;

-- Insert stylists rows
WITH selected_users AS (
  SELECT id AS user_id, row_number() OVER (ORDER BY created_at) AS rn
  FROM auth.users
  WHERE id NOT IN (SELECT profile_id FROM public.stylists)
  ORDER BY created_at
  LIMIT 3
),
seed_data AS (
  SELECT * FROM (
    VALUES
      (1, 'Ava Cole', 'Balayage specialist with a focus on low-maintenance color.', ARRAY['color','balayage','toning']),
      (2, 'Marco Nguyen', 'Precision cuts and fades; loves modern, clean looks.', ARRAY['cut','fade','styling']),
      (3, 'Lina Park', 'Curly-hair expert; healthy curls, diffusing and treatments.', ARRAY['cut','curly','treatment'])
  ) AS t(rn, display_name, bio, specialties)
)
INSERT INTO public.stylists (profile_id, display_name, bio, specialties, is_active)
SELECT su.user_id, sd.display_name, sd.bio, sd.specialties, true
FROM selected_users su
JOIN seed_data sd USING (rn)
ON CONFLICT (profile_id) DO NOTHING;

COMMIT;