import Link from "next/link";

export default function ServicesPage(): React.JSX.Element {
  type Service = {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    priceCents: number;
    category: "Haircut" | "Color" | "Styling" | "Treatment";
    popular?: boolean;
  };

  const services: ReadonlyArray<Service> = [
    { id: "basic-cut", name: "Basic Haircut", description: "Classic cut and finish.", durationMinutes: 30, priceCents: 3500, category: "Haircut", popular: true },
    { id: "restyle", name: "Restyle Cut", description: "Transformative cut with consultation.", durationMinutes: 60, priceCents: 5500, category: "Haircut" },
    { id: "full-color", name: "Full Color", description: "Single-process color application.", durationMinutes: 90, priceCents: 9000, category: "Color" },
    { id: "highlights", name: "Highlights", description: "Partial or full highlights.", durationMinutes: 120, priceCents: 12000, category: "Color" },
    { id: "blowout", name: "Blowout", description: "Wash and blow-dry style.", durationMinutes: 45, priceCents: 4000, category: "Styling" },
    { id: "keratin", name: "Keratin Treatment", description: "Smoothing treatment for frizz control.", durationMinutes: 120, priceCents: 16000, category: "Treatment" },
  ];

  const formatPrice = (cents: number): string => {
    const dollars = Math.floor(cents / 100);
    const remainder = cents % 100;
    const fractional = remainder.toString().padStart(2, "0");
    return `$${dollars}.${fractional}`;
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-[#FA5252]">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">Explore our service catalog and transparent pricing.</p>
        <p className="mt-1 text-sm text-muted-foreground">This is a stub view for Services. Upcoming feature: service catalog and pricing.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((svc) => (
          <article
            key={svc.id}
            className="group rounded-md border border-gray-700 bg-transparent p-4"
            aria-label={`${svc.name} service card`}
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
              <Link
                href={`/appointments/new?service=${svc.id}`}
                className="rounded-md bg-red-600 px-3 py-2 text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-label={`Book ${svc.name}`}
                title="Proceed to booking"
              >
                Book Now
              </Link>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{svc.category}</div>
          </article>
        ))}
      </div>
    </section>
  );
}