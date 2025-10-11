import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import DashboardShell from "@/components/dashboard-shell";
import React from "react";
import { describe, it, expect, vi } from "vitest";

// Mock next/navigation usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock supabase client calls used inside header
vi.mock("@/lib/supabase-client", () => ({
  isSupabaseEnvReady: false,
  getSupabaseClient: () => null,
}));

describe("DashboardShell header", () => {
  it("highlights the active Home link", () => {
    render(
      <DashboardShell>
        <div>content</div>
      </DashboardShell>
    );
    const primaryNav = screen.getByRole("navigation", { name: /primary/i });
    const homeLink = within(primaryNav).getByRole("link", { name: /home/i });
    expect(homeLink).toHaveClass("font-medium");
  });

  it("toggles mobile drawer when clicking hamburger button", () => {
    render(
      <DashboardShell>
        <div>content</div>
      </DashboardShell>
    );
    const menuButton = screen.getByRole("button", { name: /toggle menu/i });

    // Click to open drawer (hamburger animates)
    fireEvent.click(menuButton);
    const bars = menuButton.querySelectorAll("span > span");
    expect(bars.length).toBe(3);

    // Click to close drawer
    fireEvent.click(menuButton);
    expect(bars.length).toBe(3);
  });

  it("shows 'Home' link on right when no session", () => {
    render(
      <DashboardShell>
        <div>content</div>
      </DashboardShell>
    );
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: /home/i })).toBeInTheDocument();
  });

  // Session-present tests (unchanged expectations for email/avatar)
  it("renders email and avatar when session is present", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({ usePathname: () => "/" }));
    vi.doMock("@/lib/supabase-client", () => {
      const mockClient = {
        auth: {
          getSession: async () => ({
            data: {
              session: {
                user: {
                  email: "alice@example.com",
                  user_metadata: { avatar_url: "https://example.com/avatar.png" },
                },
              },
            },
            error: null,
          }),
          onAuthStateChange: (_evt: unknown, _sess: unknown) => ({
            data: { subscription: { unsubscribe() {} } },
          }),
        },
      };
      return { isSupabaseEnvReady: true, getSupabaseClient: () => mockClient };
    });
    const { default: DashboardShellLocal } = await import("@/components/dashboard-shell");
    render(
      <DashboardShellLocal>
        <div>content</div>
      </DashboardShellLocal>
    );
    const header = screen.getByRole("banner");
    await within(header).findByRole("link", { name: /alice@example\.com/i });
    expect(within(header).getByAltText("avatar")).toBeInTheDocument();
  });

  it("renders name initial when session present without avatar", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({ usePathname: () => "/" }));
    vi.doMock("@/lib/supabase-client", () => {
      const mockClient = {
        auth: {
          getSession: async () => ({
            data: {
              session: {
                user: {
                  email: "bob@example.com",
                  user_metadata: { avatar_url: null, full_name: "Bob Builder" },
                },
              },
            },
            error: null,
          }),
          onAuthStateChange: (_evt: unknown, _sess: unknown) => ({
            data: { subscription: { unsubscribe() {} } },
          }),
        },
      };
      return { isSupabaseEnvReady: true, getSupabaseClient: () => mockClient };
    });
    const { default: DashboardShellLocal } = await import("@/components/dashboard-shell");
    render(
      <DashboardShellLocal>
        <div>content</div>
      </DashboardShellLocal>
    );
    const header = screen.getByRole("banner");
    const link = await within(header).findByRole("link", { name: /bob builder/i });
    expect(within(header).queryByAltText("avatar")).toBeNull();
    expect(link).toBeInTheDocument();
  });
});

// Helper to find the mobile drawer container under the header
function getMobileDrawer(): HTMLDivElement {
  const header = screen.getByRole("banner");
  const divs = header.querySelectorAll("div");
  const drawer = Array.from(divs).find((d) => d.className.includes("overflow-hidden") && d.className.includes("transition-all"));
  if (!drawer) throw new Error("Mobile drawer element not found");
  return drawer as HTMLDivElement;
}

it("mobile drawer visibility classes toggle on button click", () => {
  render(
    <DashboardShell>
      <div>content</div>
    </DashboardShell>
  );
  const menuButton = screen.getByRole("button", { name: /toggle menu/i });
  const drawer = getMobileDrawer();

  // Initially closed
  expect(drawer.className).toContain("opacity-0");
  expect(drawer.className).toContain("max-h-0");

  // Open drawer
  fireEvent.click(menuButton);
  expect(drawer.className).toContain("opacity-100");
  expect(drawer.className).toContain("max-h-64");

  // Close drawer
  fireEvent.click(menuButton);
  expect(drawer.className).toContain("opacity-0");
  expect(drawer.className).toContain("max-h-0");
});

it("mobile drawer closes when route changes", async () => {
  // Dynamic pathname mock that can change across rerenders
  vi.resetModules();
  let currentPath = "/";
  vi.doMock("next/navigation", () => ({ usePathname: () => currentPath }));
  vi.doMock("@/lib/supabase-client", () => ({ isSupabaseEnvReady: false, getSupabaseClient: () => null }));
  const { default: DashboardShellLocal } = await import("@/components/dashboard-shell");

  const { rerender } = render(
    <DashboardShellLocal>
      <div>content</div>
    </DashboardShellLocal>
  );

  const menuButton = screen.getByRole("button", { name: /toggle menu/i });
  const drawer = getMobileDrawer();

  // Open drawer
  fireEvent.click(menuButton);
  expect(drawer.className).toContain("opacity-100");
  expect(drawer.className).toContain("max-h-64");

  // Simulate route change
  currentPath = "/profile";
  rerender(
    <DashboardShellLocal>
      <div>content</div>
    </DashboardShellLocal>
  );

  // Drawer should close on route change
  await waitFor(() => {
    expect(drawer.className).toContain("opacity-0");
    expect(drawer.className).toContain("max-h-0");
  });
});