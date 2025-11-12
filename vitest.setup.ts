import "@testing-library/jest-dom/vitest";

// Polyfill Next.js router helpers when needed.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
