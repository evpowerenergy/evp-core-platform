import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getSalesDataInPeriod, getSalesDataByCategory, getQuotationDataFromView, getOpportunityDataFromView } from "@/utils/salesUtils";
import { supabase } from "@/integrations/supabase/client";
import { filterLeadsWithContact } from "@/utils/leadQueryFilters";
import { useQuery } from "@tanstack/react-query";

// Helper function to get date range strings (same as Index page)
const getDateRangeStrings = (dateRange: DateRange | undefined) => {
  let startDate: string, endDate: string;
  
  if (dateRange && dateRange.from) {
    const fromDate = dateRange.from;
    const toDate = dateRange.to || dateRange.from;
    
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const startDateString = formatter.format(fromDate);
    startDate = startDateString + 'T00:00:00.000';
    
    const endDateString = formatter.format(toDate);
    endDate = endDateString + 'T23:59:59.999';
  } else {
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 30);
    
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const startDateString = formatter.format(startDateObj);
    startDate = startDateString + 'T00:00:00.000';
    
    const endDateString = formatter.format(endDateObj);
    endDate = endDateString + 'T23:59:59.999';
  }
  
  return { startDate, endDate };
};
import { getFacebookAdsData, calculateFacebookRoas, calculateFacebookCostPerLead, isFacebookApiConfigured } from "@/utils/facebookAdsUtils";
import { getGoogleAdsData, calculateGoogleRoas, calculateGoogleCostPerLead, isGoogleApiConfigured } from "@/utils/googleAdsUtils";
import { 
  Megaphone, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  Calendar,
  ArrowRight,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  DollarSign,
  Coins,
  MessageSquare,
  Package,
  ShoppingCart,
  Facebook,
  Chrome
} from "lucide-react";

interface MarketingDashboardData {
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

const MarketingDashboard = () => {
  const navigate = useNavigate();
  
  // Date picker state - เริ่มต้นด้วย default date range (วันนี้)
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(() => {
    const today = new Date();
    
    return {
      from: today,
      to: today
    };
  });
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<MarketingDashboardData>({
    totalSales: null,
    totalAdBudget: 0,
    facebookAds: {
      total: 0,
      package: 0,
      wholesales: 0,
      others: 0
    },
    googleAds: {
      total: 0,
      package: 0,
      wholesales: 0,
      others: 0
    },
    adCostPerLead: null,
    totalNewLeads: 0,
    package: {
      sales: null,
      newLeads: 0,
      pkOutQt: 0,
      totalQtDocuments: 0,
      win: 0,
      conversionRate: null,
      winRateQt: null
    },
    wholesales: {
      sales: null,
      newLeads: 0,
      whOutQt: 0,
      totalQtDocuments: 0,
      winQt: 0,
      winRateQt: null,
      conversionRate: null
    },
    totalInboxFromAds: 0,
    inboxBreakdown: {
      packageMessages: 0,
      packageCostPerMessage: 0,
      wholesalesMessages: 0,
      wholesalesCostPerMessage: 0,
      otherMessages: 0,
      otherCostPerMessage: 0
    },
    overallRoas: null,
    packageRoas: null,
    wholesalesRoas: null
  });
  
  const [loading, setLoading] = useState(false);
  const [facebookApiConnected, setFacebookApiConnected] = useState(false);
  const [googleApiConnected, setGoogleApiConnected] = useState(false);

  // Get date range strings for Edge Function
  const dateRangeStrings = useMemo(() => {
    return getDateRangeStrings(dateRangeFilter);
  }, [dateRangeFilter]);

  // ✅ Fetch leads from Edge Function (core-leads-leads-for-dashboard)
  // ใช้ fetch() โดยตรงเหมือนหน้าอื่นๆ เพื่อหลีกเลี่ยง CORS issues
  const { data: leadsFromEdgeFunction } = useQuery({
    queryKey: ['leadsFromEdgeFunction', dateRangeStrings.startDate, dateRangeStrings.endDate],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (dateRangeStrings.startDate && dateRangeStrings.endDate) {
          params.append('from', dateRangeStrings.startDate);
          params.append('to', dateRangeStrings.endDate);
        } else {
          params.append('limit', '5000');
        }

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          throw new Error('No authentication token available');
        }
        
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-leads-for-dashboard?${params.toString()}`;
        
        const response = await fetch(edgeFunctionUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch leads for dashboard');
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch leads for dashboard');
        }

        return result.data || [];
      } catch (error) {
        console.error('Error in leadsFromEdgeFunction query:', error);
        return [];
      }
    },
    enabled: !!dateRangeStrings.startDate && !!dateRangeStrings.endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch real data from CRM system
  useEffect(() => {
    fetchMarketingData();
  }, [dateRangeFilter, leadsFromEdgeFunction]);

  const fetchMarketingData = async () => {
    try {
      setLoading(true);
      
      // ✅ รอให้ leadsFromEdgeFunction โหลดเสร็จก่อน (ถ้ายังไม่มีข้อมูล)
      // ตรวจสอบว่า leadsFromEdgeFunction เป็น undefined หรือ null (ไม่ใช่ empty array)
      if (leadsFromEdgeFunction === undefined || leadsFromEdgeFunction === null) {
        console.log('Waiting for leadsFromEdgeFunction to load...');
        return;
      }
      
      // Use proper timezone handling for date range
      let startDate: string, endDate: string;
      let facebookStartDate: string, facebookEndDate: string;
      
      if (dateRangeFilter?.from && dateRangeFilter?.to) {
        const fromDate = new Date(dateRangeFilter.from);
        const toDate = new Date(dateRangeFilter.to);
        
        // Format dates for Thai timezone
        const formatter = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        // Format start date - Start from 00:00:00 Thai time
        const startDateString = formatter.format(fromDate);
        startDate = startDateString + 'T00:00:00.000';
        
        // Format end date - End at 23:59:59 Thai time
        const endDateString = formatter.format(toDate);
        endDate = endDateString + 'T23:59:59.999';
        
        // Format dates for Facebook API (YYYY-MM-DD)
        facebookStartDate = startDateString;
        facebookEndDate = endDateString;
      } else {
        // No date range selected - show all data (no date filter)
        startDate = '';
        endDate = '';
        facebookStartDate = '';
        facebookEndDate = '';
      }

      // ดึงข้อมูล Facebook Ads (client env หรือ Edge Function)
      let facebookAdsData = null;
      if (facebookStartDate && facebookEndDate) {
        try {
          // Retry mechanism สำหรับ Facebook API
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount < maxRetries) {
            try {
              facebookAdsData = await getFacebookAdsData(facebookStartDate, facebookEndDate);
              setFacebookApiConnected(!!facebookAdsData);
              break; // สำเร็จแล้ว ออกจาก loop
            } catch (retryError) {
              retryCount++;
              
              if (retryCount >= maxRetries) {
                throw retryError; // หมด retry แล้ว
              }
              
              // รอ 1 วินาทีก่อน retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          console.error('❌ Facebook API Error after retries:', error);
          setFacebookApiConnected(false);
          facebookAdsData = null;
        }
      } else {
        facebookAdsData = null;
        setFacebookApiConnected(false);
      }

      // ดึงข้อมูล Google Ads (client env หรือ Edge Function)
      let googleAdsData = null;
      if (facebookStartDate && facebookEndDate) {
        try {
          googleAdsData = await getGoogleAdsData(facebookStartDate, facebookEndDate, 'campaign');
          setGoogleApiConnected(true);
        } catch (error) {
          console.error('❌ Google Ads API Error:', error);
          setGoogleApiConnected(false);
          googleAdsData = null;
        }
      } else {
        googleAdsData = null;
        setGoogleApiConnected(false);
      }

      // ดึงข้อมูล Inbox Messages จาก Facebook API
      let inboxData = {
        totalMessages: 0,
        packageMessages: 0,
        wholesalesMessages: 0,
        otherMessages: 0,
        packageCostPerMessage: 0,
        wholesalesCostPerMessage: 0,
        otherCostPerMessage: 0
      };

      // ตรวจสอบ Facebook API connection และ data

      if (facebookAdsData) {
        try {
          // ใช้ข้อมูล messaging conversations จาก actions array (แม่นยำที่สุด)
          const totalMessagingConversations = facebookAdsData.totalMessagingConversations || 0;
          const totalSpend = facebookAdsData.totalSpend || 0;
          
          // ใช้ข้อมูล messaging conversations โดยตรง
          let packageMessages = facebookAdsData.packageMessagingConversations || 0;
          let wholesalesMessages = facebookAdsData.wholesalesMessagingConversations || 0;
          let otherMessages = facebookAdsData.othersMessagingConversations || 0;
          
          // ถ้าไม่มี messaging data ให้ใช้ results field (fallback)
          if (totalMessagingConversations === 0) {
            const totalResults = facebookAdsData.totalResults || 0;
            const totalClicks = facebookAdsData.totalClicks || 0;
            const totalInteractions = totalResults > 0 ? totalResults : (totalClicks > 0 ? totalClicks : Math.round((facebookAdsData.totalImpressions || 0) / 100));
            
            const packageSpendRatio = totalSpend > 0 ? facebookAdsData.packageSpend / totalSpend : 0;
            const wholesalesSpendRatio = totalSpend > 0 ? facebookAdsData.wholesalesSpend / totalSpend : 0;
            const othersSpendRatio = totalSpend > 0 ? facebookAdsData.othersSpend / totalSpend : 0;
            
            packageMessages = Math.round(totalInteractions * packageSpendRatio);
            wholesalesMessages = Math.round(totalInteractions * wholesalesSpendRatio);
            otherMessages = Math.round(totalInteractions * othersSpendRatio);
          }
          
          // คำนวณ cost per message
          const packageCostPerMessage = packageMessages > 0 ? 
            facebookAdsData.packageSpend / packageMessages : 0;
          const wholesalesCostPerMessage = wholesalesMessages > 0 ? 
            facebookAdsData.wholesalesSpend / wholesalesMessages : 0;
          const otherCostPerMessage = otherMessages > 0 ? 
            facebookAdsData.othersSpend / otherMessages : 0;

          inboxData = {
            totalMessages: totalMessagingConversations > 0 ? totalMessagingConversations : (packageMessages + wholesalesMessages + otherMessages),
            packageMessages,
            wholesalesMessages,
            otherMessages,
            packageCostPerMessage,
            wholesalesCostPerMessage,
            otherCostPerMessage
          };


        } catch (error) {
          console.error('❌ Error calculating inbox data:', error);
        }
      } else {
      }

      // ดึงข้อมูลยอดขายรวมจากระบบ CRM
      const totalSalesData = await getSalesDataInPeriod(
        startDate || new Date().toISOString(), 
        endDate || new Date().toISOString()
      );

      // ดึงข้อมูล Package ตาม logic ของ Package Dashboard
      let packageActivityLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, status, platform, region, created_at_thai, sale_owner_id, category, tel, line_id')
        .eq('category', 'Package')
        .not('sale_owner_id', 'is', null);
      
      // Filter เฉพาะลีดที่มีเบอร์โทรหรือ Line ID
      packageActivityLeadsQuery = filterLeadsWithContact(packageActivityLeadsQuery);

      // Apply date filters สำหรับ activity leads (ใช้ updated_at_thai เหมือน Package Dashboard)
      if (startDate && endDate) {
        packageActivityLeadsQuery = packageActivityLeadsQuery
          .gte('updated_at_thai', startDate)
          .lte('updated_at_thai', endDate);
      }

      // ✅ ดึง QT ทั้งหมดสำหรับ Package โดยใช้ custom query (filter ตาม created_at_thai ของ productivity log)
      // เพื่อให้ตรงกับหน้าอื่นๆ (Index, Executive Dashboard)
      let packageLogsQuery = supabase
        .from('lead_productivity_logs')
        .select(`
          id, 
          lead_id, 
          created_at_thai,
          leads!inner(
            id,
            category
          )
        `)
        .eq('leads.category', 'Package');

      if (startDate && endDate) {
        packageLogsQuery = packageLogsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: packageLogs, error: packageLogsError } = await packageLogsQuery;
      if (packageLogsError) {
        console.error('Error fetching package logs:', packageLogsError);
      }

      const packageLogIds = packageLogs?.map(log => log.id) || [];
      let packageQuotations: any[] = [];
      
      if (packageLogIds.length > 0) {
        const { data: packageQuotationsData, error: packageQuotationsError } = await supabase
          .from('quotation_documents')
          .select(`
            amount, 
            productivity_log_id, 
            document_number,
            created_at_thai
          `)
          .in('productivity_log_id', packageLogIds)
          .eq('document_type', 'quotation');

        if (packageQuotationsError) {
          console.error('Error fetching package quotations:', packageQuotationsError);
        } else {
          packageQuotations = packageQuotationsData || [];
        }
      }

      // นับ QT ทั้งหมด (ไม่ซ้ำ) โดยใช้ document_number
      const packageUniqueQuotations = new Set(
        packageQuotations.map(q => q.document_number?.toLowerCase().replace(/\s+/g, '') || '').filter(Boolean)
      );
      const packageTotalQuotations = packageUniqueQuotations.size;

      const [
        packageSalesData,
        packageOpportunityData,
        packageActivityLeadsResult
      ] = await Promise.all([
        // ดึงข้อมูลยอดขาย Package
        getSalesDataByCategory(
          startDate || new Date().toISOString(), 
          endDate || new Date().toISOString(),
          'Package'
        ),
        // ดึงข้อมูลโอกาสการขาย Package
        getOpportunityDataFromView(
          startDate || new Date().toISOString(), 
          endDate || new Date().toISOString(), 
          'Package'
        ),
        // ดึงข้อมูล activity leads สำหรับ Package
        packageActivityLeadsQuery.then(result => {
          if (result.error) throw result.error;
          return result;
        })
      ]);

      // ✅ ดึง QT ทั้งหมดสำหรับ Wholesale โดยใช้ custom query (filter ตาม created_at_thai ของ productivity log)
      // เพื่อให้ตรงกับหน้าอื่นๆ (Index, Executive Dashboard)
      let wholesalesLogsQuery = supabase
        .from('lead_productivity_logs')
        .select(`
          id, 
          lead_id, 
          created_at_thai,
          leads!inner(
            id,
            category
          )
        `)
        .in('leads.category', ['Wholesale', 'Wholesales']);

      if (startDate && endDate) {
        wholesalesLogsQuery = wholesalesLogsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: wholesalesLogs, error: wholesalesLogsError } = await wholesalesLogsQuery;
      if (wholesalesLogsError) {
        console.error('Error fetching wholesales logs:', wholesalesLogsError);
      }

      const wholesalesLogIds = wholesalesLogs?.map(log => log.id) || [];
      let wholesalesQuotations: any[] = [];
      
      if (wholesalesLogIds.length > 0) {
        const { data: wholesalesQuotationsData, error: wholesalesQuotationsError } = await supabase
          .from('quotation_documents')
          .select(`
            amount, 
            productivity_log_id, 
            document_number,
            created_at_thai
          `)
          .in('productivity_log_id', wholesalesLogIds)
          .eq('document_type', 'quotation');

        if (wholesalesQuotationsError) {
          console.error('Error fetching wholesales quotations:', wholesalesQuotationsError);
        } else {
          wholesalesQuotations = wholesalesQuotationsData || [];
        }
      }

      // นับ QT ทั้งหมด (ไม่ซ้ำ) โดยใช้ document_number
      const wholesalesUniqueQuotations = new Set(
        wholesalesQuotations.map(q => q.document_number?.toLowerCase().replace(/\s+/g, '') || '').filter(Boolean)
      );
      const wholesalesTotalQuotations = wholesalesUniqueQuotations.size;

      // ดึงข้อมูล Wholesale ตาม logic เดียวกัน (รองรับทั้ง Wholesale และ Wholesales)
      let wholesalesActivityLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, status, platform, region, created_at_thai, sale_owner_id, category, tel, line_id')
        .in('category', ['Wholesale', 'Wholesales'])
        .not('sale_owner_id', 'is', null);
      
      // Filter เฉพาะลีดที่มีเบอร์โทรหรือ Line ID
      wholesalesActivityLeadsQuery = filterLeadsWithContact(wholesalesActivityLeadsQuery);

      // Apply date filters สำหรับ activity leads (ใช้ updated_at_thai เหมือน Package Dashboard)
      if (startDate && endDate) {
        wholesalesActivityLeadsQuery = wholesalesActivityLeadsQuery
          .gte('updated_at_thai', startDate)
          .lte('updated_at_thai', endDate);
      }

      const [
        wholesalesData,
        wholesalesQuotationData,
        wholesalesOpportunityData,
        wholesalesActivityLeadsResult
      ] = await Promise.all([
        // ดึงข้อมูลยอดขาย Wholesale (รวมทั้ง Wholesale และ Wholesales)
        Promise.all([
          getSalesDataByCategory(
            startDate || new Date().toISOString(), 
            endDate || new Date().toISOString(),
            'Wholesale'
          ),
          getSalesDataByCategory(
            startDate || new Date().toISOString(), 
            endDate || new Date().toISOString(),
            'Wholesales'
          )
        ]).then(([wholesaleData, wholesalesData]) => ({
          salesLogs: [...(wholesaleData.salesLogs || []), ...(wholesalesData.salesLogs || [])],
          quotations: [...(wholesaleData.quotations || []), ...(wholesalesData.quotations || [])],
          totalSalesValue: (wholesaleData.totalSalesValue || 0) + (wholesalesData.totalSalesValue || 0),
          salesCount: (wholesaleData.salesCount || 0) + (wholesalesData.salesCount || 0),
          uniqueLeadIds: [...(wholesaleData.uniqueLeadIds || []), ...(wholesalesData.uniqueLeadIds || [])],
          salesLeads: [...(wholesaleData.salesLeads || []), ...(wholesalesData.salesLeads || [])] // ✅ เพิ่ม salesLeads
        })),
        // ดึงข้อมูลการออก QT Wholesale (รวมทั้ง Wholesale และ Wholesales)
        Promise.all([
          getQuotationDataFromView(
            startDate || new Date().toISOString(), 
            endDate || new Date().toISOString(), 
            'Wholesale'
          ),
          getQuotationDataFromView(
            startDate || new Date().toISOString(), 
            endDate || new Date().toISOString(), 
            'Wholesales'
          )
        ]).then(([wholesaleData, wholesalesData]) => ({
          quotationLogsWithQuotations: [...(wholesaleData.quotationLogsWithQuotations || []), ...(wholesalesData.quotationLogsWithQuotations || [])],
          totalQuotationValue: (wholesaleData.totalQuotationValue || 0) + (wholesalesData.totalQuotationValue || 0),
          quotationCount: (wholesaleData.quotationCount || 0) + (wholesalesData.quotationCount || 0)
        })),
        // ดึงข้อมูลโอกาสการขาย Wholesale (รวมทั้ง Wholesale และ Wholesales)
        Promise.all([
          getOpportunityDataFromView(
            startDate || new Date().toISOString(), 
            endDate || new Date().toISOString(), 
            'Wholesale'
          ),
          getOpportunityDataFromView(
            startDate || new Date().toISOString(), 
            endDate || new Date().toISOString(), 
            'Wholesales'
          )
        ]).then(([wholesaleData, wholesalesData]) => ({
          opportunityLogsWithOpportunities: [...(wholesaleData.opportunityLogsWithQuotations || []), ...(wholesalesData.opportunityLogsWithQuotations || [])],
          totalOpportunityValue: (wholesaleData.totalOpportunityValue || 0) + (wholesalesData.totalOpportunityValue || 0),
          opportunityCount: (wholesaleData.opportunityCount || 0) + (wholesalesData.opportunityCount || 0)
        })),
        // ดึงข้อมูล activity leads สำหรับ Wholesale
        wholesalesActivityLeadsQuery.then(result => {
          if (result.error) throw result.error;
          return result;
        })
      ]);

      // ดึงข้อมูล Lead ใหม่ทั้งหมด (ใช้ logic เดียวกับ Analytics)
      let totalNewLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, tel, line_id, status, platform, region, created_at_thai, sale_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by');
      
      totalNewLeadsQuery = filterLeadsWithContact(totalNewLeadsQuery);

      // Apply date filters สำหรับ Lead ใหม่ (ใช้ created_at_thai)
      if (startDate && endDate) {
        totalNewLeadsQuery = totalNewLeadsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: allLeadsData, error: totalLeadsError } = await totalNewLeadsQuery;
      if (totalLeadsError) {
        console.error('❌ Total leads query error:', totalLeadsError);
      }

      // ไม่ต้องกรอง tel/line_id แล้ว เพราะ backend ใช้ filterLeadsWithContact กรองให้แล้ว
      // กรองเฉพาะ platform
      const allValidLeads = allLeadsData?.filter(lead => 
        lead.platform && lead.platform.trim() !== ''
      ) || [];

      const totalNewLeads = allValidLeads.length;

      // ดึงข้อมูล Lead ใหม่แยกตามประเภท Package (ใช้ logic เดียวกับ Analytics)
      let packageNewLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, tel, line_id, status, platform, region, created_at_thai, sale_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by')
        .eq('category', 'Package');
      
      packageNewLeadsQuery = filterLeadsWithContact(packageNewLeadsQuery);

      // Apply date filters สำหรับ Package Lead ใหม่
      if (startDate && endDate) {
        packageNewLeadsQuery = packageNewLeadsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: packageLeadsData, error: packageLeadsError } = await packageNewLeadsQuery;
      if (packageLeadsError) {
        console.error('❌ Package leads query error:', packageLeadsError);
      }

      // ดึงข้อมูล Lead ใหม่แยกตามประเภท Wholesales (รวมทั้ง Wholesale และ Wholesales)
      let wholesalesNewLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, tel, line_id, status, platform, region, created_at_thai, sale_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by')
        .in('category', ['Wholesale', 'Wholesales']);
      
      wholesalesNewLeadsQuery = filterLeadsWithContact(wholesalesNewLeadsQuery);

      // Apply date filters สำหรับ Wholesales Lead ใหม่
      if (startDate && endDate) {
        wholesalesNewLeadsQuery = wholesalesNewLeadsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: wholesalesLeadsData, error: wholesalesLeadsError } = await wholesalesNewLeadsQuery;
      if (wholesalesLeadsError) {
        console.error('❌ Wholesales leads query error:', wholesalesLeadsError);
      }

      // ไม่ต้องกรอง tel/line_id แล้ว เพราะ backend ใช้ filterLeadsWithContact กรองให้แล้ว
      // กรองเฉพาะ platform
      const packageValidLeads = packageLeadsData?.filter(lead => 
        lead.platform && lead.platform.trim() !== ''
      ) || [];

      const wholesalesValidLeads = wholesalesLeadsData?.filter(lead => 
        lead.platform && lead.platform.trim() !== ''
      ) || [];

      const packageNewLeadsCount = packageValidLeads.length;
      const wholesalesNewLeadsCount = wholesalesValidLeads.length;


      // ✅ ใช้ leads จาก Edge Function สำหรับ Conversion Rate (Lead) - กรอง platform EV + Partner แล้ว
      const packageLeadsFromEdgeFunction = (leadsFromEdgeFunction || []).filter((lead: any) => lead.category === 'Package');
      const totalPackageLeads = packageLeadsFromEdgeFunction.length;
      
      // นับจำนวนลีดที่ปิดการขายจริงๆ (ไม่ใช่ QT) จาก salesLeads
      const packageClosedLeadIds = new Set();
      if (packageSalesData.salesLeads) {
        packageSalesData.salesLeads.forEach((lead: any) => {
          packageClosedLeadIds.add(lead.leadId);
        });
      }
      const packageActualClosedLeadsCount = packageClosedLeadIds.size;
      
      // คำนวณ ConversionRate (Lead) - ใช้ leads จาก Edge Function
      const packageConversionRate = totalPackageLeads > 0 
        ? (packageActualClosedLeadsCount / totalPackageLeads) * 100 
        : null; // ใช้ null แทน 0 เพื่อให้ formatPercentage แสดง "ไม่มีข้อมูล"
      
      // Debug log
      console.log('Package Conversion Rate:', {
        totalPackageLeads,
        packageActualClosedLeadsCount,
        packageConversionRate,
        leadsFromEdgeFunctionLength: leadsFromEdgeFunction?.length || 0
      });

      // ✅ ใช้ custom query สำหรับ Win Rate (QT) - เพื่อให้ตรงกับหน้าอื่นๆ (Index, Executive Dashboard)
      // packageTotalQuotations ถูกคำนวณจาก custom query ด้านบนแล้ว
      const packageWin = packageSalesData.salesCount || 0;
      
      // Win Rate (QT) for Package: QT ที่ปิด / QT ทั้งหมด
      const packageWinRateQt = packageTotalQuotations > 0
        ? (packageWin / packageTotalQuotations) * 100
        : 0;
      
      // คำนวณ pkOutQt: QT ที่ออกแต่ยังไม่ปิด = QT ทั้งหมด - QT ที่ปิด
      const packagePkOutQt = Math.max(0, packageTotalQuotations - packageWin);

      // ไม่ต้องดึงข้อมูล Wholesale แยก เพราะเราดึงข้อมูลทั้งหมดแล้ว

      // ✅ ใช้ leads จาก Edge Function สำหรับ Conversion Rate (Lead) - กรอง platform EV + Partner แล้ว
      const wholesalesLeadsFromEdgeFunction = (leadsFromEdgeFunction || []).filter((lead: any) => 
        lead.category === 'Wholesale' || lead.category === 'Wholesales'
      );
      const totalWholesalesLeads = wholesalesLeadsFromEdgeFunction.length;
      
      // นับจำนวนลีดที่ปิดการขายจริงๆ (ไม่ใช่ QT) จาก salesLeads
      const wholesalesClosedLeadIds = new Set();
      if (wholesalesData.salesLeads) {
        wholesalesData.salesLeads.forEach((lead: any) => {
          wholesalesClosedLeadIds.add(lead.leadId);
        });
      }
      const wholesalesActualClosedLeadsCount = wholesalesClosedLeadIds.size;
      
      // คำนวณ ConversionRate (Lead) - ใช้ leads จาก Edge Function
      const wholesalesConversionRate = totalWholesalesLeads > 0
        ? (wholesalesActualClosedLeadsCount / totalWholesalesLeads) * 100
        : null; // ใช้ null แทน 0 เพื่อให้ formatPercentage แสดง "ไม่มีข้อมูล"
      
      // Debug log
      console.log('Wholesales Conversion Rate:', {
        totalWholesalesLeads,
        wholesalesActualClosedLeadsCount,
        wholesalesConversionRate,
        leadsFromEdgeFunctionLength: leadsFromEdgeFunction?.length || 0
      });

      // ✅ ใช้ custom query สำหรับ Win Rate (QT) - เพื่อให้ตรงกับหน้าอื่นๆ (Index, Executive Dashboard)
      // wholesalesTotalQuotations ถูกคำนวณจาก custom query ด้านบนแล้ว
      const wholesalesWinQt = wholesalesData.salesCount || 0;
      
      // Win Rate (QT) for Wholesales: QT ที่ปิด / QT ทั้งหมด
      const wholesalesWinRateQt = wholesalesTotalQuotations > 0
        ? (wholesalesWinQt / wholesalesTotalQuotations) * 100
        : 0;
      
      // คำนวณ whOutQt: QT ที่ออกแต่ยังไม่ปิด = QT ทั้งหมด - QT ที่ปิด
      const wholesalesWhOutQt = Math.max(0, wholesalesTotalQuotations - wholesalesWinQt);

      // คำนวณ metrics เพิ่มเติม
      // Debug: ดูลีดทั้งหมดที่ไม่มี category หรือมี category อื่นๆ
      let debugLeadsQuery = supabase
        .from('leads')
        .select('id, category, created_at_thai')
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate);
      
      debugLeadsQuery = filterLeadsWithContact(debugLeadsQuery);
      const { data: debugLeadsData } = await debugLeadsQuery;
      
      const filteredLeads = debugLeadsData?.filter(lead => 
        !['Package', 'Wholesale', 'Wholesales'].includes(lead.category)
      ) || [];
      

      const facebookSpend = facebookAdsData ? facebookAdsData.totalSpend : 0;
      const googleSpend = googleAdsData ? googleAdsData.totalCost : 0;
      const totalAdBudget = facebookSpend + googleSpend;
      
      // คำนวณ Cost per Lead (รวม Facebook + Google)
      const adCostPerLead = totalAdBudget > 0 && totalNewLeads > 0 
        ? totalAdBudget / totalNewLeads 
        : null;
      
      // คำนวณ ROAS (รวม Facebook + Google)
      const overallRoas = totalAdBudget > 0 
        ? ((totalSalesData.totalSalesValue || 0) / totalAdBudget) * 100 
        : null;
      
      // คำนวณ Package ROAS (รวม Facebook + Google)
      const packageTotalSpend = (facebookAdsData ? facebookAdsData.packageSpend : 0) + (googleAdsData ? googleAdsData.packageCost : 0);
      const packageRoas = packageTotalSpend > 0 
        ? ((packageSalesData.totalSalesValue || 0) / packageTotalSpend) * 100 
        : null;
      
      // คำนวณ Wholesales ROAS (รวม Facebook + Google)
      const wholesalesTotalSpend = (facebookAdsData ? facebookAdsData.wholesalesSpend : 0) + (googleAdsData ? googleAdsData.wholesalesCost : 0);
      const wholesalesRoas = wholesalesTotalSpend > 0 
        ? ((wholesalesData.totalSalesValue || 0) / wholesalesTotalSpend) * 100 
        : null;

      // อัพเดตข้อมูล dashboard
      
      setDashboardData(prevData => ({
        ...prevData,
        totalSales: totalSalesData.totalSalesValue,
        totalAdBudget: totalAdBudget,
        facebookAds: facebookAdsData ? {
          total: facebookAdsData.totalSpend,
          package: facebookAdsData.packageSpend,
          wholesales: facebookAdsData.wholesalesSpend,
          others: facebookAdsData.othersSpend
        } : {
          total: 0,
          package: 0,
          wholesales: 0,
          others: 0
        },
        googleAds: googleAdsData ? {
          total: googleAdsData.totalCost,
          package: googleAdsData.packageCost,
          wholesales: googleAdsData.wholesalesCost,
          others: googleAdsData.othersCost
        } : {
          total: 0,
          package: 0,
          wholesales: 0,
          others: 0
        },
        adCostPerLead: adCostPerLead,
        totalNewLeads: totalNewLeads,
        overallRoas: overallRoas,
        packageRoas: packageRoas,
        wholesalesRoas: wholesalesRoas,
        package: {
          sales: packageSalesData.totalSalesValue,
          newLeads: packageNewLeadsCount || 0, // ใช้ข้อมูล Package Lead ใหม่แยกตามประเภท
          pkOutQt: packagePkOutQt,
          totalQtDocuments: (packagePkOutQt || 0) + (packageWin || 0), // QT ที่ออกทั้งหมด = PK ออก QT + Win QT
          win: packageWin,
          conversionRate: packageConversionRate,
          winRateQt: packageWinRateQt
        },
        wholesales: {
          sales: wholesalesData.totalSalesValue,
          newLeads: wholesalesNewLeadsCount || 0, // ใช้ข้อมูล Wholesales Lead ใหม่แยกตามประเภท
          whOutQt: wholesalesWhOutQt,
          totalQtDocuments: (wholesalesWhOutQt || 0) + (wholesalesWinQt || 0), // QT ที่ออกทั้งหมด = WH ออก QT + Win QT
          winQt: wholesalesWinQt,
          winRateQt: wholesalesWinRateQt,
          conversionRate: wholesalesConversionRate
        },
        totalInboxFromAds: inboxData.totalMessages,
        inboxBreakdown: {
          packageMessages: inboxData.packageMessages,
          packageCostPerMessage: inboxData.packageCostPerMessage,
          wholesalesMessages: inboxData.wholesalesMessages,
          wholesalesCostPerMessage: inboxData.wholesalesCostPerMessage,
          otherMessages: inboxData.otherMessages,
          otherCostPerMessage: inboxData.otherCostPerMessage
        }
      }));

    } catch (error) {
      console.error('❌ Error fetching marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "ไม่มีข้อมูล";
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "ไม่มีข้อมูล";
    return num.toLocaleString('th-TH');
  };

  const formatPercentage = (num: number | null) => {
    if (num === null) return "ไม่มีข้อมูล";
    return num.toFixed(1) + '%';
  };

  return (
    <div className="p-1 min-h-screen flex flex-col">
      {/* Date Range Picker */}
      <div className="mb-2 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Marketing Dashboard</h1>
          {dateRangeFilter?.from && dateRangeFilter?.to && (
            <p className="text-sm text-gray-600 mt-1">
              ข้อมูลช่วง: {dateRangeFilter.from.toLocaleDateString('th-TH')} - {dateRangeFilter.to.toLocaleDateString('th-TH')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker
            value={dateRangeFilter}
            onChange={setDateRangeFilter}
            placeholder="เลือกช่วงเวลา"
          />
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              กำลังโหลดข้อมูล...
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Column 1: Sales and Conversion Metrics */}
        <div className="flex flex-col gap-2">
          {/* ยอดขาย และ Package & Wholesales */}
          <Card className="bg-gradient-to-br from-white to-gray-50 border-2 border-yellow-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              {/* ยอดขาย ทั้งหมด */}
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">ยอดขาย ทั้งหมด</h3>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-700 p-2 rounded-xl shadow-lg">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatNumber(dashboardData.totalSales)}</p>
                </div>
              </div>

              {/* Package & Wholesales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {/* Package */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
                  <h4 className="text-2xl font-bold text-blue-900 mb-2 text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">PACKAGE</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">ยอดขาย</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.sales)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Lead ใหม่</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.newLeads)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">QT ที่ออกทั้งหมด</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.totalQtDocuments)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">PK ออก QT(ยังไม่ปิดการขาย)</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.pkOutQt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Win QT (ปิดการขายแล้ว)</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.win)}</p>
                      </div>
                    </div>
                    <div>
                      {/* <p className="text-gray-600 text-base mb-1 text-center font-medium">Conversion Rate (Lead)</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.package.conversionRate)}</p>
                      </div> */}
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Win Rate (QT)</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.package.winRateQt)}</p>
                      </div>
                      <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Conversion Rate (Lead)</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.package.conversionRate)}</p>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Wholesales */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl border border-orange-200">
                  <h4 className="text-2xl font-bold text-orange-900 mb-2 text-center bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">WHOLESALES</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">ยอดขาย</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.sales)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Lead ใหม่</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.newLeads)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">QT ที่ออกทั้งหมด</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.totalQtDocuments)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">WH ออก QT (ยังไม่ปิดการขาย)</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.whOutQt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Win QT (ปิดการขายเเล้ว)</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.winQt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Win Rate (QT)</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.wholesales.winRateQt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Conversion Rate (Lead)</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.wholesales.conversionRate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Ad Spend and Inbox Metrics */}
        <div className="flex flex-col gap-2">
          {/* งบ Ads ทั้งหมด */}
          <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">งบ Ads ทั้งหมด</h3>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-xl shadow-lg mb-4">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatCurrency(dashboardData.totalAdBudget)}</p>
                </div>
              </div>
              
              {/* Facebook Ads */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Facebook className="h-6 w-6 text-blue-500" />
                  <span className="text-gray-900 font-bold text-lg">FacebookAds</span>
                  <div className={`w-3 h-3 rounded-full ${facebookApiConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                       title={facebookApiConnected ? 'เชื่อมต่อ Facebook API สำเร็จ' : 'ไม่สามารถเชื่อมต่อ Facebook API ได้'}></div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-xl shadow-md mb-3">
                  {facebookApiConnected ? (
                    <p className="text-white font-bold text-xl text-center drop-shadow-sm">{formatCurrency(dashboardData.facebookAds.total)}</p>
                  ) : (
                    <p className="text-white font-bold text-lg text-center drop-shadow-sm">ไม่สามารถดึงข้อมูลได้</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2 font-medium">FBAds Package</p>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl shadow-sm">
                      {facebookApiConnected ? (
                        <p className="text-white text-lg font-bold drop-shadow-sm">{formatCurrency(dashboardData.facebookAds.package)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2 font-medium">FBAds Wholesales</p>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl shadow-sm">
                      {facebookApiConnected ? (
                        <p className="text-white text-lg font-bold drop-shadow-sm">{formatCurrency(dashboardData.facebookAds.wholesales)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2 font-medium">FBAds อื่นๆ</p>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl shadow-sm">
                      {facebookApiConnected ? (
                        <p className="text-white text-lg font-bold drop-shadow-sm">{formatCurrency(dashboardData.facebookAds.others)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Ads */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Chrome className="h-6 w-6 text-orange-500" />
                  <span className="text-gray-900 font-bold text-lg">GoogleAds</span>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-4 rounded-xl shadow-md">
                  <p className="text-white font-bold text-xl text-center drop-shadow-sm">{formatCurrency(dashboardData.googleAds.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ค่า Ads / Lead */}
          <Card className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">ค่า Ads / Lead</h3>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 rounded-xl shadow-lg mb-4">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatNumber(dashboardData.adCostPerLead)}</p>
                </div>
                <div className="mb-3">
                  <p className="text-gray-600 text-lg font-semibold">Lead ใหม่ ทั้งหมด</p>
                </div>
                <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-4 rounded-xl shadow-lg">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatNumber(dashboardData.totalNewLeads)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Ad Performance and RoAS */}
        <div className="flex flex-col gap-2">
          {/* Inbox จาก Ads ทั้งหมด */}
          <Card className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Inbox จาก Ads ทั้งหมด</h3>
                  <div className={`w-3 h-3 rounded-full ${facebookApiConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                       title={facebookApiConnected ? 'เชื่อมต่อ Facebook API สำเร็จ' : 'ไม่สามารถเชื่อมต่อ Facebook API ได้'}></div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-4 rounded-xl shadow-lg mb-4">
                  {facebookApiConnected ? (
                    <p className="text-white text-2xl font-bold drop-shadow-lg">{formatNumber(dashboardData.totalInboxFromAds)}</p>
                  ) : (
                    <p className="text-white text-lg font-bold drop-shadow-lg">ไม่สามารถดึงข้อมูลได้</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ข้อความ ฝั่ง Package</p>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.inboxBreakdown.packageMessages)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ต้นทุนต่อข้อความ ฝั่ง Package</p>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatCurrency(dashboardData.inboxBreakdown.packageCostPerMessage)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ข้อความ ฝั่ง Wholesales</p>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.inboxBreakdown.wholesalesMessages)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ต้นทุนต่อข้อความ ฝั่ง Wholesales</p>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatCurrency(dashboardData.inboxBreakdown.wholesalesCostPerMessage)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ข้อความ สินค้าอื่นๆ</p>
                    <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.inboxBreakdown.otherMessages)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ต้นทุนต่อข้อความ ฝั่ง บริการอื่นๆ</p>
                    <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatCurrency(dashboardData.inboxBreakdown.otherCostPerMessage)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall RoAS */}
          <Card className="bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Overall RoAS</h3>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 rounded-xl shadow-lg mb-4">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatPercentage(dashboardData.overallRoas)}</p>
                </div>
                <p className="text-gray-500 text-sm mb-4 font-medium">*Return on Ad Spend - % ผลลัพธ์จากการลงทุน</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ROAS ฝั่ง Package</p>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                      <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.packageRoas)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ROAS ฝั่ง Wholesales</p>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                      <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.wholesalesRoas)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;
