import express, { Router, Request, Response } from "express";
import payfastConfig from "../core/config";
import { generateSignatureForInitiate, pfValidSignature } from "../core/signature";
import {
  createITNPayload,
  validateITNWithPayfast,
  isPayfastSourceIp,
} from "../core/itn";
import { handleSubscriptionRoute } from "../core/subscription-client";
import {
  InitiateRequestBody,
  PaymentData,
  PfData,
  SubscriptionCallbackPayload,
} from "../types";

const buildPayfastRouter = (
  onPaymentUpdate: (payload: PfData) => Promise<void>,
  onCancel: (data: SubscriptionCallbackPayload) => Promise<void>,
  onPause: (data: SubscriptionCallbackPayload) => Promise<void>,
  onUnpause: (data: SubscriptionCallbackPayload) => Promise<void>,
  onFetch: (data: SubscriptionCallbackPayload) => Promise<void>
): Router => {
  const router: Router = express.Router();

  router.post(
    "/initiate",
    (req: Request<{}, {}, InitiateRequestBody>, res: Response) => {
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
      } = req.body;

      if (!amount || !item_name || !m_payment_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: "Amount must be a valid number" });
      }

      const effectiveBillingDate =
        billing_date || new Date().toISOString().split("T")[0];
      const parsedAmount = parseFloat(amount).toFixed(2);
      const effectiveRecurringAmount = recurring_amount || parsedAmount;

      const paymentData: PaymentData = {
        merchant_id: payfastConfig.merchant_id || "",
        merchant_key: payfastConfig.merchant_key || "",
        return_url: payfastConfig.return_url,
        cancel_url: payfastConfig.cancel_url,
        notify_url: payfastConfig.notify_url,
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

      const signature = generateSignatureForInitiate(
        paymentData,
        payfastConfig.passphrase
      );
      paymentData.signature = signature;

      const payfastUrl = payfastConfig.sandbox
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

      res.json({ paymentData, payfastUrl });
    }
  );

  router.post(
    "/notify",
    express.urlencoded({ extended: false }),
    async (req: Request, res: Response) => {
      const itnPayload = createITNPayload(req.body);
      const pfData = { ...req.body };

      let pfParamString = "";
      try {
        Object.keys(pfData).forEach((key) => {
          if (key === "signature") return;
          const value = pfData[key];
          if (typeof value !== "string") {
            throw new Error(`Invalid ITN field "${key}": expected a string`);
          }
          pfParamString += `${key}=${encodeURIComponent(value.trim()).replace(
            /%20/g,
            "+"
          )}&`;
        });
      } catch (err) {
        console.error("Error building ITN signature string:", err);
        return res.status(400).send("Invalid ITN payload");
      }
      pfParamString = pfParamString.slice(0, -1);

      const isValidSig = pfValidSignature(
        pfData,
        pfParamString,
        payfastConfig.passphrase
      );
      if (!isValidSig) return res.status(400).send("Invalid signature");

      if (itnPayload.merchant_id !== payfastConfig.merchant_id) {
        console.error("ITN merchant_id mismatch:", itnPayload.merchant_id);
        return res.status(400).send("Merchant ID mismatch");
      }

      if (!payfastConfig.sandbox) {
        const sourceIp = req.ip || req.socket.remoteAddress || "";
        const isValidSource = await isPayfastSourceIp(sourceIp);
        if (!isValidSource) {
          console.error("ITN source IP verification failed:", sourceIp);
          return res.status(400).send("Invalid source IP");
        }
      }

      const isValid = await validateITNWithPayfast(itnPayload);
      if (!isValid)
        return res.status(400).send("Validation with PayFast failed");

      try {
        await onPaymentUpdate(itnPayload);
      } catch (err) {
        console.error("Error in user callback:", err);
        return res.status(500).send("Callback failed");
      }

      res.status(200).send("OK");
    }
  );

  router.post(
    "/cancel/:token/:subscriptionId",
    handleSubscriptionRoute("cancel", "PUT", onCancel, {
      requireSubscriptionId: true,
    })
  );

  router.post(
    "/cancel/:token",
    handleSubscriptionRoute("cancel", "PUT", onCancel)
  );

  router.post(
    "/pause/:token",
    handleSubscriptionRoute("pause", "PUT", onPause)
  );

  router.post(
    "/unpause/:token",
    handleSubscriptionRoute("unpause", "PUT", onUnpause)
  );

  router.get("/fetch/:token", handleSubscriptionRoute("fetch", "GET", onFetch));

  return router;
};

export default buildPayfastRouter;
