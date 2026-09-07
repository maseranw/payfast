import express, { Router, Request, Response } from "express";
import payfastConfig from "../core/config";
import { buildInitiatePaymentData } from "../core/payment-initiation";
import { verifyIncomingItn } from "../core/itn";
import { handleSubscriptionRoute } from "./subscription-routes";
import {
  InitiateRequestBody,
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
      const result = buildInitiatePaymentData(req.body, payfastConfig);
      if ("error" in result) {
        return res.status(400).json({ error: result.error });
      }
      res.json(result);
    }
  );

  router.post(
    "/notify",
    express.urlencoded({ extended: false }),
    async (req: Request, res: Response) => {
      const sourceIp = req.ip || req.socket.remoteAddress || "";
      const result = await verifyIncomingItn(req.body, payfastConfig, sourceIp);

      if (!result.valid) {
        console.error("ITN verification failed:", result.reason);
        return res.status(400).send(result.reason);
      }

      try {
        await onPaymentUpdate(result.payload);
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
