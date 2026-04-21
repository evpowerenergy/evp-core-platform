import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import CompanyLogo from "@/components/CompanyLogo";
import { cn } from "@/lib/utils";
import { useChargingPageMeta } from "./ChargingPageMetaContext";

export function ChargingStationHeader({ className }: { className?: string }) {
  const { meta } = useChargingPageMeta();
  const showStation = Boolean(meta.dominantStation?.trim());

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/70",
        className
      )}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
            <Link
              to="/backoffice"
              className="group flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-200 sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">ศูนย์ควบคุม</span>
              <span className="sm:hidden">กลับ</span>
            </Link>
            <div className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden />
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:block [&_img]:brightness-0 [&_img]:invert">
                <CompanyLogo size="sm" showText={false} clickable={false} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                    Super EV Hub
                  </h1>
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30 sm:inline-flex">
                    <Sparkles className="h-3 w-3" />
                    วิเคราะห์
                  </span>
                </div>
                <p className="truncate text-[11px] text-slate-400 sm:text-xs">สถานีชาร์จ · ประมวลผลบนเครื่องคุณ ไม่อัปโหลดไปเซิร์ฟเวอร์</p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <UserProfileDropdown />
          </div>
        </div>

        {showStation ? (
          <div className="flex items-start gap-2 border-t border-white/10 py-2.5 sm:items-center sm:gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 sm:mt-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">สถานีที่โผล่ในไฟล์บ่อยที่สุด</p>
              <p className="truncate text-sm font-semibold text-amber-100/95 sm:text-base" title={meta.dominantStation ?? undefined}>
                {meta.dominantStation}
              </p>
            </div>
            {meta.capacityKw != null ? (
              <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs tabular-nums text-slate-300">
                กำลังตู้ ~{meta.capacityKw} kW
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
