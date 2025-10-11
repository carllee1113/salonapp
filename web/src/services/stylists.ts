// Stylists service: load remote stylists from Supabase (profiles fallback only)
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";

export type Stylist = {
  id: string;
  name: string;
  specialties: string[];
  available: boolean;
  avatarUrl?: string;
};

// Using profiles table as the source of truth for now
// Expected preferences JSON shape: { role: "stylist", specialties: string[], available: boolean }
type ProfilesTableRow = {
  user_id: string;
  full_name: string | null;
  preferences: Record<string, unknown> | null;
  avatar_url?: string | null;
};

export type LoadStylistsResult = { data: Stylist[]; error: string | null };

export async function loadStylists(): Promise<LoadStylistsResult> {
  if (!isSupabaseEnvReady) return { data: [], error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { data: [], error: "Supabase client not initialized." };

  try {
    const { data: profileData, error: profilesError } = await client
      .from("profiles")
      .select("user_id,full_name,preferences,avatar_url")
      .order("full_name", { ascending: true });

    if (profilesError) {
      return { data: [], error: profilesError.message };
    }

    const rows: ProfilesTableRow[] = (profileData ?? []) as unknown as ProfilesTableRow[];

    const mapped: Stylist[] = rows
      .map((row) => {
        const prefs = row.preferences ?? {};
        const roleVal = prefs["role"];
        const role = typeof roleVal === "string" ? roleVal : "";
        const specialtiesVal = prefs["specialties"];
        const specialties = Array.isArray(specialtiesVal) ? (specialtiesVal as string[]) : [];
        const availableVal = prefs["available"];
        const available = typeof availableVal === "boolean" ? availableVal : false;

        return {
          id: String(row.user_id),
          name: row.full_name ?? "Unknown",
          specialties,
          available,
          avatarUrl: row.avatar_url ?? undefined,
        } satisfies Stylist;
      })
      // Keep only stylist role entries; availability is filtered in UI
      .filter((s, idx) => {
        const isStylistRole = (() => {
          // We don’t have role after mapping; re-derive from original row
          const prefs = rows[idx]?.preferences ?? {};
          const rv = prefs["role"];
          return typeof rv === "string" && rv.toLowerCase() === "stylist";
        })();
        return isStylistRole;
      });

    return { data: mapped, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { data: [], error: msg };
  }
}