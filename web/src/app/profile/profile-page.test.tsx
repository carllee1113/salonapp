import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";

import DashboardShell from "@/components/dashboard-shell";
import ProfilePage from "@/app/profile/page";

describe("ProfilePage UI", () => {
  it("renders the Profile heading and the ProfileForm fields", () => {
    render(
      <DashboardShell>
        <ProfilePage />
      </DashboardShell>
    );

    // Heading and stub text
    expect(screen.getByRole("heading", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByText(/stub view for profile/i)).toBeInTheDocument();

    // Form fields
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    const phoneField = screen.getByLabelText(/phone/i) as HTMLInputElement;
    expect(phoneField).toBeInTheDocument();
    expect(phoneField.placeholder).toMatch(/1234 5678/);
    // Timezone removed for Hong Kong focus
    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();

    // Loyalty Points present
    expect(screen.getByText(/loyalty points/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();

    // Preferences checkboxes (disabled)
    const marketing = screen.getByLabelText(/receive marketing emails/i) as HTMLInputElement;
    const sms = screen.getByLabelText(/sms appointment reminders/i) as HTMLInputElement;
    expect(marketing).toBeInTheDocument();
    expect(marketing.disabled).toBe(true);
    expect(sms).toBeInTheDocument();
    expect(sms.disabled).toBe(true);
    expect(screen.getByText(/temporarily disabled/i)).toBeInTheDocument();

    // Buttons
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
    expect(screen.getByRole("button", { name: /return/i })).toBeInTheDocument();
    // Sign in button should be visible when unauthenticated
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form via submit event", async () => {
    render(
      <DashboardShell>
        <ProfilePage />
      </DashboardShell>
    );

    // Programmatically submit the form even if the button is disabled
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    const formEl = saveBtn.closest("form");
    if (!formEl) throw new Error("Form element not found");
    fireEvent.submit(formEl);

    // Errors should appear (timezone not required)
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/phone must be 8 digits/i)).toBeInTheDocument();
  });
});