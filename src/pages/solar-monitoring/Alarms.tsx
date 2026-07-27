import { useState } from "react";
import { SolarPageHeader } from "@/components/solar-monitoring/SolarMonitoringLayout";
import { MetricCard, SolarCard, SolarState } from "@/components/solar-monitoring/SolarUI";
import { severityClass } from "@/features/solar-monitoring/styles";
import { useSolarAlarms } from "@/features/solar-monitoring/hooks";
import { dateTime, number, severityLabel } from "@/features/solar-monitoring/format";

export default function SolarAlarms() {
  const [status, setStatus] = useState("active");
  const [severity, setSeverity] = useState("");
  const query = useSolarAlarms({
    ...(status ? { status } : {}),
    ...(severity ? { severity: Number(severity) } : {}),
  });
  const data = query.data;
  return (
    <>
      <SolarPageHeader title="Alarm & Maintenance" description="ติดตาม Active alarm และประวัติ lifecycle ที่ระบบบันทึกจาก Huawei" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Active ทั้งหมด" value={number(data?.activeCount, 0)} tone="red" />
        {[1, 2, 3, 4].map((level) => <MetricCard key={level} label={severityLabel(level)} value={number(data?.bySeverity?.[String(level)], 0)} tone={level <= 2 ? "red" : level === 3 ? "amber" : "cyan"} />)}
      </div>
      <SolarCard className="mb-5">
        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
            <option value="active">Active</option><option value="closed">Closed</option><option value="">ทั้งหมด</option>
          </select>
          <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
            <option value="">ทุกระดับ</option><option value="1">Critical</option><option value="2">Major</option><option value="3">Minor</option><option value="4">Warning</option>
          </select>
        </div>
      </SolarCard>
      <SolarState loading={query.isLoading} error={query.error} empty={!data?.items.length}>
        <div className="space-y-3">
          {data?.items.map((alarm) => (
            <SolarCard key={alarm.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{alarm.alarm_name ?? "Unknown alarm"}</h2><span className={`rounded-full px-2 py-1 text-xs ${severityClass(alarm.severity)}`}>{severityLabel(alarm.severity)}</span></div><p className="mt-2 text-sm text-slate-400">{alarm.alarm_cause ?? "Huawei ไม่ได้ระบุสาเหตุ"}</p><p className="mt-2 text-xs text-slate-500">{alarm.plant_name ?? "ไม่ทราบ Plant"} • {alarm.device_name ?? "Plant-level"} • {dateTime(alarm.raised_at)}</p></div>
                <span className={alarm.status === "active" ? "text-red-300" : "text-emerald-300"}>{alarm.status}</span>
              </div>
              {alarm.repair_suggestion && <div className="mt-4 rounded-lg border border-amber-400/10 bg-amber-400/5 p-3 text-sm text-amber-100/80"><strong>คำแนะนำ:</strong> {alarm.repair_suggestion}</div>}
            </SolarCard>
          ))}
        </div>
      </SolarState>
    </>
  );
}
