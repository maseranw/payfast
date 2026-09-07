import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { generateSignatureForInitiate, pfValidSignature } from "./signature";
import { PaymentData } from "../types";

const computeExpectedSignature = (
  data: Record<string, string | number | boolean | undefined>,
  fieldOrder: string[],
  passphrase: string | null
): string => {
  let paramString = fieldOrder.reduce((acc, key) => {
    if (data[key] !== undefined && data[key] !== "") {
      const value = encodeURIComponent(String(data[key]).trim()).replace(
        /%20/g,
        "+"
      );
      return acc + `${key}=${value}&`;
    }
    return acc;
  }, "");

  paramString = paramString.slice(0, -1);

  if (passphrase) {
    const encodedPass = encodeURIComponent(passphrase.trim()).replace(
      /%20/g,
      "+"
    );
    paramString += `&passphrase=${encodedPass}`;
  }

  return createHash("md5").update(paramString).digest("hex");
};

const fieldOrder = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
];

const basePaymentData: PaymentData = {
  merchant_id: "10000100",
  merchant_key: "46f0cd694581a",
  return_url: "https://example.com/return",
  cancel_url: "https://example.com/cancel",
  notify_url: "https://example.com/notify",
  name_first: "John",
  name_last: "Doe",
  email_address: "john@example.com",
  m_payment_id: "PAY-1",
  amount: "100.00",
  item_name: "Test Item",
  item_description: "A test subscription item",
  subscription_type: 1,
  billing_date: "2026-09-07",
  recurring_amount: "100.00",
  frequency: 3,
  cycles: 0,
  subscription_notify_email: true,
  subscription_notify_webhook: true,
  subscription_notify_buyer: true,
};

describe("generateSignatureForInitiate", () => {
  it("produces the expected md5 signature with a passphrase", () => {
    const passphrase = "jt7NOE43FZPn";
    const expected = computeExpectedSignature(
      basePaymentData,
      fieldOrder,
      passphrase
    );

    expect(generateSignatureForInitiate(basePaymentData, passphrase)).toBe(
      expected
    );
  });

  it("produces a stable signature when the passphrase is omitted", () => {
    const expected = computeExpectedSignature(basePaymentData, fieldOrder, null);

    const first = generateSignatureForInitiate(basePaymentData);
    const second = generateSignatureForInitiate(basePaymentData, null);

    expect(first).toBe(expected);
    expect(second).toBe(expected);
  });

  it("changes the signature when any field changes", () => {
    const passphrase = "jt7NOE43FZPn";
    const baseline = generateSignatureForInitiate(basePaymentData, passphrase);

    const changed = generateSignatureForInitiate(
      { ...basePaymentData, amount: "200.00" },
      passphrase
    );

    expect(changed).not.toBe(baseline);
  });
});

describe("pfValidSignature", () => {
  it("returns true for a valid payload with a matching signature", () => {
    const passphrase = "jt7NOE43FZPn";
    const pfData = {
      m_payment_id: "PAY-1",
      pf_payment_id: "999",
      payment_status: "COMPLETE",
      signature: "",
    };

    let paramString = "";
    Object.keys(pfData).forEach((key) => {
      if (key === "signature") return;
      const value = (pfData as Record<string, string>)[key];
      paramString += `${key}=${encodeURIComponent(value.trim()).replace(
        /%20/g,
        "+"
      )}&`;
    });
    paramString = paramString.slice(0, -1);

    const encodedPass = encodeURIComponent(passphrase.trim()).replace(
      /%20/g,
      "+"
    );
    const signature = createHash("md5")
      .update(`${paramString}&passphrase=${encodedPass}`)
      .digest("hex");

    const validPfData = { ...pfData, signature };

    expect(pfValidSignature(validPfData, paramString, passphrase)).toBe(true);
  });

  it("returns false for a tampered payload reusing the old signature", () => {
    const passphrase = "jt7NOE43FZPn";
    const pfData = {
      m_payment_id: "PAY-1",
      pf_payment_id: "999",
      payment_status: "COMPLETE",
    };

    let paramString = "";
    Object.keys(pfData).forEach((key) => {
      const value = (pfData as Record<string, string>)[key];
      paramString += `${key}=${encodeURIComponent(value.trim()).replace(
        /%20/g,
        "+"
      )}&`;
    });
    paramString = paramString.slice(0, -1);

    const encodedPass = encodeURIComponent(passphrase.trim()).replace(
      /%20/g,
      "+"
    );
    const oldSignature = createHash("md5")
      .update(`${paramString}&passphrase=${encodedPass}`)
      .digest("hex");

    const tamperedParamString = paramString.replace(
      "payment_status=COMPLETE",
      "payment_status=CANCELLED"
    );

    const tamperedPfData = {
      ...pfData,
      payment_status: "CANCELLED",
      signature: oldSignature,
    };

    expect(
      pfValidSignature(tamperedPfData, tamperedParamString, passphrase)
    ).toBe(false);
  });

  it("returns false when the signature field is missing", () => {
    const pfData = {
      m_payment_id: "PAY-1",
    };

    expect(pfValidSignature(pfData, "m_payment_id=PAY-1", null)).toBe(false);
  });
});
