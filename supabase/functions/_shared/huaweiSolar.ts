// @ts-ignore Deno URL imports are supported in Supabase Edge Functions.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
export {
  chunks,
  epochToIso,
  nextRetry,
  normalizeDeviceSample,
  normalizePlantSample,
  parseNumber,
  recordsFrom,
} from "./huaweiSolarNormalize.ts";

export type HuaweiJob = {
  id: string;
  integration_id: string;
  job_type: string;
  entity_id: string | null;
  scope: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

export type HuaweiIntegration = {
  id: string;
  base_url: string;
  enabled: boolean;
  sync_mode: "pilot" | "limited" | "full";
  pilot_plant_limit: number;
  secret_prefix: string;
};

type HuaweiEnvelope<T = unknown> = {
  success?: boolean;
  failCode?: number | string;
  failMessage?: string;
  data?: T;
};

export class HuaweiApiError extends Error {
  constructor(
    message: string,
    public readonly failCode?: string,
    public readonly httpStatus?: number,
    public readonly retryable = false,
  ) {
    super(message);
  }
}

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service configuration is missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function verifyServiceRequest(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronSecret = Deno.env.get("SOLAR_CRON_SECRET");
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const suppliedCronSecret = req.headers.get("x-cron-secret");
  return Boolean((serviceKey && auth === serviceKey) || (cronSecret && suppliedCronSecret === cronSecret));
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-cron-secret",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}


function retryableCode(code?: string): boolean {
  return ["305", "407", "429", "20200", "20618"].includes(code ?? "");
}

export class HuaweiClient {
  private token: string | null = null;
  private readonly owner = crypto.randomUUID();

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly integration: HuaweiIntegration,
  ) {}

  private secret(name: "USERNAME" | "PASSWORD"): string {
    const key = `${this.integration.secret_prefix}_${name}`;
    const value = Deno.env.get(key);
    if (!value) throw new Error(`${key} secret is missing`);
    return value;
  }

  private async savedToken(): Promise<string | null> {
    const { data } = await this.supabase
      .from("huawei_api_sessions")
      .select("xsrf_token,expires_at")
      .eq("integration_id", this.integration.id)
      .maybeSingle();
    if (!data || new Date(data.expires_at).getTime() < Date.now() + 120_000) return null;
    return data.xsrf_token;
  }

  private async login(): Promise<string> {
    const { data: locked, error: lockError } = await this.supabase.rpc("solar_lock_huawei_login", {
      p_integration_id: this.integration.id,
      p_owner: this.owner,
    });
    if (lockError) throw lockError;

    if (!locked) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const reused = await this.savedToken();
      if (reused) return reused;
      throw new HuaweiApiError("Huawei session refresh is busy", "SESSION_BUSY", 409, true);
    }

    try {
      const reused = await this.savedToken();
      if (reused) return reused;

      const response = await fetch(`${this.integration.base_url}/thirdData/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json, */*" },
        body: JSON.stringify({
          userName: this.secret("USERNAME"),
          systemCode: this.secret("PASSWORD"),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as HuaweiEnvelope;
      const token = response.headers.get("xsrf-token");
      const failCode = body.failCode === undefined ? undefined : String(body.failCode);
      if (!response.ok || !body.success || !token) {
        throw new HuaweiApiError(
          body.failMessage || "Huawei login failed",
          failCode,
          response.status,
          retryableCode(failCode),
        );
      }
      const expiresAt = new Date(Date.now() + 28 * 60 * 1000).toISOString();
      const { error } = await this.supabase.from("huawei_api_sessions").upsert({
        integration_id: this.integration.id,
        xsrf_token: token,
        expires_at: expiresAt,
        refreshed_at: new Date().toISOString(),
      });
      if (error) throw error;
      return token;
    } finally {
      await this.supabase.rpc("solar_release_huawei_login", {
        p_integration_id: this.integration.id,
        p_owner: this.owner,
      });
    }
  }

  async request<T = unknown>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
    if (!this.token) this.token = await this.savedToken() ?? await this.login();
    const execute = () => fetch(`${this.integration.base_url}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, */*",
        "XSRF-TOKEN": this.token!,
      },
      body: JSON.stringify(payload),
    });

    let response = await execute();
    let body = (await response.json().catch(() => ({}))) as HuaweiEnvelope<T>;
    if (String(body.failCode) === "305") {
      this.token = null;
      await this.supabase.from("huawei_api_sessions").delete().eq("integration_id", this.integration.id);
      this.token = await this.login();
      response = await execute();
      body = (await response.json().catch(() => ({}))) as HuaweiEnvelope<T>;
    }

    const failCode = body.failCode === undefined ? undefined : String(body.failCode);
    if (!response.ok || body.success === false || (failCode && failCode !== "0")) {
      throw new HuaweiApiError(
        body.failMessage || `Huawei request failed: ${endpoint}`,
        failCode,
        response.status,
        retryableCode(failCode),
      );
    }
    return body.data as T;
  }
}
