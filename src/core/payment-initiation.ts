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
    return_url,
    cancel_url,
    custom_str1,
    custom_str2,
    custom_str3,
    custom_str4,
    custom_str5,
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

  const parsedAmountValue = parseFloat(amount);
  if (isNaN(parsedAmountValue) || parsedAmountValue <= 0) {
    return { error: "Amount must be a valid positive number" };
  }

  const parsedAmount = parseFloat(amount).toFixed(2);

  const paymentData: PaymentData = {
    merchant_id: config.merchant_id || "",
    merchant_key: config.merchant_key || "",
    return_url: return_url || config.return_url,
    cancel_url: cancel_url || config.cancel_url,
    notify_url: config.notify_url,
    name_first: name_first || "",
    name_last: name_last || "",
    email_address: email_address || "",
    m_payment_id,
    amount: parsedAmount,
    item_name,
    item_description,
  };

  if (custom_str1 !== undefined) paymentData.custom_str1 = custom_str1;
  if (custom_str2 !== undefined) paymentData.custom_str2 = custom_str2;
  if (custom_str3 !== undefined) paymentData.custom_str3 = custom_str3;
  if (custom_str4 !== undefined) paymentData.custom_str4 = custom_str4;
  if (custom_str5 !== undefined) paymentData.custom_str5 = custom_str5;

  if (subscription_type !== undefined) {
    const effectiveBillingDate =
      billing_date || new Date().toISOString().split("T")[0];
    const effectiveRecurringAmount = recurring_amount || parsedAmount;

    paymentData.subscription_type = subscription_type;
    paymentData.billing_date = effectiveBillingDate;
    paymentData.recurring_amount = effectiveRecurringAmount;
    paymentData.frequency = frequency || 3;
    paymentData.cycles = cycles || 0;
    paymentData.subscription_notify_email = subscription_notify_email ?? true;
    paymentData.subscription_notify_webhook = subscription_notify_webhook ?? true;
    paymentData.subscription_notify_buyer = subscription_notify_buyer ?? true;
  }

  paymentData.signature = generateSignatureForInitiate(
    paymentData,
    config.passphrase
  );

  return { paymentData, payfastUrl: getPayfastProcessUrl(config) };
};

export { buildInitiatePaymentData, getPayfastProcessUrl };
