import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { SolarPageHeader } from "@/components/solar-monitoring/SolarMonitoringLayout";
import { SolarCard, SolarState } from "@/components/solar-monitoring/SolarUI";
import { healthClass } from "@/features/solar-monitoring/styles";
import { useSolarPlants } from "@/features/solar-monitoring/hooks";
import { dateTime, healthLabel, number } from "@/features/solar-monitoring/format";

export default function SolarPlants() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [page, setPage] = useState(1);
  const plants = useSolarPlants(search ? { search } : {}, sort, page);
  const totalPages = Math.max(1, Math.ceil((plants.data?.total ?? 0) / 25));

  return (
    <>
      <SolarPageHeader title="โรงไฟฟ้า" description="ค้นหา เปรียบเทียบ และตรวจสอบข้อมูลล่าสุดของแต่ละ Plant" />
      <SolarCard className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="ค้นหาชื่อหรือ Plant code"
              className="w-full rounded-lg border border-white/10 bg-slate-950 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-400/50"
            />
          </label>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
            <option value="name_asc">ชื่อ A–Z</option>
            <option value="name_desc">ชื่อ Z–A</option>
            <option value="power_desc">กำลังผลิตสูงสุด</option>
            <option value="energy_desc">พลังงานวันนี้สูงสุด</option>
          </select>
        </div>
      </SolarCard>
      <SolarState loading={plants.isLoading} error={plants.error} empty={!plants.data?.items.length}>
        <SolarCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-4">Plant</th><th>ที่อยู่จาก Huawei</th><th>กำลังติดตั้ง</th><th>กำลังล่าสุด</th><th>พลังงานวันนี้</th><th>สถานะ</th><th>อัปเดต</th></tr>
              </thead>
              <tbody>
                {plants.data?.items.map((plant) => (
                  <tr key={plant.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-5 py-4"><Link to={`/solar-monitoring/plants/${plant.id}`} className="font-medium text-amber-200 hover:text-amber-100">{plant.plant_name}</Link><div className="text-xs text-slate-500">{plant.plant_code}</div></td>
                    <td className="max-w-[320px] pr-5 text-xs leading-5 text-slate-300">
                      <span className="line-clamp-2" title={plant.plant_address ?? undefined}>
                        {plant.plant_address ?? "Huawei ไม่ได้ระบุที่อยู่"}
                      </span>
                    </td>
                    <td>{number(plant.capacity_kwp)} kWp</td><td>{number(plant.current_power_kw)} kW</td><td>{number(plant.daily_energy_kwh)} kWh</td>
                    <td><span className={`rounded-full px-2 py-1 text-xs ${healthClass(plant.latest_health_state)}`}>{healthLabel(plant.latest_health_state)}</span></td>
                    <td className="text-xs text-slate-400">{dateTime(plant.sampled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm">
            <span className="text-slate-400">ทั้งหมด {number(plants.data?.total, 0)} Plant</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </SolarCard>
      </SolarState>
    </>
  );
}
