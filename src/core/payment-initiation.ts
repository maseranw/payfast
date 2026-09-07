import { generateSignatureForInitiate } from "./signature";
import {
  InitiatePaymentError,
  InitiatePaymentResult,
  InitiateRequestBody,
  PayfastConfig,
  PaymentData,
} from "../types";

const getPayfastProcessUrl = (config: PayfastConfig): string =>
  config.sandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

const buildInitiatePaymentData = (
  body: InitiateRequestBody,
  config: PayfastConfig
): InitiatePaymentResult | InitiatePaymentError => {
  const {
    amount,
    item_name,
    item_description,
    name_first,
    name_last,
    email_address,
    m_payment_id,
    subscription_type,
    billing_date,
    recurring_amount,
    frequency,
    cycles,
    subscription_notify_email,
    subscription_notify_webhook,
    subscription_notify_buyer,
  } = body;

  if (!amount || !item_name || !m_payment_id) {
    return { error: "Missing required fields" };
  }

  if (isNaN(parseFloat(amount))) {
    return { error: "Amount must be a valid number" };
  }

  const effectiveBillingDate =
    billing_date || new Date().toISOString().split("T")[0];
  const parsedAmount = parseFloat(amount).toFixed(2);
  const effectiveRecurringAmount = recurring_amount || parsedAmount;

  const paymentData: PaymentData = {
    merchant_id: config.merchant_id || "",
    merchant_key: config.merchant_key || "",
    return_url: config.return_url,
    cancel_url: config.cancel_url,
    notify_url: config.notify_url,
    name_first: name_first || "",
    name_last: name_last || "",
    email_address: email_address || "",
    m_payment_id,
    amount: parsedAmount,
    item_name,
    item_description,
    subscription_type: subscription_type || 1,
    billing_date: effectiveBillingDate,
    recurring_amount: effectiveRecurringAmount,
    frequency: frequency || 3,
    cycles: cycles || 0,
    subscription_notify_email: subscription_notify_email ?? true,
    subscription_notify_webhook: subscription_notify_webhook ?? true,
    subscription_notify_buyer: subscription_notify_buyer ?? true,
  };

  paymentData.signature = generateSignatureForInitiate(
    paymentData,
    config.passphrase
  );

  return { paymentData, payfastUrl: getPayfastProcessUrl(config) };
};

export { buildInitiatePaymentData, getPayfastProcessUrl };
