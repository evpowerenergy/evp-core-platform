import { AlertCircle, Database, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SolarCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10", className)}>{children}</section>;
}

export function MetricCard({
  label,
  value,
  unit,
  tone = "amber",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "amber" | "emerald" | "red" | "cyan";
  hint?: string;
}) {
  const tones = {
    amber: "from-amber-400 to-orange-500",
    emerald: "from-emerald-400 to-teal-500",
    red: "from-red-400 to-rose-500",
    cyan: "from-cyan-400 to-blue-500",
  };
  return (
    <SolarCard className="overflow-hidden">
      <div className={cn("mb-4 h-1 w-12 rounded-full bg-gradient-to-r", tones[tone])} />
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold sm:text-3xl">{value} {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}</p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </SolarCard>
  );
}

export function SolarState({
  loading,
  error,
  empty,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  children: React.ReactNode;
}) {
  if (loading) return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-white/10 bg-slate-900/50">
      <div className="text-center text-slate-400"><Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-amber-400" />กำลังโหลดข้อมูล Solar</div>
    </div>
  );
  if (error) return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-red-400/20 bg-red-500/5 p-6 text-center">
      <div><AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" /><p className="font-medium">โหลดข้อมูลไม่สำเร็จ</p><p className="mt-1 text-sm text-slate-400">{error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง"}</p></div>
    </div>
  );
  if (empty) return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-900/30 p-6 text-center">
      <div><Database className="mx-auto mb-3 h-8 w-8 text-slate-500" /><p className="font-medium">ยังไม่มีข้อมูล</p><p className="mt-1 text-sm text-slate-400">เปิด Integration และรอการ Sync รอบแรก</p></div>
    </div>
  );
  return <>{children}</>;
}
