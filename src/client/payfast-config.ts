let BASE_URL = "http://localhost:5000";
let isInitialized = false;

export function initPayFastClient(baseUrl: string): void {
  BASE_URL = baseUrl;
  isInitialized = true;
}

export function getBaseUrl(): string {
  if (!isInitialized) {
    throw new Error(
      "PayFast client not initialized — call initPayFastClient(baseUrl) first"
    );
  }
  return BASE_URL;
}
