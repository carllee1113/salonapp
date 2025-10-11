import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Database = unknown; // Replace with generated types after migrations

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseEnvReady: boolean = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseEnvReady || !supabaseUrl || !supabaseAnonKey) return null;
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}