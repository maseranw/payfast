import { createHash } from "crypto";
import { PaymentData, PfData } from "../types";

const generateSignatureForInitiate = (
  data: PaymentData,
  passphrase: string | null = null
): string => {
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

  let paramString = fieldOrder.reduce((acc, key) => {
    if (data[key] !== undefined && data[key] !== "") {
      const value = encodeURIComponent(data[key]!.toString().trim()).replace(
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

const pfValidSignature = (
  pfData: PfData,
  pfParamString: string,
  pfPassphrase: string | null = null
): boolean => {
  if (pfPassphrase !== null) {
    const encodedPass = encodeURIComponent(pfPassphrase.trim()).replace(
      /%20/g,
      "+"
    );
    pfParamString += `&passphrase=${encodedPass}`;
  }

  const signature = createHash("md5").update(pfParamString).digest("hex");
  return pfData["signature"] === signature;
};

const generateApiSignature = (
  pfData: { [key: string]: string },
  passPhrase: string | null = null
): string => {
  const data = { ...pfData };
  delete data.signature;
  delete data.testing;

  if (passPhrase !== null) {
    data.passphrase = passPhrase;
  }

  const sortedKeys = Object.keys(data).sort();
  const encodedPairs = sortedKeys.map((key) => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(data[key]);
    return `${encodedKey}=${encodedValue}`;
  });

  const pfParamString = encodedPairs.join("&");

  return createHash("md5").update(pfParamString).digest("hex");
};

export {
  generateSignatureForInitiate,
  pfValidSignature,
  generateApiSignature,
};
