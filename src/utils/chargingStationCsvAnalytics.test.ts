import { describe, expect, it } from "vitest";
import {
  parseCsv,
  parseDurationMinutes,
  parseStartDate,
  parseThaiNumber,
  rowsToSessions,
  computeChargingAnalytics,
} from "./chargingStationCsvAnalytics";

describe("parseCsv", () => {
  it("handles commas inside quoted fields", () => {
    const text = 'a,b\n"1,050.25","x"';
    const rows = parseCsv(text);
    expect(rows[1]).toEqual(["1,050.25", "x"]);
  });
});

describe("parseDurationMinutes", () => {
  it("parses Thai hour + minute", () => {
    expect(parseDurationMinutes("1 ชั่วโมง 15 นาที")).toBe(75);
  });
  it("parses minutes only", () => {
    expect(parseDurationMinutes("50 นาที")).toBe(50);
  });
});

describe("parseThaiNumber", () => {
  it("strips thousand separators", () => {
    expect(parseThaiNumber("1,050.25")).toBeCloseTo(1050.25);
  });
});

describe("parseStartDate", () => {
  it("parses DD/MM/YYYY with time", () => {
    const d = parseStartDate("31/12/2024 14:30:00");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2024);
    expect(d!.getMonth()).toBe(11);
    expect(d!.getDate()).toBe(31);
  });
});

describe("integration", () => {
  it("computes KPIs from minimal CSV", () => {
    const csv = [
      "สถานี,Connector Name,เริ่มชาร์จ,ระยะเวลา,พลังงานที่ใช้ (kWh),รายได้รวม VAT (฿),รายได้ (฿),เรทราคา (฿),Payment Status,ชื่อผู้ใช้งาน,ประเภทลูกค้า",
      'Super EV Hub (เชียงใหม่),4,01/01/2025 10:00:00,"30 นาที",10.5,"1,050.00",1000.0,6.5,ชำระเงินสำเร็จ,userA,ลูกค้าทั่วไป',
      'Super EV Hub (เชียงใหม่),4,01/02/2025 10:00:00,"30 นาที",5.0,500.0,450.0,6.5,ล้มเหลว,userB,ลูกค้าทั่วไป',
    ].join("\n");
    const rows = parseCsv(csv);
    const sessions = rowsToSessions(rows, []);
    const withSuccessOnly = computeChargingAnalytics(sessions, { includeFailedInMoneyAndEnergy: false });
    expect(withSuccessOnly.kpis.sessionCountForMetrics).toBe(1);
    expect(withSuccessOnly.kpis.totalGross).toBeGreaterThan(0);

    const withAll = computeChargingAnalytics(sessions, { includeFailedInMoneyAndEnergy: true });
    expect(withAll.kpis.sessionCountForMetrics).toBe(2);

    expect(withSuccessOnly.monthlyUtilization.length).toBe(1);
    expect(withSuccessOnly.monthlyUtilization[0]?.monthKey).toBe("2025-01");
    expect(withAll.monthlyUtilization.length).toBe(2);
  });
});
