"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";
import type { SupabaseClient, AuthChangeEvent, Session } from "@supabase/supabase-js";

type ResetFormState = {
  password: string;
  confirm: string;
  loading: boolean;
  message: string | null;
  error: string | null;
  ready: boolean; // true when we detect PASSWORD_RECOVERY state
};

function validateNewPassword(password: string, confirm: string): { ok: boolean; error?: string } {
  if (!password || password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (password !== confirm) return { ok: false, error: "Passwords do not match." };
  return { ok: true };
}

export default function ResetPage() {
  const [form, setForm] = useState<ResetFormState>({ password: "", confirm: "", loading: false, message: null, error: null, ready: false });
  const [session, setSession] = useState<Session | null>(null);

  const client: SupabaseClient | null = useMemo(() => (isSupabaseEnvReady ? getSupabaseClient() : null), []);

  useEffect(() => {
    if (!client) return;

    // Initial session check (may be recovery or regular depending on the link)
    const init = async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) {
          setForm((prev) => ({ ...prev, error: `Auth check failed: ${error.message}` }));
          return;
        }
        setSession(data.session ?? null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setForm((prev) => ({ ...prev, error: `Auth init error: ${msg}` }));
      }
    };
    void init();

    // Listen for the recovery event when the user arrives via the email link
    const { data: sub } = client.auth.onAuthStateChange((event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") {
        setForm((prev) => ({ ...prev, ready: true }));
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [client]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) {
      setForm((prev) => ({ ...prev, error: "Supabase client not initialized." }));
      return;
    }
    if (!form.ready) {
      setForm((prev) => ({ ...prev, error: "Recovery link not detected. Please open the reset link from your email." }));
      return;
    }

    const password = form.password;
    const confirm = form.confirm;
    const valid = validateNewPassword(password, confirm);
    if (!valid.ok) {
      setForm((prev) => ({ ...prev, error: valid.error ?? "Invalid password" }));
      return;
    }

    setForm((prev) => ({ ...prev, loading: true, error: null, message: null }));
    try {
      const { data, error } = await client.auth.updateUser({ password });
      if (error) throw error;
      setSession(data.user ? { ...session, user: data.user } as Session : session);
      setForm((prev) => ({ ...prev, message: "Password updated. You can now continue.", password: "", confirm: "" }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setForm((prev) => ({ ...prev, error: msg }));
    } finally {
      setForm((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!isSupabaseEnvReady) {
    return (
      <div className="font-sans grid min-h-screen place-items-center p-8 sm:p-20">
        <main className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-[#FA5252]">Reset Password</h1>
          <div className="mt-4 rounded-md bg-red-600 px-3 py-2 text-xs text-white">Auth unavailable: missing env</div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans grid min-h-screen place-items-center p-8 sm:p-20">
      <main className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[#FA5252]">Reset Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">If you used the email link, you can set a new password below.</p>

        {!form.ready && (
          <div className="mt-3 rounded-md bg-gray-200 px-3 py-2 text-xs text-[#1A1A1A]">Waiting for recovery link… open the reset link from your email.</div>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm">New password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm">Confirm new password</span>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </label>

          {form.error && <div className="rounded-md bg-red-600 px-3 py-2 text-xs text-white">{form.error}</div>}
          {form.message && <div className="rounded-md bg-gray-200 px-3 py-2 text-xs text-[#1A1A1A]">{form.message}</div>}

          <button type="submit" className="w-full rounded-md px-3 py-2 text-sm bg-red-600 text-white disabled:opacity-60" disabled={form.loading || !form.ready}>
            {form.loading ? "Updating…" : "Set new password"}
          </button>
        </form>
      </main>
    </div>
  );
}