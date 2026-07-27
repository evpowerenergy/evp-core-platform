import ReactECharts from "echarts-for-react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SolarPageHeader } from "@/components/solar-monitoring/SolarMonitoringLayout";
import { MetricCard, SolarCard, SolarState } from "@/components/solar-monitoring/SolarUI";
import { severityClass } from "@/features/solar-monitoring/styles";
import { useSolarDevice } from "@/features/solar-monitoring/hooks";
import { dateTime, number, severityLabel } from "@/features/solar-monitoring/format";

export default function SolarDeviceDetail() {
  const { deviceId = "" } = useParams();
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const query = useSolarDevice(deviceId, from, to);
  const data = query.data;
  const latest = data?.samples.at(-1);
  return (
    <>
      <Link to="/solar-monitoring/plants" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> กลับไปโรงไฟฟ้า</Link>
      <SolarPageHeader title={data?.device?.device_name ?? "รายละเอียดอุปกรณ์"} description={`${data?.device?.model ?? "Huawei device"} • Type ${data?.device?.dev_type_id ?? "—"} • ${data?.device?.esn ?? "ไม่มี ESN"}`} freshness={dateTime(latest?.sampled_at)} />
      <SolarState loading={query.isLoading} error={query.error} empty={!data?.device}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="กำลังล่าสุด" value={number(latest?.active_power_kw)} unit="kW" tone="emerald" />
          <MetricCard label="พลังงานวันนี้" value={number(latest?.daily_energy_kwh)} unit="kWh" />
          <MetricCard label="SOC" value={number(latest?.soc_percent)} unit="%" tone="cyan" hint="แสดงเมื่อเป็น Battery/ESS" />
          <MetricCard label="อุณหภูมิ" value={number(latest?.temperature_c)} unit="°C" tone="cyan" />
        </div>
        <SolarCard className="mt-6">
          <h2 className="font-semibold">ข้อมูลย้อนหลัง 24 ชั่วโมง</h2>
          <ReactECharts style={{ height: 390 }} option={{
            tooltip: { trigger: "axis" },
            legend: { top: 0, textStyle: { color: "#cbd5e1" } },
            grid: { left: 60, right: 60, top: 45, bottom: 45 },
            xAxis: { type: "time", axisLabel: { color: "#94a3b8" } },
            yAxis: [
              { type: "value", name: "kW", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#1e293b" } } },
              { type: "value", name: "% / °C", axisLabel: { color: "#94a3b8" }, splitLine: { show: false } },
            ],
            series: [
              { name: "Power", type: "line", showSymbol: false, data: data?.samples.map((sample) => [sample.sampled_at, sample.active_power_kw]), lineStyle: { color: "#f59e0b" } },
              { name: "SOC", type: "line", yAxisIndex: 1, showSymbol: false, data: data?.samples.map((sample) => [sample.sampled_at, sample.soc_percent]), lineStyle: { color: "#06b6d4" } },
              { name: "Temperature", type: "line", yAxisIndex: 1, showSymbol: false, data: data?.samples.map((sample) => [sample.sampled_at, sample.temperature_c]), lineStyle: { color: "#ef4444" } },
            ],
          }} />
        </SolarCard>
        <SolarCard className="mt-6">
          <h2 className="font-semibold">Alarm ของอุปกรณ์</h2>
          <div className="mt-4 space-y-3">
            {data?.alarms.map((alarm) => <div key={alarm.id} className="rounded-xl border border-white/5 bg-slate-950/40 p-4"><div className="flex justify-between gap-3"><p className="font-medium">{alarm.alarm_name}</p><span className={`rounded-full px-2 py-1 text-xs ${severityClass(alarm.severity)}`}>{severityLabel(alarm.severity)}</span></div><p className="mt-1 text-sm text-slate-400">{alarm.alarm_cause ?? "ไม่ระบุสาเหตุ"}</p></div>)}
            {!data?.alarms.length && <p className="text-sm text-slate-400">ไม่พบ Alarm ในช่วง 24 ชั่วโมง</p>}
          </div>
        </SolarCard>
      </SolarState>
    </>
  );
}
