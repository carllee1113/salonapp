"use client";

import { Calendar } from "@/components/ui/calendar";
import { useState, useMemo } from "react";
import Link from "next/link";

function Component() {
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

  const [date, setDate] = useState<Date | undefined>(today);

  return (
    <div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        fromDate={today}
        toDate={maxDate}
        disabled={[{ before: today }, { after: maxDate }]}
        className="rounded-lg border border-border p-2"
      />
      <p
        className="mt-2 text-center text-xs text-muted-foreground"
        role="note"
        aria-live="polite"
      >
        Select a date within the next 45 days.
      </p>
      <div className="mt-4 flex items-center justify-center">
        <Link
          className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60"
          aria-label="Proceed to booking"
          href={date ? `/appointments/new?date=${date.toISOString().slice(0, 10)}` : "/appointments/new"}
        >
          Proceed to booking
        </Link>
      </div>
      <p
        className="mt-4 text-center text-xs text-muted-foreground"
        role="region"
        aria-live="polite"
      >
        Calendar -{" "}
        <a
          className="underline hover:text-foreground"
          href="https://daypicker.dev/"
          target="_blank"
          rel="noopener nofollow"
        >
          React DayPicker
        </a>
      </p>
    </div>
  );
}

export { Component };