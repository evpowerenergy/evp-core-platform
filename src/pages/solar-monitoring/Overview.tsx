import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CircleAlert,
  CircleCheckBig,
  Cpu,
  Gauge,
  MapPinned,
  Radio,
  ShieldAlert,
  Sun,
  TriangleAlert,
  WifiOff,
  Zap,
} from "lucide-react";
import { SolarCard, SolarState } from "@/components/solar-monitoring/SolarUI";
import { useSolarAlarms, useSolarFleet, useSolarPlants, useSolarProvinceRanking } from "@/features/solar-monitoring/hooks";
import { dateTime, number } from "@/features/solar-monitoring/format";
import { THAILAND_PROVINCES } from "@/utils/thailandProvinces";

const chartText = "#cbd5e1";
const chartGrid = "rgba(148,163,184,.12)";

function Kpi({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.035] p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[.06]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-slate-950/60 shadow-[inset_0_0_16px_rgba(255,255,255,.04)]">
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[.12em] text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold tabular-nums text-white">
          {value} <span className="text-xs font-normal text-slate-400">{unit}</span>
        </p>
      </div>
    </div>
  );
}

function RingChart({
  total,
  centerLabel,
  data,
}: {
  total: number;
  centerLabel: string;
  data: Array<{ name: string; value: number; color: string }>;
}) {
  const values = data.filter((item) => item.value > 0);
  return (
    <ReactECharts
      style={{ height: 210, width: "100%" }}
      option={{
        animationDuration: 1000,
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(2, 12, 27, .94)",
          borderColor: "rgba(103,232,249,.25)",
          textStyle: { color: "#e2e8f0" },
        },
        graphic: [
          { type: "text", left: "center", top: "39%", style: { text: number(total, 0), fill: "#fff", fontSize: 27, fontWeight: 700, textAlign: "center" } },
          { type: "text", left: "center", top: "55%", style: { text: centerLabel, fill: "#94a3b8", fontSize: 11, textAlign: "center" } },
        ],
        series: [
          {
            type: "pie",
            silent: true,
            radius: ["55%", "75%"],
            center: ["50%", "53%"],
            data: values.map((item) => ({ value: item.value, itemStyle: { color: `${item.color}35` } })),
            label: { show: false },
          },
          {
            type: "pie",
            radius: ["56%", "76%"],
            center: ["50%", "49%"],
            startAngle: 90,
            padAngle: 1,
            itemStyle: { borderColor: "#06203a", borderWidth: 2, shadowBlur: 18, shadowColor: "rgba(34,211,238,.16)" },
            label: { show: false },
            emphasis: { scaleSize: 7 },
            data: values.map((item) => ({ name: item.name, value: item.value, itemStyle: { color: item.color } })),
          },
        ],
      }}
    />
  );
}

function ThailandInstallMap({
  data,
}: {
  data: Array<{ province: string; geoName: string; count: number }>;
}) {
  const [ready, setReady] = useState(false);
  const [provinceCenters, setProvinceCenters] = useState<Array<{ name: string; coordinate: [number, number] }>>([]);

  useEffect(() => {
    let active = true;
    fetch("/thailand-complete.json")
      .then((response) => response.json())
      .then((geoJson) => {
        if (!active) return;
        echarts.registerMap("solar-thailand", geoJson);
        const centers = (geoJson.features ?? []).map((feature: {
          properties: { name: string };
          geometry: { coordinates: unknown };
        }) => {
          const points: number[][] = [];
          const collectPoints = (coordinates: unknown) => {
            if (!Array.isArray(coordinates)) return;
            if (
              coordinates.length >= 2
              && typeof coordinates[0] === "number"
              && typeof coordinates[1] === "number"
            ) {
              points.push(coordinates as number[]);
              return;
            }
            coordinates.forEach(collectPoints);
          };
          collectPoints(feature.geometry.coordinates);
          const longitudes = points.map((point) => point[0]);
          const latitudes = points.map((point) => point[1]);
          return {
            name: feature.properties.name,
            coordinate: [
              (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
              (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
            ] as [number, number],
          };
        });
        setProvinceCenters(centers);
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => { active = false; };
  }, []);

  if (!ready) {
    return <div className="grid h-[700px] place-items-center text-sm text-slate-500">กำลังโหลดแผนที่ประเทศไทย…</div>;
  }

  const geoNameCorrections: Record<string, string> = {
    Bangkok: "Bangkok Metropolis",
    Buriram: "Buri Ram",
    Chonburi: "Chon Buri",
    Lopburi: "Lop Buri",
    "Nong Bua Lamphu": "Nong Bua Lam Phu",
    "Phang Nga": "Phangnga",
    Prachinburi: "Prachin Buri",
    Sisaket: "Si Sa Ket",
  };
  const thaiNameByGeo = new Map(
    THAILAND_PROVINCES.map((province) => [
      geoNameCorrections[province.nameEn] ?? province.nameEn,
      province.name,
    ]),
  );
  const countByGeo = new Map(data.map((item) => [item.geoName, item.count]));
  const provinceLabelData = provinceCenters.map((item) => ({
    name: item.name,
    province: thaiNameByGeo.get(item.name) ?? item.name,
    value: [...item.coordinate, countByGeo.get(item.name) ?? 0],
  }));
  const max = Math.max(1, ...data.map((item) => item.count));
  const geoRegions = provinceCenters.map((item) => {
    const count = countByGeo.get(item.name) ?? 0;
    const intensity = count / max;
    return {
      name: item.name,
      itemStyle: {
        areaColor: count > 0
          ? `hsl(${194 - intensity * 12} 82% ${24 + intensity * 24}%)`
          : "#0b2940",
      },
    };
  });

  return (
    <div className="relative h-[700px] overflow-hidden [perspective:900px]">
      <div className="pointer-events-none absolute inset-x-[15%] bottom-10 h-20 rounded-[50%] bg-cyan-400/15 blur-3xl" />
      <ReactECharts
        style={{ height: "100%", width: "100%" }}
        option={{
          animationDuration: 1200,
          geo: {
            map: "solar-thailand",
            roam: true,
            scaleLimit: { min: 0.9, max: 6 },
            center: [101.05, 13.15],
            zoom: 0.9,
            layoutCenter: ["50%", "51%"],
            layoutSize: "78%",
            itemStyle: {
              areaColor: "#0b2940",
              borderColor: "#22d3ee",
              borderWidth: 0.8,
              shadowBlur: 18,
              shadowOffsetY: 8,
              shadowColor: "rgba(0,0,0,.6)",
            },
            emphasis: {
              label: { show: false },
              itemStyle: {
                areaColor: "#f59e0b",
                borderColor: "#fde68a",
                borderWidth: 1.5,
                shadowBlur: 24,
                shadowColor: "rgba(245,158,11,.5)",
              },
            },
            regions: geoRegions,
            silent: false,
            z: 8,
          },
          tooltip: {
            trigger: "item",
            backgroundColor: "rgba(2,12,27,.96)",
            borderColor: "rgba(34,211,238,.35)",
            textStyle: { color: "#e2e8f0" },
            formatter: (params: { data?: { province?: string; value?: number[] }; name: string }) => {
              const count = Array.isArray(params.data?.value)
                ? params.data.value[2]
                : (countByGeo.get(params.name) ?? 0);
              return `<strong>${params.data?.province ?? thaiNameByGeo.get(params.name) ?? params.name}</strong><br/><span style="color:#94a3b8">ติดตั้ง</span> <b style="color:#67e8f9">${count}</b> Plant`;
            },
          },
          series: [
            {
              name: "ชื่อจังหวัด",
              type: "scatter",
              coordinateSystem: "geo",
              data: provinceLabelData,
              symbol: "circle",
              symbolSize: (value: number[]) => value[2] > 0 ? Math.min(16, 6 + Math.sqrt(value[2]) * 1.2) : 3,
              itemStyle: {
                color: (params: { value: number[] }) => params.value[2] > 0 ? "#fbbf24" : "#38bdf8",
                borderColor: "#e0f2fe",
                borderWidth: 0.5,
                shadowBlur: 10,
                shadowColor: "rgba(34,211,238,.55)",
              },
              label: {
                show: true,
                position: "top",
                distance: 2,
                formatter: (params: { data: { province: string; value: number[] } }) =>
                  `${params.data.province}\n{count|${params.data.value[2]}}`,
                color: "#f8fafc",
                fontSize: 8,
                lineHeight: 10,
                fontWeight: 600,
                textBorderColor: "#020c1b",
                textBorderWidth: 3,
                rich: {
                  count: {
                    color: "#67e8f9",
                    fontSize: 9,
                    lineHeight: 11,
                    fontWeight: 800,
                  },
                },
              },
              labelLayout: { hideOverlap: false },
              emphasis: {
                scale: 1.8,
                label: {
                  show: true,
                  fontSize: 12,
                  lineHeight: 15,
                  backgroundColor: "rgba(2,12,27,.92)",
                  borderColor: "#22d3ee",
                  borderWidth: 1,
                  borderRadius: 5,
                  padding: [4, 7],
                },
              },
              tooltip: {
                formatter: (params: { data: { province: string; value: number[] } }) =>
                  `<strong>${params.data.province}</strong><br/><span style="color:#94a3b8">ติดตั้ง</span> <b style="color:#67e8f9">${params.data.value[2]}</b> Plant`,
              },
              z: 20,
            },
          ],
        }}
      />
    </div>
  );
}

export default function SolarOverview() {
  const fleet = useSolarFleet();
  const plants = useSolarPlants({}, "power_desc", 1, 100);
  const alarms = useSolarAlarms({ status: "active" });
  const provinceRanking = useSolarProvinceRanking();
  const summary = fleet.data;
  const items = plants.data?.items ?? [];
  const loading = fleet.isLoading || plants.isLoading;
  const error = fleet.error || plants.error;

  const topEnergy = [...items]
    .filter((plant) => (plant.daily_energy_kwh ?? 0) > 0)
    .sort((a, b) => (b.daily_energy_kwh ?? 0) - (a.daily_energy_kwh ?? 0))
    .slice(0, 12);
  const specificYield = [...items]
    .filter((plant) => (plant.capacity_kwp ?? 0) > 0 && (plant.daily_energy_kwh ?? 0) > 0)
    .map((plant) => ({ ...plant, yield: (plant.daily_energy_kwh ?? 0) / (plant.capacity_kwp ?? 1) }))
    .sort((a, b) => b.yield - a.yield)
    .slice(0, 6);

  const severity = alarms.data?.bySeverity ?? {};
  const severityValue = (...keys: string[]) => keys.reduce((sum, key) => sum + Number(severity[key] ?? 0), 0);
  const alarmSegments = [
    { name: "Critical", value: severityValue("1", "critical", "Critical"), color: "#fb3b5b" },
    { name: "Major", value: severityValue("2", "major", "Major"), color: "#ff8a00" },
    { name: "Minor", value: severityValue("3", "minor", "Minor"), color: "#facc15" },
    { name: "Warning", value: severityValue("4", "warning", "Warning"), color: "#38bdf8" },
  ];
  const classifiedAlarms = alarmSegments.reduce((sum, item) => sum + item.value, 0);
  if (!classifiedAlarms && (summary?.activeAlarmCount ?? 0) > 0) {
    alarmSegments[1].value = summary?.activeAlarmCount ?? 0;
  }

  return (
    <SolarState loading={loading} error={error} empty={!summary?.plantCount}>
      <div className="min-h-[calc(100vh-65px)] w-full overflow-hidden border-y border-cyan-300/15 bg-[#03162b] shadow-[0_30px_100px_rgba(0,0,0,.35),inset_0_1px_rgba(255,255,255,.05)]">
        <section className="relative isolate overflow-hidden px-5 pb-7 pt-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(14,165,233,.3),transparent_45%),linear-gradient(115deg,#031326,#07305a_50%,#031326)]" />
          <div className="pointer-events-none absolute inset-x-[-10%] bottom-[-120px] -z-10 h-[280px] origin-bottom rotate-x-[66deg] bg-[linear-gradient(rgba(34,211,238,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.13)_1px,transparent_1px)] bg-[size:46px_46px] opacity-70 [transform:perspective(500px)_rotateX(58deg)] [mask-image:linear-gradient(to_top,black,transparent)]" />
          <div className="pointer-events-none absolute -bottom-14 left-1/2 -z-10 h-40 w-[70%] -translate-x-1/2 rounded-[50%] bg-cyan-400/10 blur-3xl" />

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.25em] text-cyan-300">
                <Radio className="h-3.5 w-3.5 animate-pulse" /> Live fleet intelligence
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Solar Command Center</h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-2 text-xs text-slate-300 backdrop-blur">
              <Activity className="h-4 w-4 text-emerald-400" />
              อัปเดตล่าสุด {dateTime(summary?.latestSampleAt)}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_.8fr_.8fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium text-white">Plant KPIs</h2>
                <Gauge className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Kpi icon={Zap} label="กำลังผลิตปัจจุบัน" value={number(summary?.currentPowerKw)} unit="kW" color="#22d3ee" />
                <Kpi icon={Sun} label="พลังงานวันนี้" value={number(summary?.dailyEnergyKwh)} unit="kWh" color="#fbbf24" />
                <Kpi icon={Cpu} label="กำลังติดตั้งรวม" value={number(summary?.capacityKwp)} unit="kWp" color="#a78bfa" />
                <Kpi icon={Building2} label="โรงไฟฟ้าที่ติดตาม" value={number(summary?.plantCount, 0)} unit="แห่ง" color="#34d399" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-white">Plant Status</h2>
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Realtime</span>
              </div>
              <div className="grid grid-cols-[minmax(150px,1fr)_140px] items-center">
                <RingChart
                  total={summary?.plantCount ?? 0}
                  centerLabel="Total plants"
                  data={[
                    { name: "Normal", value: summary?.healthyCount ?? 0, color: "#18c98b" },
                    { name: "Fault", value: summary?.faultyCount ?? 0, color: "#fb3b5b" },
                    { name: "Offline", value: summary?.offlineCount ?? 0, color: "#64748b" },
                  ]}
                />
                <div className="space-y-3">
                  {[
                    { label: "Normal", value: summary?.healthyCount ?? 0, color: "#18c98b", icon: CircleCheckBig },
                    { label: "Fault", value: summary?.faultyCount ?? 0, color: "#fb3b5b", icon: TriangleAlert },
                    { label: "Offline", value: summary?.offlineCount ?? 0, color: "#94a3b8", icon: WifiOff },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.035] px-3 py-2">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ color: item.color, backgroundColor: `${item.color}18` }}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: item.color }}>{item.label}</p>
                        <p className="text-2xl font-bold leading-none tabular-nums text-white">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-white">Active Alarms</h2>
                <Link to="/solar-monitoring/alarms" className="text-cyan-300 transition hover:text-white"><ArrowUpRight className="h-4 w-4" /></Link>
              </div>
              <div className="grid grid-cols-[minmax(150px,1fr)_150px] items-center">
                <RingChart total={summary?.activeAlarmCount ?? 0} centerLabel="Total alarms" data={alarmSegments} />
                <div className="space-y-2">
                  {alarmSegments.map((item, index) => {
                    const AlarmIcon = [ShieldAlert, Zap, CircleAlert, AlertTriangle][index];
                    return (
                    <div key={item.name} className="flex items-center gap-2 rounded-xl border border-white/[.06] bg-white/[.035] px-2.5 py-2">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ color: item.color, backgroundColor: `${item.color}18` }}>
                        <AlarmIcon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium" style={{ color: item.color }}>{item.name}</p>
                        <strong className="block text-xl leading-none tabular-nums text-white">{item.value}</strong>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#06101f] p-4 sm:p-6">
          <div className="grid items-stretch gap-5 xl:grid-cols-2">
            <div className="grid min-w-0 gap-5">
              <SolarCard className="min-w-0 border-cyan-300/10 bg-[#091628]/90">
                <div className="mb-2 flex items-center justify-between">
                  <div><h2 className="font-semibold text-white">Specific Energy Ranking</h2><p className="text-xs text-slate-500">พลังงานวันนี้ ÷ กำลังติดตั้ง</p></div>
                  <Link to="/solar-monitoring/plants" className="text-xs text-cyan-300">ดูทั้งหมด</Link>
                </div>
                <ReactECharts
                  style={{ height: 300 }}
                  option={{
                    tooltip: { trigger: "axis", backgroundColor: "#06101f", borderColor: "#164e63", textStyle: { color: chartText }, valueFormatter: (value: number) => `${number(value)} kWh/kWp` },
                    grid: { left: 115, right: 40, top: 15, bottom: 20 },
                    xAxis: { type: "value", axisLabel: { color: "#64748b" }, splitLine: { lineStyle: { color: chartGrid } } },
                    yAxis: { type: "category", inverse: true, data: specificYield.map((plant) => plant.plant_name), axisLabel: { color: chartText, width: 100, overflow: "truncate" }, axisLine: { show: false }, axisTick: { show: false } },
                    series: [{ type: "bar", barWidth: 12, data: specificYield.map((plant) => Number(plant.yield.toFixed(2))), label: { show: true, position: "right", color: chartText, formatter: "{c}" }, itemStyle: { borderRadius: 8, color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#0ea5e9" }, { offset: 1, color: "#22d3ee" }] } } }],
                  }}
                />
              </SolarCard>

              <SolarCard className="flex min-w-0 flex-col border-cyan-300/10 bg-[#091628]/90 p-0">
                <div className="flex flex-col gap-3 border-b border-white/[.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-white">Energy Yield by Plant</h2>
                    <p className="text-xs text-slate-500">พลังงานสะสมวันนี้จากข้อมูล Plant ล่าสุด</p>
                  </div>
                  <div className="rounded-lg border border-cyan-300/10 bg-cyan-300/[.05] px-3 py-1.5 text-xs text-cyan-200">Today · {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date())}</div>
                </div>
                <ReactECharts
                  style={{ height: 420 }}
                  option={{
                    tooltip: { trigger: "axis", backgroundColor: "#06101f", borderColor: "#164e63", textStyle: { color: "#e2e8f0" }, valueFormatter: (value: number) => `${number(value)} kWh` },
                    grid: { left: 55, right: 25, top: 30, bottom: 90 },
                    xAxis: { type: "category", data: topEnergy.map((plant) => plant.plant_name), axisLabel: { color: "#64748b", rotate: 34, width: 85, overflow: "truncate" }, axisLine: { lineStyle: { color: chartGrid } }, axisTick: { show: false } },
                    yAxis: { type: "value", name: "kWh", nameTextStyle: { color: "#64748b" }, axisLabel: { color: "#64748b" }, splitLine: { lineStyle: { color: chartGrid } } },
                    series: [{
                      name: "Energy",
                      type: "bar",
                      barMaxWidth: 28,
                      data: topEnergy.map((plant) => plant.daily_energy_kwh ?? 0),
                      itemStyle: { borderRadius: [7, 7, 0, 0], color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#34d399" }, { offset: 1, color: "#0891b2" }] }, shadowBlur: 14, shadowColor: "rgba(34,211,238,.2)" },
                    }],
                  }}
                />
              </SolarCard>
            </div>

            <SolarCard className="relative flex min-w-0 flex-col overflow-hidden border-cyan-300/10 bg-[#091628]/90 p-0">
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4 border-b border-white/[.06] px-5 py-4">
                <div>
                  <h2 className="font-semibold text-white">จังหวัดที่ติดตั้งมากที่สุด</h2>
                  <p className="text-xs text-slate-500">แผนที่ความหนาแน่นจากข้อความที่อยู่ซึ่ง Huawei ส่งมา</p>
                </div>
                <MapPinned className="h-5 w-5 shrink-0 text-cyan-300" />
              </div>
              {provinceRanking.isLoading ? (
                <div className="grid min-h-[700px] flex-1 place-items-center text-sm text-slate-500">กำลังวิเคราะห์ที่อยู่ทั้งหมด…</div>
              ) : (
                <ThailandInstallMap data={provinceRanking.data?.items ?? []} />
              )}
              <div className="relative mt-auto border-t border-white/[.06] bg-slate-950/30 p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {provinceRanking.data?.items.slice(0, 5).map((item, index) => (
                    <div key={item.province} className="rounded-xl border border-white/[.06] bg-white/[.035] p-2.5 text-center">
                      <p className="text-[10px] text-cyan-300">TOP {index + 1}</p>
                      <p className="mt-1 truncate text-xs text-slate-300">{item.province}</p>
                      <p className="text-xl font-bold tabular-nums text-white">{item.count}</p>
                    </div>
                  ))}
                </div>
                {provinceRanking.data && (
                  <p className="mt-3 text-center text-[11px] text-slate-500">
                    ระบุจังหวัดได้ {number(provinceRanking.data.matched, 0)} จาก {number(provinceRanking.data.total, 0)} Plant
                    {provinceRanking.data.unmatched > 0 && ` • ไม่พบชื่อจังหวัด ${number(provinceRanking.data.unmatched, 0)} Plant`}
                  </p>
                )}
              </div>
            </SolarCard>
          </div>
        </section>
      </div>
    </SolarState>
  );
}
