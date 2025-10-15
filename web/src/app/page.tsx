// Removed CalendarDemo from Home page per request
import EnvStatus from "@/components/env-status";
import SupabasePing from "@/components/supabase-ping";
import { isSupabaseEnvReady } from "@/lib/supabase-client";
import AuthPanel from "@/components/auth-panel";

export default function Home() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-6 min-h-[70vh] grid place-items-center">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-[#FA5252] text-center">Salon Booking App</h1>
          {/* Calendar preview removed */}
          <div className="mt-4 space-y-4">
            <EnvStatus />
            {isSupabaseEnvReady && <SupabasePing />}
            <AuthPanel />
          </div>
        </div>
      </div>
    </>
  );
}
