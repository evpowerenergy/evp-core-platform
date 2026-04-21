import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  BatteryCharging,
  ChevronDown,
  DollarSign,
  FileSpreadsheet,
  Gauge,
  Percent,
  Shield,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { parseChargingCsvFile, type MonthlyUtilizationRow } from "@/utils/chargingStationCsvAnalytics";
import { useChargingPageMeta } from "@/components/charging-station/ChargingPageMetaContext";
import { cn } from "@/lib/utils";

function formatBaht(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(n: number | null) {
  if (n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function formatKw(n: number | null) {
  if (n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)} kW`;
}

function formatMonthLabelThai(yyyyMm: string | null): string {
  if (!yyyyMm) return "";
  const [ys, ms] = yyyyMm.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return yyyyMm;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

/** YYYY-MM-DD → วันที่ไทยสั้น */
function formatDateKeyThai(yyyyMmDd: string | null): string {
  if (!yyyyMmDd) return "";
  const [ys, ms, ds] = yyyyMmDd.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const day = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) return yyyyMmDd;
  return new Date(y, m - 1, day).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function utilizationWindowFootText(kpis: {
  utilizationWindowStartDate: string | null;
  utilizationWindowEndDate: string | null;
  utilizationWindowDays: number | null;
  capacityKw: number | null;
}): string {
  if (!kpis.utilizationWindowEndDate || !kpis.utilizationWindowStartDate) {
    return "ยังไม่มีวันที่เริ่มชาร์จในไฟล์ — เลือกไฟล์ที่มีข้อมูลก่อน";
  }
  const days = kpis.utilizationWindowDays ?? 30;
  const cap = kpis.capacityKw ?? "—";
  return `นับตั้งแต่ ${formatDateKeyThai(kpis.utilizationWindowStartDate)} ถึง ${formatDateKeyThai(kpis.utilizationWindowEndDate)} · เทียบกับถ้าตู้ทำงานเต็มกำลัง ${cap} kW ต่อวัน × ${days} วัน`;
}

/** แกนกราฟ — สีเข้มพออ่านบนพื้นอ่อน */
const tickAxisSm = { fill: "#1e293b", fontSize: 11, fontWeight: 600 as number };
const tickAxisXs = { fill: "#334155", fontSize: 10, fontWeight: 500 as number };
const gridSoft = { stroke: "#64748b", strokeOpacity: 0.28 };
const tooltipLabelStyle = { color: "#0f172a", fontWeight: 700, fontSize: 12 };
const tooltipItemStyle = { color: "#334155", fontSize: 12, fontWeight: 500 };
const legendReadable = {
  paddingTop: 8,
  fontSize: 12,
  fontWeight: 600,
  color: "#0f172a",
};

function KpiSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 border-b border-white/10 pb-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h2>
        {hint ? <p className="max-w-xl text-xs leading-snug text-slate-500">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  title,
  icon: Icon,
  accent,
  children,
  foot,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  accent: "amber" | "orange" | "emerald" | "violet" | "cyan" | "rose";
  children: ReactNode;
  foot?: ReactNode;
}) {
  const ring: Record<typeof accent, string> = {
    amber: "from-amber-400/80 to-amber-600/0",
    orange: "from-orange-400/80 to-orange-600/0",
    emerald: "from-emerald-400/80 to-emerald-600/0",
    violet: "from-violet-400/80 to-violet-600/0",
    cyan: "from-cyan-400/80 to-cyan-600/0",
    rose: "from-rose-400/80 to-rose-600/0",
  };
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]"
      )}
    >
      <div
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-90", ring[accent])}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner ring-1 ring-white/10",
            accent === "amber" && "from-amber-500/25 to-amber-600/10 text-amber-300",
            accent === "orange" && "from-orange-500/25 to-orange-600/10 text-orange-300",
            accent === "emerald" && "from-emerald-500/25 to-emerald-600/10 text-emerald-300",
            accent === "violet" && "from-violet-500/25 to-violet-600/10 text-violet-300",
            accent === "cyan" && "from-cyan-500/25 to-cyan-600/10 text-cyan-300",
            accent === "rose" && "from-rose-500/25 to-rose-600/10 text-rose-300"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-white">{children}</div>
      {foot ? <p className="mt-2 text-xs leading-relaxed text-slate-500">{foot}</p> : null}
    </div>
  );
}

/** กรอบกราฟ: หัวข้อ + พื้นหลังไล่เฉด + แผง chart สว่างด้านใน */
function ChartSurface({
  title,
  description,
  children,
  chartHeightClass = "h-[280px]",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  chartHeightClass?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-slate-900/25 to-slate-950/40 shadow-xl shadow-black/25 ring-1 ring-white/5">
      <div className="relative border-b border-white/5 px-5 py-3.5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/[0.06] via-transparent to-violet-500/[0.06]" />
        <h3 className="relative text-sm font-semibold tracking-tight text-white">{title}</h3>
        {description ? <p className="relative mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="relative p-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(251,191,36,0.12), transparent 50%)",
          }}
        />
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] ring-1 ring-slate-300/60",
            chartHeightClass
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const chartAnim = { isAnimationActive: true, animationDuration: 700, animationEasing: "ease-out" as const };

const tooltipLightStyle = {
  borderRadius: 12,
  border: "1px solid rgba(226, 232, 240, 0.95)",
  boxShadow: "0 10px 40px -10px rgba(15, 23, 42, 0.2)",
};

export default function ChargingStationDashboard() {
  const { setMeta } = useChargingPageMeta();
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [includeFailed, setIncludeFailed] = useState(false);
  const [importOpen, setImportOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didAutoCollapse = useRef(false);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
    };
    reader.readAsText(f, "UTF-8");
  }, []);

  const analytics = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseChargingCsvFile(csvText, { includeFailedInMoneyAndEnergy: includeFailed });
  }, [csvText, includeFailed]);

  useEffect(() => {
    if (!csvText.trim()) {
      didAutoCollapse.current = false;
      setImportOpen(true);
    }
  }, [csvText]);

  useEffect(() => {
    if (analytics && !didAutoCollapse.current) {
      setImportOpen(false);
      didAutoCollapse.current = true;
    }
  }, [analytics]);

  const topUsers = useMemo(() => {
    if (!analytics) return [];
    const map = new Map<string, { sessions: number; kwh: number; gross: number }>();
    for (const s of analytics.sessions) {
      const u = (s.userName || "").trim();
      if (!u) continue;
      const cur = map.get(u) ?? { sessions: 0, kwh: 0, gross: 0 };
      cur.sessions += 1;
      cur.kwh += s.kwh;
      cur.gross += s.grossBaht;
      map.set(u, cur);
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 15);
  }, [analytics]);

  const kpis = analytics?.kpis;
  const rowCount = analytics?.sessions.length ?? 0;

  useEffect(() => {
    if (!kpis) {
      setMeta({ dominantStation: null, capacityKw: null });
      return;
    }
    setMeta({
      dominantStation: kpis.dominantStation,
      capacityKw: kpis.capacityKw,
    });
    return () => {
      setMeta({ dominantStation: null, capacityKw: null });
    };
  }, [kpis, setMeta]);

  return (
    <div className="space-y-8 pb-8">
      {/* Hero — compact */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.05] via-slate-900/30 to-violet-950/20 px-5 py-5 shadow-lg shadow-black/30 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/15 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-md shadow-amber-500/20 ring-1 ring-white/15">
              <BatteryCharging className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  <span className="bg-gradient-to-r from-white to-amber-100/90 bg-clip-text text-transparent">
                    Super EV Hub
                  </span>
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  <Shield className="h-3 w-3 text-emerald-400" />
                  ประมวลผลในเบราว์เซอร์
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {analytics
                  ? `วิเคราะห์จาก ${rowCount.toLocaleString("th-TH")} แถวในไฟล์ — รายได้ ไฟที่จ่าย และลูกค้า`
                  : "อัปโหลดไฟล์ CSV เพื่อดูรายได้ Utilization Rate และสรุปลูกค้า"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Import — collapsible */}
      <Collapsible open={importOpen} onOpenChange={setImportOpen}>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/20 backdrop-blur-sm">
          {/* แถบสรุปเมื่อหุบ + ปุ่มขยาย */}
          {analytics && !importOpen ? (
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/25">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {fileName ?? "ข้อมูลโหลดแล้ว"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {rowCount.toLocaleString("th-TH")} แถว — พร้อมดูตัวเลขและกราฟ
                  </p>
                </div>
                <Badge variant="secondary" className="hidden shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-200 sm:inline-flex">
                  โหลดแล้ว
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5">
                  <Label htmlFor="include-failed-collapsed" className="cursor-pointer text-xs text-slate-400">
                    นับรายการชำระไม่สำเร็จด้วย
                  </Label>
                  <Switch id="include-failed-collapsed" checked={includeFailed} onCheckedChange={setIncludeFailed} />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-amber-500/35 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                  onClick={() => setImportOpen(true)}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  เปลี่ยนไฟล์
                </Button>
              </div>
            </div>
          ) : null}

          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-none">
            <div className="border-t border-white/5 p-5 sm:p-6">
              {analytics ? (
                <button
                  type="button"
                  className="mb-4 flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left sm:hidden"
                  onClick={() => setImportOpen(false)}
                >
                  <span className="text-sm font-medium text-white">หุบแถบนำเข้า</span>
                  <ChevronDown className="h-4 w-4 rotate-180 text-slate-500" />
                </button>
              ) : null}

              <div className="mb-4 hidden items-center justify-between sm:flex">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                    <Upload className="h-4 w-4 text-amber-400" />
                    นำเข้าข้อมูล
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">ไฟล์ CSV จากระบบจัดการสถานี — รองรับภาษาไทย (UTF-8)</p>
                </div>
                {analytics ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:bg-white/5 hover:text-white"
                    onClick={() => setImportOpen(false)}
                  >
                    <ChevronDown className="mr-1 h-4 w-4 rotate-180" />
                    หุบแถบนี้
                  </Button>
                ) : null}
              </div>

              <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} />

              <button
                type="button"
                className={cn(
                  "group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-500/30 bg-gradient-to-b from-amber-500/[0.07] to-transparent px-4 py-8 transition-all duration-300 hover:border-amber-400/55 hover:from-amber-500/12 hover:shadow-lg hover:shadow-amber-500/10 sm:py-9"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-400/35 transition-transform group-hover:scale-105">
                  <Upload className="h-5 w-5 text-amber-300" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-white">เลือกไฟล์ CSV</span>
                  <p className="mt-0.5 text-xs text-slate-500">คลิกเพื่อเลือก · ไม่อัปโหลดขึ้นเซิร์ฟเวอร์</p>
                </div>
              </button>

              {fileName ? (
                <p className="mt-3 text-center text-xs text-slate-500">
                  ไฟล์: <span className="font-medium text-amber-200/90">{fileName}</span>
                </p>
              ) : null}

              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-failed" className="text-sm font-medium text-slate-200">
                    เอารายการชำระไม่สำเร็จมารวมในยอดเงินและหน่วยไฟ
                  </Label>
                  <p className="text-xs text-slate-500">ปิดไว้ = นับเฉพาะที่ชำระเงินผ่าน</p>
                </div>
                <Switch id="include-failed" checked={includeFailed} onCheckedChange={setIncludeFailed} />
              </div>

              {analytics?.parseWarnings.length ? (
                <ul className="mt-4 list-inside list-disc rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
                  {analytics.parseWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>

      {!analytics && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center backdrop-blur-sm">
          <Zap className="mx-auto mb-3 h-12 w-12 text-amber-400/35" />
          <p className="font-medium text-slate-300">ยังไม่มีข้อมูล</p>
          <p className="mt-1 text-sm text-slate-500">อัปโหลดไฟล์ด้านบนเพื่อดูตัวเลขสรุปและกราฟ</p>
        </div>
      )}

      {analytics && kpis && (
        <>
          <KpiSection
            title="รายได้และการใช้พลังงาน"
            hint="อ่านจากซ้ายไปขวา: เงินเข้ากระเป๋า → ยอดก่อนหัก → ไฟที่จ่ายออก → เปอร์เซ็นต์Utilization Rate (30 วันล่าสุดจากข้อมูลในไฟล์)"
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="รายได้สุทธิ" icon={DollarSign} accent="orange" foot="รวมยอดหลังหักค่าธรรมเนียมแล้ว">
                ฿{formatBaht(kpis.totalNet)}
              </KpiCard>
              <KpiCard title="รายได้รวม (ก่อนหัก)" icon={DollarSign} accent="amber" foot="รวมยอดก่อนหัก รวม VAT">
                ฿{formatBaht(kpis.totalGross)}
              </KpiCard>
              <KpiCard title="พลังงานรวม" icon={Zap} accent="cyan" foot="หน่วย kWh ตามรายการที่เลือกนับ (สวิตช์ด้านบน)">
                {kpis.totalKwh.toLocaleString("th-TH", { maximumFractionDigits: 3 })} kWh
              </KpiCard>
              <KpiCard
                title="Utilization Rate (30 วันย้อนหลัง)"
                icon={Gauge}
                accent="violet"
                foot={utilizationWindowFootText(kpis)}
              >
                {formatPct(kpis.utilizationPct)}
              </KpiCard>
            </div>
          </KpiSection>

          <KpiSection
            title="คุณภาพการชาร์จและการจ่ายเงิน"
            hint="ชำระผ่านกี่เปอร์เซ็นต์ · ยอดเฉลี่ยต่อครั้ง · ความเร็วจ่ายไฟโดยประมาณ"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                title="อัตราชำระสำเร็จ"
                icon={Percent}
                accent="emerald"
                foot={`${kpis.successCount} / ${kpis.allSessionCount} ครั้งชาร์จ (ทุกแถวในไฟล์)`}
              >
                {formatPct(kpis.successRatePct)}
              </KpiCard>
              <KpiCard
                title="ยอดเฉลี่ยต่อครั้ง (ก่อนหัก)"
                icon={DollarSign}
                accent="amber"
                foot={`เฉลี่ยจาก ${kpis.sessionCountForMetrics} ครั้งที่ใช้คำนวณยอดเงิน`}
              >
                {kpis.avgTicketGross != null ? `฿${formatBaht(kpis.avgTicketGross)}` : "—"}
              </KpiCard>
              <KpiCard title="ความเร็วจ่ายไฟเฉลี่ย" icon={Gauge} accent="violet" foot="ไฟรวม ÷ เวลาชาร์จรวม (ประมาณ kW)">
                {formatKw(kpis.avgSpeedKw)}
              </KpiCard>
            </div>
          </KpiSection>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid h-auto w-full max-w-3xl grid-cols-2 gap-1 rounded-2xl bg-slate-950/80 p-1.5 ring-1 ring-white/10 sm:grid-cols-4">
              {["overview", "customer", "usage", "revenue"].map((v, i) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="rounded-xl py-2.5 text-sm font-medium text-slate-400 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25"
                >
                  {["ภาพรวม", "ลูกค้า", "การใช้งาน", "รายได้"][i]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6 focus-visible:outline-none">
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartSurface title="ช่วงไหนคนมาชาร์จเยอะ" description="จำนวนครั้งชาร์จในแต่ละชั่วโมง (0–23 น.)">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.hourly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} {...chartAnim}>
                      <defs>
                        <linearGradient id="csms-hour-bar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" {...gridSoft} vertical={false} />
                      <XAxis dataKey="hour" tick={tickAxisSm} axisLine={{ stroke: "#94a3b8" }} tickLine={{ stroke: "#94a3b8" }} />
                      <YAxis tick={tickAxisSm} axisLine={{ stroke: "#94a3b8" }} tickLine={{ stroke: "#94a3b8" }} width={40} />
                      <Tooltip
                        cursor={{ fill: "rgba(251, 191, 36, 0.12)" }}
                        contentStyle={tooltipLightStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(v: number) => [v.toLocaleString("th-TH"), "ครั้งชาร์จ"]}
                        labelFormatter={(h) => `ชั่วโมง ${h}`}
                      />
                      <Bar dataKey="sessions" fill="url(#csms-hour-bar)" name="ครั้งชาร์จ" radius={[8, 8, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartSurface>

                <ChartSurface title="รายได้รายวัน (ก่อนหัก)" description="แนวโน้มยอดก่อนหักแยกตามวัน">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.dailyRevenue} margin={{ top: 12, right: 8, left: 0, bottom: 4 }} {...chartAnim}>
                      <defs>
                        <linearGradient id="csms-daily-gross-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ea580c" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" {...gridSoft} vertical={false} />
                      <XAxis
                        dataKey="dateKey"
                        tick={tickAxisXs}
                        angle={-30}
                        textAnchor="end"
                        height={48}
                        axisLine={{ stroke: "#94a3b8" }}
                        tickLine={{ stroke: "#94a3b8" }}
                      />
                      <YAxis tick={tickAxisSm} axisLine={{ stroke: "#94a3b8" }} tickLine={{ stroke: "#94a3b8" }} width={48} />
                      <Tooltip
                        contentStyle={tooltipLightStyle}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={tooltipItemStyle}
                        formatter={(v: number) => [`฿${formatBaht(v)}`, "ก่อนหัก"]}
                        labelFormatter={(d) => `วันที่ ${d}`}
                      />
                      <Area type="monotone" dataKey="gross" stroke="none" fill="url(#csms-daily-gross-area)" />
                      <Line
                        type="monotone"
                        dataKey="gross"
                        stroke="#c2410c"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: "#ea580c", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartSurface>
              </div>

              <ChartSurface
                chartHeightClass="h-[320px]"
                title="Utilization Rateรายเดือน"
                description={`ไฟที่จ่ายในเดือนนั้น เทียบกับถ้าตู้เต็มกำลัง ${kpis.capacityKw ?? "—"} kW ตลอดเดือน`}
              >
                {analytics.monthlyUtilization.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm font-medium text-slate-700">
                    ไม่มีข้อมูลรายเดือนในไฟล์
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.monthlyUtilization} margin={{ top: 12, right: 12, left: 0, bottom: 4 }} {...chartAnim}>
                      <defs>
                        <linearGradient id="csms-util-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" {...gridSoft} vertical={false} />
                      <XAxis
                        dataKey="labelShort"
                        tick={tickAxisSm}
                        interval={0}
                        angle={analytics.monthlyUtilization.length > 8 ? -32 : 0}
                        textAnchor={analytics.monthlyUtilization.length > 8 ? "end" : "middle"}
                        height={analytics.monthlyUtilization.length > 8 ? 56 : 32}
                        axisLine={{ stroke: "#94a3b8" }}
                        tickLine={{ stroke: "#94a3b8" }}
                      />
                      <YAxis
                        tick={{ ...tickAxisSm, fontSize: 11 }}
                        tickFormatter={(v) => `${v}%`}
                        domain={[0, "auto"]}
                        axisLine={{ stroke: "#94a3b8" }}
                        tickLine={{ stroke: "#94a3b8" }}
                        width={44}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const row = payload[0].payload as MonthlyUtilizationRow;
                          return (
                            <div className="rounded-xl border border-violet-200/90 bg-white px-3 py-2 text-xs shadow-xl" style={tooltipLightStyle}>
                              <p className="font-semibold text-slate-900">{formatMonthLabelThai(row.monthKey)}</p>
                              <p className="text-violet-700">Utilization Rate: {row.utilizationPct.toFixed(2)}%</p>
                              <p className="text-slate-600">
                                {row.kwh.toLocaleString("th-TH", { maximumFractionDigits: 3 })} kWh · {row.daysInMonth} วัน
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="utilizationPct" stroke="none" fill="url(#csms-util-area)" />
                      <Line
                        type="monotone"
                        dataKey="utilizationPct"
                        stroke="#6d28d9"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </ChartSurface>
            </TabsContent>

            <TabsContent value="customer" className="mt-6 space-y-6 focus-visible:outline-none">
              <KpiSection
                title="สรุปลูกค้า"
                hint="ใช้ชื่อจากไฟล์เท่านั้น — ตัวเลขนับเฉพาะช่วงในไฟล์นี้ ไม่ได้แปลว่าเป็นสมาชิกใหม่ของสถานี"
              >
              <div className="grid gap-4 md:grid-cols-3">
                <KpiCard
                  title="มีลูกค้ากี่คน"
                  icon={Users}
                  accent="cyan"
                  foot="นับคนไม่ซ้ำ — คนเดียวกันชาร์จหลายครั้งยังนับเป็น 1 คน"
                >
                  {analytics.customerRetention.uniqueUsers}
                </KpiCard>
                <KpiCard
                  title="ชาร์จแค่ครั้งเดียว"
                  icon={Users}
                  accent="emerald"
                  foot="ในไฟล์นี้คนนั้นมีแค่ 1 ครั้ง — ไม่ได้แปลว่าเป็นคนใหม่เสมอไป"
                >
                  {analytics.customerRetention.newCustomers}
                </KpiCard>
                <KpiCard
                  title="ชาร์จมากกว่าหนึ่งครั้ง"
                  icon={Users}
                  accent="amber"
                  foot="ในไฟล์นี้คนเดิมกลับมาชาร์จมากกว่าหนึ่งครั้ง"
                >
                  {analytics.customerRetention.returningCustomers}
                </KpiCard>
              </div>
              </KpiSection>
              <Card className="border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base text-white">ลูกค้าที่ทำรายได้สูงสุด</CardTitle>
                  <CardDescription className="text-slate-500">
                    เรียงจากยอดก่อนหักรวม — ชื่อตามที่อยู่ในไฟล์
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/30 p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-slate-400">#</TableHead>
                        <TableHead className="text-slate-400">ชื่อในระบบ</TableHead>
                        <TableHead className="text-right text-slate-400">ครั้งชาร์จ</TableHead>
                        <TableHead className="text-right text-slate-400">ไฟ (kWh)</TableHead>
                        <TableHead className="text-right text-slate-400">ยอดก่อนหัก</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topUsers.map((r, i) => (
                        <TableRow key={r.name} className="border-white/5 hover:bg-white/[0.04]">
                          <TableCell className="text-slate-500">{i + 1}</TableCell>
                          <TableCell className="font-medium text-slate-200">{r.name}</TableCell>
                          <TableCell className="text-right tabular-nums text-slate-300">{r.sessions}</TableCell>
                          <TableCell className="text-right tabular-nums text-slate-300">{r.kwh.toFixed(3)}</TableCell>
                          <TableCell className="text-right tabular-nums text-amber-200/90">฿{formatBaht(r.gross)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="mt-6 space-y-6 focus-visible:outline-none">
              <ChartSurface title="วันไหนคึกคัก" description="จันทร์ถึงอาทิตย์ — ครั้งชาร์จและหน่วยไฟ">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dayOfWeek} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} {...chartAnim}>
                    <defs>
                      <linearGradient id="csms-dow-sess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                      <linearGradient id="csms-dow-kwh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" {...gridSoft} vertical={false} />
                    <XAxis dataKey="label" tick={tickAxisSm} axisLine={{ stroke: "#94a3b8" }} tickLine={{ stroke: "#94a3b8" }} />
                    <YAxis yAxisId="left" tick={tickAxisSm} axisLine={{ stroke: "#94a3b8" }} tickLine={{ stroke: "#94a3b8" }} width={40} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={tickAxisSm}
                      axisLine={{ stroke: "#94a3b8" }}
                      tickLine={{ stroke: "#94a3b8" }}
                      width={44}
                    />
                    <Tooltip
                      contentStyle={tooltipLightStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                    />
                    <Legend wrapperStyle={legendReadable} iconType="circle" iconSize={8} />
                    <Bar yAxisId="left" dataKey="sessions" fill="url(#csms-dow-sess)" name="ครั้งชาร์จ" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar yAxisId="right" dataKey="kwh" fill="url(#csms-dow-kwh)" name="หน่วยไฟ (kWh)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartSurface>
              <Card className="border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base text-white">หัวจ่ายแต่ละช่อง</CardTitle>
                  <CardDescription className="text-slate-500">
                    สัดส่วนครั้งที่จ่ายไม่สำเร็จ เทียบกับครั้งที่พยายามจ่ายทั้งหมดของช่องนั้น
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-slate-400">รหัสหัวจ่าย</TableHead>
                        <TableHead className="text-right text-slate-400">สำเร็จ</TableHead>
                        <TableHead className="text-right text-slate-400">ไม่สำเร็จ</TableHead>
                        <TableHead className="text-right text-slate-400">อัตราผิดพลาด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.connectorReliability.map((c) => (
                        <TableRow key={c.connector} className="border-white/5 hover:bg-white/[0.04]">
                          <TableCell className="font-mono text-sm text-slate-200">{c.connector}</TableCell>
                          <TableCell className="text-right text-slate-300">{c.success}</TableCell>
                          <TableCell className="text-right text-slate-300">{c.failed}</TableCell>
                          <TableCell className="text-right">
                            {c.errorRatePct != null ? (
                              <Badge
                                variant={c.errorRatePct > 10 ? "destructive" : "secondary"}
                                className="font-mono"
                              >
                                {c.errorRatePct.toFixed(2)}%
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="mt-6 space-y-6 focus-visible:outline-none">
              <ChartSurface
                chartHeightClass="h-[320px]"
                title="รายได้รายวัน (สองเส้น)"
                description="เส้นส้ม = ก่อนหัก · เส้นม่วง = หลังหัก · พื้นที่ใต้เส้นช่วยดูระดับยอด"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.dailyRevenue} margin={{ top: 12, right: 8, left: 0, bottom: 4 }} {...chartAnim}>
                    <defs>
                      <linearGradient id="csms-rev-gross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="csms-rev-net" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" {...gridSoft} vertical={false} />
                    <XAxis
                      dataKey="dateKey"
                      tick={tickAxisXs}
                      angle={-28}
                      textAnchor="end"
                      height={52}
                      axisLine={{ stroke: "#94a3b8" }}
                      tickLine={{ stroke: "#94a3b8" }}
                    />
                    <YAxis tick={tickAxisSm} axisLine={{ stroke: "#94a3b8" }} tickLine={{ stroke: "#94a3b8" }} width={48} />
                    <Tooltip
                      contentStyle={tooltipLightStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                      formatter={(v: number) => [`฿${formatBaht(v)}`, ""]}
                      labelFormatter={(d) => `วันที่ ${d}`}
                    />
                    <Legend wrapperStyle={legendReadable} iconType="circle" iconSize={8} />
                    <Area type="monotone" dataKey="gross" stroke="none" fill="url(#csms-rev-gross)" />
                    <Area type="monotone" dataKey="net" stroke="none" fill="url(#csms-rev-net)" />
                    <Line
                      type="monotone"
                      dataKey="gross"
                      stroke="#d97706"
                      strokeWidth={2.5}
                      dot={false}
                      name="ก่อนหัก"
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#6d28d9"
                      strokeWidth={2.5}
                      dot={false}
                      name="หลังหัก"
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartSurface>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
