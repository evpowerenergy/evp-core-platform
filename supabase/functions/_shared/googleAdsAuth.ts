/**
 * Google Ads OAuth helpers for Edge Functions.
 * Prefers Service Account (no refresh token maintenance); falls back to refresh token.
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADWORDS_SCOPE = "https://www.googleapis.com/auth/adwords";

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function importPkcs8PrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signServiceAccountJwt(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: credentials.client_email,
      scope: ADWORDS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const key = await importPkcs8PrivateKey(credentials.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function parseServiceAccountJson(raw: string): ServiceAccountCredentials {
  const parsed = JSON.parse(raw) as Partial<ServiceAccountCredentials>;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_ADS_SERVICE_ACCOUNT_JSON must include client_email and private_key");
  }
  return { client_email: parsed.client_email, private_key: parsed.private_key };
}

async function exchangeJwtForAccessToken(assertion: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j.error_description || j.error || text;
    } catch {
      // keep raw text
    }
    throw new Error(`Service account OAuth: ${res.status} - ${msg}`);
  }
  const data = JSON.parse(text) as { access_token?: string };
  if (!data.access_token) throw new Error("Service account OAuth: missing access_token");
  return data.access_token;
}

async function getAccessTokenFromRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j.error_description || j.error || text;
    } catch {
      // keep raw text
    }
    throw new Error(`OAuth refresh token: ${res.status} - ${msg}`);
  }
  const data = JSON.parse(text) as { access_token?: string };
  if (!data.access_token) throw new Error("OAuth refresh token: missing access_token");
  return data.access_token;
}

export type GoogleAdsAuthMode = "service_account" | "refresh_token";

export interface GoogleAdsAuthConfig {
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
  mode: GoogleAdsAuthMode;
  serviceAccountJson?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export function loadGoogleAdsAuthConfig(): GoogleAdsAuthConfig | null {
  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
  const customerId = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");
  if (!developerToken || !customerId) return null;

  const loginCustomerId = Deno.env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID") ?? undefined;
  const serviceAccountJson = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON");
  if (serviceAccountJson) {
    return {
      developerToken,
      customerId,
      loginCustomerId,
      mode: "service_account",
      serviceAccountJson,
    };
  }

  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) return null;

  return {
    developerToken,
    customerId,
    loginCustomerId,
    mode: "refresh_token",
    clientId,
    clientSecret,
    refreshToken,
  };
}

export async function getGoogleAdsAccessToken(config: GoogleAdsAuthConfig): Promise<string> {
  if (config.mode === "service_account") {
    const credentials = parseServiceAccountJson(config.serviceAccountJson!);
    const jwt = await signServiceAccountJwt(credentials);
    return exchangeJwtForAccessToken(jwt);
  }
  return getAccessTokenFromRefreshToken(
    config.clientId!,
    config.clientSecret!,
    config.refreshToken!,
  );
}

export function isOAuthAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("oauth") ||
    lower.includes("service account oauth") ||
    lower.includes("invalid_grant") ||
    lower.includes("token has been expired")
  );
}
