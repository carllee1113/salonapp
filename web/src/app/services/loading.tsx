export default function Loading(): React.JSX.Element {
  const skeletons = Array.from({ length: 6 }, (_, i) => i);

  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-[#FA5252]">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preparing service catalog…</p>
        <span className="sr-only">Loading services and pricing…</span>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skeletons.map((key) => (
          <article
            key={key}
            className="rounded-md border border-gray-700 bg-transparent p-4 animate-pulse"
            aria-hidden="true"
          >
            <div className="flex items-start justify-between">
              <div className="h-4 w-32 rounded-md bg-gray-200" />
              <div className="ml-2 h-5 w-14 rounded-md border border-gray-300 bg-gray-100" />
            </div>

            <div className="mt-2 space-y-2">
              <div className="h-3 w-full rounded-md bg-gray-200" />
              <div className="h-3 w-5/6 rounded-md bg-gray-200" />
              <div className="h-3 w-2/3 rounded-md bg-gray-200" />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-md bg-gray-200" />
                <div className="h-3 w-24 rounded-md bg-gray-200" />
              </div>
              <div className="h-8 w-24 rounded-md bg-gray-200" />
            </div>

            <div className="mt-2 h-3 w-16 rounded-md bg-gray-200" />
          </article>
        ))}
      </div>
    </section>
  );
}