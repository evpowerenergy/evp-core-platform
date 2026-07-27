import { SolarPageHeader } from "@/components/solar-monitoring/SolarMonitoringLayout";
import { MetricCard, SolarCard, SolarState } from "@/components/solar-monitoring/SolarUI";
import { useSolarDataHealth } from "@/features/solar-monitoring/hooks";
import { dateTime, number } from "@/features/solar-monitoring/format";

export default function SolarDataHealth() {
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const query = useSolarDataHealth(from);
  const data = query.data;
  return (
    <>
      <SolarPageHeader title="Data Health" description="คุณภาพ ความสดใหม่ และประวัติการทำงานของ Huawei ingestion" freshness={dateTime(data?.lastSuccessfulSync)} />
      <SolarState loading={query.isLoading} error={query.error}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Plant ข้อมูลเก่า" value={number(data?.stalePlants, 0)} tone={data?.stalePlants ? "red" : "emerald"} hint="ไม่มีข้อมูลใหม่เกิน 15 นาที" />
          <MetricCard label="Queue backlog" value={number(data?.queueBacklog, 0)} tone="cyan" />
          <MetricCard label="Failed 24 ชม." value={number(data?.failedRuns, 0)} tone={data?.failedRuns ? "red" : "emerald"} />
          <MetricCard label="Rate limit 24 ชม." value={number(data?.rateLimitIncidents, 0)} tone={data?.rateLimitIncidents ? "red" : "emerald"} />
          <MetricCard label="Dead letter" value={number(data?.deadLetterCount, 0)} tone={data?.deadLetterCount ? "red" : "emerald"} />
          <MetricCard label="Quality issues" value={number(data?.openQualityIssues, 0)} tone={data?.openQualityIssues ? "red" : "emerald"} hint={`${number(data?.qualityByType?.missing_intervals, 0)} missing-interval`} />
        </div>
        <SolarCard className="mt-6 overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-4"><h2 className="font-semibold">Sync runs ล่าสุด</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">เวลา</th><th>Job</th><th>สถานะ</th><th>Endpoint</th><th>รับ/เขียน</th><th>เวลาใช้</th><th>Error</th></tr></thead>
              <tbody>{data?.recentRuns.map((run, index) => <tr key={String(run.id ?? index)} className="border-t border-white/5"><td className="px-5 py-3 text-xs">{dateTime(run.started_at as string)}</td><td>{String(run.job_type ?? "—")}</td><td className={run.status === "success" ? "text-emerald-300" : "text-red-300"}>{String(run.status ?? "—")}</td><td>{String(run.endpoint ?? "—")}</td><td>{number(run.records_received as number, 0)} / {number(run.records_written as number, 0)}</td><td>{number(run.duration_ms as number, 0)} ms</td><td className="max-w-xs truncate text-red-300">{String(run.error_message ?? "—")}</td></tr>)}</tbody>
            </table>
          </div>
        </SolarCard>
      </SolarState>
    </>
  );
}
