"use client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseClient, isSupabaseEnvReady } from "@/lib/supabase-client";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { loadCurrentUserProfile } from "@/services/profile";

type DashboardShellProps = {
  children: React.ReactNode;
};

type UserInfo = {
  email: string | null;
  avatarUrl: string | null;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({ email: null, avatarUrl: null });
  const [userName, setUserName] = useState<string | null>(null);

  const client: SupabaseClient | null = useMemo(() => (isSupabaseEnvReady ? getSupabaseClient() : null), []);

  useEffect(() => {
    if (!client) return;
    const init = async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) return; // Silent; header should render even if auth fails
        const current = data.session ?? null;
        setSession(current);
        setUserInfo({ email: current?.user?.email ?? null, avatarUrl: current?.user?.user_metadata?.avatar_url ?? null });
      } catch {
        // Silent error handling per header resilience
      }
    };
    void init();

    const { data: sub } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUserInfo({ email: newSession?.user?.email ?? null, avatarUrl: newSession?.user?.user_metadata?.avatar_url ?? null });
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    // Close drawer when route changes
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Load user's full name when session is present
    if (!client) return;
    if (!session) {
      setUserName(null);
      return;
    }
    let active = true;
    const run = async (): Promise<void> => {
      try {
        const { data } = await loadCurrentUserProfile();
        if (!active) return;
        const name = data?.fullName ?? session.user?.user_metadata?.full_name ?? session.user?.email ?? null;
        setUserName(name);
      } catch {
        if (active) setUserName(session?.user?.email ?? null);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [client, session]);

  const navItems: { href: string; label: string }[] = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    // Calendar removed per request
    { href: "/appointments", label: "Appointments" },
    { href: "/profile", label: "Profile" },
  ];

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="font-sans min-h-screen grid grid-rows-[auto_1fr]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Toggle menu"
              className="sm:hidden rounded-md border border-gray-300 px-2 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span className="flex flex-col items-center justify-center gap-1">
                <span className={`${mobileOpen ? "rotate-45 translate-y-[3px]" : ""} block h-[2px] w-5 bg-gray-800 transition-transform`}></span>
                <span className={`${mobileOpen ? "opacity-0" : "opacity-100"} block h-[2px] w-5 bg-gray-800 transition-opacity`}></span>
                <span className={`${mobileOpen ? "-rotate-45 -translate-y-[3px]" : ""} block h-[2px] w-5 bg-gray-800 transition-transform`}></span>
              </span>
            </button>
            <Link href="/" className="text-lg font-semibold text-[#FA5252] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-md px-2 py-1">Salon</Link>
          </div>

          <nav aria-label="Primary" className="hidden sm:block">
            <ul className="flex items-center gap-4 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${isActive(item.href) ? "font-medium text-[#FA5252]" : "text-[#1A1A1A]"} inline-flex items-center rounded-md px-2 py-1 hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/profile" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                {userInfo.avatarUrl ? (
                  // avatar image; fallback to initial
                  <img
                    src={userInfo.avatarUrl}
                    alt="avatar"
                    className="h-6 w-6 rounded-full border border-gray-300 object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full border border-gray-300 grid place-items-center text-xs">
                    {(userName ?? userInfo.email ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-muted-foreground">{userName ?? "Profile"}</span>
              </Link>
            ) : (
              <Link href="/" className="text-xs text-muted-foreground inline-flex rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white">Home</Link>
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={`${mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"} sm:hidden overflow-hidden transition-all duration-300 border-t border-gray-200`}
        >
          <ul className="px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${isActive(item.href) ? "font-medium text-[#FA5252]" : "text-[#1A1A1A]"} block rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA5252] focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </header>
      <main className="row-start-2">{children}</main>
    </div>
  );
}