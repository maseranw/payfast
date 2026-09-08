import { describe, expect, it } from "vitest";
import {
  buildInitiatePaymentData,
  getPayfastProcessUrl,
} from "../../src/core/payment-initiation";
import { PayfastConfig } from "../../src/types";

const config: PayfastConfig = {
  sandbox: true,
  merchant_id: "10000100",
  merchant_key: "key",
  passphrase: "passphrase123",
  return_url: "https://example.com/return",
  cancel_url: "https://example.com/cancel",
  notify_url: "https://example.com/notify",
};

describe("buildInitiatePaymentData", () => {
  it("rejects a request missing required fields", () => {
    const result = buildInitiatePaymentData(
      { item_name: "Plan", m_payment_id: "PAY-1" },
      config
    );

    expect(result).toEqual({ error: "Missing required fields" });
  });

  it("rejects a non-numeric amount", () => {
    const result = buildInitiatePaymentData(
      { amount: "abc", item_name: "Plan", m_payment_id: "PAY-1" },
      config
    );

    expect(result).toEqual({ error: "Amount must be a valid positive number" });
  });

  it("rejects a negative amount", () => {
    const result = buildInitiatePaymentData(
      { amount: "-9999.99", item_name: "Plan", m_payment_id: "PAY-1" },
      config
    );

    expect(result).toEqual({ error: "Amount must be a valid positive number" });
  });

  it("rejects a zero amount", () => {
    const result = buildInitiatePaymentData(
      { amount: "0", item_name: "Plan", m_payment_id: "PAY-1" },
      config
    );

    expect(result).toEqual({ error: "Amount must be a valid positive number" });
  });

  it("builds a signed payment payload for a valid request", () => {
    const result = buildInitiatePaymentData(
      { amount: "99.5", item_name: "Plan", m_payment_id: "PAY-1" },
      config
    );

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.paymentData.amount).toBe("99.50");
      expect(result.paymentData.merchant_id).toBe("10000100");
      expect(result.paymentData.signature).toBeTruthy();
      expect(result.payfastUrl).toBe(getPayfastProcessUrl(config));
    }
  });

  it("omits subscription fields for a once-off payment", () => {
    const result = buildInitiatePaymentData(
      { amount: "10.00", item_name: "Song", m_payment_id: "PAY-1" },
      config
    );

    if (!("error" in result)) {
      expect(result.paymentData.subscription_type).toBeUndefined();
      expect(result.paymentData.recurring_amount).toBeUndefined();
      expect(result.paymentData.billing_date).toBeUndefined();
    }
  });

  it("passes through custom_str1-5 for a once-off payment", () => {
    const result = buildInitiatePaymentData(
      {
        amount: "10.00",
        item_name: "Song",
        m_payment_id: "PAY-1",
        custom_str1: "song-slug",
        custom_str2: "42",
      },
      config
    );

    if (!("error" in result)) {
      expect(result.paymentData.custom_str1).toBe("song-slug");
      expect(result.paymentData.custom_str2).toBe("42");
    }
  });

  it("opts into subscription fields with defaults when subscription_type is set", () => {
    const result = buildInitiatePaymentData(
      {
        amount: "10.00",
        item_name: "Plan",
        m_payment_id: "PAY-1",
        subscription_type: 1,
      },
      config
    );

    const today = new Date().toISOString().split("T")[0];
    if (!("error" in result)) {
      expect(result.paymentData.subscription_type).toBe(1);
      expect(result.paymentData.billing_date).toBe(today);
      expect(result.paymentData.recurring_amount).toBe("10.00");
      expect(result.paymentData.frequency).toBe(3);
      expect(result.paymentData.cycles).toBe(0);
    }
  });

  it("allows return_url and cancel_url to be overridden per call", () => {
    const result = buildInitiatePaymentData(
      {
        amount: "10.00",
        item_name: "Song",
        m_payment_id: "PAY-1",
        return_url: "https://example.com/return/song-slug",
        cancel_url: "https://example.com/cancel/song-slug",
      },
      config
    );

    if (!("error" in result)) {
      expect(result.paymentData.return_url).toBe(
        "https://example.com/return/song-slug"
      );
      expect(result.paymentData.cancel_url).toBe(
        "https://example.com/cancel/song-slug"
      );
    }
  });

  it("defaults return_url and cancel_url to config when not overridden", () => {
    const result = buildInitiatePaymentData(
      { amount: "10.00", item_name: "Song", m_payment_id: "PAY-1" },
      config
    );

    if (!("error" in result)) {
      expect(result.paymentData.return_url).toBe(config.return_url);
      expect(result.paymentData.cancel_url).toBe(config.cancel_url);
    }
  });
});

describe("getPayfastProcessUrl", () => {
  it("returns the sandbox URL when sandbox is true", () => {
    expect(getPayfastProcessUrl({ ...config, sandbox: true })).toContain(
      "sandbox.payfast.co.za"
    );
  });

  it("returns the live URL when sandbox is false", () => {
    expect(getPayfastProcessUrl({ ...config, sandbox: false })).toBe(
      "https://www.payfast.co.za/eng/process"
    );
  });
});
