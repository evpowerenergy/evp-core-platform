/// <reference path="./deno.d.ts" />
// @ts-ignore Deno URL imports are supported.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  epochToIso,
  HuaweiApiError,
  HuaweiClient,
  type HuaweiIntegration,
  type HuaweiJob,
  jsonResponse,
  nextRetry,
  normalizeDeviceSample,
  normalizePlantSample,
  parseNumber,
  recordsFrom,
  serviceClient,
  verifyServiceRequest,
} from "../_shared/huaweiSolar.ts";

type JobResult = { endpoint?: string; received: number; written: number };

const reportEndpoints: Record<string, string> = {
  hour: "/thirdData/getKpiStationHour",
  day: "/thirdData/getKpiStationDay",
  month: "/thirdData/getKpiStationMonth",
  year: "/thirdData/getKpiStationYear",
};
const deviceReportEndpoints: Record<string, string> = {
  day: "/thirdData/getDevKpiDay",
  month: "/thirdData/getDevKpiMonth",
  year: "/thirdData/getDevKpiYear",
};

async function discoverPlants(
  supabase: SupabaseClient,
  client: HuaweiClient,
  integration: HuaweiIntegration,
): Promise<JobResult> {
  let pageNo = 1;
  let received = 0;
  let written = 0;
  while (pageNo <= 1000) {
    const data = await client.request("/thirdData/stations", { pageNo });
    const rows = recordsFrom(data);
    if (rows.length === 0) break;
    received += rows.length;
    const payload = rows.map((row) => ({
      integration_id: integration.id,
      plant_code: String(row.plantCode ?? row.stationCode ?? ""),
      plant_name: String(row.plantName ?? row.stationName ?? row.plantCode ?? ""),
      plant_address: row.plantAddress ?? row.address ?? null,
      province: row.province ?? null,
      latitude: parseNumber(row.latitude),
      longitude: parseNumber(row.longitude),
      capacity_kwp: parseNumber(row.capacity ?? row.installedCapacity),
      grid_connection_date: row.gridConnectionDate ? epochToIso(row.gridConnectionDate) : null,
      source_updated_at: row.updateTime ? epochToIso(row.updateTime) : null,
      last_synced_at: new Date().toISOString(),
      enabled_for_sync: integration.sync_mode === "full",
      visible_in_dashboard: integration.sync_mode === "full",
      raw_payload: row,
      updated_at: new Date().toISOString(),
    })).filter((row) => row.plant_code);
    const { error } = await supabase.from("huawei_plants").upsert(payload, {
      onConflict: "integration_id,plant_code",
    });
    if (error) throw error;
    written += payload.length;
    if (rows.length < 100) break;
    pageNo += 1;
  }

  if (integration.sync_mode === "pilot") {
    const { data: pilotPlants } = await supabase
      .from("huawei_plants")
      .select("id")
      .eq("integration_id", integration.id)
      .order("plant_name")
      .limit(integration.pilot_plant_limit);
    const ids = (pilotPlants ?? []).map((plant) => plant.id);
    if (ids.length > 0) {
      const { error } = await supabase
        .from("huawei_plants")
        .update({ enabled_for_sync: true, visible_in_dashboard: true })
        .in("id", ids);
      if (error) throw error;
    }
  }
  return { endpoint: "/thirdData/stations", received, written };
}

async function discoverDevices(
  supabase: SupabaseClient,
  client: HuaweiClient,
  integration: HuaweiIntegration,
): Promise<JobResult> {
  const { data: plants, error } = await supabase
    .from("huawei_plants")
    .select("id,plant_code")
    .eq("integration_id", integration.id)
    .eq("enabled_for_sync", true);
  if (error) throw error;
  const plantByCode = new Map((plants ?? []).map((plant) => [plant.plant_code, plant.id]));
  let received = 0;
  let written = 0;
  for (let index = 0; index < (plants?.length ?? 0); index += 100) {
    const group = plants!.slice(index, index + 100);
    const data = await client.request("/thirdData/getDevList", {
      stationCodes: group.map((plant) => plant.plant_code).join(","),
    });
    const rows = recordsFrom(data);
    received += rows.length;
    const payload = rows.map((row) => {
      const plantCode = String(row.stationCode ?? row.plantCode ?? "");
      return {
        integration_id: integration.id,
        plant_id: plantByCode.get(plantCode),
        huawei_device_id: String(row.id ?? row.devId ?? ""),
        dev_dn: String(row.devDn ?? row.dn ?? ""),
        dev_type_id: Number(row.devTypeId),
        esn: row.esnCode ?? row.esn ?? row.sn ?? null,
        device_name: row.devName ?? row.deviceName ?? null,
        model: row.invType ?? row.model ?? null,
        software_version: row.softwareVersion ?? null,
        device_status: parseNumber(row.devStatus ?? row.status),
        last_synced_at: new Date().toISOString(),
        raw_payload: row,
        updated_at: new Date().toISOString(),
      };
    }).filter((row) => row.plant_id && row.huawei_device_id && Number.isFinite(row.dev_type_id));
    if (payload.length) {
      const { error: upsertError } = await supabase.from("huawei_devices").upsert(payload, {
        onConflict: "integration_id,huawei_device_id",
      });
      if (upsertError) throw upsertError;
      written += payload.length;
    }
  }
  return { endpoint: "/thirdData/getDevList", received, written };
}

async function plantRealtime(
  supabase: SupabaseClient,
  client: HuaweiClient,
  job: HuaweiJob,
): Promise<JobResult> {
  const stationCodes = (job.scope.stationCodes as string[]) ?? [];
  const data = await client.request("/thirdData/getStationRealKpi", {
    stationCodes: stationCodes.join(","),
  });
  const rows = recordsFrom(data);
  const { data: plants } = await supabase
    .from("huawei_plants")
    .select("id,plant_code")
    .in("plant_code", stationCodes)
    .eq("integration_id", job.integration_id);
  const byCode = new Map((plants ?? []).map((plant) => [plant.plant_code, plant.id]));
  const now = new Date();
  const payload = rows.map((row) => {
    const code = String(row.stationCode ?? row.plantCode ?? "");
    const plantId = byCode.get(code);
    return plantId ? normalizePlantSample(plantId, row, now) : null;
  }).filter(Boolean);
  if (payload.length) {
    const { error } = await supabase.from("huawei_plant_samples").upsert(payload, {
      onConflict: "plant_id,sampled_at",
    });
    if (error) throw error;
  }
  if (plants?.length) {
    await supabase.from("huawei_plants")
      .update({ last_synced_at: now.toISOString() })
      .in("id", plants.map((plant) => plant.id));
  }
  return { endpoint: "/thirdData/getStationRealKpi", received: rows.length, written: payload.length };
}

async function deviceRealtime(
  supabase: SupabaseClient,
  client: HuaweiClient,
  job: HuaweiJob,
): Promise<JobResult> {
  const internalIds = (job.scope.deviceIds as string[]) ?? [];
  const huaweiIds = (job.scope.huaweiDeviceIds as string[]) ?? [];
  const devTypeId = Number(job.scope.devTypeId);
  const data = await client.request("/thirdData/getDevRealKpi", {
    devIds: huaweiIds.join(","),
    devTypeId,
  });
  const rows = recordsFrom(data);
  const { data: devices } = await supabase
    .from("huawei_devices")
    .select("id,huawei_device_id,plant_id")
    .in("id", internalIds);
  const byHuaweiId = new Map((devices ?? []).map((device) => [String(device.huawei_device_id), device.id]));
  const now = new Date();
  const payload = rows.map((row) => {
    const id = String(row.devId ?? row.id ?? row.devIdStr ?? "");
    const deviceId = byHuaweiId.get(id);
    return deviceId ? normalizeDeviceSample(deviceId, devTypeId, row, now) : null;
  }).filter(Boolean);
  if (payload.length) {
    const { error } = await supabase.from("huawei_device_samples").upsert(payload, {
      onConflict: "device_id,sampled_at",
    });
    if (error) throw error;
  }
  const touchedPlantIds = [...new Set((devices ?? []).map((device) => device.plant_id).filter(Boolean))];
  if (touchedPlantIds.length) await refreshPlantCurrentPower(supabase, touchedPlantIds);
  return { endpoint: "/thirdData/getDevRealKpi", received: rows.length, written: payload.length };
}

async function refreshPlantCurrentPower(
  supabase: SupabaseClient,
  plantIds: string[],
): Promise<void> {
  const { data: inverters, error: deviceError } = await supabase
    .from("huawei_devices")
    .select("id,plant_id")
    .in("plant_id", plantIds)
    .in("dev_type_id", [1, 38])
    .eq("enabled_for_sync", true);
  if (deviceError) throw deviceError;
  const inverterIds = (inverters ?? []).map((device) => device.id);
  if (!inverterIds.length) return;

  const recentCutoff = new Date(Date.now() - 20 * 60_000).toISOString();
  const { data: samples, error: sampleError } = await supabase
    .from("huawei_device_samples")
    .select("device_id,active_power_kw,sampled_at")
    .in("device_id", inverterIds)
    .gte("sampled_at", recentCutoff)
    .order("sampled_at", { ascending: false });
  if (sampleError) throw sampleError;

  const latestByDevice = new Map<string, number>();
  for (const sample of samples ?? []) {
    if (!latestByDevice.has(sample.device_id) && sample.active_power_kw !== null) {
      latestByDevice.set(sample.device_id, Number(sample.active_power_kw));
    }
  }
  const plantByDevice = new Map((inverters ?? []).map((device) => [device.id, device.plant_id]));
  const powerByPlant = new Map<string, number>();
  for (const [deviceId, power] of latestByDevice) {
    const plantId = plantByDevice.get(deviceId);
    if (plantId) powerByPlant.set(plantId, (powerByPlant.get(plantId) ?? 0) + power);
  }

  const { data: plantSamples, error: plantSampleError } = await supabase
    .from("huawei_plant_samples")
    .select("id,plant_id,sampled_at")
    .in("plant_id", plantIds)
    .order("sampled_at", { ascending: false });
  if (plantSampleError) throw plantSampleError;
  const latestPlantSample = new Map<string, number>();
  for (const sample of plantSamples ?? []) {
    if (!latestPlantSample.has(sample.plant_id)) latestPlantSample.set(sample.plant_id, sample.id);
  }
  await Promise.all([...powerByPlant.entries()].map(([plantId, power]) => {
    const sampleId = latestPlantSample.get(plantId);
    if (!sampleId) return Promise.resolve();
    return supabase.from("huawei_plant_samples")
      .update({ current_power_kw: power })
      .eq("id", sampleId)
      .then(({ error }) => {
        if (error) throw error;
      });
  }));
}

async function activeAlarms(
  supabase: SupabaseClient,
  client: HuaweiClient,
  job: HuaweiJob,
): Promise<JobResult> {
  const stationCodes = (job.scope.stationCodes as string[]) ?? [];
  const data = await client.request("/thirdData/getAlarmList", {
    stationCodes: stationCodes.join(","),
    beginTime: Date.now() - 90 * 24 * 60 * 60 * 1000,
    endTime: Date.now(),
    language: "en_US",
    levels: "1,2,3,4",
  });
  const rows = recordsFrom(data);
  const { data: plants } = await supabase.from("huawei_plants")
    .select("id,plant_code").eq("integration_id", job.integration_id).in("plant_code", stationCodes);
  const plantByCode = new Map((plants ?? []).map((plant) => [plant.plant_code, plant.id]));
  const { data: devices } = await supabase.from("huawei_devices")
    .select("id,esn").eq("integration_id", job.integration_id);
  const deviceByEsn = new Map((devices ?? []).map((device) => [device.esn, device.id]));
  const now = new Date().toISOString();
  const payload = rows.map((row) => ({
    integration_id: job.integration_id,
    plant_id: plantByCode.get(String(row.stationCode ?? "")) ?? null,
    device_id: deviceByEsn.get(String(row.esnCode ?? "")) ?? null,
    station_code: row.stationCode ?? null,
    esn: row.esnCode ?? null,
    alarm_id: String(row.alarmId ?? ""),
    cause_id: String(row.causeId ?? ""),
    raised_at: epochToIso(row.raiseTime),
    alarm_name: row.alarmName ?? null,
    alarm_cause: row.alarmCause ?? null,
    repair_suggestion: row.repairSuggestion ?? null,
    severity: parseNumber(row.lev),
    alarm_type: row.alarmType ?? null,
    status: "active",
    last_seen_at: now,
    closed_at: null,
    raw_payload: row,
  })).filter((row) => row.alarm_id);
  let seenIds: string[] = [];
  if (payload.length) {
    const { data: upserted, error } = await supabase.from("huawei_alarm_events").upsert(payload, {
      onConflict: "integration_id,station_code,esn,alarm_id,cause_id,raised_at",
      ignoreDuplicates: false,
    }).select("id");
    if (error) throw error;
    seenIds = (upserted ?? []).map((alarm) => alarm.id);
  }
  const { data: existing } = await supabase.from("huawei_alarm_events")
    .select("id")
    .eq("integration_id", job.integration_id)
    .eq("status", "active")
    .in("station_code", stationCodes);
  const seenIdSet = new Set(seenIds);
  const toClose = (existing ?? []).filter((alarm) => !seenIdSet.has(alarm.id)).map((alarm) => alarm.id);
  if (toClose.length) {
    const { error } = await supabase.from("huawei_alarm_events")
      .update({ status: "closed", closed_at: now })
      .in("id", toClose);
    if (error) throw error;
  }
  return { endpoint: "/thirdData/getAlarmList", received: rows.length, written: payload.length };
}

async function plantReport(
  supabase: SupabaseClient,
  client: HuaweiClient,
  job: HuaweiJob,
): Promise<JobResult> {
  const stationCodes = (job.scope.stationCodes as string[]) ?? [];
  const periodType = String(job.scope.periodType ?? "day");
  const endpoint = reportEndpoints[periodType];
  if (!endpoint) throw new Error(`Unsupported report period: ${periodType}`);
  const collectTime = Number(job.scope.collectTime ?? Date.now());
  const data = await client.request(endpoint, { stationCodes: stationCodes.join(","), collectTime });
  const rows = recordsFrom(data);
  const { data: plants } = await supabase.from("huawei_plants")
    .select("id,plant_code").eq("integration_id", job.integration_id).in("plant_code", stationCodes);
  const byCode = new Map((plants ?? []).map((plant) => [plant.plant_code, plant.id]));
  const payload = rows.map((row) => {
    const map = (row.dataItemMap ?? row) as Record<string, unknown>;
    const plantId = byCode.get(String(row.stationCode ?? row.plantCode ?? ""));
    const start = epochToIso(row.collectTime ?? collectTime);
    return plantId ? {
      plant_id: plantId,
      period_type: periodType,
      period_start: start,
      plant_local_date: start.slice(0, 10),
      yield_kwh: parseNumber(map.inverter_power),
      pv_yield_kwh: parseNumber(map.PVYield),
      inverter_yield_kwh: parseNumber(map.inverterYield),
      consumption_kwh: parseNumber(map.use_power),
      feed_in_kwh: parseNumber(map.ongrid_power),
      grid_purchase_kwh: parseNumber(map.buyPower),
      self_consumption_kwh: parseNumber(map.selfUsePower),
      charge_kwh: parseNumber(map.chargeCap),
      discharge_kwh: parseNumber(map.dischargeCap),
      performance_ratio: parseNumber(map.performance_ratio),
      revenue: parseNumber(map.power_profit),
      raw_payload: row,
    } : null;
  }).filter(Boolean);
  if (payload.length) {
    const { error } = await supabase.from("huawei_plant_reports").upsert(payload, {
      onConflict: "plant_id,period_type,period_start",
    });
    if (error) throw error;
  }
  return { endpoint, received: rows.length, written: payload.length };
}

async function deviceHistory(
  supabase: SupabaseClient,
  client: HuaweiClient,
  job: HuaweiJob,
): Promise<JobResult> {
  const { data: device, error } = await supabase.from("huawei_devices")
    .select("id,dev_dn,dev_type_id").eq("id", job.entity_id).single();
  if (error) throw error;
  const startTime = Number(job.scope.startTime);
  const endTime = Number(job.scope.endTime);
  if (!startTime || !endTime || endTime - startTime > 86_400_000) {
    throw new Error("Historical job must contain a window of at most 24 hours");
  }
  const data = await client.request("/rest/openapi/pvms/nbi/v1/device/history", {
    devDn: device.dev_dn,
    devTypeId: device.dev_type_id,
    startTime,
    endTime,
  });
  const rows = recordsFrom(data);
  const payload = rows.map((row) => normalizeDeviceSample(
    device.id,
    device.dev_type_id,
    row,
    new Date(startTime),
  ));
  if (payload.length) {
    const { error: upsertError } = await supabase.from("huawei_device_samples").upsert(payload, {
      onConflict: "device_id,sampled_at",
    });
    if (upsertError) throw upsertError;
  }
  return { endpoint: "/rest/openapi/pvms/nbi/v1/device/history", received: rows.length, written: payload.length };
}

async function deviceReport(
  supabase: SupabaseClient,
  client: HuaweiClient,
  job: HuaweiJob,
): Promise<JobResult> {
  const internalIds = (job.scope.deviceIds as string[]) ?? [];
  const huaweiIds = (job.scope.huaweiDeviceIds as string[]) ?? [];
  const periodType = String(job.scope.periodType ?? "day");
  const devTypeId = Number(job.scope.devTypeId);
  const endpoint = deviceReportEndpoints[periodType];
  if (!endpoint) throw new Error(`Unsupported device report period: ${periodType}`);
  const collectTime = Date.now();
  const data = await client.request(endpoint, {
    devIds: huaweiIds.join(","),
    devTypeId,
    collectTime,
  });
  const rows = recordsFrom(data);
  const { data: devices } = await supabase.from("huawei_devices")
    .select("id,huawei_device_id").in("id", internalIds);
  const byHuaweiId = new Map((devices ?? []).map((device) => [String(device.huawei_device_id), device.id]));
  const payload = rows.map((row) => {
    const map = (row.dataItemMap ?? row) as Record<string, unknown>;
    const deviceId = byHuaweiId.get(String(row.devId ?? row.id ?? ""));
    const start = epochToIso(row.collectTime ?? collectTime);
    return deviceId ? {
      device_id: deviceId,
      period_type: periodType,
      period_start: start,
      plant_local_date: start.slice(0, 10),
      yield_kwh: parseNumber(map.product_power ?? map.day_cap ?? map.inverterYield),
      charge_kwh: parseNumber(map.charge_cap ?? map.chargeCap),
      discharge_kwh: parseNumber(map.discharge_cap ?? map.dischargeCap),
      peak_power_kw: parseNumber(map.max_power ?? map.peak_power),
      raw_payload: row,
    } : null;
  }).filter(Boolean);
  if (payload.length) {
    const { error } = await supabase.from("huawei_device_reports").upsert(payload, {
      onConflict: "device_id,period_type,period_start",
    });
    if (error) throw error;
  }
  return { endpoint, received: rows.length, written: payload.length };
}

async function processJob(
  supabase: SupabaseClient,
  integration: HuaweiIntegration,
  job: HuaweiJob,
): Promise<JobResult> {
  const client = new HuaweiClient(supabase, integration);
  switch (job.job_type) {
    case "discover_plants": return discoverPlants(supabase, client, integration);
    case "discover_devices": return discoverDevices(supabase, client, integration);
    case "plant_realtime": return plantRealtime(supabase, client, job);
    case "device_realtime": return deviceRealtime(supabase, client, job);
    case "active_alarms": return activeAlarms(supabase, client, job);
    case "plant_report": return plantReport(supabase, client, job);
    case "device_report": return deviceReport(supabase, client, job);
    case "device_history": return deviceHistory(supabase, client, job);
    case "data_quality": {
      const { data, error } = await supabase.rpc("solar_refresh_data_quality", {
        p_integration_id: job.integration_id,
      });
      if (error) throw error;
      return { received: Number(data ?? 0), written: Number(data ?? 0) };
    }
    default: throw new Error(`Unsupported Huawei job type: ${job.job_type}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  if (!verifyServiceRequest(req)) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const maxJobs = Math.min(Math.max(Number(body.maxJobs ?? 10), 1), 20);
  const supabase = serviceClient();
  const workerId = `edge-${crypto.randomUUID()}`;
  const results: Array<Record<string, unknown>> = [];

  for (let count = 0; count < maxJobs; count += 1) {
    const { data: claimed, error: claimError } = await supabase.rpc("solar_claim_sync_job", {
      p_worker: workerId,
    });
    if (claimError) return jsonResponse({ success: false, error: claimError.message, results }, 500);
    const job = claimed?.[0] as HuaweiJob | undefined;
    if (!job) break;
    const startedAt = Date.now();

    const { data: integration, error: integrationError } = await supabase
      .from("huawei_integrations")
      .select("id,base_url,enabled,sync_mode,pilot_plant_limit,secret_prefix")
      .eq("id", job.integration_id)
      .single();
    if (integrationError || !integration) {
      await supabase.from("huawei_sync_jobs").update({
        status: "dead_letter", finished_at: new Date().toISOString(),
        last_error_message: integrationError?.message ?? "Integration not found",
      }).eq("id", job.id);
      continue;
    }

    try {
      const result = await processJob(supabase, integration as HuaweiIntegration, job);
      const finishedAt = new Date().toISOString();
      await supabase.from("huawei_sync_jobs").update({
        status: "success", finished_at: finishedAt, updated_at: finishedAt,
        last_error_code: null, last_error_message: null,
      }).eq("id", job.id);
      await supabase.from("huawei_sync_runs").insert({
        integration_id: job.integration_id, job_id: job.id, job_type: job.job_type,
        status: "success", endpoint: result.endpoint, records_received: result.received,
        records_written: result.written, duration_ms: Date.now() - startedAt,
        started_at: new Date(startedAt).toISOString(), finished_at: finishedAt,
      });
      await supabase.from("huawei_integrations").update({
        last_success_at: finishedAt, last_error_code: null, last_error_message: null,
      }).eq("id", job.integration_id);
      results.push({ jobId: job.id, jobType: job.job_type, success: true, ...result });
      // History quota is much lower than realtime APIs. Process at most one
      // device/day history request per cron invocation unless quota is measured
      // and a stricter tenant-specific limiter is configured.
      if (job.job_type === "device_history") break;
    } catch (error) {
      const apiError = error instanceof HuaweiApiError ? error : null;
      const message = error instanceof Error ? error.message : "Unknown sync error";
      const canRetry = (apiError?.retryable ?? true) && job.attempts < job.max_attempts;
      const status = canRetry ? "retrying" : "dead_letter";
      const finishedAt = new Date().toISOString();
      await supabase.from("huawei_sync_jobs").update({
        status,
        scheduled_at: canRetry ? nextRetry(job.attempts) : finishedAt,
        finished_at: finishedAt,
        last_error_code: apiError?.failCode ?? null,
        last_error_message: message.slice(0, 1000),
        updated_at: finishedAt,
      }).eq("id", job.id);
      await supabase.from("huawei_sync_runs").insert({
        integration_id: job.integration_id, job_id: job.id, job_type: job.job_type,
        status, endpoint: null, http_status: apiError?.httpStatus,
        fail_code: apiError?.failCode, duration_ms: Date.now() - startedAt,
        error_message: message.slice(0, 1000), started_at: new Date(startedAt).toISOString(),
        finished_at: finishedAt,
      });
      await supabase.from("huawei_integrations").update({
        last_error_at: finishedAt, last_error_code: apiError?.failCode ?? null,
        last_error_message: message.slice(0, 1000),
      }).eq("id", job.integration_id);
      results.push({ jobId: job.id, jobType: job.job_type, success: false, status, error: message });
      if (apiError?.failCode === "407" || apiError?.failCode === "429") break;
    }
  }
  return jsonResponse({ success: results.every((result) => result.success), processed: results.length, results });
});
