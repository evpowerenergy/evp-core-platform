export const number = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(value);

export const dateTime = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    }).format(new Date(value))
    : "ยังไม่มีข้อมูล";

export const healthLabel = (state?: number | null) => ({
  1: "Offline",
  2: "Fault",
  3: "Healthy",
}[state ?? 0] ?? "Unknown");

export const severityLabel = (severity?: number | null) => ({
  1: "Critical",
  2: "Major",
  3: "Minor",
  4: "Warning",
}[severity ?? 0] ?? "Unknown");
