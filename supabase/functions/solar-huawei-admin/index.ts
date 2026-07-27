/// <reference path="./deno.d.ts" />
// @ts-ignore Deno URL imports are supported.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonResponse,
  serviceClient,
} from "../_shared/huaweiSolar.ts";

async function requireSuperAdmin(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("authorization");
  if (!url || !anonKey || !authorization) return null;
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;
  const service = serviceClient();
  const { data } = await service.from("users")
    .select("role").eq("auth_user_id", user.id).maybeSingle();
  return data?.role === "super_admin" ? user : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  const user = await requireSuperAdmin(req);
  if (!user) return jsonResponse({ success: false, error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const supabase = serviceClient();

  if (action === "set_integration_enabled") {
    const { error } = await supabase.from("huawei_integrations")
      .update({ enabled: Boolean(body.enabled), updated_at: new Date().toISOString() })
      .eq("id", body.integrationId);
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    return jsonResponse({ success: true });
  }

  if (action === "set_plant_sync") {
    const values: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.enabled === "boolean") values.enabled_for_sync = body.enabled;
    if (typeof body.visible === "boolean") values.visible_in_dashboard = body.visible;
    const { error } = await supabase.from("huawei_plants").update(values).eq("id", body.plantId);
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    return jsonResponse({ success: true });
  }

  if (action === "enqueue") {
    const allowedTypes = new Set([
      "discover_plants", "discover_devices", "plant_realtime", "device_realtime",
      "active_alarms", "plant_report", "device_report", "device_history", "data_quality",
    ]);
    if (!allowedTypes.has(body.jobType)) {
      return jsonResponse({ success: false, error: "Unsupported job type" }, 400);
    }
    const { data, error } = await supabase.from("huawei_sync_jobs").insert({
      integration_id: body.integrationId,
      job_type: body.jobType,
      entity_id: body.entityId ?? null,
      scope: { ...(body.scope ?? {}), manualRequestId: crypto.randomUUID(), requestedBy: user.id },
      priority: 1,
    }).select("id").single();
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    return jsonResponse({ success: true, jobId: data.id });
  }

  if (action === "retry_job") {
    const { error } = await supabase.from("huawei_sync_jobs").update({
      status: "retrying",
      attempts: 0,
      scheduled_at: new Date().toISOString(),
      finished_at: null,
      last_error_code: null,
      last_error_message: null,
      updated_at: new Date().toISOString(),
    }).eq("id", body.jobId).in("status", ["failed", "dead_letter"]);
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    return jsonResponse({ success: true });
  }

  if (action === "enqueue_backfill") {
    const days = Math.min(Math.max(Number(body.days ?? 90), 1), 90);
    const { data: plant, error: plantError } = await supabase.from("huawei_plants")
      .select("id,plant_code").eq("id", body.plantId).single();
    if (plantError) return jsonResponse({ success: false, error: plantError.message }, 400);
    const { data: devices, error } = await supabase.from("huawei_devices")
      .select("id").eq("plant_id", body.plantId).eq("enabled_for_sync", true);
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    const jobs = [];
    const endOfToday = new Date();
    endOfToday.setUTCHours(0, 0, 0, 0);
    for (const device of devices ?? []) {
      for (let offset = 1; offset <= days; offset += 1) {
        const end = endOfToday.getTime() - (offset - 1) * 86_400_000;
        const start = end - 86_400_000;
        jobs.push({
          integration_id: body.integrationId,
          job_type: "device_history",
          entity_id: device.id,
          scope: { startTime: start, endTime: end },
          priority: 200,
        });
      }
    }
    for (let offset = 1; offset <= days; offset += 1) {
      const collectTime = endOfToday.getTime() - offset * 86_400_000;
      jobs.push({
        integration_id: body.integrationId,
        job_type: "plant_report",
        entity_id: null,
        scope: {
          stationCodes: [plant.plant_code],
          plantIds: [plant.id],
          periodType: "day",
          collectTime,
        },
        priority: 150,
      });
    }
    for (let index = 0; index < jobs.length; index += 500) {
      const { error: insertError } = await supabase.from("huawei_sync_jobs")
        .insert(jobs.slice(index, index + 500));
      if (insertError && insertError.code !== "23505") {
        return jsonResponse({ success: false, error: insertError.message }, 400);
      }
    }
    return jsonResponse({ success: true, jobsQueued: jobs.length });
  }

  return jsonResponse({ success: false, error: "Unknown action" }, 400);
});
