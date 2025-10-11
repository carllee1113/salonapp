import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Database = unknown; // Replace with generated types after migrations

// Read and normalize environment variables
const supabaseUrlRaw: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKeyRaw: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const supabaseUrl: string = supabaseUrlRaw.trim();
const supabaseAnonKey: string = supabaseAnonKeyRaw.trim();

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const isSupabaseEnvReady: boolean = Boolean(
  isValidHttpUrl(supabaseUrl) && supabaseAnonKey.length > 0
);

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseEnvReady) return null;
  try {
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  } catch {
    // If env is misconfigured, avoid throwing during build; return null to allow static pages to build.
    return null;
  }
}