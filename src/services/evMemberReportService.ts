import { supabase } from "@/integrations/supabase/client";
import { getSalesDataInPeriod } from "@/utils/salesUtils";
import type { DateRange } from "react-day-picker";

export interface EvMemberEnrichedLead {
  id: number;
  leadId: number;
  logId: number;
  display_name: string;
  full_name: string;
  category: string;
  platform: string;
  tel: string;
  line_id: string;
  sale_owner_id: number;
  sale_id: number;
  status?: string;
  created_at_thai: string;
  totalQuotationAmount: number;
  totalQuotationCount: number;
  quotationNumbers: string[];
  quotationDocuments: Array<{
    document_number: string;
    amount: string;
    created_at_thai: string;
    productivity_log_id: number;
  }>;
  avg_electricity_bill: number;
  ad_campaign_name: string | null;
  ad_campaign_image_url: string | null;
  sale_chance_status: string;
  sale_chance_percent: number;
  lead_group: string;
  presentation_type: string;
  latest_log: {
    id: number;
    note: string | null;
    next_follow_up: string | null;
    next_follow_up_details: string | null;
    created_at_thai: string;
  };
  /** จังหวัด/ภูมิภาค — จาก leads.region */
  region: string;
  /** รายละเอียดเพิ่มเติม — จาก leads.notes */
  lead_notes: string | null;
}

function buildThaiRangeStrings(dateRange: DateRange | undefined): { startDate: string; endDate: string; hasRange: boolean } {
  if (!dateRange?.from || !dateRange?.to) {
    return { startDate: "", endDate: "", hasRange: false };
  }
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const startDateString = formatter.format(fromDate);
  const endDateString = formatter.format(toDate);
  return {
    startDate: `${startDateString}T00:00:00.000`,
    endDate: `${endDateString}T23:59:59.999`,
    hasRange: true,
  };
}

/**
 * ดึงข้อมูล EV Member โดยใช้ logic เดียวกับ /reports/sales-closed (ไม่รวม win-rate query ชุดใหญ่)
 */
export async function fetchEvMemberEnrichedLeads(
  dateRangeFilter: DateRange | undefined,
  salesFilter: string,
  platformFilter: string,
  categoryFilter: string
): Promise<{
  salesCount: number;
  totalSalesValue: number;
  salesLeads: EvMemberEnrichedLead[];
}> {
  const { startDate, endDate, hasRange } = buildThaiRangeStrings(dateRangeFilter);

  const salesFilterParam = salesFilter !== "all" ? salesFilter : undefined;
  const platformFilterParam = platformFilter !== "all" ? platformFilter : undefined;
  const categoryFilterParam = categoryFilter !== "all" ? categoryFilter : undefined;

  const salesData = await getSalesDataInPeriod(
    hasRange ? startDate : "",
    hasRange ? endDate : "",
    salesFilterParam,
    platformFilterParam,
    categoryFilterParam
  );

  if (!salesData?.salesLeads?.length) {
    return {
      salesCount: salesData?.salesCount ?? 0,
      totalSalesValue: salesData?.totalSalesValue ?? 0,
      salesLeads: [],
    };
  }

  const salesCount = salesData.salesCount;
  const totalSalesValue = salesData.totalSalesValue;

  const leadIds = salesData.salesLeads.map((lead) => lead.leadId);
  let leadsData: any[] = [];

  if (leadIds.length > 0) {
    const { data: leadsResult, error: leadsError } = await supabase
      .from("leads")
      .select(
        `
        id,
        avg_electricity_bill,
        tel,
        line_id,
        region,
        notes,
        ad_campaign_id,
        ads_campaigns (
          id,
          name,
          campaign_name,
          image_url
        )
      `
      )
      .in("id", leadIds);

    if (leadsError) {
      console.error("EV Member: error fetching leads data:", leadsError);
    } else {
      leadsData = leadsResult || [];
    }
  }

  const leadsMap = new Map<
    number,
    {
      avg_electricity_bill: number;
      ad_campaign_name: string | null;
      ad_campaign_image_url: string | null;
      tel: string | null;
      line_id: string | null;
      region: string | null;
      notes: string | null;
    }
  >();
  leadsData.forEach((lead) => {
    const adCampaignName = lead.ads_campaigns?.name || lead.ads_campaigns?.campaign_name || null;
    const adCampaignImageUrl = lead.ads_campaigns?.image_url || null;
    leadsMap.set(lead.id, {
      avg_electricity_bill: lead.avg_electricity_bill || 0,
      ad_campaign_name: adCampaignName,
      ad_campaign_image_url: adCampaignImageUrl,
      tel: lead.tel ?? null,
      line_id: lead.line_id ?? null,
      region: lead.region ?? null,
      notes: lead.notes ?? null,
    });
  });

  const salesLeads = (salesData.salesLeads || []).map((lead) => {
    const leadData = leadsMap.get(lead.leadId) || {
      avg_electricity_bill: 0,
      ad_campaign_name: null,
      ad_campaign_image_url: null,
      tel: null,
      line_id: null,
      region: null,
      notes: null,
    };
    const telDisplay = (leadData.tel ?? lead.tel ?? "").trim() || "ไม่ระบุ";
    const lineDisplay = (leadData.line_id ?? lead.lineId ?? "").trim() || "ไม่ระบุ";
    const regionDisplay = (leadData.region ?? "").trim() || "ไม่ระบุ";
    return {
      id: lead.logId || lead.leadId,
      leadId: lead.leadId,
      logId: lead.logId,
      display_name: lead.displayName || "",
      full_name: lead.fullName || "",
      category: lead.category,
      platform: lead.platform || "ไม่ระบุ",
      tel: telDisplay,
      line_id: lineDisplay,
      region: regionDisplay,
      lead_notes: leadData.notes,
      sale_owner_id: lead.saleOwnerId || 0,
      sale_id: lead.saleId || lead.saleOwnerId || 0,
      status: lead.leadStatus,
      created_at_thai: lead.lastActivityDate,
      totalQuotationAmount: lead.totalQuotationAmount,
      totalQuotationCount: lead.totalQuotationCount,
      quotationNumbers: lead.quotationNumbers,
      quotationDocuments: lead.quotationDocuments || [],
      avg_electricity_bill: leadData.avg_electricity_bill,
      ad_campaign_name: leadData.ad_campaign_name,
      ad_campaign_image_url: leadData.ad_campaign_image_url,
    };
  });

  const uniqueLeadIds = [...new Set(salesLeads.map((l) => l.leadId))];
  let saleChanceData: any[] = [];

  if (uniqueLeadIds.length > 0) {
    const { data: logsResult, error: logsError } = await supabase
      .from("lead_productivity_logs")
      .select(
        `
        lead_id,
        sale_chance_status,
        sale_chance_percent,
        lead_group,
        presentation_type,
        note,
        next_follow_up,
        next_follow_up_details,
        created_at_thai
      `
      )
      .in("lead_id", uniqueLeadIds)
      .not("sale_chance_status", "is", null)
      .order("created_at_thai", { ascending: false });

    if (logsError) {
      console.error("EV Member: error fetching sale chance data:", logsError);
    } else {
      saleChanceData = logsResult || [];
    }
  }

  const leadSaleChanceMap = new Map<
    number,
    {
      sale_chance_status: string;
      sale_chance_percent: number;
      lead_group: string;
      presentation_type: string;
      latest_log: {
        id: number;
        note: string | null;
        next_follow_up: string | null;
        next_follow_up_details: string | null;
        created_at_thai: string;
      };
    }
  >();

  saleChanceData.forEach((log) => {
    if (!leadSaleChanceMap.has(log.lead_id)) {
      leadSaleChanceMap.set(log.lead_id, {
        sale_chance_status: log.sale_chance_status,
        sale_chance_percent: log.sale_chance_percent,
        lead_group: log.lead_group,
        presentation_type: log.presentation_type,
        latest_log: {
          id: log.lead_id,
          note: log.note,
          next_follow_up: log.next_follow_up,
          next_follow_up_details: log.next_follow_up_details,
          created_at_thai: log.created_at_thai,
        },
      });
    }
  });

  const enrichedSalesLeads: EvMemberEnrichedLead[] = salesLeads.map((lead) => {
    const saleChanceInfo = leadSaleChanceMap.get(lead.leadId);
    return {
      ...lead,
      sale_chance_status: saleChanceInfo?.sale_chance_status || "ไม่ระบุ",
      sale_chance_percent: saleChanceInfo?.sale_chance_percent || 0,
      lead_group: saleChanceInfo?.lead_group || "ไม่ระบุ",
      presentation_type: saleChanceInfo?.presentation_type || "ไม่ระบุ",
      latest_log:
        saleChanceInfo?.latest_log || {
          id: lead.leadId,
          note: "ไม่มีรายละเอียดการติดตาม",
          next_follow_up: null,
          next_follow_up_details: null,
          created_at_thai: lead.created_at_thai,
        },
    };
  });

  return {
    salesCount,
    totalSalesValue,
    salesLeads: enrichedSalesLeads,
  };
}
