import { beforeEach, describe, expect, it, vi } from "vitest";
import { PayFastService } from "../../src/client/payfast-service";
import { initPayFastClient, setAuthTokenProvider } from "../../src/client/payfast-config";
import type { PaymentData } from "../../src/types";

describe("PayFastService", () => {
  beforeEach(() => {
    initPayFastClient("https://api.example.com");
    setAuthTokenProvider(null);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("initiatePayment calls fetch with correct URL, method and body and returns parsed JSON", async () => {
    const responseBody = {
      paymentData: { amount: "100" },
      payfastUrl: "https://payfast.example.com/pay",
    };
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseBody),
    });

    const service = new PayFastService();
    const data: PaymentData = {
      amount: "100",
      item_name: "Subscription",
      m_payment_id: "abc123",
    };

    const result = await service.initiatePayment(data);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/payfast/initiate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    expect(result).toEqual(responseBody);
  });

  it("initiatePayment attaches an Authorization header when an auth token provider is set", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    setAuthTokenProvider(() => "session-token-abc");

    const service = new PayFastService();
    await service.initiatePayment({
      amount: "100",
      item_name: "Subscription",
      m_payment_id: "abc123",
    });

    const [, options] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer session-token-abc");
  });

  it("throws PayFast API error with status and statusText when error body is not JSON", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: vi.fn().mockRejectedValue(new Error("not json")),
    });

    const service = new PayFastService();

    await expect(
      service.initiatePayment({
        amount: "100",
        item_name: "Subscription",
        m_payment_id: "abc123",
      })
    ).rejects.toThrow("PayFast API error: 500 Internal Server Error");
  });

  it("throws the error message from the response body when it is valid JSON", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: vi.fn().mockResolvedValue({ error: "some message" }),
    });

    const service = new PayFastService();

    await expect(
      service.initiatePayment({
        amount: "100",
        item_name: "Subscription",
        m_payment_id: "abc123",
      })
    ).rejects.toThrow("some message");
  });

  it("cancelSubscriptionById URL-encodes token and subscriptionId with special characters", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const service = new PayFastService();
    const token = "tok/en?value";
    const subscriptionId = "sub/id?value";

    await service.cancelSubscriptionById(token, subscriptionId);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.example.com/api/payfast/cancel/${encodeURIComponent(
        token
      )}/${encodeURIComponent(subscriptionId)}`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("cancelSubscription URL-encodes token with special characters", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const service = new PayFastService();
    const token = "tok/en?value";

    await service.cancelSubscription(token);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.example.com/api/payfast/cancel/${encodeURIComponent(
        token
      )}`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("pauseSubscription URL-encodes token with special characters", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const service = new PayFastService();
    const token = "tok/en?value";

    await service.pauseSubscription(token);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.example.com/api/payfast/pause/${encodeURIComponent(
        token
      )}`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("unpauseSubscription URL-encodes token with special characters", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const service = new PayFastService();
    const token = "tok/en?value";

    await service.unpauseSubscription(token);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.example.com/api/payfast/unpause/${encodeURIComponent(
        token
      )}`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("fetchSubscription URL-encodes token with special characters", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const service = new PayFastService();
    const token = "tok/en?value";

    await service.fetchSubscription(token);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.example.com/api/payfast/fetch/${encodeURIComponent(
        token
      )}`,
      { method: "GET", headers: {} }
    );
  });

  it("attaches no Authorization header when no auth token provider is set", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const service = new PayFastService();
    await service.pauseSubscription("token-123");

    const [, options] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("attaches an Authorization header from the configured auth token provider", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    setAuthTokenProvider(() => "session-token-abc");

    const service = new PayFastService();
    await service.pauseSubscription("token-123");

    const [, options] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer session-token-abc");
  });

  it("supports an async auth token provider", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    setAuthTokenProvider(async () => "async-token");

    const service = new PayFastService();
    await service.fetchSubscription("token-123");

    const [, options] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer async-token");
  });
});
