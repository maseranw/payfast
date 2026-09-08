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

  it("defaults billing_date to today when not provided", () => {
    const result = buildInitiatePaymentData(
      { amount: "10.00", item_name: "Plan", m_payment_id: "PAY-1" },
      config
    );

    const today = new Date().toISOString().split("T")[0];
    if (!("error" in result)) {
      expect(result.paymentData.billing_date).toBe(today);
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
