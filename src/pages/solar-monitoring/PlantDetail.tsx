import ReactECharts from "echarts-for-react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Battery, Cpu, Link2, Zap } from "lucide-react";
import { SolarPageHeader } from "@/components/solar-monitoring/SolarMonitoringLayout";
import { MetricCard, SolarCard, SolarState } from "@/components/solar-monitoring/SolarUI";
import { healthClass, severityClass } from "@/features/solar-monitoring/styles";
import { useSolarPlant } from "@/features/solar-monitoring/hooks";
import { dateTime, healthLabel, number, severityLabel } from "@/features/solar-monitoring/format";

export default function SolarPlantDetail() {
  const { plantId = "" } = useParams();
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const query = useSolarPlant(plantId, from, to);
  const data = query.data;
  const latest = data?.samples.at(-1);

  return (
    <>
      <Link to="/solar-monitoring/plants" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> กลับไปโรงไฟฟ้าทั้งหมด</Link>
      <SolarPageHeader
        title={data?.plant?.plant_name ?? "รายละเอียดโรงไฟฟ้า"}
        description={data?.plant ? `${data.plant.plant_code} • ${data.plant.plant_address ?? "Huawei ไม่ได้ระบุที่อยู่"}` : "ข้อมูล Plant และอุปกรณ์"}
        freshness={dateTime(latest?.sampled_at)}
      />
      <SolarState loading={query.isLoading} error={query.error} empty={!data?.plant}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="กำลังติดตั้ง" value={number(data?.plant?.capacity_kwp)} unit="kWp" />
          <MetricCard label="กำลังผลิตล่าสุด" value={number(latest?.current_power_kw)} unit="kW" tone="emerald" />
          <MetricCard label="พลังงานวันนี้" value={number(latest?.daily_energy_kwh)} unit="kWh" tone="cyan" />
          <MetricCard label="อุปกรณ์" value={number(data?.devices.length, 0)} unit="เครื่อง" />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <SolarCard>
            <h2 className="font-semibold">กำลังผลิตย้อนหลัง 7 วัน</h2>
            <p className="text-xs text-slate-400">ข้อมูลตาม measurement timestamp จาก Huawei</p>
            <ReactECharts style={{ height: 360 }} option={{
              grid: { left: 60, right: 24, top: 35, bottom: 50 },
              tooltip: { trigger: "axis" },
              xAxis: { type: "time", axisLabel: { color: "#94a3b8" }, splitLine: { show: false } },
              yAxis: { type: "value", name: "kW", nameTextStyle: { color: "#94a3b8" }, axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#1e293b" } } },
              series: [{ type: "line", showSymbol: false, smooth: true, data: data?.samples.map((sample) => [sample.sampled_at, sample.current_power_kw]), lineStyle: { color: "#f59e0b", width: 2 }, areaStyle: { color: "rgba(245,158,11,.12)" } }],
              dataZoom: [{ type: "inside" }, { type: "slider", bottom: 5, textStyle: { color: "#94a3b8" } }],
            }} />
          </SolarCard>
          <SolarCard>
            <h2 className="font-semibold">ข้อมูล Plant</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-slate-400">สถานะ</span><span className={`rounded-full px-2 py-1 text-xs ${healthClass(data?.plant?.latest_health_state)}`}>{healthLabel(data?.plant?.latest_health_state)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-400">ที่อยู่</span><span className="text-right">{data?.plant?.plant_address ?? "—"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-400">Customer mapping</span><span className={data?.customerLink ? "text-emerald-300" : "text-amber-300"}>{data?.customerLink ? "เชื่อมแล้ว" : "ยังไม่เชื่อม"}</span></div>
              {!data?.customerLink && <Link to="/solar-monitoring/settings" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-amber-200"><Link2 className="h-4 w-4" /> ไปหน้าจับคู่ลูกค้า</Link>}
            </div>
          </SolarCard>
        </div>
        <SolarCard className="mt-6">
          <h2 className="font-semibold">อุปกรณ์ในโรงไฟฟ้า</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data?.devices.map((device) => (
              <Link key={device.id} to={`/solar-monitoring/devices/${device.id}`} className="rounded-xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-amber-400/30">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-amber-400/10 p-2 text-amber-300">{device.dev_type_id === 39 ? <Battery className="h-5 w-5" /> : device.dev_type_id === 1 ? <Zap className="h-5 w-5" /> : <Cpu className="h-5 w-5" />}</span>
                  <div className="min-w-0"><p className="truncate font-medium">{device.device_name ?? `Device ${device.dev_type_id}`}</p><p className="text-xs text-slate-500">{device.model ?? "ไม่ระบุรุ่น"} • {device.esn ?? "ไม่มี ESN"}</p></div>
                </div>
              </Link>
            ))}
            {!data?.devices.length && <p className="text-sm text-slate-400">ยังไม่พบข้อมูลอุปกรณ์</p>}
          </div>
        </SolarCard>
        <SolarCard className="mt-6">
          <h2 className="font-semibold">Alarm ล่าสุด</h2>
          <div className="mt-4 space-y-3">
            {data?.alarms.slice(0, 10).map((alarm) => (
              <div key={alarm.id} className="flex flex-col gap-2 rounded-xl border border-white/5 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">{alarm.alarm_name ?? "Unknown alarm"}</p><p className="text-xs text-slate-400">{dateTime(alarm.raised_at)}</p></div>
                <span className={`w-fit rounded-full px-2 py-1 text-xs ${severityClass(alarm.severity)}`}>{severityLabel(alarm.severity)}</span>
              </div>
            ))}
            {!data?.alarms.length && <p className="text-sm text-slate-400">ไม่พบ Alarm ในช่วง 7 วัน</p>}
          </div>
        </SolarCard>
      </SolarState>
    </>
  );
}
