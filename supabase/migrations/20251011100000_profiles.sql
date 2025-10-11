-- Migration: profiles table with per-user RLS and updated_at trigger
-- Description:
--   - Creates public.profiles with columns:
--       user_id UUID PK (FK to auth.users.id, ON DELETE CASCADE)
--       full_name TEXT
--       phone TEXT (<=32 chars)
--       timezone TEXT (<=64 chars)
--       preferences JSONB NOT NULL DEFAULT '{}'
--       avatar_url TEXT
--       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
--       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
--   - Enables Row Level Security and adds policies so only the owner can select/insert/update/delete
--   - Adds trigger to auto-update updated_at on UPDATE
-- Security notes:
--   - All write operations require auth.uid() to match the row's user_id
--   - Avoids SQL injection by parameterizing queries in app code; DDL here is static

BEGIN;

-- Table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  timezone TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT phone_len CHECK (phone IS NULL OR char_length(phone) <= 32),
  CONSTRAINT tz_len CHECK (timezone IS NULL OR char_length(timezone) <= 64)
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT (owner-only)
CREATE POLICY "profiles_select_owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT (owner-only; enforce user_id = auth.uid())
CREATE POLICY "profiles_insert_owner"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE (owner-only)
CREATE POLICY "profiles_update_owner"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE (owner-only)
CREATE POLICY "profiles_delete_owner"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

COMMIT;