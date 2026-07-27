import { describe, expect, it } from "vitest";
import {
  chunks,
  epochToIso,
  normalizeDeviceSample,
  normalizePlantSample,
  parseNumber,
} from "../../../supabase/functions/_shared/huaweiSolarNormalize";

describe("Huawei solar normalization", () => {
  it("parses numbers and Huawei null markers", () => {
    expect(parseNumber("1,234.5")).toBe(1234.5);
    expect(parseNumber("--")).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("not-a-number")).toBeNull();
  });

  it("normalizes plant numeric strings", () => {
    const sample = normalizePlantSample("plant-1", {
      collectTime: 1_700_000_000_000,
      dataItemMap: { day_power: "42.5", real_health_state: "3", real_power: "12.2" },
    });
    expect(sample.daily_energy_kwh).toBe(42.5);
    expect(sample.health_state).toBe(3);
    expect(sample.current_power_kw).toBe(12.2);
  });

  it("converts meter and battery power from W to kW", () => {
    expect(normalizeDeviceSample("meter", 17, { active_power: "2500" }).active_power_kw).toBe(2.5);
    expect(normalizeDeviceSample("battery", 39, { active_power: "-3000" }).active_power_kw).toBe(-3);
    expect(normalizeDeviceSample("inverter", 1, { active_power: "3.5" }).active_power_kw).toBe(3.5);
  });

  it("accepts epoch seconds and milliseconds", () => {
    expect(epochToIso(1_700_000_000)).toBe(epochToIso(1_700_000_000_000));
  });

  it("creates deterministic batches", () => {
    expect(chunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
