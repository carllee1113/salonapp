import React from "react";
import BookingForm from "@/components/booking-form";

export default function NewAppointmentPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }): React.JSX.Element {
  const initialServiceId = typeof searchParams?.service === "string" ? searchParams?.service : undefined;
  const initialDate = typeof searchParams?.date === "string" ? searchParams?.date : undefined;
  const initialStylistId = typeof searchParams?.stylist === "string" ? searchParams?.stylist : undefined;
  const initialLockedTime = typeof searchParams?.lock === "string" ? searchParams?.lock : undefined;
  const originalAppointmentId = typeof searchParams?.orig === "string" ? searchParams?.orig : undefined;
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <BookingForm
        initialServiceId={initialServiceId}
        initialDate={initialDate}
        initialStylistId={initialStylistId}
        initialLockedTime={initialLockedTime}
        originalAppointmentId={originalAppointmentId}
      />
    </section>
  );
}