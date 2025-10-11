"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadUserAppointments, type Appointment } from "@/services/appointments";
import { loadStylists, type Stylist } from "@/services/stylists";

type LoadState = "idle" | "loading" | "loaded";

export default function AppointmentsList(): React.JSX.Element {
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Appointment[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistsError, setStylistsError] = useState<string | null>(null);
  const [stylistsLoading, setStylistsLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const run = async (): Promise<void> => {
      setState("loading");
      setError(null);
      try {
        const { data, error } = await loadUserAppointments();
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

  useEffect(() => {
    let active = true;
    const run = async (): Promise<void> => {
      setStylistsLoading(true);
      setStylistsError(null);
      try {
        const { data, error } = await loadStylists();
        if (!active) return;
        if (error) {
          setStylistsError(error);
          setStylists([]);
        } else {
          setStylists(data);
        }
      } catch (err) {
        const msg: string = err instanceof Error ? err.message : "Unknown error";
        setStylistsError(msg);
        setStylists([]);
      } finally {
        if (active) setStylistsLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const hasAuthOrEnvIssue: boolean = useMemo(() => {
    if (!error) return false;
    return /not authenticated|supabase environment not configured/i.test(error);
  }, [error]);

  const stylistNameById: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    stylists.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [stylists]);

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
                    <p className="text-xs text-muted-foreground">Stylist: {stylistNameById[apt.stylistId] ?? "Unknown"}</p>
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