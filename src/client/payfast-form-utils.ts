export class PayFastFormUtils {
  static createPaymentForm(
    paymentData: Record<string, string>,
    actionUrl: string
  ): HTMLFormElement {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = actionUrl;
    form.style.display = "none";

    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    return form;
  }

  static submitPayment(
    paymentData: Record<string, string>,
    actionUrl: string
  ): void {
    const form = this.createPaymentForm(paymentData, actionUrl);
    document.body.appendChild(form);
    form.submit();
  }
}
