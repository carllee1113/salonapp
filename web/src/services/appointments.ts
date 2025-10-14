// Appointments service: create a new appointment via Supabase (stubbed when env is not ready)
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";

export type Appointment = {
  id: string;
  userId: string;
  serviceId: string;
  stylistId?: string | null;
  stylistName?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string | null;
  createdAt?: string | null;
};

export type AppointmentCreateInput = {
  serviceId: string;
  stylistId?: string;
  date: string;
  time: string;
  notes?: string;
};

export type AppointmentCreateResult = { ok: boolean; error: string | null };

export type AppointmentRow = {
  user_id: string;
  service_id: string;
  stylist_id?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string | null;
};

export type LoadAppointmentsResult = { data: Appointment[]; error: string | null };

export async function loadUserAppointments(): Promise<LoadAppointmentsResult> {
  if (!isSupabaseEnvReady) return { data: [], error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { data: [], error: "Supabase client not initialized." };
  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) return { data: [], error: authError.message };
    const userId = authData?.user?.id;
    if (!userId) return { data: [], error: "Not authenticated." };

    const { data, error } = await client
      .from("appointments")
      .select("id,user_id,service_id,stylist_id,date,time,notes,created_at")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) return { data: [], error: error.message };

    const rows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      service_id: string;
      stylist_id?: string | null;
      date: string;
      time: string;
      notes?: string | null;
      created_at?: string | null;
    }>;

    const mapped: Appointment[] = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      serviceId: r.service_id,
      stylistId: r.stylist_id ?? null,
      stylistName: null,
      date: r.date,
      time: r.time,
      notes: r.notes ?? null,
      createdAt: r.created_at ?? null,
    }));

    return { data: mapped, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { data: [], error: msg };
  }
}

// Faster: single RPC call that returns appointments joined with stylist display name
export async function loadUserAppointmentsFast(): Promise<LoadAppointmentsResult> {
  if (!isSupabaseEnvReady) return { data: [], error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { data: [], error: "Supabase client not initialized." };
  try {
    const { data: rpcData, error: rpcError } = await client.rpc("get_user_appointments_with_stylist");
    if (rpcError) return { data: [], error: rpcError.message };

    const rows = (rpcData ?? []) as Array<{
      id: string;
      user_id: string;
      service_id: string;
      stylist_id?: string | null;
      stylist_name?: string | null;
      date: string;
      time_text: string;
      notes?: string | null;
      created_at?: string | null;
    }>;

    const mapped: Appointment[] = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      serviceId: r.service_id,
      stylistId: r.stylist_id ?? null,
      stylistName: r.stylist_name ?? null,
      date: r.date,
      time: r.time_text,
      notes: r.notes ?? null,
      createdAt: r.created_at ?? null,
    }));

    return { data: mapped, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { data: [], error: msg };
  }
}

export async function createAppointment(input: AppointmentCreateInput): Promise<AppointmentCreateResult> {
  if (!isSupabaseEnvReady) return { ok: false, error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: "Supabase client not initialized." };
  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) return { ok: false, error: authError.message };
    const userId = authData?.user?.id;
    if (!userId) return { ok: false, error: "Not authenticated." };

    // One-shot transactional RPC: creates, assigns stylist, expands slots
    const { data: rpcData, error: rpcError } = await client.rpc(
      "book_appointment",
      {
        in_service_id: input.serviceId,
        in_date: input.date,
        in_time: input.time,
        in_notes: input.notes ?? null,
        in_stylist_id: input.stylistId ?? null,
      } as unknown as never
    );

    if (rpcError) {
      // Surface richer Postgres error details when available
      const details = (rpcError as unknown as { details?: string }).details;
      const hint = (rpcError as unknown as { hint?: string }).hint;
      const msg = [rpcError.message, details, hint].filter(Boolean).join(" | ");
      return { ok: false, error: msg || rpcError.message };
    }

    const newId: string | undefined = typeof rpcData === "string" ? rpcData : undefined;
    if (!newId) return { ok: false, error: "Booking succeeded but no ID returned." };
    return { ok: true, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

export type StylistBusySlotsResult = { busySlots: string[]; error: string | null };
export type StylistRangeAvailableResult = { available: boolean; error: string | null };
export type LoadStylistsResult = { stylists: { id: string; name: string }[]; error: string | null };

export function getServiceDurationMinutes(serviceId: string): number {
  switch (serviceId) {
    case "blowout":
      return 45;
    case "highlights":
      return 120;
    case "full-color":
      return 90;
    case "basic-cut":
      return 30;
    case "restyle":
      return 60;
    case "keratin":
      return 120;
    default:
      return 30;
  }
}

export async function loadStylistBusySlots(stylistId: string, dayISO: string): Promise<StylistBusySlotsResult> {
  if (!isSupabaseEnvReady) return { busySlots: [], error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { busySlots: [], error: "Supabase client not initialized." };
  try {
    const { error, data } = await client.rpc("get_stylist_busy_slots", { in_stylist_id: stylistId, in_day: dayISO } as unknown as never);
    if (error) return { busySlots: [], error: error.message };
    const arr = Array.isArray(data) ? (data as string[]) : [];
    return { busySlots: arr, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { busySlots: [], error: msg };
  }
}

export async function isStylistRangeAvailable(params: { stylistId: string; dayISO: string; startTime: string; durationMinutes: number }): Promise<StylistRangeAvailableResult> {
  if (!isSupabaseEnvReady) return { available: false, error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { available: false, error: "Supabase client not initialized." };
  try {
    const { error, data } = await client.rpc("is_stylist_time_range_available", {
      in_stylist_id: params.stylistId,
      in_day: params.dayISO,
      in_start_time: params.startTime,
      in_duration_minutes: params.durationMinutes,
    } as unknown as never);
    if (error) return { available: false, error: error.message };
    const ok = typeof data === "boolean" ? (data as boolean) : false;
    return { available: ok, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { available: false, error: msg };
  }
}

export async function loadStylists(): Promise<LoadStylistsResult> {
  if (!isSupabaseEnvReady) return { stylists: [], error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { stylists: [], error: "Supabase client not initialized." };
  try {
    const { data, error } = await client
      .from("stylists")
      .select("profile_id,display_name,is_active")
      .eq("is_active", true)
      .order("display_name", { ascending: true });
    if (error) return { stylists: [], error: error.message };
    const rows = (data ?? []) as Array<{ profile_id: string; display_name: string; is_active: boolean }>;
    const stylists = rows.map((r) => ({ id: r.profile_id, name: r.display_name }));
    return { stylists, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { stylists: [], error: msg };
  }
}