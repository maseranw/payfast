import { beforeEach, describe, expect, it, vi } from "vitest";

describe("payfast-config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when getBaseUrl is called before initPayFastClient", async () => {
    const { getBaseUrl } = await import("../../src/client/payfast-config");
    expect(() => getBaseUrl()).toThrow(
      "PayFast client not initialized — call initPayFastClient(baseUrl) first"
    );
  });

  it("returns the configured url after initPayFastClient is called", async () => {
    const { getBaseUrl, initPayFastClient } = await import(
      "../../src/client/payfast-config"
    );
    initPayFastClient("https://api.example.com");
    expect(getBaseUrl()).toBe("https://api.example.com");
  });
});
