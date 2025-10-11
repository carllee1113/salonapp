// Profile service: load and save the current user's profile via Supabase
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileData, ProfilePreferences } from "@/components/profile-form";

// Row type mirroring the 'profiles' table columns
export type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  timezone: string | null;
  avatar_url: string | null;
  preferences: ProfilePreferences | null; // stored as JSON in DB
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProfileLoadResult = { data: ProfileData | null; error: string | null };
export type ProfileSaveResult = { ok: boolean; error: string | null };

function toProfileData(row: ProfileRow): ProfileData {
  return {
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    timezone: row.timezone ?? "America/New_York",
    avatarUrl: row.avatar_url ?? undefined,
    preferences: row.preferences ?? { marketingEmails: true, smsReminders: true },
  };
}

function toProfileRow(userId: string, data: ProfileData): ProfileRow {
  return {
    user_id: userId,
    full_name: data.fullName,
    phone: data.phone,
    timezone: data.timezone,
    avatar_url: data.avatarUrl ?? null,
    preferences: data.preferences,
  };
}

export async function loadCurrentUserProfile(): Promise<ProfileLoadResult> {
  if (!isSupabaseEnvReady) return { data: null, error: "Supabase environment not configured." };
  const client: SupabaseClient | null = getSupabaseClient();
  if (!client) return { data: null, error: "Supabase client not initialized." };
  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) return { data: null, error: authError.message };
    const userId = authData?.user?.id;
    if (!userId) return { data: null, error: "Not authenticated." };

    const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null }; // no profile yet
    const typed = data as unknown as ProfileRow;
    return { data: toProfileData(typed), error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { data: null, error: msg };
  }
}

export async function saveCurrentUserProfile(data: ProfileData): Promise<ProfileSaveResult> {
  if (!isSupabaseEnvReady) return { ok: false, error: "Supabase environment not configured." };
  const client: SupabaseClient | null = getSupabaseClient();
  if (!client) return { ok: false, error: "Supabase client not initialized." };
  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) return { ok: false, error: authError.message };
    const userId = authData?.user?.id;
    if (!userId) return { ok: false, error: "Not authenticated." };

    const row = toProfileRow(userId, data);
    const { error } = await client.from("profiles").upsert(row, { onConflict: "user_id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: msg };
  }
}