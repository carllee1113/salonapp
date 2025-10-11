import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import NewAppointmentPage from "./page";

describe("NewAppointmentPage", () => {
  it("renders the BookingForm heading and unauthenticated helper text", () => {
    render(<NewAppointmentPage />);
    // Heading from BookingForm
    expect(screen.getByRole("heading", { name: /new appointment/i })).toBeInTheDocument();
    // Unauthenticated helper copy
    screen.getByText(/sign in is required to book appointments/i);
    // Ensure Book button is present but disabled in unauthenticated mode
    const bookBtn = screen.getByRole("button", { name: /book/i });
    expect(bookBtn).toBeDisabled();
  });
});