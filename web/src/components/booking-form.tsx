"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";
import { createAppointment } from "@/services/appointments";
import { loadStylists, type Stylist } from "@/services/stylists";
import { Calendar } from "@/components/ui/calendar";

export type AppointmentData = {
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
};

export type BookingFormProps = {
  initialServiceId?: string;
  initialDate?: string; // YYYY-MM-DD
};

export default function BookingForm(props: BookingFormProps): React.JSX.Element {
  const router = useRouter();

  const services: ReadonlyArray<{
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    priceCents: number;
    category: "Haircut" | "Color" | "Styling" | "Treatment";
    popular?: boolean;
  }> = useMemo(
    () => [
      { id: "basic-cut", name: "Basic Haircut", description: "Classic cut and finish.", durationMinutes: 30, priceCents: 3500, category: "Haircut", popular: true },
      { id: "restyle", name: "Restyle Cut", description: "Transformative cut with consultation.", durationMinutes: 60, priceCents: 5500, category: "Haircut" },
      { id: "full-color", name: "Full Color", description: "Single-process color application.", durationMinutes: 90, priceCents: 9000, category: "Color" },
      { id: "highlights", name: "Highlights", description: "Partial or full highlights.", durationMinutes: 120, priceCents: 12000, category: "Color" },
      { id: "blowout", name: "Blowout", description: "Wash and blow-dry style.", durationMinutes: 45, priceCents: 4000, category: "Styling" },
      { id: "keratin", name: "Keratin Treatment", description: "Smoothing treatment for frizz control.", durationMinutes: 120, priceCents: 16000, category: "Treatment" },
    ],
    []
  );

  const formatPrice = (cents: number): string => {
    const dollars = Math.floor(cents / 100);
    const remainder = cents % 100;
    const fractional = remainder.toString().padStart(2, "0");
    return `$${dollars}.${fractional}`;
  };

  // Local list of available stylists (system-held data)
  // Local list of available stylists (system-held data)
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistsError, setStylistsError] = useState<string | null>(null);
  const [stylistsLoading, setStylistsLoading] = useState<boolean>(false);
  useEffect(() => {
    let active = true;
    const run = async (): Promise<void> => {
      setStylistsLoading(true);
      setStylistsError(null);
      const { data, error } = await loadStylists();
      if (!active) return;
      if (error) {
        setStylistsError(error);
        setStylists([]);
      } else {
        setStylists(data);
      }
      setStylistsLoading(false);
    };
    void run();
    return () => {
      active = false;
    };
  }, []);
  
  // Allow selecting from the pool: default to "ANY" and let backend assign later
  const [stylistId, setStylistId] = useState<string>("ANY");
  useEffect(() => {
    if (!stylistId && stylists.length > 0) {
      const firstAvailable = stylists.find((s) => s.available)?.id ?? stylists[0].id;
      setStylistId(firstAvailable);
    }
  }, [stylists, stylistId]);

  // Local timezone-safe date helpers to avoid UTC off-by-one shifts
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (s: string): Date | undefined => {
    const parts = s.split("-");
    if (parts.length !== 3) return undefined;
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return undefined;
    return new Date(year, month, day, 0, 0, 0, 0);
  };

  // Generate 30-minute time slots between opening (10:00) and closing (18:00)
  const timeSlots: string[] = useMemo(() => {
    const slots: string[] = [];
    const startMinutes = 10 * 60; // 10:00
    const endMinutes = 18 * 60;   // 18:00 inclusive
    for (let m = startMinutes; m <= endMinutes; m += 30) {
      const hh = Math.floor(m / 60).toString().padStart(2, "0");
      const mm = (m % 60).toString().padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }, []);

  // Determine availability: if selected date is today, disable past slots
  const isSameDay = (a: Date, b: Date): boolean => formatLocalDate(a) === formatLocalDate(b);
  const nextHalfHourMinutes = (): number => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const nextMinutes = minutes <= 29 ? 30 : 0;
    const nextHour = minutes <= 29 ? hours : hours + 1;
    return nextHour * 60 + nextMinutes;
  };
  const isSlotAvailable = (slot: string): boolean => {
    const threshold = selectedDate && isSameDay(selectedDate, today) ? nextHalfHourMinutes() : -1;
    const [hhStr, mmStr] = slot.split(":");
    const m = Number(hhStr) * 60 + Number(mmStr);
    if (Number.isNaN(m)) return false;
    if (threshold >= 0 && m < threshold) return false;
    return true;
  };

  const [form, setForm] = useState<AppointmentData>(() => ({
    serviceId: props.initialServiceId && services.some((s) => s.id === props.initialServiceId)
      ? props.initialServiceId
      : services[0]?.id ?? "basic-cut",
    date: typeof props.initialDate === "string" ? props.initialDate : "",
    time: "",
    notes: "",
  }));

  // Calendar date constraints: today to next 45 days
  const today: Date = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate: Date = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 45);
    return d;
  }, [today]);

  // Derive selected Date object from form.date (YYYY-MM-DD) using local timezone-safe parsing
  const selectedDate: Date | undefined = useMemo(() => {
    if (!form.date) return undefined;
    return parseLocalDate(form.date);
  }, [form.date]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isFormValid: boolean = Boolean(form.serviceId && form.date && form.time);

  useEffect(() => {
    // Determine auth status: if Supabase env is not ready, treat as unauthenticated to show Sign in immediately.
    if (!isSupabaseEnvReady) {
      setIsAuthenticated(false);
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      setIsAuthenticated(false);
      return;
    }
    client.auth.getSession().then(({ data }) => {
      setIsAuthenticated(Boolean(data.session));
    });
  }, []);

  const onChange = (patch: Partial<AppointmentData>): void => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setServerError(null);
    if (!isAuthenticated) {
      setServerError("Sign in is required to book appointments.");
      return;
    }
    if (!isFormValid) {
      setServerError("Please select a service, date, and time.");
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedStylistId: string | undefined = stylistId === "ANY" ? undefined : stylistId;
      const result = await createAppointment({
        serviceId: form.serviceId,
        stylistId: selectedStylistId,
        date: form.date,
        time: form.time,
        notes: form.notes,
      });
      if (!result.ok) {
        setServerError(result.error ?? "Unable to create appointment.");
        return;
      }
      // Navigate to appointments list after successful booking (stubbed for now)
      router.push("/appointments");
    } catch (err) {
      const msg: string = err instanceof Error ? err.message : "Unknown error";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">New Appointment</h1>
        {!isAuthenticated && (
          <p className="mt-1 text-sm text-muted-foreground">Sign in is required to book appointments.</p>
        )}
      </header>

      {/* Unauthenticated controls */}
      {!isAuthenticated && (
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            onClick={() => router.push("/")}
            aria-label="Sign in"
          >
            Sign in
          </button>
          <button
            type="button"
            className="rounded-md bg-gray-200 px-3 py-2 text-xs text-black hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            onClick={() => router.back()}
            aria-label="Return"
          >
            Return
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" aria-label="Booking form">
        <div>
          <label className="block text-sm font-medium">Choose a service</label>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Service selection">
            {services.map((svc) => (
              <article
                key={svc.id}
                className={`group rounded-md border ${form.serviceId === svc.id ? "border-[#FA5252]" : "border-gray-700"} bg-transparent p-4`}
                aria-label={`${svc.name} service card`}
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => onChange({ serviceId: svc.id })}
                  aria-pressed={form.serviceId === svc.id}
                  aria-label={`Select ${svc.name}`}
                >
                  <div className="flex items-start justify-between">
                    <h2 className="text-base font-medium">{svc.name}</h2>
                    {svc.popular && (
                      <span className="ml-2 rounded-md border border-[#FA5252] px-2 py-1 text-xs text-[#FA5252]">Popular</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{svc.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{formatPrice(svc.priceCents)}</span>
                      <span className="ml-2 text-muted-foreground">• {svc.durationMinutes} min</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{svc.category}</span>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </div>

        {/* Stylist selection */}
        <div>
          <label htmlFor="stylist" className="block text-sm font-medium">Stylist</label>
          <select
            id="stylist"
            name="stylist"
            className="mt-1 w-full rounded-md border border-gray-700 bg-transparent p-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            value={stylistId}
            onChange={(e) => setStylistId(e.target.value)}
            aria-label="Select a stylist"
            disabled={stylistsLoading}
          >
            <option value="ANY">Any available stylist</option>
            {stylists.filter((s) => s.available).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {stylistsLoading && (
            <p className="mt-1 text-xs text-muted-foreground">Loading stylists…</p>
          )}
          {!stylistsLoading && stylistsError && (
            <p className="mt-1 text-xs text-red-600">{stylistsError}</p>
          )}
          {!stylistsLoading && !stylistsError && (
            <p className="mt-1 text-xs text-muted-foreground">Choose a stylist or select “Any available stylist” to be matched automatically.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="block text-sm font-medium">Date</label>
            <div className="mt-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d?: Date) => onChange({ date: d ? formatLocalDate(d) : "" })}
                fromDate={today}
                toDate={maxDate}
                disabled={[{ before: today }, { after: maxDate }]}
                className="rounded-lg border border-gray-700 p-2"
                classNames={{
                  day_button:
                    "group-[[data-selected]:not(.range-middle)]:bg-red-600 group-[[data-selected]:not(.range-middle)]:text-white group-[[data-selected]:not(.range-middle)]:rounded-full group-[[data-selected]:not(.range-middle)]:ring-2 group-[[data-selected]:not(.range-middle)]:ring-[#FA5252] group-[[data-selected]:not(.range-middle)]:shadow",
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">Select a date within the next 45 days.</p>
            </div>
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium">Time</label>
            <div className="mt-1" id="time" role="radiogroup" aria-label="Select a time slot">
              {!selectedDate && (
                <p className="mb-2 text-xs text-muted-foreground">Please select a date first.</p>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {timeSlots.map((slot) => {
                  const available = selectedDate ? isSlotAvailable(slot) : false;
                  const isSelected = form.time === slot;
                  const baseClasses = "w-full rounded-md border p-2 text-center text-sm text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-100";
                                  const selectedClasses = isSelected ? "bg-red-600 text-white" : "";
                  const availableClasses = !isSelected && available ? "bg-gray-200 text-black font-semibold border border-gray-300" : "";
                  const unavailableClasses = !available ? "bg-gray-200 text-black cursor-not-allowed border border-dashed border-gray-400" : "";
                  return (
                    <button
                      key={slot}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Time ${slot}${available ? "" : " (unavailable)"}`}
                      disabled={!available || !selectedDate}
                      className={`${baseClasses} ${selectedClasses} ${availableClasses} ${unavailableClasses}`}
                      onClick={() => available && selectedDate ? onChange({ time: slot }) : undefined}
                    >
                      {!available ? (
                        <span className="inline-flex items-center justify-center gap-1">
                          <span aria-hidden="true">🔒</span>
                          <span>{slot}</span>
                        </span>
                      ) : (
                        slot
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium">Special Requirement</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-700 bg-transparent p-2 text-sm"
            value={form.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Add any preferences or special requests"
          />
        </div>

        {serverError && (
          <p className="text-sm text-red-600" role="alert">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label="Book appointment"
            disabled={!isAuthenticated || !isFormValid || isSubmitting}
          >
            {isSubmitting ? "Booking…" : "Book"}
          </button>
          <button
            type="button"
            className="rounded-md bg-gray-200 px-3 py-2 text-xs text-black hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            onClick={() => router.back()}
            aria-label="Return"
          >
            Return
          </button>
        </div>
      </form>
    </section>
  );
}