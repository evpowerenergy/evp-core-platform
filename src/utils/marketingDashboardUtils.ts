/**
 * Marketing Dashboard summary via Edge Function (single source of truth for UI + AI).
 */
import { supabase } from "@/integrations/supabase/client";
import { getMarketingFunctionUrl } from "@/config";

export interface MarketingDashboardData {
  totalSales: number | null;
  totalAdBudget: number;
  facebookAds: {
    total: number;
    package: number;
    wholesales: number;
    others: number;
  };
  googleAds: {
    total: number;
    package: number;
    wholesales: number;
    others: number;
  };
  adCostPerLead: number | null;
  totalNewLeads: number;
  package: {
    sales: number | null;
    newLeads: number;
    pkOutQt: number;
    totalQtDocuments: number;
    win: number;
    conversionRate: number | null;
    winRateQt: number | null;
  };
  wholesales: {
    sales: number | null;
    newLeads: number;
    whOutQt: number;
    totalQtDocuments: number;
    winQt: number;
    winRateQt: number | null;
    conversionRate: number | null;
  };
  totalInboxFromAds: number;
  inboxBreakdown: {
    packageMessages: number;
    packageCostPerMessage: number;
    wholesalesMessages: number;
    wholesalesCostPerMessage: number;
    otherMessages: number;
    otherCostPerMessage: number;
  };
  overallRoas: number | null;
  packageRoas: number | null;
  wholesalesRoas: number | null;
}

export const EMPTY_MARKETING_DASHBOARD: MarketingDashboardData = {
  totalSales: null,
  totalAdBudget: 0,
  facebookAds: { total: 0, package: 0, wholesales: 0, others: 0 },
  googleAds: { total: 0, package: 0, wholesales: 0, others: 0 },
  adCostPerLead: null,
  totalNewLeads: 0,
  package: {
    sales: null,
    newLeads: 0,
    pkOutQt: 0,
    totalQtDocuments: 0,
    win: 0,
    conversionRate: null,
    winRateQt: null,
  },
  wholesales: {
    sales: null,
    newLeads: 0,
    whOutQt: 0,
    totalQtDocuments: 0,
    winQt: 0,
    winRateQt: null,
    conversionRate: null,
  },
  totalInboxFromAds: 0,
  inboxBreakdown: {
    packageMessages: 0,
    packageCostPerMessage: 0,
    wholesalesMessages: 0,
    wholesalesCostPerMessage: 0,
    otherMessages: 0,
    otherCostPerMessage: 0,
  },
  overallRoas: null,
  packageRoas: null,
  wholesalesRoas: null,
};

export function formatMarketingDateForApi(isoStart: string, isoEnd: string): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: isoStart.slice(0, 10),
    endDate: isoEnd.slice(0, 10),
  };
}

export async function fetchMarketingDashboardSummary(
  startDate: string,
  endDate: string,
): Promise<{
  data: MarketingDashboardData;
  facebookApiConnected: boolean;
  googleApiConnected: boolean;
}> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("No authentication token available");
  }

  const { startDate: apiStart, endDate: apiEnd } = formatMarketingDateForApi(startDate, endDate);
  const url = getMarketingFunctionUrl("marketing-dashboard-summary");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ startDate: apiStart, endDate: apiEnd }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || "Failed to fetch marketing dashboard summary");
  }

  const { meta, ...dashboard } = result.data as MarketingDashboardData & {
    meta?: { facebookApiConnected?: boolean; googleApiConnected?: boolean };
  };

  return {
    data: dashboard,
    facebookApiConnected: meta?.facebookApiConnected ?? false,
    googleApiConnected: meta?.googleApiConnected ?? false,
  };
}
