"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadUserAppointmentsFast, type Appointment } from "@/services/appointments";

type LoadState = "idle" | "loading" | "loaded";

export default function AppointmentsList(): React.JSX.Element {
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Appointment[]>([]);
  // Joined fetch includes stylist display names; no separate stylists request needed

  useEffect(() => {
    let active = true;
    const run = async (): Promise<void> => {
      setState("loading");
      setError(null);
      try {
        const { data, error } = await loadUserAppointmentsFast();
        if (!active) return;
        if (error) {
          setError(error);
          setItems([]);
          setState("loaded");
          return;
        }
        setItems(data);
        setState("loaded");
      } catch (err) {
        const msg: string = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setItems([]);
        setState("loaded");
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  // Removed secondary stylists fetch; stylist names are returned with appointments

  const hasAuthOrEnvIssue: boolean = useMemo(() => {
    if (!error) return false;
    return /not authenticated|supabase environment not configured/i.test(error);
  }, [error]);

  // Names are available directly on items via stylistName

  const formatDate = (yyyyMmDd: string): string => {
    const [y, m, d] = yyyyMmDd.split("-").map((p) => Number(p));
    if (!y || !m || !d) return yyyyMmDd;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="mt-6">
      {state === "loading" && (
        <p className="text-sm text-muted-foreground">Loading your appointments…</p>
      )}

      {state === "loaded" && hasAuthOrEnvIssue && (
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <p className="text-sm text-muted-foreground">Sign in is required to view your appointments.</p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Sign in
            </Link>
            <Link
              href="/appointments/new"
              className="rounded-md bg-gray-200 px-3 py-2 text-xs text-black hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Book without account
            </Link>
          </div>
        </div>
      )}

      {state === "loaded" && !hasAuthOrEnvIssue && items.length === 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <p className="text-sm text-muted-foreground">You have no upcoming appointments.</p>
          <Link
            href="/appointments/new"
            className="mt-3 inline-block rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Book New Appointment
          </Link>
        </div>
      )}

      {state === "loaded" && !hasAuthOrEnvIssue && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((apt) => (
            <li key={apt.id} className="rounded-md border border-gray-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(apt.date)} at {apt.time}
                  </p>
                  <p className="text-xs text-muted-foreground">Service: {apt.serviceId}</p>
                  {apt.stylistId && (
                    <p className="text-xs text-muted-foreground">Stylist: {apt.stylistName ?? "Unknown"}</p>
                  )}
                  {apt.notes && (
                    <p className="mt-1 text-xs text-muted-foreground">Notes: {apt.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/appointments/new"
                    className="rounded-md bg-gray-200 px-3 py-2 text-xs text-black hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Reschedule
                  </Link>
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    disabled
                  >
                    Cancel (coming soon)
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}