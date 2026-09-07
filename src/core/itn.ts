import axios from "axios";
import qs from "querystring";
import { reverse } from "dns/promises";
import { pfValidSignature } from "./signature";
import { ItnVerificationResult, PayfastConfig, PfData } from "../types";

const createITNPayload = (body: { [key: string]: string }): PfData => {
  return {
    m_payment_id: body.m_payment_id || "",
    pf_payment_id: body.pf_payment_id || "",
    payment_status: body.payment_status || "",
    item_name: body.item_name || "",
    item_description: body.item_description || "",
    amount_gross: body.amount_gross || "",
    amount_fee: body.amount_fee || "",
    amount_net: body.amount_net || "",
    custom_str1: body.custom_str1 || "",
    custom_str2: body.custom_str2 || "",
    custom_str3: body.custom_str3 || "",
    custom_str4: body.custom_str4 || "",
    custom_str5: body.custom_str5 || "",
    custom_int1: body.custom_int1 || "",
    custom_int2: body.custom_int2 || "",
    custom_int3: body.custom_int3 || "",
    custom_int4: body.custom_int4 || "",
    custom_int5: body.custom_int5 || "",
    name_first: body.name_first || "",
    name_last: body.name_last || "",
    email_address: body.email_address || "",
    merchant_id: body.merchant_id || "",
    token: body.token || "",
    billing_date: body.billing_date || "",
    signature: body.signature || "",
  };
};

const validateITNWithPayfast = async (
  pfData: PfData,
  sandbox: boolean
): Promise<boolean> => {
  const postData = qs.stringify({ ...pfData });
  const url = sandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";

  try {
    const response = await axios.post(url, postData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data === "VALID";
  } catch (error) {
    console.error("PayFast ITN validation request failed:", error);
    return false;
  }
};

const isPayfastSourceIp = async (ip: string): Promise<boolean> => {
  try {
    const hostnames = await reverse(ip);
    return hostnames.some((hostname) => hostname.endsWith("payfast.co.za"));
  } catch (error) {
    console.error("PayFast source IP reverse lookup failed:", error);
    return false;
  }
};

const buildItnParamString = (
  body: { [key: string]: unknown }
): { paramString: string; error?: string } => {
  let paramString = "";
  for (const key of Object.keys(body)) {
    if (key === "signature") continue;
    const value = body[key];
    if (typeof value !== "string") {
      return { paramString: "", error: `Invalid ITN field "${key}": expected a string` };
    }
    paramString += `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, "+")}&`;
  }
  return { paramString: paramString.slice(0, -1) };
};

const verifyIncomingItn = async (
  body: { [key: string]: unknown },
  config: PayfastConfig,
  sourceIp: string
): Promise<ItnVerificationResult> => {
  const { paramString, error } = buildItnParamString(body);
  if (error) return { valid: false, reason: error };

  const itnPayload = createITNPayload(body as { [key: string]: string });

  if (!pfValidSignature(itnPayload, paramString, config.passphrase)) {
    return { valid: false, reason: "Invalid signature" };
  }

  if (itnPayload.merchant_id !== config.merchant_id) {
    return { valid: false, reason: "Merchant ID mismatch" };
  }

  if (!config.sandbox) {
    const isValidSource = await isPayfastSourceIp(sourceIp);
    if (!isValidSource) {
      return { valid: false, reason: "Invalid source IP" };
    }
  }

  const isValid = await validateITNWithPayfast(itnPayload, config.sandbox);
  if (!isValid) {
    return { valid: false, reason: "Validation with PayFast failed" };
  }

  return { valid: true, payload: itnPayload };
};

export {
  createITNPayload,
  validateITNWithPayfast,
  isPayfastSourceIp,
  verifyIncomingItn,
};
