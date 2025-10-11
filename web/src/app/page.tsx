import Image from "next/image";
// Removed CalendarDemo from Home page per request
import EnvStatus from "@/components/env-status";
import SupabasePing from "@/components/supabase-ping";
import { isSupabaseEnvReady } from "@/lib/supabase-client";
import AuthPanel from "@/components/auth-panel";

export default function Home() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-[#FA5252]">Salon Booking App</h1>
        {/* Calendar preview removed */}
        <EnvStatus />
        {isSupabaseEnvReady && <SupabasePing />}
        <AuthPanel />
      </div>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
      </footer>
    </>
  );
}
