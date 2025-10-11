import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock Supabase to avoid session state complexity in navigation tests
vi.mock("@/lib/supabase-client", () => ({
  isSupabaseEnvReady: false,
  getSupabaseClient: () => null,
}));

// Helper to render at a given path
async function renderShellAtPath(pathname: string) {
  vi.resetModules();
  vi.doMock("next/navigation", () => ({ usePathname: () => pathname }));
  const { default: DashboardShellLocal } = await import("@/components/dashboard-shell");
  render(
    <DashboardShellLocal>
      <div>content</div>
    </DashboardShellLocal>
  );
}

// Utility to get primary header navigation
function getPrimaryNav() {
  const nav = screen.getByRole("navigation", { name: /primary/i });
  return within(nav);
}

describe("Header navigation links", () => {
  it("renders links with correct hrefs", async () => {
    await renderShellAtPath("/");
    const nav = getPrimaryNav();
    const links = nav.getAllByRole("link");
    const map = new Map(links.map((a) => [a.textContent?.trim() ?? "", a.getAttribute("href")]));

    expect(map.get("Home")).toBe("/");
    expect(map.get("Services")).toBe("/services");
    expect(map.get("Appointments")).toBe("/appointments");
    expect(map.get("Profile")).toBe("/profile");
  });

  it("highlights Home as active at path '/'", async () => {
    await renderShellAtPath("/");
    const nav = getPrimaryNav();
    const homeLink = nav.getByRole("link", { name: /home/i });
    expect(homeLink.className).toContain("text-[#FA5252]");
    const others = ["Services", "Appointments", "Profile"].map((label) =>
      nav.getByRole("link", { name: new RegExp(label, "i") })
    );
    for (const l of others) {
      expect(l.className).not.toContain("text-[#FA5252]");
    }
  });

  it("highlights Appointments as active at path '/appointments'", async () => {
    await renderShellAtPath("/appointments");
    const nav = getPrimaryNav();
    const link = nav.getByRole("link", { name: /appointments/i });
    expect(link.className).toContain("text-[#FA5252]");
  });

  it("highlights Services as active at path '/services'", async () => {
    await renderShellAtPath("/services");
    const nav = getPrimaryNav();
    const link = nav.getByRole("link", { name: /services/i });
    expect(link.className).toContain("text-[#FA5252]");
  });
});