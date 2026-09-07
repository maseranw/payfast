import axios from "axios";
import payfastConfig from "./config";
import { generateApiSignature } from "./signature";
import { CsrfSession, RequestArgs, RequestResult } from "../types";

const getCurrentIsoTimestamp = (): string => {
  const date = new Date();
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");
  const hours = pad(offsetMinutes / 60);
  const minutes = pad(offsetMinutes % 60);
  const isoString = date.toISOString().slice(0, 19);
  return `${isoString}${sign}${hours}:${minutes}`;
};

const fetchCsrfAndSession = async (baseUrl: string): Promise<CsrfSession> => {
  try {
    const response = await axios.get(baseUrl, {
      timeout: 5000,
      headers: { Accept: "text/html" },
      withCredentials: true,
    });

    const tokenMatch = response.data.match(
      /<meta name="csrf-token" content="(.+?)"/
    );

    return {
      csrfToken: tokenMatch ? tokenMatch[1] : null,
      sessionCookie: response.headers["set-cookie"]?.join("; ") || null,
    };
  } catch (error) {
    console.error("Fetching CSRF token and session failed:", error);
    return { csrfToken: null, sessionCookie: null };
  }
};

const buildSignedHeaders = async (
  passphrase: string | null
): Promise<{ [key: string]: string }> => {
  const headers: { [key: string]: string } = {
    "merchant-id": payfastConfig.merchant_id || "",
    version: process.env.PAYFAST_API_VERSION || "v1",
    timestamp: getCurrentIsoTimestamp(),
  };
  headers["signature"] = generateApiSignature(headers, passphrase);
  return headers;
};

const attemptPayfastRequest = async ({
  method,
  url,
  headers,
  token,
  subscriptionId,
  callback,
}: RequestArgs): Promise<RequestResult> => {
  const maxRetries = 2;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const axiosConfig = {
        method,
        url,
        headers,
        timeout: 10000,
        ...(method === "PUT" ? { data: null } : {}),
      };

      const response = await axios(axiosConfig);

      if (typeof callback === "function") {
        await callback({
          token,
          subscriptionId,
          status: response.status,
          payload: response.data,
        });
      }

      return {
        status: response.status,
        payload: {
          message: response.data.message,
          data: response.data,
        },
      };
    } catch (error: any) {
      if (error.response?.status === 419 && attempt < maxRetries - 1) {
        const baseUrl = url.split("/subscriptions")[0];
        const { csrfToken, sessionCookie } = await fetchCsrfAndSession(baseUrl);
        if (csrfToken) headers["X-CSRF-TOKEN"] = csrfToken;
        if (sessionCookie) headers["Cookie"] = sessionCookie;
        attempt++;
        continue;
      }

      return {
        status: error.response?.status || 500,
        payload: {
          error:
            error.response?.data?.message || error.message || "Request failed",
          details: error.response?.data || {},
        },
      };
    }
  }

  return {
    status: 500,
    payload: { error: "Max retry attempts exceeded" },
  };
};

export {
  buildSignedHeaders,
  fetchCsrfAndSession,
  attemptPayfastRequest,
  getCurrentIsoTimestamp,
};
