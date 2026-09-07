import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "PAYFAST_RETURN_URL",
  "RETURN_URL",
  "TESTING_MODE",
  "NODE_ENV",
];

const originalEnv: Record<string, string | undefined> = {};

describe("payfastConfig", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it("prefers PAYFAST_RETURN_URL over the legacy RETURN_URL", async () => {
    process.env.PAYFAST_RETURN_URL = "https://example.com/new-return";
    process.env.RETURN_URL = "https://example.com/legacy-return";

    const { default: payfastConfig } = await import("./config");

    expect(payfastConfig.return_url).toBe("https://example.com/new-return");
  });

  it("falls back to RETURN_URL when PAYFAST_RETURN_URL is unset", async () => {
    process.env.RETURN_URL = "https://example.com/legacy-return";

    const { default: payfastConfig } = await import("./config");

    expect(payfastConfig.return_url).toBe("https://example.com/legacy-return");
  });

  it("sets sandbox to true when TESTING_MODE is 'true'", async () => {
    process.env.TESTING_MODE = "true";
    process.env.NODE_ENV = "production";

    const { default: payfastConfig } = await import("./config");

    expect(payfastConfig.sandbox).toBe(true);
  });
});
