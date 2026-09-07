import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PayFastFormUtils } from "../../src/client/payfast-form-utils";

describe("PayFastFormUtils", () => {
  let submitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    submitSpy = vi
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    submitSpy.mockRestore();
    document.body.innerHTML = "";
  });

  it("submitPayment builds a form with hidden inputs, correct action/method, appends it and submits", () => {
    const paymentData = {
      amount: "100",
      item_name: "Subscription",
      m_payment_id: "abc123",
    };
    const actionUrl = "https://payfast.example.com/pay";

    PayFastFormUtils.submitPayment(paymentData, actionUrl);

    const form = document.body.querySelector("form");
    expect(form).not.toBeNull();
    expect(form?.method).toBe("post");
    expect(form?.action).toBe(actionUrl);

    Object.entries(paymentData).forEach(([key, value]) => {
      const input = form?.querySelector<HTMLInputElement>(
        `input[name="${key}"]`
      );
      expect(input).not.toBeNull();
      expect(input?.type).toBe("hidden");
      expect(input?.value).toBe(value);
    });

    expect(document.body.contains(form)).toBe(true);
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });
});
