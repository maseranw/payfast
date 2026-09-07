import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("dns/promises", () => ({
  reverse: vi.fn(),
}));

import { reverse } from "dns/promises";
import { createITNPayload, isPayfastSourceIp } from "./itn";

const mockedReverse = vi.mocked(reverse);

describe("createITNPayload", () => {
  it("maps raw ITN body fields onto the expected payload shape", () => {
    const body = {
      m_payment_id: "PAY-1",
      pf_payment_id: "9999",
      payment_status: "COMPLETE",
      item_name: "Subscription",
      item_description: "Monthly plan",
      amount_gross: "100.00",
      amount_fee: "-3.30",
      amount_net: "96.70",
      custom_str1: "s1",
      custom_str2: "s2",
      custom_str3: "s3",
      custom_str4: "s4",
      custom_str5: "s5",
      custom_int1: "1",
      custom_int2: "2",
      custom_int3: "3",
      custom_int4: "4",
      custom_int5: "5",
      name_first: "John",
      name_last: "Doe",
      email_address: "john@example.com",
      merchant_id: "10000100",
      token: "abc123",
      billing_date: "2026-09-07",
      signature: "deadbeef",
    };

    expect(createITNPayload(body)).toEqual(body);
  });

  it("defaults missing fields to empty strings", () => {
    const payload = createITNPayload({ m_payment_id: "PAY-1" });

    expect(payload.m_payment_id).toBe("PAY-1");
    expect(payload.pf_payment_id).toBe("");
    expect(payload.payment_status).toBe("");
    expect(payload.signature).toBe("");
  });
});

describe("isPayfastSourceIp", () => {
  afterEach(() => {
    mockedReverse.mockReset();
  });

  it("returns true when a reverse-lookup hostname ends with payfast.co.za", async () => {
    mockedReverse.mockResolvedValue(["mta1.payfast.co.za"]);

    expect(await isPayfastSourceIp("196.1.2.3")).toBe(true);
  });

  it("returns false when no hostname ends with payfast.co.za", async () => {
    mockedReverse.mockResolvedValue(["mail.example.com"]);

    expect(await isPayfastSourceIp("1.2.3.4")).toBe(false);
  });

  it("returns false, not a thrown error, when the lookup rejects", async () => {
    mockedReverse.mockRejectedValue(new Error("lookup failed"));

    await expect(isPayfastSourceIp("1.2.3.4")).resolves.toBe(false);
  });
});
