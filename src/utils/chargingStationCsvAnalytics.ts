/**
 * Client-side analytics for CSMS charging session CSV exports (Super EV Hub).
 * See docs/PRD_and_Logic_Architecture.md
 */

export type ChargingSession = {
  station: string;
  connector: string;
  startAt: Date | null;
  durationMinutes: number;
  kwh: number;
  grossBaht: number;
  netBaht: number;
  rateBaht: number;
  paymentStatus: string;
  userName: string;
  customerType: string;
  paymentSuccess: boolean;
};

export type ChargingAnalyticsOptions = {
  /** When true, include failed payment rows in revenue / kWh / time aggregates */
  includeFailedInMoneyAndEnergy: boolean;
};

export type ChargingKpis = {
  totalGross: number;
  totalNet: number;
  totalKwh: number;
  totalDurationMinutes: number;
  sessionCountForMetrics: number;
  allSessionCount: number;
  successCount: number;
  successRatePct: number;
  avgSpeedKw: number | null;
  avgTicketGross: number | null;
  /**
   * Utilization ช่วง 30 วันปฏิทินย้อนหลัง จากวันที่เริ่มชาร์จล่าสุดในไฟล์ (รวมทั้งวันเริ่มและวันสิ้นสุด = 30 วัน)
   * = kWh ในช่วงนั้น ÷ (Capacity kW × 24 × 30) × 100
   */
  utilizationPct: number | null;
  /** วันเริ่มช่วง YYYY-MM-DD */
  utilizationWindowStartDate: string | null;
  /** วันสิ้นสุดช่วง (= วันที่เริ่มชาร์จล่าสุดในไฟล์) YYYY-MM-DD */
  utilizationWindowEndDate: string | null;
  /** คงที่ 30 — ใช้ในสูตรเทียบ capacity */
  utilizationWindowDays: number | null;
  validMonthsCount: number;
  capacityKw: number | null;
  dominantStation: string | null;
};

export type HourlyBucket = { hour: number; sessions: number; kwh: number };
export type DowBucket = { dow: number; label: string; sessions: number; kwh: number };
export type DailyRevenueRow = { dateKey: string; gross: number; net: number };
export type ConnectorReliability = {
  connector: string;
  success: number;
  failed: number;
  errorRatePct: number | null;
};
export type CustomerRetentionSummary = {
  uniqueUsers: number;
  newCustomers: number;
  returningCustomers: number;
};

/** Utilization ต่อเดือนปฏิทิน — สูตรเดียวกับการ์ด “เดือนล่าสุด” แต่ทุกเดือนที่มีข้อมูล */
export type MonthlyUtilizationRow = {
  monthKey: string;
  /** ป้ายกำกับแกน X (สั้น) */
  labelShort: string;
  kwh: number;
  daysInMonth: number;
  utilizationPct: number;
};

export type ChargingAnalyticsResult = {
  sessions: ChargingSession[];
  parseWarnings: string[];
  kpis: ChargingKpis;
  hourly: HourlyBucket[];
  dayOfWeek: DowBucket[];
  dailyRevenue: DailyRevenueRow[];
  monthlyUtilization: MonthlyUtilizationRow[];
  connectorReliability: ConnectorReliability[];
  customerRetention: CustomerRetentionSummary;
};

/** Short labels Mon → Sun */
const DOW_LABELS_MON_FIRST = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

/** RFC-style CSV parser with quoted fields (handles commas inside numbers like 1,050.25). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushRow = () => {
    if (row.length > 1 || (row.length === 1 && row[0].trim() !== "")) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      pushRow();
    } else if (c === "\r") {
      // skip; handle \r\n as \n only
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.length > 1 || (row.length === 1 && row[0].trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function findColumnIndex(headers: string[], matchers: (h: string) => boolean): number {
  for (let i = 0; i < headers.length; i++) {
    const n = normalizeHeader(headers[i] ?? "");
    if (matchers(n)) return i;
  }
  return -1;
}

export function detectColumnIndices(headers: string[]) {
  const norm = headers.map((h) => normalizeHeader(h));

  const station = findColumnIndex(headers, (n) => n.includes("สถานี") && !n.includes("connector"));
  const connector = findColumnIndex(headers, (n) => n.includes("connector"));
  const start = findColumnIndex(headers, (n) => n.includes("เริ่มชาร์จ") || n.includes("start"));
  const duration = findColumnIndex(headers, (n) => n.includes("ระยะเวลา") || n.includes("duration"));
  const kwh = findColumnIndex(
    headers,
    (n) => (n.includes("kwh") || n.includes("พลังงาน")) && !n.includes("ความเร็ว")
  );
  const gross = findColumnIndex(
    headers,
    (n) => (n.includes("รายได้รวม") && n.includes("vat")) || n.includes("gross")
  );
  const net = findColumnIndex(
    headers,
    (n) =>
      (n.includes("รายได้") && n.includes("฿") && !n.includes("vat") && !n.includes("รวม")) ||
      n === "รายได้ (฿)" ||
      (n.includes("net") && n.includes("รายได้"))
  );
  const rate = findColumnIndex(headers, (n) => n.includes("เรท") || n.includes("rate"));
  const payment = findColumnIndex(headers, (n) => n.includes("payment") || n.includes("ชำระ"));
  const user = findColumnIndex(
    headers,
    (n) => n.includes("ชื่อผู้ใช้") || n.includes("username") || n.includes("user id")
  );
  const custType = findColumnIndex(headers, (n) => n.includes("ประเภทลูกค้า") || n.includes("customer type"));

  // Fallback: "รายได้ (฿)" column when gross/net confused
  let netIdx = net;
  if (netIdx < 0) {
    netIdx = norm.findIndex((n) => n.startsWith("รายได้") && n.includes("฿") && !n.includes("vat"));
  }

  return {
    station: station >= 0 ? station : 0,
    connector: connector >= 0 ? connector : 1,
    start: start >= 0 ? start : 2,
    duration: duration >= 0 ? duration : 3,
    kwh: kwh >= 0 ? kwh : 4,
    gross: gross >= 0 ? gross : 5,
    net: netIdx >= 0 ? netIdx : 6,
    rate: rate >= 0 ? rate : 7,
    payment: payment >= 0 ? payment : 8,
    user: user >= 0 ? user : 9,
    customerType: custType >= 0 ? custType : 10,
  };
}

export function parseThaiNumber(raw: string): number {
  const s = (raw ?? "")
    .replace(/฿/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, "")
    .trim();
  if (!s) return 0;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Parse DD/MM/YYYY HH:mm:ss or YYYY-MM-DD HH:mm:ss */
export function parseStartDate(raw: string): Date | null {
  const s = (raw ?? "").trim();
  if (!s) return null;

  const isoTry = Date.parse(s.replace(" ", "T"));
  if (!Number.isNaN(isoTry)) {
    const d = new Date(isoTry);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    const year = Number(m[3]);
    const hh = Number(m[4]);
    const mm = Number(m[5]);
    const ss = m[6] ? Number(m[6]) : 0;
    const d = new Date(year, month, day, hh, mm, ss);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "50 นาที", "1 ชั่วโมง 15 นาที" */
export function parseDurationMinutes(raw: string): number {
  const s = (raw ?? "").trim();
  if (!s) return 0;

  if (s.includes("ชั่วโมง")) {
    const hourMatch = s.match(/(\d+(?:\.\d+)?)\s*ชั่วโมง/);
    const minMatch = s.match(/(\d+(?:\.\d+)?)\s*นาที/);
    const hours = hourMatch ? Number.parseFloat(hourMatch[1]) : 0;
    const mins = minMatch ? Number.parseFloat(minMatch[1]) : 0;
    return Math.round(hours * 60 + mins);
  }

  const digits = s.replace(/\D/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10) || 0;
}

export function isPaymentSuccess(status: string): boolean {
  const s = (status ?? "").toLowerCase();
  return s.includes("สำเร็จ") || s.includes("success") || s.includes("paid");
}

function yearMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** วันที่ในเครื่อง (local) YYYY-MM-DD */
export function dateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addCalendarDays(d: Date, delta: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
  return x;
}

/** วันที่เริ่มชาร์จล่าสุดใน sessions (ทุกแถวที่มีวันที่) */
function latestSessionStartDate(sessions: ChargingSession[]): Date | null {
  let best: Date | null = null;
  for (const s of sessions) {
    if (!s.startAt) continue;
    if (!best || s.startAt > best) best = s.startAt;
  }
  return best;
}

export function capacityKwFromStationName(stationName: string): number {
  const n = stationName ?? "";
  if (n.includes("เชียงใหม่")) return 720;
  if (n.includes("นนทบุรี")) return 600;
  return 600;
}

function dominantStationName(sessions: ChargingSession[]): string | null {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const key = (s.station || "").trim() || "(ไม่ระบุสถานี)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [k, v] of counts) {
    if (v > bestN) {
      bestN = v;
      best = k;
    }
  }
  return best;
}

function daysInCalendarMonth(year: number, month1Based: number): number {
  return new Date(year, month1Based, 0).getDate();
}

function monthLabelShortThai(yyyyMm: string): string {
  const [ys, ms] = yyyyMm.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return yyyyMm;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("th-TH", { month: "short", year: "numeric" });
}

function computeValidMonthsCount(sessions: ChargingSession[]): { count: number; byMonth: Map<string, number> } {
  const byMonth = new Map<string, number>();
  for (const s of sessions) {
    if (!s.startAt) continue;
    const k = yearMonthKey(s.startAt);
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  }
  const total = sessions.filter((s) => s.startAt).length;
  const threshold = Math.max(1, Math.floor(total * 0.01));
  let count = 0;
  for (const [, n] of byMonth) {
    if (n >= threshold) count++;
  }
  return { count, byMonth };
}

export function rowsToSessions(rows: string[][], warnings: string[]): ChargingSession[] {
  if (rows.length < 2) {
    warnings.push("ไฟล์ไม่มีแถวข้อมูล");
    return [];
  }
  const headers = rows[0];
  const idx = detectColumnIndices(headers);
  const out: ChargingSession[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !String(c).trim())) continue;

    const station = String(row[idx.station] ?? "").trim();
    const connector = String(row[idx.connector] ?? "").trim();
    const startAt = parseStartDate(String(row[idx.start] ?? ""));
    const durationMinutes = parseDurationMinutes(String(row[idx.duration] ?? ""));
    const kwh = parseThaiNumber(String(row[idx.kwh] ?? ""));
    const grossBaht = parseThaiNumber(String(row[idx.gross] ?? ""));
    const netBaht = parseThaiNumber(String(row[idx.net] ?? ""));
    const rateBaht = parseThaiNumber(String(row[idx.rate] ?? ""));
    const paymentStatus = String(row[idx.payment] ?? "").trim();
    const userName = String(row[idx.user] ?? "").trim();
    const customerType = String(row[idx.customerType] ?? "").trim();
    const paymentSuccess = isPaymentSuccess(paymentStatus);

    out.push({
      station,
      connector,
      startAt,
      durationMinutes,
      kwh,
      grossBaht,
      netBaht,
      rateBaht,
      paymentStatus,
      userName,
      customerType,
      paymentSuccess,
    });
  }

  return out;
}

function sessionIncludedInMetrics(s: ChargingSession, opts: ChargingAnalyticsOptions): boolean {
  if (opts.includeFailedInMoneyAndEnergy) return true;
  return s.paymentSuccess;
}

export function computeChargingAnalytics(
  sessions: ChargingSession[],
  opts: ChargingAnalyticsOptions
): ChargingAnalyticsResult {
  const parseWarnings: string[] = [];
  const allSessionCount = sessions.length;
  const successCount = sessions.filter((s) => s.paymentSuccess).length;
  const successRatePct = allSessionCount > 0 ? (successCount / allSessionCount) * 100 : 0;

  const dominant = dominantStationName(sessions);
  const capacityKw = dominant ? capacityKwFromStationName(dominant) : null;

  const { count: validMonthsCount } = computeValidMonthsCount(sessions);

  let totalGross = 0;
  let totalNet = 0;
  let totalKwh = 0;
  let totalDurationMinutes = 0;
  let sessionCountForMetrics = 0;

  for (const s of sessions) {
    if (!sessionIncludedInMetrics(s, opts)) continue;
    totalGross += s.grossBaht;
    totalNet += s.netBaht;
    totalKwh += s.kwh;
    totalDurationMinutes += s.durationMinutes;
    sessionCountForMetrics++;
  }

  const hoursCharging = totalDurationMinutes / 60;
  const avgSpeedKw = hoursCharging > 0 ? totalKwh / hoursCharging : null;
  const avgTicketGross =
    sessionCountForMetrics > 0 ? totalGross / sessionCountForMetrics : null;

  let utilizationPct: number | null = null;
  let utilizationWindowStartDate: string | null = null;
  let utilizationWindowEndDate: string | null = null;
  const UTILIZATION_ROLLING_DAYS = 30;
  let utilizationWindowDays: number | null = null;

  const latestStart = latestSessionStartDate(sessions);
  if (capacityKw && capacityKw > 0 && latestStart) {
    const endDay = startOfDayLocal(latestStart);
    const startDay = addCalendarDays(endDay, -(UTILIZATION_ROLLING_DAYS - 1));
    utilizationWindowEndDate = dateKeyLocal(endDay);
    utilizationWindowStartDate = dateKeyLocal(startDay);
    utilizationWindowDays = UTILIZATION_ROLLING_DAYS;

    let kwhInWindow = 0;
    for (const s of sessions) {
      if (!sessionIncludedInMetrics(s, opts)) continue;
      if (!s.startAt) continue;
      const t = s.startAt.getTime();
      if (t >= startDay.getTime() && t <= endDay.getTime() + 86400000 - 1) {
        kwhInWindow += s.kwh;
      }
    }
    const denom = capacityKw * 24 * UTILIZATION_ROLLING_DAYS;
    utilizationPct = denom > 0 ? (kwhInWindow / denom) * 100 : null;
  }

  const kpis: ChargingKpis = {
    totalGross,
    totalNet,
    totalKwh,
    totalDurationMinutes,
    sessionCountForMetrics,
    allSessionCount,
    successCount,
    successRatePct,
    avgSpeedKw,
    avgTicketGross,
    utilizationPct,
    utilizationWindowStartDate,
    utilizationWindowEndDate,
    utilizationWindowDays,
    validMonthsCount,
    capacityKw,
    dominantStation: dominant,
  };

  // Hourly & DOW & daily (filtered sessions for usage/revenue alignment)
  const hourlyMap = new Map<number, { sessions: number; kwh: number }>();
  const dowMap = new Map<number, { sessions: number; kwh: number }>();
  const dailyMap = new Map<string, { gross: number; net: number }>();

  for (let h = 0; h < 24; h++) hourlyMap.set(h, { sessions: 0, kwh: 0 });
  for (let d = 0; d < 7; d++) dowMap.set(d, { sessions: 0, kwh: 0 });

  for (const s of sessions) {
    if (!sessionIncludedInMetrics(s, opts)) continue;
    if (s.startAt) {
      const hour = s.startAt.getHours();
      const hb = hourlyMap.get(hour)!;
      hb.sessions++;
      hb.kwh += s.kwh;

      let dow = s.startAt.getDay(); // 0 Sun .. 6 Sat — reorder to Mon=0 for display
      const monBased = (dow + 6) % 7;
      const db = dowMap.get(monBased)!;
      db.sessions++;
      db.kwh += s.kwh;

      const y = s.startAt.getFullYear();
      const m = String(s.startAt.getMonth() + 1).padStart(2, "0");
      const day = String(s.startAt.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${day}`;
      const cur = dailyMap.get(dateKey) ?? { gross: 0, net: 0 };
      cur.gross += s.grossBaht;
      cur.net += s.netBaht;
      dailyMap.set(dateKey, cur);
    }
  }

  const hourly: HourlyBucket[] = Array.from({ length: 24 }, (_, hour) => {
    const b = hourlyMap.get(hour)!;
    return { hour, sessions: b.sessions, kwh: b.kwh };
  });

  const dayOfWeek: DowBucket[] = Array.from({ length: 7 }, (_, i) => {
    const b = dowMap.get(i)!;
    return {
      dow: i,
      label: DOW_LABELS_MON_FIRST[i] ?? String(i),
      sessions: b.sessions,
      kwh: b.kwh,
    };
  });

  const dailyRevenue: DailyRevenueRow[] = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, v]) => ({ dateKey, gross: v.gross, net: v.net }));

  const monthlyUtilization: MonthlyUtilizationRow[] = [];
  if (capacityKw && capacityKw > 0) {
    const byMonthKwh = new Map<string, number>();
    for (const s of sessions) {
      if (!sessionIncludedInMetrics(s, opts)) continue;
      if (!s.startAt) continue;
      const km = yearMonthKey(s.startAt);
      byMonthKwh.set(km, (byMonthKwh.get(km) ?? 0) + s.kwh);
    }
    const sortedMonthKeys = [...byMonthKwh.keys()].sort();
    for (const monthKey of sortedMonthKeys) {
      const [ys, ms] = monthKey.split("-");
      const y = Number(ys);
      const mo = Number(ms);
      if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) continue;
      const daysInMonth = daysInCalendarMonth(y, mo);
      const kwh = byMonthKwh.get(monthKey) ?? 0;
      const denom = capacityKw * 24 * daysInMonth;
      const utilizationPct = denom > 0 ? (kwh / denom) * 100 : 0;
      monthlyUtilization.push({
        monthKey,
        labelShort: monthLabelShortThai(monthKey),
        kwh,
        daysInMonth,
        utilizationPct,
      });
    }
  }

  // Connector reliability — all sessions (payment outcomes)
  const connMap = new Map<string, { success: number; failed: number }>();
  for (const s of sessions) {
    const key = s.connector || "(ไม่ระบุ)";
    const cur = connMap.get(key) ?? { success: 0, failed: 0 };
    if (s.paymentSuccess) cur.success++;
    else cur.failed++;
    connMap.set(key, cur);
  }
  const connectorReliability: ConnectorReliability[] = [...connMap.entries()].map(([connector, v]) => {
    const total = v.success + v.failed;
    const errorRatePct = total > 0 ? (v.failed / total) * 100 : null;
    return { connector, success: v.success, failed: v.failed, errorRatePct };
  });
  connectorReliability.sort((a, b) => b.failed + b.success - (a.failed + a.success));

  // Customer retention — all sessions with user key
  const userCounts = new Map<string, number>();
  for (const s of sessions) {
    const u = (s.userName || "").trim();
    if (!u) continue;
    userCounts.set(u, (userCounts.get(u) ?? 0) + 1);
  }
  let newCustomers = 0;
  let returningCustomers = 0;
  for (const [, c] of userCounts) {
    if (c === 1) newCustomers++;
    else returningCustomers++;
  }
  const customerRetention: CustomerRetentionSummary = {
    uniqueUsers: userCounts.size,
    newCustomers,
    returningCustomers,
  };

  return {
    sessions,
    parseWarnings,
    kpis,
    hourly,
    dayOfWeek,
    dailyRevenue,
    monthlyUtilization,
    connectorReliability,
    customerRetention,
  };
}

export function parseChargingCsvFile(text: string, opts: ChargingAnalyticsOptions): ChargingAnalyticsResult {
  const warnings: string[] = [];
  const rows = parseCsv(text);
  const sessions = rowsToSessions(rows, warnings);
  const analytics = computeChargingAnalytics(sessions, opts);
  return {
    ...analytics,
    parseWarnings: [...warnings, ...analytics.parseWarnings],
  };
}
