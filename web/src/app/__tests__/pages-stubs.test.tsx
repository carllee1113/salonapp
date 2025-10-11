import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Helper to render a page within the DashboardShell-root layout environment
import DashboardShell from "@/components/dashboard-shell";

// Mock Supabase as disabled for these simple stub page tests
vi.mock("@/lib/supabase-client", () => ({
  isSupabaseEnvReady: false,
  getSupabaseClient: () => null,
}));


// Services Page tests
import ServicesPage from "@/app/services/page";
describe("ServicesPage", () => {
  it("renders Services title and stub description", () => {
    render(
      <DashboardShell>
        <ServicesPage />
      </DashboardShell>
    );
    expect(screen.getByRole("heading", { name: /services/i })).toBeInTheDocument();
    expect(
      screen.getByText(/stub view for services/i)
    ).toBeInTheDocument();
  });
});

// Appointments Page tests
import AppointmentsPage from "@/app/appointments/page";
describe("AppointmentsPage", () => {
  it("renders Appointments title and stub description", () => {
    render(
      <DashboardShell>
        <AppointmentsPage />
      </DashboardShell>
    );
    expect(screen.getByRole("heading", { name: /appointments/i })).toBeInTheDocument();
    expect(
      screen.getByText(/stub view for appointments/i)
    ).toBeInTheDocument();
  });
});

// Profile Page tests
import ProfilePage from "@/app/profile/page";
describe("ProfilePage", () => {
  it("renders Profile title and stub description", () => {
    render(
      <DashboardShell>
        <ProfilePage />
      </DashboardShell>
    );
    expect(screen.getByRole("heading", { name: /profile/i })).toBeInTheDocument();
    expect(
      screen.getByText(/stub view for profile/i)
    ).toBeInTheDocument();
  });
});