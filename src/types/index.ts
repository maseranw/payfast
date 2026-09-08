export interface PayfastConfig {
  sandbox: boolean;
  merchant_id: string | undefined;
  merchant_key: string | undefined;
  passphrase: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
}

export interface PaymentData {
  merchant_id?: string;
  merchant_key?: string;
  return_url?: string;
  cancel_url?: string;
  notify_url?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  subscription_type?: string | number;
  billing_date?: string;
  recurring_amount?: string;
  frequency?: string | number;
  cycles?: string | number;
  subscription_notify_email?: string | boolean;
  subscription_notify_webhook?: string | boolean;
  subscription_notify_buyer?: string | boolean;
  signature?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface InitiateRequestBody {
  amount?: string;
  item_name?: string;
  item_description?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  m_payment_id?: string;
  return_url?: string;
  cancel_url?: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  subscription_type?: number;
  billing_date?: string;
  recurring_amount?: string;
  frequency?: number;
  cycles?: number;
  subscription_notify_email?: boolean;
  subscription_notify_webhook?: boolean;
  subscription_notify_buyer?: boolean;
}

export interface PfData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1: string;
  custom_str2: string;
  custom_str3: string;
  custom_str4: string;
  custom_str5: string;
  custom_int1: string;
  custom_int2: string;
  custom_int3: string;
  custom_int4: string;
  custom_int5: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  token: string;
  billing_date: string;
  signature: string;
}

export type ItnVerificationResult =
  | { valid: true; payload: PfData }
  | { valid: false; reason: string };

export interface InitiatePaymentResult {
  paymentData: PaymentData;
  payfastUrl: string;
}

export interface InitiatePaymentError {
  error: string;
}

export interface RequestArgs {
  method: "GET" | "PUT";
  url: string;
  headers: { [key: string]: string };
  token: string;
  subscriptionId?: string;
  callback?: (data: any) => Promise<void>;
}

export interface RequestResult {
  status: number;
  payload: any;
}

export interface CsrfSession {
  csrfToken: string | null;
  sessionCookie: string | null;
}

export type ActionType = "cancel" | "pause" | "unpause" | "fetch";
export type MethodType = "GET" | "PUT";

export interface SubscriptionRouteOptions {
  requireSubscriptionId?: boolean;
}

export interface SubscriptionCallbackPayload {
  token: string;
  subscriptionId?: string;
  status: number;
  payload: any;
}

export interface PayFastResponse {
  paymentData: Record<string, string>;
  payfastUrl: string;
}

export interface PayFastActionResponse {
  data: {
    code: number;
    status: string;
    data: {
      response: any;
      message: string;
    };
  };
}

export interface PayFastServiceInterface {
  initiatePayment(data: PaymentData): Promise<PayFastResponse>;
  cancelSubscriptionById(token: string, subscriptionId: string): Promise<PayFastActionResponse>;
  cancelSubscription(token: string): Promise<PayFastActionResponse>;
  pauseSubscription(token: string): Promise<PayFastActionResponse>;
  unpauseSubscription(token: string): Promise<PayFastActionResponse>;
  fetchSubscription(token: string): Promise<PayFastActionResponse>;
  submitPayment(paymentData: Record<string, string>, actionUrl: string): void;
}
