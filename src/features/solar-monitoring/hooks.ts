import { useQuery } from "@tanstack/react-query";
import { solarApi } from "./api";

export const solarKeys = {
  all: ["solar-monitoring"] as const,
  fleet: (filters: Record<string, unknown>) => [...solarKeys.all, "fleet", filters] as const,
  plants: (filters: Record<string, unknown>, sort: string, page: number, pageSize = 25) =>
    [...solarKeys.all, "plants", filters, sort, page, pageSize] as const,
  plant: (id: string, from: string, to: string) => [...solarKeys.all, "plant", id, from, to] as const,
  device: (id: string, from: string, to: string) => [...solarKeys.all, "device", id, from, to] as const,
  alarms: (filters: Record<string, unknown>) => [...solarKeys.all, "alarms", filters] as const,
  health: (from: string) => [...solarKeys.all, "health", from] as const,
  provinceRanking: () => [...solarKeys.all, "province-ranking-v2"] as const,
};

const realtimeOptions = {
  staleTime: 4 * 60_000,
  refetchInterval: 5 * 60_000,
};

export function useSolarFleet(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: solarKeys.fleet(filters),
    queryFn: () => solarApi.fleetSummary(filters),
    ...realtimeOptions,
  });
}

export function useSolarPlants(
  filters: Record<string, unknown>,
  sort: string,
  page: number,
  pageSize = 25,
) {
  return useQuery({
    queryKey: solarKeys.plants(filters, sort, page, pageSize),
    queryFn: () => solarApi.plants(filters, sort, page, pageSize),
    placeholderData: (previous) => previous,
    staleTime: 4 * 60_000,
  });
}

export function useSolarPlant(id: string, from: string, to: string) {
  return useQuery({
    queryKey: solarKeys.plant(id, from, to),
    queryFn: () => solarApi.plantDetail(id, from, to),
    enabled: Boolean(id),
    ...realtimeOptions,
  });
}

export function useSolarDevice(id: string, from: string, to: string) {
  return useQuery({
    queryKey: solarKeys.device(id, from, to),
    queryFn: () => solarApi.deviceDetail(id, from, to),
    enabled: Boolean(id),
    ...realtimeOptions,
  });
}

export function useSolarAlarms(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: solarKeys.alarms(filters),
    queryFn: () => solarApi.alarms(filters),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  });
}

export function useSolarDataHealth(from: string) {
  return useQuery({
    queryKey: solarKeys.health(from),
    queryFn: () => solarApi.dataHealth(from),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useSolarProvinceRanking() {
  return useQuery({
    queryKey: solarKeys.provinceRanking(),
    queryFn: () => solarApi.provinceRanking(),
    staleTime: 60 * 60_000,
  });
}
