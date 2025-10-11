"use client";
import React, { useEffect, useState } from "react";
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";

type PingState = {
  status: "idle" | "ok" | "error" | "missing_env";
  message: string;
};

const SupabasePing: React.FC = () => {
  const [state, setState] = useState<PingState>({ status: "idle", message: "Checking Supabase…" });

  useEffect(() => {
    const run = async () => {
      if (!isSupabaseEnvReady) {
        setState({ status: "missing_env", message: "Env vars missing" });
        return;
      }
      const client = getSupabaseClient();
      if (!client) {
        setState({ status: "missing_env", message: "Client not initialized" });
        return;
      }
      try {
        const { data, error } = await client.auth.getSession();
        if (error) {
          setState({ status: "error", message: `Auth check failed: ${error.message}` });
          return;
        }
        const hasSession = Boolean(data?.session);
        setState({ status: "ok", message: hasSession ? "Connected (session present)" : "Connected (no session)" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setState({ status: "error", message: `Connection error: ${msg}` });
      }
    };
    run();
  }, []);

  const color =
    state.status === "ok"
      ? "bg-gray-200 text-[#1A1A1A]"
      : state.status === "error"
      ? "bg-red-600 text-white"
      : "bg-gray-200 text-[#1A1A1A]";

  return (
    <div className={`mt-2 inline-flex items-center rounded-md px-3 py-1 text-xs ${color}`}>
      Supabase: {state.message}
    </div>
  );
};

export default SupabasePing;