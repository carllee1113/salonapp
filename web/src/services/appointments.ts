// Appointments service: create a new appointment via Supabase (stubbed when env is not ready)
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";

export type Appointment = {
  id: string;
  userId: string;
  serviceId: string;
  stylistId?: string | null;
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

export async function createAppointment(input: AppointmentCreateInput): Promise<AppointmentCreateResult> {
  if (!isSupabaseEnvReady) return { ok: false, error: "Supabase environment not configured." };
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: "Supabase client not initialized." };
  try {
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) return { ok: false, error: authError.message };
    const userId = authData?.user?.id;
    if (!userId) return { ok: false, error: "Not authenticated." };

    const row: AppointmentRow = {
      user_id: userId,
      service_id: input.serviceId,
      stylist_id: input.stylistId ?? null,
      date: input.date,
      time: input.time,
      notes: input.notes ?? null,
    };

    // Insert and return the new appointment id
    const { data: inserted, error: insertError } = await client
      .from("appointments")
      .insert(row as unknown as never)
      .select("id");

    if (insertError) return { ok: false, error: insertError.message };

    const insertedId: string | undefined = Array.isArray(inserted) && inserted.length > 0
      ? (inserted[0] as { id: string }).id
      : undefined;

    if (!insertedId) return { ok: false, error: "Appointment created but no ID returned." };

    // If no stylist was provided, call RPC to auto-assign one server-side
    if (!input.stylistId) {
      const { error: rpcError } = await client.rpc("assign_stylist_for_appointment", { appointment_id: insertedId } as unknown as never);
      if (rpcError) return { ok: false, error: rpcError.message };
    }

    return { ok: true, error: null };
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: msg };
  }
}