import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import AppointmentsList from "./appointments-list";

// Mock services used by the AppointmentsList component
vi.mock("@/services/appointments", () => ({
  loadUserAppointmentsFast: vi.fn(),
  cancelAppointment: vi.fn(),
}));
import { loadUserAppointmentsFast, cancelAppointment } from "@/services/appointments";

describe("AppointmentsList optimistic cancel", () => {
  it("removes the appointment from the list after cancel", async () => {
    const items = [
      {
        id: "a1",
        userId: "u1",
        serviceId: "basic-cut",
        stylistId: "s1",
        stylistName: "Alex",
        date: "2025-10-15",
        time: "10:00",
        notes: null,
        createdAt: null,
      },
      {
        id: "a2",
        userId: "u1",
        serviceId: "restyle",
        stylistId: "s1",
        stylistName: "Alex",
        date: "2025-10-16",
        time: "11:00",
        notes: null,
        createdAt: null,
      },
    ];

    (loadUserAppointmentsFast as any).mockResolvedValue({ data: items, error: null });
    (cancelAppointment as any).mockResolvedValue({ ok: true, error: null });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<AppointmentsList />);

    // Wait for items to render
    await screen.findByText(/Service: basic-cut/i);
    await screen.findByText(/Service: restyle/i);

    // Cancel the first appointment
    const buttons = await screen.findAllByRole("button", { name: /cancel/i });
    buttons[0].click();

    // Expect the first item to be removed optimistically
    await waitFor(() => {
      expect(screen.queryByText(/Service: basic-cut/i)).not.toBeInTheDocument();
    });

    // The second item remains
    expect(screen.getByText(/Service: restyle/i)).toBeInTheDocument();
  });
});