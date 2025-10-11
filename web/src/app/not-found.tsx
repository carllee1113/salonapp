import Link from "next/link";

export default function NotFound(): React.JSX.Element {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="rounded-md border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-semibold text-[#FA5252]">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sorry, the page you are looking for could not be found.</p>
        <div className="mt-4 flex items-center justify-center">
          <Link
            href="/"
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Go back home
          </Link>
        </div>
      </div>
    </section>
  );
}