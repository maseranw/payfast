let BASE_URL = "http://localhost:5000";
let isInitialized = false;
let authTokenProvider: (() => string | null | Promise<string | null>) | null = null;

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

export function setAuthTokenProvider(
  provider: (() => string | null | Promise<string | null>) | null
): void {
  authTokenProvider = provider;
}

export async function getAuthToken(): Promise<string | null> {
  if (!authTokenProvider) return null;
  return authTokenProvider();
}
