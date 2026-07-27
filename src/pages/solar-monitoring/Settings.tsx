import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Play, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SolarPageHeader } from "@/components/solar-monitoring/SolarMonitoringLayout";
import { SolarCard, SolarState } from "@/components/solar-monitoring/SolarUI";
import { solarApi } from "@/features/solar-monitoring/api";
import { dateTime } from "@/features/solar-monitoring/format";
import { solarKeys } from "@/features/solar-monitoring/hooks";

export default function SolarSettings() {
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [tariffRate, setTariffRate] = useState("");
  const queryClient = useQueryClient();
  const integration = useQuery({
    queryKey: [...solarKeys.all, "integration"],
    queryFn: async () => {
      return solarApi.integration();
    },
  });
  const action = useMutation({
    mutationFn: (payload: Record<string, unknown>) => solarApi.admin(payload),
    onSuccess: () => {
      toast.success("ส่งคำสั่งเรียบร้อย");
      queryClient.invalidateQueries({ queryKey: solarKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ดำเนินการไม่สำเร็จ"),
  });
  const item = integration.data;
  const plants = useQuery({
    queryKey: [...solarKeys.all, "settings-plants"],
    queryFn: () => solarApi.plants({}, "name_asc", 1, 100),
  });
  const candidates = useQuery({
    queryKey: [...solarKeys.all, "mapping-candidates", selectedPlantId],
    queryFn: () => solarApi.mappingCandidates(selectedPlantId),
    enabled: Boolean(selectedPlantId),
  });
  const mapping = useMutation({
    mutationFn: (customerServiceId: number) => solarApi.confirmMapping(selectedPlantId, customerServiceId),
    onSuccess: () => {
      toast.success("ยืนยันการจับคู่ลูกค้าแล้ว");
      queryClient.invalidateQueries({ queryKey: solarKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "จับคู่ไม่สำเร็จ"),
  });
  const tariff = useMutation({
    mutationFn: () => solarApi.setTariff({
      plantId: selectedPlantId,
      name: "อัตราค่าไฟที่ยืนยัน",
      importRate: Number(tariffRate),
      exportRate: null,
      validFrom: new Date().toISOString().slice(0, 10),
    }),
    onSuccess: () => toast.success("บันทึก Tariff แล้ว"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "บันทึก Tariff ไม่สำเร็จ"),
  });
  return (
    <>
      <SolarPageHeader title="Solar Settings" description="การเชื่อมต่อ การ Sync และ rollout สำหรับผู้ดูแลระบบ" />
      <SolarState loading={integration.isLoading} error={integration.error} empty={!item}>
        <div className="grid gap-6 xl:grid-cols-2">
          <SolarCard>
            <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{item?.name}</h2><p className="mt-1 text-sm text-slate-400">{item?.base_url}</p></div><span className={`rounded-full px-2 py-1 text-xs ${item?.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>{item?.enabled ? "Enabled" : "Paused"}</span></div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-lg bg-slate-950/60 p-3"><span className="text-slate-500">โหมด</span><p className="mt-1 font-medium">{item?.sync_mode}</p></div><div className="rounded-lg bg-slate-950/60 p-3"><span className="text-slate-500">Pilot limit</span><p className="mt-1 font-medium">{item?.pilot_plant_limit} Plant</p></div><div className="rounded-lg bg-slate-950/60 p-3"><span className="text-slate-500">สำเร็จล่าสุด</span><p className="mt-1 font-medium">{dateTime(item?.last_success_at)}</p></div><div className="rounded-lg bg-slate-950/60 p-3"><span className="text-slate-500">Error ล่าสุด</span><p className="mt-1 truncate font-medium text-red-300">{item?.last_error_message ?? "ไม่มี"}</p></div></div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button disabled={action.isPending} onClick={() => action.mutate({ action: "set_integration_enabled", integrationId: item.id, enabled: !item.enabled })} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">{item?.enabled ? "Pause integration" : "Enable integration"}</button>
              <button disabled={action.isPending} onClick={() => action.mutate({ action: "enqueue", integrationId: item.id, jobType: "discover_plants" })} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Sync Plants</button>
              <button disabled={action.isPending} onClick={() => action.mutate({ action: "enqueue", integrationId: item.id, jobType: "discover_devices" })} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm"><Play className="h-4 w-4" /> Sync Devices</button>
            </div>
          </SolarCard>
          <SolarCard>
            <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-emerald-400" /><div><h2 className="font-semibold">Credential safety</h2><p className="text-xs text-slate-400">หน้าเว็บไม่สามารถอ่าน Huawei password หรือ XSRF token</p></div></div>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p>ตั้งค่า Secrets ที่ Edge Functions: <code className="text-amber-300">HUAWEI_USERNAME</code>, <code className="text-amber-300">HUAWEI_PASSWORD</code>, <code className="text-amber-300">SOLAR_CRON_SECRET</code></p>
              <p>หลัง deploy ให้เปิด Integration แล้ว worker จะเริ่มจาก Pilot {item?.pilot_plant_limit} Plant</p>
              <p className="text-amber-200">ต้องเปลี่ยนรหัสผ่านที่เคยส่งในแชตก่อนเปิด production</p>
            </div>
          </SolarCard>
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <SolarCard>
            <h2 className="font-semibold">Customer mapping</h2>
            <p className="mt-1 text-sm text-slate-400">เลือก Plant แล้วตรวจคำแนะนำก่อนยืนยัน ระบบจะไม่จับคู่อัตโนมัติ</p>
            <select value={selectedPlantId} onChange={(event) => setSelectedPlantId(event.target.value)} className="mt-4 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
              <option value="">เลือก Plant</option>
              {plants.data?.items.map((plant) => <option key={plant.id} value={plant.id}>{plant.plant_name}</option>)}
            </select>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {candidates.data?.map((candidate) => (
                <div key={String(candidate.id)} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-slate-950/50 p-3">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{String(candidate.customer_group)}</p><p className="text-xs text-slate-500">{String(candidate.province ?? "—")} • {String(candidate.capacity_kw ?? "—")} kW • score {String(candidate.match_score)}</p></div>
                  <button disabled={mapping.isPending} onClick={() => mapping.mutate(Number(candidate.id))} className="shrink-0 rounded-lg border border-amber-400/20 px-3 py-1.5 text-xs text-amber-200">ยืนยัน</button>
                </div>
              ))}
              {selectedPlantId && !candidates.isLoading && !candidates.data?.length && <p className="text-sm text-slate-500">ไม่พบ candidate ที่ยังว่าง</p>}
            </div>
          </SolarCard>
          <SolarCard>
            <h2 className="font-semibold">Tariff</h2>
            <p className="mt-1 text-sm text-slate-400">KPI การเงินจะเปิดใช้ได้เมื่อมีอัตราที่ผู้ดูแลยืนยัน</p>
            <label className="mt-4 block text-sm text-slate-300">อัตราซื้อไฟ (บาท/kWh)
              <input type="number" min="0" step="0.01" value={tariffRate} onChange={(event) => setTariffRate(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
            </label>
            <button disabled={!selectedPlantId || !tariffRate || tariff.isPending} onClick={() => tariff.mutate()} className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-40">บันทึกอัตราสำหรับ Plant ที่เลือก</button>
          </SolarCard>
        </div>
      </SolarState>
    </>
  );
}
