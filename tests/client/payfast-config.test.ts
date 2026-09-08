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

  it("returns null from getAuthToken when no provider is set", async () => {
    const { getAuthToken } = await import("../../src/client/payfast-config");
    expect(await getAuthToken()).toBeNull();
  });

  it("returns the provider's token from getAuthToken once one is set", async () => {
    const { getAuthToken, setAuthTokenProvider } = await import(
      "../../src/client/payfast-config"
    );
    setAuthTokenProvider(() => "abc123");
    expect(await getAuthToken()).toBe("abc123");
  });

  it("returns null again after the provider is cleared", async () => {
    const { getAuthToken, setAuthTokenProvider } = await import(
      "../../src/client/payfast-config"
    );
    setAuthTokenProvider(() => "abc123");
    setAuthTokenProvider(null);
    expect(await getAuthToken()).toBeNull();
  });
});
