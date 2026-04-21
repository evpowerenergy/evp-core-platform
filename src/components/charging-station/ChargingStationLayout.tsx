import { ReactNode } from "react";
import { AppointmentToastNotifier } from "@/components/notifications/AppointmentToastNotifier";
import { ChargingPageMetaProvider } from "./ChargingPageMetaContext";
import { ChargingStationHeader } from "./ChargingStationHeader";

interface ChargingStationLayoutProps {
  children: ReactNode;
}

export function ChargingStationLayout({ children }: ChargingStationLayoutProps) {
  return (
    <ChargingPageMetaProvider>
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-1/4 top-0 h-[520px] w-[520px] rounded-full bg-amber-500/15 blur-[120px]" />
        <div className="absolute -right-1/4 top-1/3 h-[480px] w-[480px] rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <ChargingStationHeader />

      <main className="relative z-10 mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>

      <AppointmentToastNotifier />
    </div>
    </ChargingPageMetaProvider>
  );
}
