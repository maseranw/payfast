import { getAuthToken, getBaseUrl } from "./payfast-config";
import { PayFastFormUtils } from "./payfast-form-utils";
import {
  PayFastActionResponse,
  PayFastResponse,
  PayFastServiceInterface,
  PaymentData,
} from "../types";

export class PayFastService implements PayFastServiceInterface {
  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      let error: any;
      try {
        error = await response.json();
      } catch {
        throw new Error(
          `PayFast API error: ${response.status} ${response.statusText}`
        );
      }
      throw new Error(error.error || `Failed to ${response.url}`);
    }
    return response.json();
  }

  private async buildAuthHeaders(): Promise<Record<string, string>> {
    const token = await getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async initiatePayment(data: PaymentData): Promise<PayFastResponse> {
    const response = await fetch(`${getBaseUrl()}/api/payfast/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await this.buildAuthHeaders()),
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async cancelSubscriptionById(
    token: string,
    subscriptionId: string
  ): Promise<PayFastActionResponse> {
    const response = await fetch(
      `${getBaseUrl()}/api/payfast/cancel/${encodeURIComponent(
        token
      )}/${encodeURIComponent(subscriptionId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await this.buildAuthHeaders()),
        },
      }
    );
    return await this.handleResponse(response);
  }

  async cancelSubscription(token: string): Promise<PayFastActionResponse> {
    const response = await fetch(
      `${getBaseUrl()}/api/payfast/cancel/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await this.buildAuthHeaders()),
        },
      }
    );
    return await this.handleResponse(response);
  }

  async pauseSubscription(token: string): Promise<PayFastActionResponse> {
    const response = await fetch(
      `${getBaseUrl()}/api/payfast/pause/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await this.buildAuthHeaders()),
        },
      }
    );
    return await this.handleResponse(response);
  }

  async unpauseSubscription(token: string): Promise<PayFastActionResponse> {
    const response = await fetch(
      `${getBaseUrl()}/api/payfast/unpause/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await this.buildAuthHeaders()),
        },
      }
    );
    return await this.handleResponse(response);
  }

  async fetchSubscription(token: string): Promise<PayFastActionResponse> {
    const response = await fetch(
      `${getBaseUrl()}/api/payfast/fetch/${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: await this.buildAuthHeaders(),
      }
    );
    return await this.handleResponse(response);
  }

  submitPayment(paymentData: Record<string, string>, actionUrl: string): void {
    PayFastFormUtils.submitPayment(paymentData, actionUrl);
  }
}
