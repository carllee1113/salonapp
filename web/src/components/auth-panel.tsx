"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";
import type { SupabaseClient, AuthChangeEvent, Session } from "@supabase/supabase-js";

type AuthMode = "login" | "signup";

type FormState = {
  email: string;
  password: string;
  mode: AuthMode;
  loading: boolean;
  message: string | null;
  error: string | null;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email: string, password: string): { ok: boolean; error?: string } {
  if (!email || !emailRegex.test(email)) return { ok: false, error: "Please enter a valid email." };
  if (!password || password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  return { ok: true };
}

const AuthPanel: React.FC = () => {
  const [form, setForm] = useState<FormState>({ email: "", password: "", mode: "login", loading: false, message: null, error: null });
  const [session, setSession] = useState<Session | null>(null);

  const client: SupabaseClient | null = useMemo(() => (isSupabaseEnvReady ? getSupabaseClient() : null), []);

  useEffect(() => {
    if (!client) return;
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

    const { data: sub } = client.auth.onAuthStateChange((_event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
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

    const email = form.email.trim();
    const password = form.password;
    const valid = validateCredentials(email, password);
    if (!valid.ok) {
      setForm((prev) => ({ ...prev, error: valid.error ?? "Invalid credentials" }));
      return;
    }

    setForm((prev) => ({ ...prev, loading: true, error: null, message: null }));
    try {
      if (form.mode === "login") {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session ?? null);
        setForm((prev) => ({ ...prev, message: "Logged in successfully." }));
      } else {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;
        setSession(data.session ?? null);
        setForm((prev) => ({ ...prev, message: "Signup successful. Check your email if confirmations are enabled." }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setForm((prev) => ({ ...prev, error: msg }));
    } finally {
      setForm((prev) => ({ ...prev, loading: false }));
    }
  };

  const onLogout = async () => {
    if (!client) return;
    setForm((prev) => ({ ...prev, loading: true, error: null, message: null }));
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      setSession(null);
      setForm((prev) => ({ ...prev, message: "Logged out." }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setForm((prev) => ({ ...prev, error: msg }));
    } finally {
      setForm((prev) => ({ ...prev, loading: false }));
    }
  };

  const onForgotPassword = async () => {
    const email = form.email.trim();
    if (!client) {
      setForm((prev) => ({ ...prev, error: "Supabase client not initialized." }));
      return;
    }
    if (!email || !emailRegex.test(email)) {
      setForm((prev) => ({ ...prev, error: "Enter a valid email to request reset." }));
      return;
    }
    setForm((prev) => ({ ...prev, loading: true, error: null, message: null }));
    try {
      const redirectTo = `${window.location.origin}/auth/reset`;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      // Generic message to prevent account enumeration
      setForm((prev) => ({ ...prev, message: "If an account exists for this email, we sent a reset link." }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setForm((prev) => ({ ...prev, error: msg }));
    } finally {
      setForm((prev) => ({ ...prev, loading: false }));
    }
  };

  const switchMode = () => setForm((prev) => ({ ...prev, mode: prev.mode === "login" ? "signup" : "login", error: null, message: null }));

  if (!isSupabaseEnvReady) {
    return <div className="mt-2 inline-flex items-center rounded-md px-3 py-1 text-xs bg-red-600 text-white">Auth unavailable: missing env</div>;
  }

  return (
    <section className="w-full max-w-sm mt-6">
      <div className="rounded-lg border border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-[#FA5252]">Auth</h2>
        {session ? (
          <div className="mt-3 space-y-3">
            <div className="text-sm text-muted-foreground">Signed in as: <span className="font-medium">{session.user?.email ?? "(no email)"}</span></div>
            <button type="button" onClick={onLogout} className="w-full rounded-md px-3 py-2 text-sm bg-red-600 text-white disabled:opacity-60" disabled={form.loading}>
              {form.loading ? "Logging out…" : "Logout"}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-3 space-y-3">
            <label className="block">
              <span className="text-sm">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>

            {form.error && <div className="rounded-md bg-red-600 px-3 py-2 text-xs text-white">{form.error}</div>}
            {form.message && <div className="rounded-md bg-gray-200 px-3 py-2 text-xs text-[#1A1A1A]">{form.message}</div>}

            <div className="flex items-center gap-2">
              <button type="submit" className="flex-1 rounded-md px-3 py-2 text-sm bg-red-600 text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white" disabled={form.loading}>
                {form.loading ? (form.mode === "login" ? "Logging in…" : "Signing up…") : form.mode === "login" ? "Login" : "Sign up"}
              </button>
              <button type="button" onClick={switchMode} className="rounded-md px-3 py-2 text-sm bg-gray-200 text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                {form.mode === "login" ? "Switch to Sign up" : "Switch to Login"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={onForgotPassword} className="mt-2 rounded-md px-3 py-2 text-xs bg-gray-200 text-[#1A1A1A] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white" disabled={form.loading}>
                Forgot password?
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default AuthPanel;