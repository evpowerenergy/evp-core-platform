export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || value === "--") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function epochToIso(value: unknown, fallback = new Date()): string {
  const parsed = parseNumber(value);
  if (parsed === null) return fallback.toISOString();
  const milliseconds = parsed < 10_000_000_000 ? parsed * 1000 : parsed;
  return new Date(milliseconds).toISOString();
}

export function chunks<T>(items: T[], size = 100): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

export function recordsFrom(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== "object") return [];
  const object = data as Record<string, unknown>;
  for (const key of ["list", "data", "records", "items"]) {
    if (Array.isArray(object[key])) return object[key] as Record<string, unknown>[];
  }
  return [];
}

export function normalizePlantSample(
  plantId: string,
  row: Record<string, unknown>,
  sampledAt = new Date(),
) {
  const map = (row.dataItemMap ?? row) as Record<string, unknown>;
  const qualityFlags: string[] = [];
  const currentPower = parseNumber(map.real_power ?? map.current_power ?? map.active_power);
  if (currentPower === null) qualityFlags.push("missing_current_power");
  return {
    plant_id: plantId,
    sampled_at: epochToIso(row.collectTime ?? row.collect_time, sampledAt),
    current_power_kw: currentPower,
    daily_energy_kwh: parseNumber(map.day_power),
    monthly_energy_kwh: parseNumber(map.month_power),
    lifetime_energy_kwh: parseNumber(map.total_power),
    daily_feed_in_kwh: parseNumber(map.day_on_grid_energy),
    daily_consumption_kwh: parseNumber(map.day_use_energy),
    daily_income: parseNumber(map.day_income),
    lifetime_income: parseNumber(map.total_income),
    health_state: parseNumber(map.real_health_state),
    quality_flags: qualityFlags,
    raw_payload: row,
  };
}

export function normalizeDeviceSample(
  deviceId: string,
  devTypeId: number,
  row: Record<string, unknown>,
  sampledAt = new Date(),
) {
  const map = (row.dataItemMap ?? row) as Record<string, unknown>;
  const activeRaw = parseNumber(map.active_power ?? map.ch_discharge_power);
  const wattsTypes = new Set([17, 38, 39, 47]);
  const activeKw = activeRaw === null ? null : wattsTypes.has(devTypeId) ? activeRaw / 1000 : activeRaw;
  return {
    device_id: deviceId,
    sampled_at: epochToIso(row.collectTime ?? row.collect_time, sampledAt),
    active_power_kw: activeKw,
    reactive_power_kvar: parseNumber(map.reactive_power),
    daily_energy_kwh: parseNumber(map.day_cap ?? map.day_energy),
    lifetime_energy_kwh: parseNumber(map.total_cap ?? map.total_energy),
    voltage_v: parseNumber(map.phase_A_voltage ?? map.voltage ?? map.busbar_u),
    current_a: parseNumber(map.phase_A_current ?? map.current),
    frequency_hz: parseNumber(map.elec_freq ?? map.grid_frequency),
    temperature_c: parseNumber(map.temperature),
    efficiency_percent: parseNumber(map.efficiency),
    soc_percent: parseNumber(map.battery_soc ?? map.soc),
    soh_percent: parseNumber(map.battery_soh ?? map.soh),
    charge_power_kw: parseNumber(map.charge_power),
    discharge_power_kw: parseNumber(map.discharge_power),
    run_state: String(map.run_state ?? map.inverter_state ?? map.battery_status ?? ""),
    quality_flags: activeRaw === null ? ["missing_active_power"] : [],
    raw_payload: row,
  };
}

export function nextRetry(attempt: number, random = Math.random): string {
  const baseSeconds = Math.min(3600, 60 * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(random() * 30);
  return new Date(Date.now() + (baseSeconds + jitter) * 1000).toISOString();
}
