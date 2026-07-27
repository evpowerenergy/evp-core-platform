export interface FleetSummary {
  plantCount: number;
  capacityKwp: number;
  currentPowerKw: number;
  dailyEnergyKwh: number;
  healthyCount: number;
  faultyCount: number;
  offlineCount: number;
  activeAlarmCount: number;
  latestSampleAt: string | null;
}

export interface SolarPlant {
  id: string;
  plant_code: string;
  plant_name: string;
  plant_address?: string | null;
  province?: string | null;
  capacity_kwp?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  sampled_at?: string | null;
  current_power_kw?: number | null;
  daily_energy_kwh?: number | null;
  latest_health_state?: number | null;
  customer_service_id?: number | null;
  last_synced_at?: string | null;
}

export interface PlantListResponse {
  items: SolarPlant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SolarSample {
  sampled_at: string;
  current_power_kw?: number | null;
  active_power_kw?: number | null;
  daily_energy_kwh?: number | null;
  soc_percent?: number | null;
  temperature_c?: number | null;
  quality_flags?: string[];
}

export interface SolarDevice {
  id: string;
  device_name?: string | null;
  dev_type_id: number;
  esn?: string | null;
  model?: string | null;
  device_status?: number | null;
  last_synced_at?: string | null;
}

export interface SolarAlarm {
  id: string;
  alarm_name?: string | null;
  alarm_cause?: string | null;
  repair_suggestion?: string | null;
  severity?: number | null;
  status: string;
  raised_at: string;
  closed_at?: string | null;
  plant_name?: string | null;
  device_name?: string | null;
}

export interface PlantDetailResponse {
  plant: SolarPlant | null;
  customerLink: Record<string, unknown> | null;
  samples: SolarSample[];
  devices: SolarDevice[];
  alarms: SolarAlarm[];
}

export interface DeviceDetailResponse {
  device: SolarDevice | null;
  samples: SolarSample[];
  alarms: SolarAlarm[];
}

export interface AlarmSummary {
  activeCount: number;
  bySeverity: Record<string, number>;
  items: SolarAlarm[];
}

export interface DataHealth {
  lastSuccessfulSync: string | null;
  failedRuns: number;
  rateLimitIncidents: number;
  queueBacklog: number;
  deadLetterCount: number;
  stalePlants: number;
  openQualityIssues: number;
  qualityByType: Record<string, number>;
  recentRuns: Array<Record<string, unknown>>;
}

export interface HuaweiIntegrationView {
  id: string;
  name: string;
  base_url: string;
  enabled: boolean;
  sync_mode: "pilot" | "limited" | "full";
  pilot_plant_limit: number;
  last_success_at: string | null;
  last_error_message: string | null;
}
