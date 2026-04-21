import { useState, useEffect, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import {
  fetchEvMemberEnrichedLeads,
  type EvMemberEnrichedLead,
} from "@/services/evMemberReportService";

export function useEvMemberDashboardData(
  dateRange: DateRange | undefined,
  salesFilter: string,
  platformFilter: string,
  categoryFilter: string
) {
  const [loading, setLoading] = useState(true);
  const [salesCount, setSalesCount] = useState(0);
  const [totalSalesValue, setTotalSalesValue] = useState(0);
  const [salesLeads, setSalesLeads] = useState<EvMemberEnrichedLead[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchEvMemberEnrichedLeads(
        dateRange,
        salesFilter,
        platformFilter,
        categoryFilter
      );
      setSalesCount(r.salesCount);
      setTotalSalesValue(r.totalSalesValue);
      setSalesLeads(r.salesLeads);
    } catch (e) {
      console.error("useEvMemberDashboardData:", e);
      setSalesCount(0);
      setTotalSalesValue(0);
      setSalesLeads([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, salesFilter, platformFilter, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, salesCount, totalSalesValue, salesLeads, reload: load };
}
