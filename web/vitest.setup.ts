import "@testing-library/jest-dom";

// Polyfill for next/link and next/navigation if needed
// (Testing Library with jsdom handles most, but Next APIs may require stubs in some tests.)

// Global mock for Next.js navigation to avoid invariant errors when components call useRouter/usePathname
import { vi } from "vitest";
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => "/",
  };
});