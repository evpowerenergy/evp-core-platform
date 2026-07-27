/// <reference path="../marketing-facebook-ads-auto-sync/deno.d.ts" />
// @ts-ignore Deno URL imports are supported.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  chunks,
  corsHeaders,
  jsonResponse,
  serviceClient,
  verifyServiceRequest,
} from "../_shared/huaweiSolar.ts";

function bucket(minutes: number, now = new Date()): string {
  const size = minutes * 60_000;
  return new Date(Math.floor(now.getTime() / size) * size).toISOString();
}

async function enqueue(
  supabase: SupabaseClient,
  integrationId: string,
  jobType: string,
  scope: Record<string, unknown>,
  entityId: string | null,
  priority: number,
) {
  const { error } = await supabase.from("huawei_sync_jobs").insert({
    integration_id: integrationId,
    job_type: jobType,
    entity_id: entityId,
    scope,
    priority,
  });
  if (error && error.code !== "23505") throw error;
  return !error;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  if (!verifyServiceRequest(req)) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

  const supabase = serviceClient();
  const { data: integrations, error } = await supabase
    .from("huawei_integrations")
    .select("id,sync_mode,pilot_plant_limit")
    .eq("enabled", true);
  if (error) return jsonResponse({ success: false, error: error.message }, 500);

  let created = 0;
  for (const integration of integrations ?? []) {
    created += Number(await enqueue(supabase, integration.id, "discover_plants", {
      bucket: bucket(360),
    }, null, 10));
    created += Number(await enqueue(supabase, integration.id, "discover_devices", {
      bucket: bucket(720),
    }, null, 20));

    const { data: plants } = await supabase
      .from("huawei_plants")
      .select("id,plant_code")
      .eq("integration_id", integration.id)
      .eq("enabled_for_sync", true)
      .order("plant_code");

    for (const group of chunks(plants ?? [], 100)) {
      const scope = {
        bucket: bucket(5),
        plantIds: group.map((plant) => plant.id),
        stationCodes: group.map((plant) => plant.plant_code),
      };
      created += Number(await enqueue(supabase, integration.id, "plant_realtime", scope, null, 30));
    }

    // SmartPVMS limits active-alarm calls by a 30-minute window.
    for (const group of chunks(plants ?? [], 100)) {
      created += Number(await enqueue(supabase, integration.id, "active_alarms", {
        bucket: bucket(30),
        plantIds: group.map((plant) => plant.id),
        stationCodes: group.map((plant) => plant.plant_code),
      }, null, 40));
    }

    const { data: devices } = await supabase
      .from("huawei_devices")
      .select("id,huawei_device_id,dev_type_id")
      .eq("integration_id", integration.id)
      .eq("enabled_for_sync", true)
      .order("dev_type_id");
    type DeviceRow = { id: string; huawei_device_id: string; dev_type_id: number };
    const byType = new Map<number, DeviceRow[]>();
    for (const device of devices ?? []) {
      const group = byType.get(device.dev_type_id) ?? [];
      group.push(device);
      byType.set(device.dev_type_id, group);
    }
    const realtimeSupportedTypes = new Set([1, 10, 17, 38, 39, 41, 47, 23070]);
    for (const [devTypeId, typedDevices] of byType) {
      if (realtimeSupportedTypes.has(devTypeId)) {
        for (const group of chunks(typedDevices ?? [], 100)) {
          created += Number(await enqueue(supabase, integration.id, "device_realtime", {
            bucket: bucket(5),
            devTypeId,
            deviceIds: group.map((device) => device.id),
            huaweiDeviceIds: group.map((device) => device.huawei_device_id),
          }, null, 35));
        }
      }
      if ([1, 38, 39, 41].includes(devTypeId)) {
        for (const group of chunks(typedDevices ?? [], 100)) {
          const common = {
            devTypeId,
            deviceIds: group.map((device) => device.id),
            huaweiDeviceIds: group.map((device) => device.huawei_device_id),
          };
          created += Number(await enqueue(supabase, integration.id, "device_report", {
            ...common, periodType: "day", bucket: bucket(1440),
          }, null, 100));
          created += Number(await enqueue(supabase, integration.id, "device_report", {
            ...common, periodType: "month", bucket: bucket(1440),
          }, null, 110));
          created += Number(await enqueue(supabase, integration.id, "device_report", {
            ...common, periodType: "year", bucket: bucket(1440),
          }, null, 120));
        }
      }
    }

    for (const group of chunks(plants ?? [], 100)) {
      const common = {
        plantIds: group.map((plant) => plant.id),
        stationCodes: group.map((plant) => plant.plant_code),
      };
      created += Number(await enqueue(supabase, integration.id, "plant_report", {
        ...common, periodType: "hour", bucket: bucket(60),
      }, null, 65));
      created += Number(await enqueue(supabase, integration.id, "plant_report", {
        ...common, periodType: "day", bucket: bucket(60),
      }, null, 70));
      created += Number(await enqueue(supabase, integration.id, "plant_report", {
        ...common, periodType: "month", bucket: bucket(360),
      }, null, 80));
      created += Number(await enqueue(supabase, integration.id, "plant_report", {
        ...common, periodType: "year", bucket: bucket(1440),
      }, null, 90));
    }

    created += Number(await enqueue(supabase, integration.id, "data_quality", {
      bucket: bucket(15),
    }, null, 95));
  }

  return jsonResponse({ success: true, integrations: integrations?.length ?? 0, jobsCreated: created });
});
