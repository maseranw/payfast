import { config as dotenvConfig } from "dotenv";
import { PayfastConfig } from "../types";

dotenvConfig();


const payfastConfig: PayfastConfig = {
  sandbox:
    process.env.TESTING_MODE === "true" || process.env.NODE_ENV !== "production",
  merchant_id: process.env.PAYFAST_MERCHANT_ID,
  merchant_key: process.env.PAYFAST_MERCHANT_KEY,
  passphrase: process.env.PAYFAST_PASSPHRASE || "",
  return_url: process.env.PAYFAST_RETURN_URL || process.env.RETURN_URL || "",
  cancel_url: process.env.PAYFAST_CANCEL_URL || process.env.CANCEL_URL || "",
  notify_url: process.env.PAYFAST_NOTIFY_URL || process.env.NOTIFY_URL || "",
};

export default payfastConfig;
