import { Request, Response } from "express";
import payfastConfig from "../core/config";
import {
  buildSignedHeaders,
  fetchCsrfAndSession,
  attemptPayfastRequest,
} from "../core/payfast-api-client";
import { ActionType, MethodType, SubscriptionRouteOptions } from "../types";

const handleSubscriptionRoute =
  (
    action: ActionType,
    method: MethodType,
    callback: (data: any) => Promise<void>,
    options: SubscriptionRouteOptions = {}
  ) =>
  async (
    req: Request<{ token: string; subscriptionId?: string }>,
    res: Response
  ) => {
    const { token, subscriptionId } = req.params;
    const { requireSubscriptionId = false } = options;

    if (!token || (requireSubscriptionId && !subscriptionId)) {
      return res.status(400).json({
        error:
          "Token" +
          (requireSubscriptionId ? " and Subscription ID" : "") +
          " are required",
      });
    }

    try {
      const baseUrl = "https://api.payfast.co.za";
      const testingMode = process.env.TESTING_MODE || "false";
      const url = `${baseUrl}/subscriptions/${token}/${action}?testing=${testingMode}`;

      const headers = await buildSignedHeaders(payfastConfig.passphrase);

      const { csrfToken, sessionCookie } = await fetchCsrfAndSession(baseUrl);
      if (csrfToken) headers["X-CSRF-TOKEN"] = csrfToken;
      if (sessionCookie) headers["Cookie"] = sessionCookie;

      const result = await attemptPayfastRequest({
        method,
        url,
        headers,
        token,
        subscriptionId,
        callback,
      });

      return res.status(result.status).json(result.payload);
    } catch (error: any) {
      return res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  };

export { handleSubscriptionRoute };
