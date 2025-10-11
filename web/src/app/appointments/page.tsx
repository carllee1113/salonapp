import Link from "next/link";
import AppointmentsList from "@/components/appointments-list";

export default function AppointmentsPage(): React.JSX.Element {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-semibold">Appointments</h1>
      <p className="text-sm text-muted-foreground">This is a stub view for Appointments. Upcoming feature: list, filter, and manage bookings.</p>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href="/appointments/new"
          className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Book New Appointment
        </Link>
      </div>

      <AppointmentsList />
    </section>
  );
}