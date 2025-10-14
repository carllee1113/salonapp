// Stylists service: load remote stylists from Supabase (dedicated stylists table)
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";

export type Stylist = {
  id: string;
  name: string;
  specialties: string[];
  available: boolean;
  avatarUrl?: string;
};

// Dedicated stylists table is the source of truth
// public.stylists columns: profile_id (uuid, PK), display_name (text), bio (text), specialties (text[]), is_active (boolean)
type StylistsTableRow = {
  profile_id: string; // uuid as string in client
  display_name: string;
  bio: string | null;
  specialties: string[] | null;
  is_active: boolean;
};

export type LoadStylistsResult = { data: Stylist[]; error: string | null };

export async function loadStylists(): Promise<LoadStylistsResult> {
  if (!isSupabaseEnvReady) return { data: [], error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { data: [], error: "Supabase client not initialized." };

  try {
    // Exclude current user if they happen to be in the stylists table
    let currentUserId: string | null = null;
    try {
      const { data: userData } = await client.auth.getUser();
      currentUserId = userData?.user?.id ?? null;
    } catch {
      currentUserId = null;
    }

    let query = client
      .from("stylists")
      .select("profile_id,display_name,bio,specialties,is_active")
      .order("display_name", { ascending: true });

    if (currentUserId) {
      query = query.neq("profile_id", currentUserId);
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }

    const rows: StylistsTableRow[] = (data ?? []) as unknown as StylistsTableRow[];

    const mapped: Stylist[] = rows.map((row) => {
      const specialties = Array.isArray(row.specialties) ? row.specialties : [];
      return {
        id: String(row.profile_id),
        name: row.display_name,
        specialties,
        available: Boolean(row.is_active),
        avatarUrl: undefined, // Can be populated later via a join to profiles.avatar_url if needed
      } satisfies Stylist;
    });

    return { data: mapped, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { data: [], error: msg };
  }
}