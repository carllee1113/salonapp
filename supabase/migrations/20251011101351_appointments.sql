-- Migration: appointments table with RLS
-- Description:
--   - Creates public.appointments with columns aligned to app services
--   - Enables RLS with owner-only access via auth.uid() = user_id
--   - Adds simple check constraints for date/time formats
-- Security notes:
--   - All writes require auth.uid() match on user_id
--   - Foreign keys reference auth.users and public.profiles

BEGIN;

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  stylist_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT time_len CHECK (char_length(time) BETWEEN 4 AND 8)
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select_owner"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "appointments_insert_owner"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_update_owner"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_delete_owner"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;