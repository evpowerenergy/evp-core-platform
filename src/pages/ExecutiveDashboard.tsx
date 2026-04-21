import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, FileText, Star, TrendingUp, Target, Calendar, MapPin, Zap, UserCheck, UserX, DollarSign, Activity, ArrowLeft, Home, Megaphone, Coins, MessageSquare, Package, ShoppingCart, Facebook, Chrome, AlertCircle, CheckCircle, Clock, X, RefreshCw, Wrench, Phone } from "lucide-react";
import ThailandMap from "@/components/dashboard/ThailandMap";
import { useAppData } from "@/hooks/useAppDataAPI";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import { PLATFORM_OPTIONS, getPlatformIcon } from "@/utils/dashboardUtils";
import {  
  calculateAssignedLeads, 
  calculateUnassignedLeads, 
  calculateAssignmentRate,
  calculateLeadsByStatus,
  calculateLeadsByPlatform,
  calculateTotalLeadsWithContact,
  calculateAssignedLeadsWithContact,
  calculateUnassignedLeadsWithContact,
  calculateAssignmentRateWithContact,
  calculateLeadsByStatusWithContact,
  calculateLeadsByPlatformWithContact
} from "@/utils/leadValidation";
import { ReactECharts } from '@/utils/echartsLoader.tsx';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSalesDataInPeriod, getQuotationDataFromDocuments, getSalesDataByCategory, getQuotationDataFromView, getOpportunityDataFromView } from "@/utils/salesUtils";
import { filterLeadsWithContact } from "@/utils/leadQueryFilters";
import { getFacebookAdsData, isFacebookApiConfigured } from "@/utils/facebookAdsUtils";
import { getGoogleAdsData, isGoogleApiConfigured } from "@/utils/googleAdsUtils";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/hooks/useToast";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { isInDateRange } from '@/utils/dateFilterUtils';
import SalesFunnelChart from "@/components/charts/SalesFunnelChart";
import MarketingLineChart from "@/components/marketing/MarketingLineChart";
import { useCustomerServiceStatsAPI as useCustomerServiceStats, useCustomerServicesAPI as useCustomerServices } from "@/hooks/useCustomerServicesAPI";

// สีสำหรับแต่ละแพลตฟอร์ม
const platformColors = {
  'Facebook': 'border-blue-200 text-blue-600',
  'Line': 'border-green-200 text-green-600', 
  'Huawei': 'border-red-200 text-red-600',
  'Huawei (C&I)': 'border-red-300 text-red-700',
  'Website': 'border-purple-200 text-purple-600',
  'TikTok': 'border-gray-200 text-gray-900',
  'IG': 'border-pink-200 text-pink-600',
  'YouTube': 'border-red-200 text-red-600',
  'Shopee': 'border-orange-200 text-orange-600',
  'Lazada': 'border-blue-200 text-blue-600',
  'แนะนำ': 'border-green-200 text-green-600',
  'Outbound': 'border-indigo-200 text-indigo-600',
  'โทร': 'border-gray-200 text-gray-600',
  'ATMOCE': 'border-cyan-200 text-cyan-600',
  'Solar Edge': 'border-yellow-200 text-yellow-600',
  'Sigenergy': 'border-purple-200 text-purple-600',
  'solvana': 'border-emerald-200 text-emerald-600',
  'terawatt': 'border-teal-200 text-teal-600',
  'ลูกค้าเก่า service ครบ': 'border-amber-200 text-amber-600'
};

// ฟังก์ชันคำนวณวันที่เริ่มต้นและสิ้นสุดจาก DateRange
const getDateRange = (dateRange: DateRange | undefined) => {
  if (!dateRange || !dateRange.from) {
    const now = new Date();
    return {
      startDate: now,
      endDate: now
    };
  }
  
  return {
    startDate: dateRange.from,
    endDate: dateRange.to || dateRange.from
  };
};

// ฟังก์ชันแปลง DateRange เป็น string format
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
    
    const fromString = formatter.format(fromDate);
    const toString = formatter.format(toDate);
    
    startDate = fromString + 'T00:00:00.000';
    endDate = toString + 'T23:59:59.999';
  } else {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const todayString = formatter.format(now);
    startDate = todayString + 'T00:00:00.000';
    endDate = todayString + 'T23:59:59.999';
  }
  
  return { startDate, endDate };
};

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
  };
  wholesales: {
    sales: number | null;
    newLeads: number;
    whOutQt: number;
    totalQtDocuments: number;
    winQt: number;
    winRateQt: number | null;
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

interface ReportData {
  main_status: string;
  detail_status: string;
  count: number;
}

interface SummaryData {
  total: number;
  byMainStatus: { [key: string]: number };
  byDetailStatus: { [key: string]: number };
}

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // วันที่ 1 ของเดือนนี้
    to: new Date() // วันนี้
  });

  // Marketing Dashboard state
  const [marketingData, setMarketingData] = useState<MarketingDashboardData>({
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
      conversionRate: null
    },
    wholesales: {
      sales: null,
      newLeads: 0,
      whOutQt: 0,
      totalQtDocuments: 0,
      winQt: 0,
      winRateQt: null
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
  
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [facebookApiConnected, setFacebookApiConnected] = useState(false);
  const [googleApiConnected, setGoogleApiConnected] = useState(false);

  // Permit Dashboard state
  const [permitReportData, setPermitReportData] = useState<ReportData[]>([]);
  const [permitSummaryData, setPermitSummaryData] = useState<SummaryData | null>(null);
  const [permitLoading, setPermitLoading] = useState(false);

  // Customer Services Dashboard - Fetch data (แสดงข้อมูลทั้งหมด - ไม่ใช้ date filter)
  const { data: customerServiceStats, isLoading: customerServiceStatsLoading } = useCustomerServiceStats();
  const { data: customerServices, isLoading: customerServicesLoading } = useCustomerServices();

  // ✅ ดึงข้อมูล leads ทั้งหมดสำหรับการคำนวณสถิติ (filter ตาม date range)
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['all-leads-for-executive-dashboard', dateRangeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (dateRangeFilter && dateRangeFilter.from) {
        const fromDate = dateRangeFilter.from;
        const toDate = dateRangeFilter.to || dateRangeFilter.from;
        
        const formatter = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const startDateString = formatter.format(fromDate);
        const startString = startDateString + 'T00:00:00.000';
        
        const endDateString = formatter.format(toDate);
        const endString = endDateString + 'T23:59:59.999';
        
        params.append('from', startString);
        params.append('to', endString);
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
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ดึงข้อมูลลีดใหม่สำหรับ chart
  const { data: newLeadsForChart, isLoading: newLeadsLoading } = useQuery({
    queryKey: ['new-leads-for-executive-chart', dateRangeFilter],
    queryFn: async () => {
      if (!dateRangeFilter) return [];
      
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      let query = supabase
        .from('leads')
        .select('id, created_at_thai, status, platform')
        .eq('has_contact_info', true);

      query = query
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching new leads:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!dateRangeFilter,
  });

  // ดึงข้อมูลลีดที่ปิดการขายสำหรับ chart
  const { data: closedLeadsForChart, isLoading: closedLeadsLoading } = useQuery({
    queryKey: ['closed-leads-for-executive-chart', dateRangeFilter],
    queryFn: async () => {
      if (!dateRangeFilter) return [];
      
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      let query = supabase
        .from('lead_productivity_logs')
        .select('id, lead_id, created_at_thai, status')
        .eq('status', 'ปิดการขายแล้ว');

      query = query
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching closed leads:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!dateRangeFilter,
  });

  // ฟังก์ชันแปลงชื่อจังหวัดให้ตรงกับแผนที่
  const normalizeRegionName = (region: string): string => {
    if (!region) return 'ไม่ระบุ';
    
    const regionLower = region.toLowerCase().trim();
    
    const regionMap: { [key: string]: string } = {
      'bangkok': 'Bangkok Metropolis',
      'bkk': 'Bangkok Metropolis',
      'กรุงเทพ': 'Bangkok Metropolis',
      'กรุงเทพฯ': 'Bangkok Metropolis',
      'กรุงเทพมหานคร': 'Bangkok Metropolis',
      'chiang mai': 'Chiang Mai',
      'chiangmai': 'Chiang Mai',
      'เชียงใหม่': 'Chiang Mai',
      'chiang rai': 'Chiang Rai',
      'chiangrai': 'Chiang Rai',
      'เชียงราย': 'Chiang Rai',
      // เพิ่มจังหวัดอื่นๆ ตามต้องการ
    };
    
    if (regionMap[regionLower]) {
      return regionMap[regionLower];
    }
    
    for (const [key, value] of Object.entries(regionMap)) {
      if (regionLower.includes(key) || key.includes(regionLower)) {
        return value;
      }
    }
    
    return region;
  };

  // คำนวณสถิติภาพรวม
  const stats = useMemo(() => {
    if (!leads || leads.length === 0) {
      return {
        totalLeads: 0,
        assignedLeads: 0,
        unassignedLeads: 0,
        assignmentRate: 0,
        thisMonthLeads: 0,
        thisWeekLeads: 0,
        todayLeads: 0,
        ppaProjectLeads: 0,
        platformStats: [],
        statusStats: {
          'ใหม่': 0,
          'ติดต่อแล้ว': 0,
          'นัดหมาย': 0,
          'ปิดการขาย': 0,
          'ไม่สนใจ': 0
        },
        dailyLeads: [],
        dailyNewLeads: [],
        dailyClosedLeads: []
      };
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalLeads = calculateTotalLeadsWithContact(leads, false);
    const assignedLeads = calculateAssignedLeadsWithContact(leads, false);
    const unassignedLeads = calculateUnassignedLeadsWithContact(leads, false);
    const assignmentRate = calculateAssignmentRateWithContact(leads, false);

    const thisMonthLeads = calculateTotalLeadsWithContact(
      leads.filter(lead => new Date(lead.created_at_thai) >= thisMonth), 
      false
    );
    const thisWeekLeads = calculateTotalLeadsWithContact(
      leads.filter(lead => new Date(lead.created_at_thai) >= thisWeek), 
      false
    );
    const todayLeads = calculateTotalLeadsWithContact(
      leads.filter(lead => new Date(lead.created_at_thai) >= today), 
      false
    );

    // Calculate PPA Project leads
    const ppaProjectLeads = leads.filter(lead => 
      lead.is_from_ppa_project === true
    ).length;

    const platformStats = PLATFORM_OPTIONS.map(platform => {
      const count = calculateLeadsByPlatformWithContact(leads, platform, false);
      const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
      return {
        name: platform,
        count,
        percentage
      };
    });

    const statusStats = {
      'ใหม่': calculateLeadsByStatusWithContact(leads, 'ใหม่', false),
      'ติดต่อแล้ว': calculateLeadsByStatusWithContact(leads, 'ติดต่อแล้ว', false),
      'นัดหมาย': calculateLeadsByStatusWithContact(leads, 'นัดหมาย', false),
      'ปิดการขาย': calculateLeadsByStatusWithContact(leads, 'ปิดการขาย', false),
      'ไม่สนใจ': calculateLeadsByStatusWithContact(leads, 'ไม่สนใจ', false)
    };

    const dailyLeads = [];
    const dailyNewLeads = [];
    const dailyClosedLeads = [];
    
    const { startDate, endDate } = getDateRange(dateRangeFilter);
    const chartStartDate = startDate;
    
    for (let d = new Date(chartStartDate); d <= endDate; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const dateStr = d.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const dayString = formatter.format(d);
      
      const newLeadsCount = newLeadsForChart?.filter(lead => {
        const leadDate = new Date(lead.created_at_thai);
        const leadDateString = leadDate.toISOString().split('T')[0];
        return leadDateString === dayString;
      }).length || 0;
      
      const closedLeadsCount = closedLeadsForChart?.filter(log => {
        const logDate = new Date(log.created_at_thai);
        const logDateString = logDate.toISOString().split('T')[0];
        return logDateString === dayString;
      }).length || 0;
      
      dailyLeads.push({ date: dateStr, count: newLeadsCount });
      dailyNewLeads.push({ date: dateStr, count: newLeadsCount });
      dailyClosedLeads.push({ date: dateStr, count: closedLeadsCount });
    }

    return {
      totalLeads,
      assignedLeads,
      unassignedLeads,
      assignmentRate,
      thisMonthLeads,
      thisWeekLeads,
      todayLeads,
      ppaProjectLeads,
      platformStats,
      statusStats,
      dailyLeads,
      dailyNewLeads,
      dailyClosedLeads
    };
  }, [leads, newLeadsForChart, closedLeadsForChart, dateRangeFilter]);

  // ดึงข้อมูล productivity logs
  const { data: productivityLogs } = useQuery({
    queryKey: ['productivity-logs-for-executive-charts', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      const { data, error } = await supabase
        .from('lead_productivity_logs')
        .select(`
          id,
          created_at_thai,
          customer_category,
          lead_group,
          lead_id,
          leads (
            id,
            status
          )
        `)
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate)
        .order('created_at_thai', { ascending: false });

      if (error) {
        console.error('Error fetching productivity logs:', error);
        return [];
      }
      
      if (data && data.length > 0) {
        const logIds = data.map(log => log.id);
        
        const { data: quotationsData, error: quotationsError } = await supabase
          .from('quotations')
          .select('id, productivity_log_id, total_amount, has_qt, has_inv')
          .in('productivity_log_id', logIds);
        
        if (quotationsError) {
          console.error('Error fetching quotations:', quotationsError);
        }
        
        const enrichedData = data.map(log => ({
          ...log,
          quotations: quotationsData?.filter(q => q.productivity_log_id === log.id) || []
        }));
        
        return enrichedData;
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ดึงข้อมูลยอดขาย
  const { data: salesData } = useQuery({
    queryKey: ['sales-data-for-executive-charts', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      return await getSalesDataInPeriod(
        startDate,
        endDate
      );
    },
    staleTime: 1000 * 60 * 5,
  });

  // ดึงข้อมูล QT ทั้งหมด (ไม่ซ้ำ) สำหรับคำนวณ Win Rate
  // ใช้วิธีเดียวกับ getSalesDataInPeriod เพื่อให้ช่วงเวลาและ logic ตรงกัน
  const { data: allQuotationData } = useQuery({
    queryKey: ['all-quotation-data-for-winrate', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      try {
        // ดึง productivity logs ที่มี QT (ไม่ว่าจะปิดหรือยังไม่ปิด) ในช่วงเวลาที่เลือก
        // ใช้ logic เดียวกับ getSalesDataInPeriod แต่ไม่ filter status
        let logsQuery = supabase
          .from('lead_productivity_logs')
          .select(`
            id, 
            lead_id, 
            created_at_thai,
            leads!inner(
              id,
              category
            )
          `);

        // Filter ตามช่วงเวลา (ใช้ created_at_thai ของ log เหมือน getSalesDataInPeriod)
        if (startDate && endDate) {
          logsQuery = logsQuery
            .gte('created_at_thai', startDate)
            .lte('created_at_thai', endDate);
        }

        const { data: logs, error: logsError } = await logsQuery;

        if (logsError) {
          console.error('Error fetching productivity logs:', logsError);
          throw logsError;
        }

        // ดึง quotation_documents จาก logs เหล่านั้น
        const logIds = logs?.map(log => log.id) || [];
        let quotations: any[] = [];
        
        if (logIds.length > 0) {
          const { data: quotationsData, error: quotationsError } = await supabase
            .from('quotation_documents')
            .select(`
              amount, 
              productivity_log_id, 
              document_number,
              created_at_thai
            `)
            .in('productivity_log_id', logIds)
            .eq('document_type', 'quotation');

          if (quotationsError) {
            console.error('Error fetching quotation_documents:', quotationsError);
            throw quotationsError;
          }

          quotations = quotationsData || [];
        }

        // นับ QT ทั้งหมด (ไม่ซ้ำ) โดยใช้ document_number
        const uniqueQuotations = new Set(
          quotations.map(q => q.document_number?.toLowerCase().replace(/\s+/g, '') || '').filter(Boolean)
        );
        const totalQuotations = uniqueQuotations.size;

        // คำนวณจำนวน QT ตาม category
        const quotationByCategory = new Map<string, number>();
        const categoryQuotationMap = new Map<string, Set<string>>();

        logs?.forEach(log => {
          const category = log.leads?.category || 'ไม่ระบุ';
          const logQuotations = quotations.filter(q => q.productivity_log_id === log.id);
          
          if (!categoryQuotationMap.has(category)) {
            categoryQuotationMap.set(category, new Set());
          }
          
          logQuotations.forEach(q => {
            const normalizedDoc = q.document_number?.toLowerCase().replace(/\s+/g, '') || '';
            if (normalizedDoc) {
              categoryQuotationMap.get(category)!.add(normalizedDoc);
            }
          });
        });

        categoryQuotationMap.forEach((quotationSet, category) => {
          quotationByCategory.set(category, quotationSet.size);
        });
        
        return {
          totalQuotations,
          quotationByCategory,
          quotationLeads: []
        };
      } catch (error) {
        console.error('Error fetching all quotation data:', error);
        return {
          totalQuotations: 0,
          quotationByCategory: new Map(),
          quotationLeads: []
        };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // ดึงข้อมูล interested_kw_size จากลีดที่ปิดการขายแล้ว (เฉพาะ category = Package)
  // นับตามจำนวน QT จริงๆ (ไม่ใช่จำนวน log) เพื่อให้ตรงกับ card "รายการปิดการขาย"
  const { data: kwSizeData } = useQuery({
    queryKey: ['kw-size-from-closed-sales', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      // 1. ดึง productivity logs ที่ปิดการขายแล้ว (Package)
      let logsQuery = supabase
        .from('lead_productivity_logs')
        .select(`
          id,
          interested_kw_size,
          leads!inner(
            id,
            category
          )
        `)
        .eq('status', 'ปิดการขายแล้ว')
        .eq('leads.category', 'Package')
        .or(`sale_chance_status.eq.win,and(sale_chance_status.eq.win + สินเชื่อ,credit_approval_status.eq.อนุมัติ)`)
        .not('interested_kw_size', 'is', null);

      if (startDate && endDate) {
        logsQuery = logsQuery.gte('created_at_thai', startDate).lte('created_at_thai', endDate);
      }

      const { data: logs, error: logsError } = await logsQuery;

      if (logsError) {
        console.error('Error fetching productivity logs:', logsError);
        throw logsError;
      }

      if (!logs || logs.length === 0) {
        return [];
      }

      // 2. ดึง quotation_documents จาก logs เหล่านั้น
      const logIds = logs.map(log => log.id);
      const { data: quotations, error: quotationsError } = await supabase
        .from('quotation_documents')
        .select('productivity_log_id, document_number, created_at_thai')
        .in('productivity_log_id', logIds)
        .eq('document_type', 'quotation');

      if (quotationsError) {
        console.error('Error fetching quotation documents:', quotationsError);
        throw quotationsError;
      }

      // 3. ทำ deduplication ของ QT ซ้ำ (เหมือนกับ getSalesDataInPeriod)
      const normalizedQuotations = (quotations || []).map(q => ({
        ...q,
        normalized_doc: q.document_number?.toLowerCase().replace(/\s+/g, '') || ''
      }));

      const uniqueQuotationsMap = new Map();
      normalizedQuotations.forEach(q => {
        const key = `${q.productivity_log_id}_${q.normalized_doc}`;
        const existing = uniqueQuotationsMap.get(key);
        
        if (!existing || new Date(q.created_at_thai) > new Date(existing.created_at_thai)) {
          uniqueQuotationsMap.set(key, q);
        }
      });

      const uniqueQuotations = Array.from(uniqueQuotationsMap.values());

      // 4. Map quotation กลับไปหา interested_kw_size จาก log
      const kwSizeData = uniqueQuotations.map(qt => {
        const log = logs.find(l => l.id === qt.productivity_log_id);
        return {
          interested_kw_size: log?.interested_kw_size || 'ไม่ระบุ',
          quotation_id: qt.productivity_log_id
        };
      });

      return kwSizeData;
    },
    staleTime: 1000 * 60 * 5,
  });

  // ดึงข้อมูล Funnel - Stage 1: ลีดที่เซลล์รับแล้ว
  const { data: funnelStage1 } = useQuery({
    queryKey: ['funnel-stage1-executive', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      let query = supabase
        .from('leads')
        .select('id, platform, category, sale_owner_id, post_sales_owner_id')
        .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null')
        .eq('is_archived', false);

      if (startDate && endDate) {
        query = query.gte('created_at_thai', startDate).lte('created_at_thai', endDate);
      }

      const { data: leads, error } = await query;

      if (error) {
        console.error('Error fetching stage 1 data:', error);
        return { totalLeads: 0, platformBreakdown: {} };
      }

      const platformBreakdown: { [key: string]: number } = {};

      leads?.forEach(lead => {
        const platform = lead.platform || 'ไม่ระบุ';
        platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
      });

      return {
        totalLeads: leads?.length || 0,
        platformBreakdown
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  // ดึงข้อมูล Funnel - Stage 2: QT ทั้งหมด
  const { data: funnelStage2 } = useQuery({
    queryKey: ['funnel-stage2-executive', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      try {
        const quotationData = await getQuotationDataFromDocuments(
          startDate || new Date().toISOString(), 
          endDate || new Date().toISOString()
        );

        const platformBreakdown: { [key: string]: number } = {};

        quotationData.quotationLogsWithQuotations?.forEach(log => {
          const platform = log.leadPlatform || 'ไม่ระบุ';
          platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
        });

        return {
          totalQuotations: quotationData.quotationCount || 0,
          totalValue: quotationData.totalQuotationValue || 0,
          platformBreakdown
        };
      } catch (error) {
        console.error('Error fetching stage 2 data:', error);
        return { totalQuotations: 0, totalValue: 0, platformBreakdown: {} };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // ดึงข้อมูล Funnel - Stage 3: QT ที่ปิดการขาย
  const { data: funnelStage3 } = useQuery({
    queryKey: ['funnel-stage3-executive', dateRangeFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      try {
        const salesData = await getSalesDataInPeriod(
          startDate || new Date().toISOString(), 
          endDate || new Date().toISOString()
        );

        const platformBreakdown: { [key: string]: number } = {};

        salesData.salesLeads?.forEach(lead => {
          const platform = lead.platform || 'ไม่ระบุ';
          platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
        });

        return {
          totalClosedQuotations: salesData.salesCount || 0,
          totalClosedValue: salesData.totalSalesValue || 0,
          platformBreakdown
        };
      } catch (error) {
        console.error('Error fetching stage 3 data:', error);
        return { totalClosedQuotations: 0, totalClosedValue: 0, platformBreakdown: {} };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Marketing Dashboard data
  useEffect(() => {
    fetchMarketingData();
  }, [dateRangeFilter]);

  // Fetch Permit Dashboard data (แสดงข้อมูลทั้งหมด - ไม่ใช้ date filter)
  useEffect(() => {
    fetchPermitData();
  }, []); // ไม่มี dependency - fetch ครั้งเดียวเมื่อ component mount

  const fetchMarketingData = async () => {
    try {
      setMarketingLoading(true);
      
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
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount < maxRetries) {
            try {
              facebookAdsData = await getFacebookAdsData(facebookStartDate, facebookEndDate);
              setFacebookApiConnected(!!facebookAdsData);
              break;
            } catch (retryError: any) {
              retryCount++;
              
              // ถ้าเป็น 403 error (Forbidden) ไม่ต้อง retry
              if (retryError?.message?.includes('403') || retryError?.message?.includes('Forbidden')) {
                console.warn('⚠️ Facebook API: Access denied (403). Please check API configuration.');
                setFacebookApiConnected(false);
                facebookAdsData = null;
                break;
              }
              
              if (retryCount >= maxRetries) {
                throw retryError;
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error: any) {
          // Suppress error log สำหรับ 403 error เพราะเป็น error ที่คาดได้
          if (!error?.message?.includes('403') && !error?.message?.includes('Forbidden')) {
            console.error('❌ Facebook API Error after retries:', error);
          }
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
          if (googleAdsData) setGoogleApiConnected(true);
          else setGoogleApiConnected(false);
        } catch (error: any) {
          console.error('❌ Google Ads API Error:', error);
          setGoogleApiConnected(false);
          googleAdsData = null;
        }
      } else {
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

      if (facebookAdsData) {
        try {
          const totalMessagingConversations = facebookAdsData.totalMessagingConversations || 0;
          const totalSpend = facebookAdsData.totalSpend || 0;
          
          let packageMessages = facebookAdsData.packageMessagingConversations || 0;
          let wholesalesMessages = facebookAdsData.wholesalesMessagingConversations || 0;
          let otherMessages = facebookAdsData.othersMessagingConversations || 0;
          
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
      }

      // ดึงข้อมูลยอดขายรวมจากระบบ CRM
      const totalSalesData = await getSalesDataInPeriod(
        startDate || new Date().toISOString(), 
        endDate || new Date().toISOString()
      );

      // ดึงข้อมูล Package
      let packageActivityLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, status, platform, region, created_at_thai, sale_owner_id, category, tel, line_id')
        .eq('category', 'Package')
        .not('sale_owner_id', 'is', null);
      
      packageActivityLeadsQuery = filterLeadsWithContact(packageActivityLeadsQuery);

      if (startDate && endDate) {
        packageActivityLeadsQuery = packageActivityLeadsQuery
          .gte('updated_at_thai', startDate)
          .lte('updated_at_thai', endDate);
      }

      const [
        packageSalesData,
        packageQuotationData,
        packageOpportunityData,
        packageActivityLeadsResult
      ] = await Promise.all([
        getSalesDataByCategory(
          startDate || new Date().toISOString(), 
          endDate || new Date().toISOString(),
          'Package'
        ),
        getQuotationDataFromView(
          startDate || new Date().toISOString(), 
          endDate || new Date().toISOString(), 
          'Package'
        ),
        getOpportunityDataFromView(
          startDate || new Date().toISOString(), 
          endDate || new Date().toISOString(), 
          'Package'
        ),
        packageActivityLeadsQuery.then(result => {
          if (result.error) throw result.error;
          return result;
        })
      ]);

      // ดึงข้อมูล Wholesale
      let wholesalesActivityLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, status, platform, region, created_at_thai, sale_owner_id, category, tel, line_id')
        .in('category', ['Wholesale', 'Wholesales'])
        .not('sale_owner_id', 'is', null);
      
      wholesalesActivityLeadsQuery = filterLeadsWithContact(wholesalesActivityLeadsQuery);

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
          uniqueLeadIds: [...(wholesaleData.uniqueLeadIds || []), ...(wholesalesData.uniqueLeadIds || [])]
        })),
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
        wholesalesActivityLeadsQuery.then(result => {
          if (result.error) throw result.error;
          return result;
        })
      ]);

      // ดึงข้อมูล Lead ใหม่ทั้งหมด
      let totalNewLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, tel, line_id, status, platform, region, created_at_thai, sale_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by');
      
      totalNewLeadsQuery = filterLeadsWithContact(totalNewLeadsQuery);

      if (startDate && endDate) {
        totalNewLeadsQuery = totalNewLeadsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: allLeadsData } = await totalNewLeadsQuery;

      const allValidLeads = allLeadsData?.filter(lead => 
        lead.platform && lead.platform.trim() !== ''
      ) || [];

      const totalNewLeads = allValidLeads.length;

      // ดึงข้อมูล Lead ใหม่แยกตามประเภท Package
      let packageNewLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, tel, line_id, status, platform, region, created_at_thai, sale_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by')
        .eq('category', 'Package');
      
      packageNewLeadsQuery = filterLeadsWithContact(packageNewLeadsQuery);

      if (startDate && endDate) {
        packageNewLeadsQuery = packageNewLeadsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: packageLeadsData } = await packageNewLeadsQuery;

      // ดึงข้อมูล Lead ใหม่แยกตามประเภท Wholesales
      let wholesalesNewLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, tel, line_id, status, platform, region, created_at_thai, sale_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by')
        .in('category', ['Wholesale', 'Wholesales']);
      
      wholesalesNewLeadsQuery = filterLeadsWithContact(wholesalesNewLeadsQuery);

      if (startDate && endDate) {
        wholesalesNewLeadsQuery = wholesalesNewLeadsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: wholesalesLeadsData } = await wholesalesNewLeadsQuery;

      const packageValidLeads = packageLeadsData?.filter(lead => 
        lead.platform && lead.platform.trim() !== ''
      ) || [];

      const wholesalesValidLeads = wholesalesLeadsData?.filter(lead => 
        lead.platform && lead.platform.trim() !== ''
      ) || [];

      const packageNewLeadsCount = packageValidLeads.length;
      const wholesalesNewLeadsCount = wholesalesValidLeads.length;

      // คำนวณ Package metrics
      const packageActivityLeads = packageActivityLeadsResult.data || [];
      const validPackageLeads = packageActivityLeads;
      
      const packagePkOutQt = packageQuotationData.quotationLogsWithQuotations.length;
      const packageWin = packageSalesData.salesCount;
      
      const packageWonLeads = validPackageLeads.filter(lead => lead.status === 'ปิดการขาย');
      const packageConversionRate = validPackageLeads.length > 0 
        ? (packageWonLeads.length / validPackageLeads.length) * 100 
        : 0;

      // คำนวณ Wholesale metrics
      const wholesalesActivityLeads = wholesalesActivityLeadsResult.data || [];
      const validWholesalesLeads = wholesalesActivityLeads;
      
      const wholesalesWhOutQt = wholesalesQuotationData.quotationLogsWithQuotations.length;
      const wholesalesWinQt = wholesalesData.salesCount;
      
      const wholesalesWonLeads = validWholesalesLeads.filter(lead => lead.status === 'ปิดการขาย');
      const wholesalesWinRateQt = validWholesalesLeads.length > 0 
        ? (wholesalesWonLeads.length / validWholesalesLeads.length) * 100 
        : 0;

      const facebookSpend = facebookAdsData ? facebookAdsData.totalSpend : 0;
      const googleSpend = googleAdsData ? googleAdsData.totalCost : 0;
      const totalAdBudget = facebookSpend + googleSpend;
      
      const adCostPerLead = totalAdBudget > 0 && totalNewLeads > 0 
        ? totalAdBudget / totalNewLeads 
        : null;
      
      const overallRoas = totalAdBudget > 0 
        ? ((totalSalesData.totalSalesValue || 0) / totalAdBudget) * 100 
        : null;
      
      const packageTotalSpend = (facebookAdsData ? facebookAdsData.packageSpend : 0) + (googleAdsData ? googleAdsData.packageCost : 0);
      const packageRoas = packageTotalSpend > 0 
        ? ((packageSalesData.totalSalesValue || 0) / packageTotalSpend) * 100 
        : null;
      
      const wholesalesTotalSpend = (facebookAdsData ? facebookAdsData.wholesalesSpend : 0) + (googleAdsData ? googleAdsData.wholesalesCost : 0);
      const wholesalesRoas = wholesalesTotalSpend > 0 
        ? ((wholesalesData.totalSalesValue || 0) / wholesalesTotalSpend) * 100 
        : null;

      setMarketingData({
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
          newLeads: packageNewLeadsCount || 0,
          pkOutQt: packagePkOutQt,
          totalQtDocuments: (packagePkOutQt || 0) + (packageWin || 0),
          win: packageWin,
          conversionRate: packageConversionRate
        },
        wholesales: {
          sales: wholesalesData.totalSalesValue,
          newLeads: wholesalesNewLeadsCount || 0,
          whOutQt: wholesalesWhOutQt,
          totalQtDocuments: (wholesalesWhOutQt || 0) + (wholesalesWinQt || 0),
          winQt: wholesalesWinQt,
          winRateQt: wholesalesWinRateQt
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
      });

    } catch (error) {
      console.error('❌ Error fetching marketing data:', error);
    } finally {
      setMarketingLoading(false);
    }
  };

  // Helper functions for formatting
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

  // Fetch Permit Dashboard data
  const fetchPermitData = async () => {
    try {
      setPermitLoading(true);
      
      // ไม่ใช้ date filter - แสดงข้อมูลทั้งหมด
      let query = supabase
        .from("permit_requests")
        .select("main_status, sub_status, executor, province, created_at");

      const { data, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Failed to fetch data: ${error.message}`);
      }

      // Process data for report
      const processedData: ReportData[] = [];
      const summary: SummaryData = {
        total: 0,
        byMainStatus: {},
        byDetailStatus: {}
      };

      data?.forEach((item) => {
        let mainStatus = item.main_status;
        let detailStatus = item.sub_status;

        // Move "ไม่ยื่นขออนุญาต" and "ยกเลิกกิจการ" under "ดำเนินการเสร็จสิ้น"
        if (item.main_status === "ไม่ยื่นขออนุญาต" || item.main_status === "ยกเลิกกิจการ") {
          mainStatus = "ดำเนินการเสร็จสิ้น";
          detailStatus = item.main_status;
        } else if (item.main_status === "ดำเนินการเสร็จสิ้น") {
          detailStatus = item.executor;
        }

        // Use fallback if detailStatus is empty
        if (!detailStatus) {
          detailStatus = "ไม่ระบุ";
        }

        processedData.push({
          main_status: mainStatus,
          detail_status: detailStatus,
          count: 1
        });

        // Update summary
        summary.total += 1;
        summary.byMainStatus[mainStatus] = (summary.byMainStatus[mainStatus] || 0) + 1;
        summary.byDetailStatus[detailStatus] = (summary.byDetailStatus[detailStatus] || 0) + 1;
      });

      // Group and sum by main_status and detail_status
      const groupedData = processedData.reduce((acc, item) => {
        const key = `${item.main_status}-${item.detail_status}`;
        if (acc[key]) {
          acc[key].count += item.count;
        } else {
          acc[key] = { ...item };
        }
        return acc;
      }, {} as { [key: string]: ReportData });

      setPermitReportData(Object.values(groupedData));
      setPermitSummaryData(summary);

    } catch (error) {
      console.error("Error fetching permit data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายงานได้",
        variant: "destructive",
      });
    } finally {
      setPermitLoading(false);
    }
  };

  // Helper functions for Permit Dashboard
  const getPermitStatusIcon = (status: string) => {
    switch (status) {
      case "ไม่สามารถดำเนินการได้":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "ระหว่างดำเนินการ":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "ดำเนินการเสร็จสิ้น":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "ไม่ยื่นขออนุญาต":
        return <FileText className="h-4 w-4 text-gray-600" />;
      case "ยกเลิกกิจการ":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPermitSubStatusesForCard = (mainStatus: string) => {
    const subStatusOptions = {
      "ดำเนินการเสร็จสิ้น": [
        "EV ดำเนินการให้",
        "ลูกค้าดำเนินการเอง", 
        "ไม่ยื่นขออนุญาต",
        "ยกเลิกกิจการ"
      ],
      "ระหว่างดำเนินการ": [
        "รอเอกสารสำคัญเพื่อจัดทำเล่ม",
        "อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA",
        "ยื่นคำร้องเข้าระบบการไฟฟ้าเรียบร้อย รอการไฟฟ้าดำเนินการตรวจสอบ",
        "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร",
        "อยู่ระหว่างการชำระเงิน",
        "ชำระค่าบริการแล้ว",
        "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้หน้างาน",
        "รอ PEA หรือ MEA นัดหมาย เข้าตรวจสอบงานติดตั้ง",
        "COD เรียบร้อย รอเปลี่ยนมิเตอร์"
      ],
      "ไม่สามารถดำเนินการได้": [
        "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์",
        "รอโควต้าขายไฟรอบใหม่"
      ]
    };

    const predefinedSubStatuses = subStatusOptions[mainStatus as keyof typeof subStatusOptions] || [];
    const dataSubStatuses = permitReportData
      .filter(item => item.main_status === mainStatus)
      .map(item => item.detail_status);

    // Combine predefined + any additional sub-statuses from data
    return Array.from(new Set([...predefinedSubStatuses, ...dataSubStatuses]));
  };

  // Customer Services Dashboard - Calculate stats (แสดงข้อมูลทั้งหมด - ไม่ใช้ date filter)
  const customerServiceDisplayStats = customerServiceStats || {
    total: 0,
    completed: 0,
    serviceVisit1Completed: 0,
    serviceVisit2Completed: 0,
    pendingServiceVisit1: 0,
    pendingServiceVisit2: 0,
  };
  const customerServiceDisplayData = customerServices || [];

  // Calculate additional stats
  const customerServiceFilteredStats = useMemo(() => {
    const services = customerServiceDisplayData;
    return {
      total: services.length,
      completed: services.filter(item => item.completed_visits_count >= 2).length,
      serviceVisit1Completed: services.filter(item => item.service_visit_1 === true).length,
      serviceVisit2Completed: services.filter(item => item.service_visit_2 === true).length,
      serviceVisit3Completed: services.filter(item => item.service_visit_3 === true).length,
      serviceVisit4Completed: services.filter(item => item.service_visit_4 === true).length,
      serviceVisit5Completed: services.filter(item => item.service_visit_5 === true).length,
      pendingServiceVisit1: services.filter(item => item.service_visit_1 !== true).length,
      pendingServiceVisit2: services.filter(item => item.service_visit_1 === true && item.service_visit_2 !== true).length,
      pendingServiceVisit3: services.filter(item => item.service_visit_2 === true && item.service_visit_3 !== true).length,
      pendingServiceVisit4: services.filter(item => item.service_visit_3 === true && item.service_visit_4 !== true).length,
      pendingServiceVisit5: services.filter(item => item.service_visit_4 === true && item.service_visit_5 !== true).length,
    };
  }, [customerServiceDisplayData]);

  const customerServiceCompletionRate = customerServiceFilteredStats.total > 0 
    ? Math.round((customerServiceFilteredStats.completed / customerServiceFilteredStats.total) * 100) 
    : 0;

  // Calculate statistics for charts
  const customerServiceKwSizeStats = useMemo(() => {
    return customerServiceDisplayData.reduce((acc, item) => {
      const kwSize = item.capacity_kw || 'ไม่ระบุ';
      const sizeKey = typeof kwSize === 'number' ? `${kwSize} kW` : kwSize;
      acc[sizeKey] = (acc[sizeKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [customerServiceDisplayData]);

  const customerServiceProvinceStats = useMemo(() => {
    return customerServiceDisplayData.reduce((acc, item) => {
      const province = item.province || 'ไม่ระบุ';
      acc[province] = (acc[province] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [customerServiceDisplayData]);

  // Chart options for kW Size
  const customerServiceKwSizeChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: {
        fontSize: 11
      }
    },
    series: [
      {
        name: 'ขนาด kW',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: Object.entries(customerServiceKwSizeStats)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 10)
          .map(([key, value], index) => ({
            value,
            name: key,
            itemStyle: { 
              color: key === 'ไม่ระบุ' ? '#6b7280' : 
                     ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'][index] || '#6b7280'
            }
          })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }), [customerServiceKwSizeStats]);

  // Chart options for Province
  const customerServiceProvinceChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: {
        fontSize: 11
      }
    },
    series: [
      {
        name: 'จังหวัด',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: Object.entries(customerServiceProvinceStats)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 8)
          .map(([key, value], index) => ({
            value,
            name: key,
            itemStyle: { 
              color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'][index] || '#6b7280'
            }
          })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }), [customerServiceProvinceStats]);

  // Chart options for Service Status
  const customerServiceStatusChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: {
        fontSize: 11
      }
    },
    series: [
      {
        name: 'สถานะ Service',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: [
          { value: customerServiceFilteredStats.pendingServiceVisit1, name: 'ยังไม่ได้รับบริการ', itemStyle: { color: '#6b7280' } },
          { value: customerServiceFilteredStats.serviceVisit1Completed, name: 'บริการครั้งที่ 1 ครบแล้ว', itemStyle: { color: '#f59e0b' } },
          { value: customerServiceFilteredStats.serviceVisit2Completed, name: 'บริการครั้งที่ 2 ครบแล้ว', itemStyle: { color: '#3b82f6' } },
          { value: customerServiceFilteredStats.serviceVisit3Completed, name: 'บริการครั้งที่ 3 ครบแล้ว', itemStyle: { color: '#8b5cf6' } },
          { value: customerServiceFilteredStats.serviceVisit4Completed, name: 'บริการครั้งที่ 4 ครบแล้ว', itemStyle: { color: '#ec4899' } },
          { value: customerServiceFilteredStats.serviceVisit5Completed, name: 'บริการครั้งที่ 5 ครบแล้ว', itemStyle: { color: '#10b981' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }), [customerServiceFilteredStats]);

  // คำนวณข้อมูลสำหรับ charts
  const chartData = useMemo(() => {
    if (!productivityLogs || productivityLogs.length === 0) {
      return {
        dailyPresentations: [],
        dailyWins: [],
        dailyClosedLeads: []
      };
    }

    const { startDate, endDate } = getDateRange(dateRangeFilter);
    
    const dailyData = [];
    for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const dateStr = d.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const dayString = formatter.format(d);
      
      const presentations = productivityLogs.filter(log => {
        const logDate = new Date(log.created_at_thai);
        const logDateString = logDate.toISOString().split('T')[0];
        return logDateString === dayString && log.lead_group;
      });
      
      const newCustomers = presentations.filter(log => log.lead_group === 'ลูกค้าใหม่').length;
      const existingCustomers = presentations.filter(log => log.lead_group === 'ลูกค้าเดิม').length;
      
      let totalSales = 0;
      let closedLeads = 0;
      
      if (salesData && salesData.salesLogs) {
        const daySalesLogs = salesData.salesLogs.filter(log => {
          const logDate = new Date(log.created_at_thai);
          const logDateString = logDate.toISOString().split('T')[0];
          return logDateString === dayString;
        });
        
        const dayQuotations = salesData.quotations.filter(quotation => 
          daySalesLogs.some(log => log.id === quotation.productivity_log_id)
        );
        
        totalSales = dayQuotations.reduce((sum, qt) => sum + (qt.amount || 0), 0);
        
        const uniqueLeadIds = new Set(daySalesLogs.map(log => log.lead_id));
        closedLeads = uniqueLeadIds.size;
      }
      
      dailyData.push({
        date: dateStr,
        newCustomers,
        existingCustomers,
        totalSales,
        closedLeads
      });
    }

    return {
      dailyPresentations: dailyData.map(item => ({
        date: item.date,
        newCustomers: item.newCustomers,
        existingCustomers: item.existingCustomers
      })),
      dailyWins: dailyData.map(item => ({
        date: item.date,
        totalSales: item.totalSales
      })),
      dailyClosedLeads: dailyData.map(item => ({
        date: item.date,
        closedLeads: item.closedLeads
      }))
    };
  }, [productivityLogs, salesData, dateRangeFilter]);

  const salesSummary = useMemo(() => {
    const totalSalesCount = salesData?.salesCount || 0;
    const totalSalesValue = salesData?.totalSalesValue || 0;
    const totalQuotations = allQuotationData?.totalQuotations || 0;

    const categoryMap = new Map<
      string,
      { salesCount: number; totalSalesValue: number; totalQuotations: number }
    >();

    // นับ QT ทั้งหมดตาม category
    allQuotationData?.quotationByCategory?.forEach((count, category) => {
      const summary = categoryMap.get(category) || {
        salesCount: 0,
        totalSalesValue: 0,
        totalQuotations: 0,
      };
      summary.totalQuotations = count;
      categoryMap.set(category, summary);
    });

    // นับ QT ที่ปิดการขายตาม category
    (salesData?.salesLeads || []).forEach((lead: any) => {
      const category = lead.category || 'ไม่ระบุ';
      const summary = categoryMap.get(category) || {
        salesCount: 0,
        totalSalesValue: 0,
        totalQuotations: 0,
      };
      summary.salesCount += lead.totalQuotationCount || 0;
      summary.totalSalesValue += lead.totalQuotationAmount || 0;
      categoryMap.set(category, summary);
    });

    // นับจำนวนลีดที่ปิดการขาย (ไม่ซ้ำ) ตาม category
    const closedLeadsByCategory = new Map<string, Set<number>>();
    (salesData?.salesLeads || []).forEach((lead: any) => {
      const category = lead.category || 'ไม่ระบุ';
      if (!closedLeadsByCategory.has(category)) {
        closedLeadsByCategory.set(category, new Set());
      }
      closedLeadsByCategory.get(category)!.add(lead.leadId);
    });

    // นับจำนวนลีดทั้งหมดตาม category
    const totalLeadsByCategory = new Map<string, number>();
    (leads || []).forEach((lead: any) => {
      const category = lead.category || 'ไม่ระบุ';
      const current = totalLeadsByCategory.get(category) || 0;
      totalLeadsByCategory.set(category, current + 1);
    });

    const categorySummary = Array.from(categoryMap.entries())
      .map(([category, summary]) => {
        const closedLeadsCount = closedLeadsByCategory.get(category)?.size || 0;
        const totalLeadsCount = totalLeadsByCategory.get(category) || 0;
        
        return {
        category,
        salesCount: summary.salesCount,
        totalSalesValue: summary.totalSalesValue,
          totalQuotations: summary.totalQuotations,
        winRate:
            summary.totalQuotations > 0
              ? (summary.salesCount / summary.totalQuotations) * 100
              : 0,
          closedLeadsCount,
          totalLeadsCount,
          conversionRate:
            totalLeadsCount > 0
              ? (closedLeadsCount / totalLeadsCount) * 100
            : 0,
        };
      })
      .filter((item) => item.category !== 'ไม่ระบุ');

    // คำนวณ Win Rate รวม: QT ที่ปิดการขาย / QT ทั้งหมด
    const overallWinRate =
      totalQuotations > 0 ? (totalSalesCount / totalQuotations) * 100 : 0;

    // คำนวณ Conversion Rate รวม: ลีดที่ปิดการขาย / ลีดทั้งหมด
    const uniqueClosedLeadIds = new Set(
      (salesData?.salesLeads || []).map((lead: any) => lead.leadId)
    );
    const closedLeadsCount = uniqueClosedLeadIds.size;
    const totalLeads = leads?.length || 0;
    const overallConversionRate =
      totalLeads > 0 ? (closedLeadsCount / totalLeads) * 100 : 0;

    return {
      totalSalesCount,
      totalSalesValue,
      totalQuotations,
      overallWinRate,
      closedLeadsCount,
      totalLeads,
      overallConversionRate,
      categorySummary,
    };
  }, [salesData, allQuotationData, leads]);

  // คำนวณข้อมูลกิโลวัตต์ที่ติดตั้งจากลีดที่ปิดการขาย
  const kwSizeChartOption = useMemo(() => {
    if (!kwSizeData || kwSizeData.length === 0) {
      return {
        tooltip: { trigger: 'item' },
        series: [{
          name: 'กิโลวัตต์ที่ติดตั้ง',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: [],
          label: { show: false }
        }]
      };
    }

    // จัดกลุ่มข้อมูลตาม interested_kw_size
    const kwSizeCount: Record<string, number> = {};
    kwSizeData.forEach((item: any) => {
      const kwSize = item.interested_kw_size || 'ไม่ระบุ';
      kwSizeCount[kwSize] = (kwSizeCount[kwSize] || 0) + 1;
    });

    // สีสำหรับแต่ละขนาด kW
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
      '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16',
      '#06b6d4', '#a855f7', '#f97316', '#22c55e', '#eab308'
    ];

    const chartData = Object.entries(kwSizeCount)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([key, value], index) => ({
        value,
        name: key,
        itemStyle: { 
          color: key === 'ไม่ระบุ' ? '#6b7280' : colors[index % colors.length]
        }
      }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params.name}</div>
              <div style="color: #6B7280; font-size: 12px;">จำนวน: ${params.value}</div>
              <div style="color: ${params.color}; font-size: 12px;">สัดส่วน: ${params.percent.toFixed(1)}%</div>
            </div>
          `;
        }
      },
      series: [
        {
          name: 'กิโลวัตต์ที่ติดตั้ง',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: chartData,
          label: {
            show: true,
            formatter: function(params: any) {
              return `${params.name}\n${params.value} | ${params.percent.toFixed(1)}%`;
            },
            fontSize: 11,
            fontWeight: 'bold',
            color: '#374151'
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 10
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          animation: true,
          animationDuration: 1000,
          animationEasing: 'cubicOut'
        }
      ]
    };
  }, [kwSizeData]);

  // คำนวณ EV และ Partner metrics
  const evPartnerSummary = useMemo(() => {
    const { startDate, endDate } = getDateRange(dateRangeFilter);
    // Filter leads เหมือนกับหน้า /reports/lead-summary:
    // 1. มี sale_owner_id (ไม่เป็น null)
    // 2. มีเบอร์โทรหรือ Line ID
    // 3. อยู่ในช่วงวันที่
    const filteredLeads = leads?.filter(lead => {
      // Filter 1: ต้องมี sale_owner_id
      if (!lead.sale_owner_id) return false;
      
      // Filter 2: ต้องมีเบอร์โทรหรือ Line ID
      if (!lead.tel && !lead.line_id) return false;
      
      // Filter 3: อยู่ในช่วงวันที่
      return isInDateRange(lead.created_at_thai, { from: startDate, to: endDate });
    }) || [];

    // Helper functions for platform classification
    const isEVLead = (platform: string) => {
      const evPlatforms = ['Facebook', 'Line', 'Website', 'TikTok', 'IG', 'YouTube', 'Shopee', 'Lazada', 'แนะนำ', 'Outbound', 'โทร', 'ลูกค้าเก่า service ครบ'];
      return evPlatforms.includes(platform);
    };

    const isPartnerLead = (platform: string) => {
      const partnerPlatforms = ['Huawei', 'Huawei (C&I)', 'ATMOCE', 'Solar Edge', 'Sigenergy', 'terawatt'];
      return partnerPlatforms.includes(platform);
    };

    // Calculate EV leads
    const evLeads = filteredLeads.filter(lead => 
      isEVLead(lead.platform)
    ).length;

    // Calculate Partner leads individually
    const huaweiLeads = filteredLeads.filter(lead => 
      lead.platform === 'Huawei'
    ).length;
    const huaweiCILeads = filteredLeads.filter(lead => 
      lead.platform === 'Huawei (C&I)'
    ).length;
    const atmoceLeads = filteredLeads.filter(lead => 
      lead.platform === 'ATMOCE'
    ).length;
    const solarEdgeLeads = filteredLeads.filter(lead => 
      lead.platform === 'Solar Edge'
    ).length;
    const sigenergyLeads = filteredLeads.filter(lead => 
      lead.platform === 'Sigenergy'
    ).length;
    const terawattLeads = filteredLeads.filter(lead => 
      lead.platform === 'terawatt'
    ).length;
    const partnerLeads = huaweiLeads + huaweiCILeads + atmoceLeads + solarEdgeLeads + sigenergyLeads + terawattLeads;

    // Calculate EV and Partner won/value from salesData
    let evWon = 0;
    let evValue = 0;
    let partnerWon = 0;
    let partnerValue = 0;
    let huaweiWon = 0;
    let huaweiValue = 0;
    let atmoceWon = 0;
    let atmoceValue = 0;
    let solarEdgeWon = 0;
    let solarEdgeValue = 0;
    let sigenergyWon = 0;
    let sigenergyValue = 0;
    let terawattWon = 0;
    let terawattValue = 0;

    (salesData?.salesLeads || []).forEach((lead: any) => {
      const platform = lead.platform;
      
      if (platform === 'Huawei') {
        huaweiValue += lead.totalQuotationAmount || 0;
        huaweiWon += lead.totalQuotationCount || 0;
        partnerValue += lead.totalQuotationAmount || 0;
        partnerWon += lead.totalQuotationCount || 0;
      } else if (platform === 'Huawei (C&I)') {
        partnerValue += lead.totalQuotationAmount || 0;
        partnerWon += lead.totalQuotationCount || 0;
      } else if (platform === 'ATMOCE') {
        atmoceValue += lead.totalQuotationAmount || 0;
        atmoceWon += lead.totalQuotationCount || 0;
        partnerValue += lead.totalQuotationAmount || 0;
        partnerWon += lead.totalQuotationCount || 0;
      } else if (platform === 'Solar Edge') {
        solarEdgeValue += lead.totalQuotationAmount || 0;
        solarEdgeWon += lead.totalQuotationCount || 0;
        partnerValue += lead.totalQuotationAmount || 0;
        partnerWon += lead.totalQuotationCount || 0;
      } else if (platform === 'Sigenergy') {
        sigenergyValue += lead.totalQuotationAmount || 0;
        sigenergyWon += lead.totalQuotationCount || 0;
        partnerValue += lead.totalQuotationAmount || 0;
        partnerWon += lead.totalQuotationCount || 0;
      } else if (platform === 'terawatt') {
        terawattValue += lead.totalQuotationAmount || 0;
        terawattWon += lead.totalQuotationCount || 0;
        partnerValue += lead.totalQuotationAmount || 0;
        partnerWon += lead.totalQuotationCount || 0;
      } else if (isEVLead(platform)) {
        evValue += lead.totalQuotationAmount || 0;
        evWon += lead.totalQuotationCount || 0;
      }
    });

    const evWinRate = evLeads > 0 ? ((evWon / evLeads) * 100) : 0;
    const partnerWinRate = partnerLeads > 0 ? ((partnerWon / partnerLeads) * 100) : 0;

    return {
      evLeads,
      evWon,
      evValue,
      evWinRate,
      partnerLeads,
      partnerWon,
      partnerValue,
      partnerWinRate,
      huaweiLeads,
      huaweiWon,
      huaweiValue,
      atmoceLeads,
      atmoceWon,
      atmoceValue,
      solarEdgeLeads,
      solarEdgeWon,
      solarEdgeValue,
      sigenergyLeads,
      sigenergyWon,
      sigenergyValue,
      terawattLeads,
      terawattWon,
      terawattValue,
    };
  }, [leads, salesData, dateRangeFilter]);

  // สร้างข้อมูลสำหรับแผนที่
  const mapData = useMemo(() => {
    if (!leads || leads.length === 0) {
      return {};
    }

    const { startDate, endDate } = getDateRange(dateRangeFilter);
    const filteredLeads = leads.filter(lead => {
      return isInDateRange(lead.created_at_thai, { from: startDate, to: endDate });
    });

    const regionCounts = filteredLeads.reduce((acc, lead) => {
      const originalRegion = lead.region || 'ไม่ระบุ';
      const normalizedRegion = normalizeRegionName(originalRegion);
      
      acc[normalizedRegion] = (acc[normalizedRegion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return regionCounts;
  }, [leads, dateRangeFilter]);

  // คำนวณอันดับจังหวัดที่มีลีดมากที่สุด
  const provinceRanking = useMemo(() => {
    if (!leads || leads.length === 0) {
      return [];
    }

    const { startDate, endDate } = getDateRange(dateRangeFilter);
    const filteredLeads = leads.filter(lead => {
      return isInDateRange(lead.created_at_thai, { from: startDate, to: endDate });
    });

    // นับจำนวนลีดตามจังหวัด (ใช้ region จากข้อมูลจริง ไม่ normalize)
    const provinceCounts = filteredLeads.reduce((acc, lead) => {
      const province = lead.region || 'ไม่ระบุ';
      acc[province] = (acc[province] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // แปลงเป็น array และเรียงลำดับจากมากไปน้อย
    const ranking = Object.entries(provinceCounts)
      .map(([province, count]) => ({
        province,
        count: count as number
      }))
      .sort((a, b) => b.count - a.count);

    return ranking;
  }, [leads, dateRangeFilter]);

  // คำนวณอันดับจังหวัดที่มีลีดปิดการขายมากที่สุด พร้อม Win Rate (สัดส่วนจากยอดทั้งหมด)
  const provinceClosedRanking = useMemo(() => {
    if (!leads || !salesData?.salesLeads) {
      return [];
    }

    const { startDate, endDate } = getDateRange(dateRangeFilter);
    const filteredLeads = leads.filter(lead => {
      return isInDateRange(lead.created_at_thai, { from: startDate, to: endDate });
    });

    // นับจำนวนลีดทั้งหมดตามจังหวัด
    const provinceTotalLeads = filteredLeads.reduce((acc, lead) => {
      const province = lead.region || 'ไม่ระบุ';
      acc[province] = (acc[province] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // นับจำนวนลีดที่ปิดการขายตามจังหวัด (ไม่ซ้ำ)
    const provinceClosedLeads = new Map<string, Set<number>>();
    salesData.salesLeads.forEach((lead: any) => {
      // หา region จาก leads ที่มี leadId ตรงกัน
      const originalLead = filteredLeads.find(l => l.id === lead.leadId);
      if (originalLead) {
        const province = originalLead.region || 'ไม่ระบุ';
        if (!provinceClosedLeads.has(province)) {
          provinceClosedLeads.set(province, new Set());
        }
        provinceClosedLeads.get(province)!.add(lead.leadId);
      }
    });

    // คำนวณจำนวนลีดที่ปิดการขายทั้งหมด (รวมทุกจังหวัด)
    const totalClosedLeads = Array.from(provinceClosedLeads.values())
      .reduce((sum, closedLeadIds) => sum + closedLeadIds.size, 0);

    // คำนวณ Win Rate (สัดส่วนจากยอดปิดการขายทั้งหมด) และจำนวนลีดที่ปิดการขาย
    const ranking = Array.from(provinceClosedLeads.entries())
      .map(([province, closedLeadIds]) => {
        const closedCount = closedLeadIds.size;
        const totalCount = provinceTotalLeads[province] || 0;
        // Win Rate = สัดส่วนของยอดปิดการขายทั้งหมดที่ตกอยู่ในจังหวัดนี้
        const winRate = totalClosedLeads > 0 ? (closedCount / totalClosedLeads) * 100 : 0;
        
        return {
          province,
          closedCount,
          totalCount,
          winRate
        };
      })
      .filter(item => item.closedCount > 0) // เฉพาะจังหวัดที่มีลีดปิดการขาย
      .sort((a, b) => b.closedCount - a.closedCount); // เรียงตามจำนวนลีดที่ปิดการขาย

    return ranking;
  }, [leads, salesData, dateRangeFilter]);

  if (leadsLoading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-emerald-50 overflow-x-hidden">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 border-b border-indigo-200/60 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/backoffice')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover:bg-indigo-50 border-indigo-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">กลับ</span>
            </Button>
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-indigo-800">
                Executive Dashboard
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="w-full">
          {/* Page Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
                <p className="text-gray-600 mt-1">ภาพรวมข้อมูลทั้งหมดจากทุกระบบ</p>
              </div>
              
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-medium">ช่วงเวลา:</span>
                </div>
                <DateRangePicker
                  value={dateRangeFilter}
                  onChange={setDateRangeFilter}
                  placeholder="เลือกช่วงเวลา"
                  presets={true}
                  className="w-auto"
                />
              </div>
            </div>
          </div>

        {/* Section 1: CRM Overview */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent" />
              <span className="mx-4 text-gray-400 font-medium text-lg">ภาพรวมระบบ CRM</span>
              <div className="flex-1 h-px bg-gradient-to-l from-green-200 via-emerald-200 to-transparent" />
            </div>
          </div>

          {/* Summary Cards - 4 Columns Layout */}
          <div className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 items-stretch">
              {/* Column 1 */}
              <div className="flex flex-col gap-2 h-full">
                {/* Total Leads Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <p className="text-xs font-medium text-blue-600 mb-1">ลีดทั้งหมด</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.totalLeads}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Leads Card */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <p className="text-xs font-medium text-green-600 mb-1">ลีดที่ได้รับ</p>
                        <p className="text-2xl font-bold text-green-900">{stats.assignedLeads}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Leads Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <p className="text-xs font-medium text-purple-600 mb-1">ลีดวันนี้</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.todayLeads}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* PPA Project Leads Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-sm">PPA</span>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-xs text-blue-600 mb-1">โครงการ PPA</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.ppaProjectLeads}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Unassigned Leads Card */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-3 h-full flex items-center justify-center">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserX className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <p className="text-xs font-medium text-orange-600 mb-1">ลีดที่ยังไม่ได้รับ</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.unassignedLeads}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col h-full">
                {/* Total Sales Count Card */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">รายการปิดการขาย</p>
                        <p className="text-3xl font-bold text-green-900">
                          {salesSummary.totalSalesCount.toLocaleString()}
                          {salesSummary.totalQuotations > 0 && (
                            <span className="text-lg text-green-600 font-normal">/{salesSummary.totalQuotations.toLocaleString()}</span>
                          )}
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                          จำนวน QT ที่ปิด{salesSummary.totalQuotations > 0 ? ' / QT ทั้งหมด' : ''}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    {salesSummary.categorySummary.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-green-200 pt-3 flex-1">
                        <div className="space-y-2">
                          <div className="bg-emerald-100/70 rounded-lg p-2">
                            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                              Conversion Rate (Lead) รวม
                            </div>
                            <div className="text-xl font-bold text-emerald-700">
                              {salesSummary.overallConversionRate.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                              })}
                              %
                            </div>
                            <div className="text-xs text-emerald-600 mt-1">
                              {salesSummary.closedLeadsCount.toLocaleString()}/{salesSummary.totalLeads.toLocaleString()} ลีด
                            </div>
                          </div>
                        <div className="bg-green-100/70 rounded-lg p-2">
                            <div className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                              Win Rate (QT) รวม
                          </div>
                          <div className="text-xl font-bold text-green-700">
                            {salesSummary.overallWinRate.toLocaleString(undefined, {
                              maximumFractionDigits: 1
                            })}
                            %
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {salesSummary.categorySummary.map((item) => (
                            <div
                              key={item.category}
                              className="bg-white/70 border border-green-100 rounded-lg p-2 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-green-700">
                                  {item.category}
                                </span>
                                <span className="text-sm font-bold text-green-800">
                                  {item.salesCount.toLocaleString()}
                                  {item.totalQuotations > 0 && (
                                    <span className="text-xs text-green-600 font-normal">/{item.totalQuotations.toLocaleString()}</span>
                                  )} QT
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-green-600 space-y-0.5">
                                <div className="text-emerald-600">
                                  Conversion Rate (Lead): {item.conversionRate.toLocaleString(undefined, {
                                    maximumFractionDigits: 1
                                  })}
                                  % ({item.closedLeadsCount}/{item.totalLeadsCount})
                                </div>
                                <div>
                                  Win Rate (QT): {item.winRate.toLocaleString(undefined, {
                                  maximumFractionDigits: 1
                                })}
                                %
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col h-full">
                {/* Total Sales Value Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">มูลค่าปิดการขาย</p>
                        <p className="text-3xl font-bold text-blue-900">฿{salesSummary.totalSalesValue.toLocaleString('th-TH')}</p>
                        <p className="text-xs text-blue-500 mt-1">ยอดขายรวมทั้งหมด</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mb-3 space-y-2">
                      <div className="bg-indigo-100/70 rounded-lg p-2 border border-indigo-200">
                        <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">
                          Conversion Rate (Lead) รวม
                        </div>
                        <div className="text-xl font-bold text-indigo-700">
                          {salesSummary.overallConversionRate.toLocaleString(undefined, {
                            maximumFractionDigits: 1
                          })}
                          %
                        </div>
                        <div className="text-xs text-indigo-600 mt-1">
                          {salesSummary.closedLeadsCount.toLocaleString()}/{salesSummary.totalLeads.toLocaleString()} ลีด
                        </div>
                      </div>
                      <div className="bg-blue-100/70 rounded-lg p-2 border border-blue-200">
                        <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                          Win Rate (QT) รวม
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                          {salesSummary.overallWinRate.toLocaleString(undefined, {
                            maximumFractionDigits: 1
                          })}
                          %
                        </div>
                      </div>
                    </div>
                    {salesSummary.categorySummary.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-blue-200 pt-3 flex-1">
                        {salesSummary.categorySummary.map((item) => (
                          <div
                            key={item.category}
                            className="bg-white/70 border border-blue-100 rounded-lg p-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-blue-700">
                                {item.category}
                              </span>
                              <span className="text-sm font-bold text-blue-800">
                                ฿{item.totalSalesValue.toLocaleString('th-TH')}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-blue-600 space-y-0.5">
                              <div className="text-indigo-600">
                                Conversion Rate (Lead): {item.conversionRate.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                              })}
                                % ({item.closedLeadsCount}/{item.totalLeadsCount})
                              </div>
                              <div>
                                Win Rate (QT): {item.winRate.toLocaleString(undefined, {
                                  maximumFractionDigits: 1
                                })}
                                % | จำนวน QT: {item.salesCount.toLocaleString()}
                                {item.totalQuotations > 0 && (
                                  <span>/{item.totalQuotations.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Column 4 */}
              <div className="flex flex-col h-full">
                {/* KW Size Chart Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200 h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-purple-600 mb-1">กิโลวัตต์ที่ติดตั้ง</p>
                        <p className="text-xs text-purple-500 mt-1">จากลีด Package ที่ปิดการขาย</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                        <Zap className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full h-full min-h-[250px]">
                        <ReactECharts
                          option={kwSizeChartOption}
                          style={{ height: '100%', width: '100%' }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-4">
            {/* Row 1: Combined Leads & Sales Chart with EV/Partner Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 mb-4">
              <Card className="bg-white/90 shadow-xl border-green-100 h-full flex flex-col">
                <CardHeader className="pb-2 xl:pb-0 flex-none">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    แนวโน้มลีดและยอดขายรายวัน
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 flex-1 flex">
                  <div className="h-full w-full">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: 'axis',
                          axisPointer: {
                            type: 'cross'
                          },
                          formatter: function(params: any) {
                            return `
                              <div style="padding: 8px;">
                                <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params[0].name}</div>
                                ${params.map((param: any) => `
                                  <div style="color: ${param.color}; font-size: 14px; margin-bottom: 2px;">
                                    ${param.seriesName}: ${param.value}
                                  </div>
                                `).join('')}
                              </div>
                            `;
                          }
                        },
                        legend: {
                          data: ['จำนวนลีดใหม่', 'ลีดปิดการขาย'],
                          bottom: 0,
                          textStyle: {
                            fontSize: 12,
                            fontWeight: 'bold'
                          }
                        },
                        grid: {
                          left: '3%',
                          right: '4%',
                          bottom: '15%',
                          containLabel: true
                        },
                        xAxis: {
                          type: 'category',
                          data: stats.dailyNewLeads?.map(item => item.date) || [],
                          axisLabel: {
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: '#374151',
                            interval: Math.floor((stats.dailyNewLeads?.length || 1) / 10),
                            rotate: 45
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#E5E7EB'
                            }
                          }
                        },
                        yAxis: {
                          type: 'value',
                          name: 'จำนวนลีด',
                          nameTextStyle: {
                            color: '#374151',
                            fontSize: 12,
                            fontWeight: 'bold'
                          },
                          axisLabel: {
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#374151',
                            formatter: '{value}'
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#E5E7EB'
                            }
                          },
                          splitLine: {
                            lineStyle: {
                              color: '#F3F4F6'
                            }
                          }
                        },
                        series: [
                          {
                            name: 'จำนวนลีดใหม่',
                            type: 'bar',
                            stack: 'leads',
                            data: stats.dailyNewLeads?.map(item => item.count) || [],
                            itemStyle: {
                              color: '#10B981',
                              borderRadius: [0, 0, 0, 0]
                            },
                            emphasis: {
                              itemStyle: {
                                color: '#059669',
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(16, 185, 129, 0.3)'
                              }
                            }
                          },
                          {
                            name: 'ลีดปิดการขาย',
                            type: 'bar',
                            stack: 'leads',
                            data: stats.dailyClosedLeads?.map(item => item.count) || [],
                            itemStyle: {
                              color: '#F59E0B',
                              borderRadius: [4, 4, 0, 0]
                            },
                            emphasis: {
                              itemStyle: {
                                color: '#D97706',
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(245, 158, 11, 0.3)'
                              }
                            }
                          }
                        ],
                        animation: true,
                        animationDuration: 1000,
                        animationEasing: 'cubicOut'
                      }}
                      style={{ height: '100%', minHeight: '280px', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* EV and Partner Cards - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ลีด EV Card */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <p className="text-4xl font-bold text-green-900 mb-2">{evPartnerSummary.evLeads.toLocaleString()}</p>
                      <p className="text-lg font-semibold text-green-700 mb-2">บริษัทหามาเอง</p>
                      <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">EV Leads</p>
                    </div>
                    <div className="border-t border-green-200 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-900 mb-1">{evPartnerSummary.evWon}</p>
                          <p className="text-sm font-medium text-green-600">ปิดได้</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-emerald-900 mb-1 break-words overflow-hidden">
                            ฿{evPartnerSummary.evValue.toLocaleString()}
                          </p>
                          <p className="text-sm font-medium text-emerald-600">มูลค่า</p>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-lg font-semibold text-green-700">
                          Win Rate: <span className="font-bold">{evPartnerSummary.evWinRate.toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ลีด Partner Card */}
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <p className="text-4xl font-bold text-red-900 mb-2">{evPartnerSummary.partnerLeads.toLocaleString()}</p>
                      <p className="text-lg font-semibold text-red-700 mb-2">รวม Partner</p>
                      <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-full">Partner Leads</p>
                    </div>
                    <div className="border-t border-red-200 pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-900 mb-1">{evPartnerSummary.partnerWon}</p>
                          <p className="text-sm font-medium text-red-600">ปิดได้</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-rose-900 mb-1 break-words overflow-hidden">
                            ฿{evPartnerSummary.partnerValue.toLocaleString()}
                          </p>
                          <p className="text-sm font-medium text-rose-600">มูลค่า</p>
                        </div>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-lg font-semibold text-red-700">
                          Win Rate: <span className="font-bold">{evPartnerSummary.partnerWinRate.toFixed(1)}%</span>
                        </p>
                      </div>
                      
                      {/* Individual Partner Cards */}
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {/* Huawei Card */}
                        <Card className="bg-white border-red-200 shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 flex items-center justify-center">
                                  <img 
                                    src="/icons/huawei_logo.svg" 
                                    alt="Huawei" 
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                  <span className="text-red-600 font-bold text-xs hidden">HW</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-bold text-red-900 truncate">{evPartnerSummary.huaweiLeads}</p>
                                <p className="text-xs font-semibold text-red-700 truncate">Huawei</p>
                                <p className="text-xs text-red-600">
                                  Win: <span className="font-bold">{evPartnerSummary.huaweiWon}</span> | ฿<span className="font-bold">{evPartnerSummary.huaweiValue.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* ATMOCE Card */}
                        <Card className="bg-white border-blue-200 shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 flex items-center justify-center">
                                  <img 
                                    src="/icons/atmoce_logo.svg" 
                                    alt="ATMOCE" 
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                  <span className="text-blue-600 font-bold text-xs hidden">AT</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-bold text-blue-900 truncate">{evPartnerSummary.atmoceLeads}</p>
                                <p className="text-xs font-semibold text-blue-700 truncate">ATMOCE</p>
                                <p className="text-xs text-blue-600">
                                  Win: <span className="font-bold">{evPartnerSummary.atmoceWon}</span> | ฿<span className="font-bold">{evPartnerSummary.atmoceValue.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Solar Edge Card */}
                        <Card className="bg-white border-yellow-200 shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 flex items-center justify-center">
                                  <img 
                                    src="/icons/solar_edge_logo.svg" 
                                    alt="Solar Edge" 
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                  <span className="text-yellow-600 font-bold text-xs hidden">SE</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-bold text-yellow-900 truncate">{evPartnerSummary.solarEdgeLeads}</p>
                                <p className="text-xs font-semibold text-yellow-700 truncate">Solar Edge</p>
                                <p className="text-xs text-yellow-600">
                                  Win: <span className="font-bold">{evPartnerSummary.solarEdgeWon}</span> | ฿<span className="font-bold">{evPartnerSummary.solarEdgeValue.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Sigenergy Card */}
                        <Card className="bg-white border-purple-200 shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 flex items-center justify-center">
                                  <img 
                                    src="/icons/sigenergy_logo.svg" 
                                    alt="Sigenergy" 
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                  <span className="text-purple-600 font-bold text-xs hidden">SG</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-bold text-purple-900 truncate">{evPartnerSummary.sigenergyLeads}</p>
                                <p className="text-xs font-semibold text-purple-700 truncate">Sigenergy</p>
                                <p className="text-xs text-purple-600">
                                  Win: <span className="font-bold">{evPartnerSummary.sigenergyWon}</span> | ฿<span className="font-bold">{evPartnerSummary.sigenergyValue.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* terawatt Card */}
                        <Card className="bg-white border-teal-200 shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 flex items-center justify-center">
                                  <img 
                                    src="/icons/terawatt_logo.svg" 
                                    alt="terawatt" 
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                  <span className="text-teal-600 font-bold text-xs hidden">TW</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-bold text-teal-900 truncate">{evPartnerSummary.terawattLeads}</p>
                                <p className="text-xs font-semibold text-teal-700 truncate">terawatt</p>
                                <p className="text-xs text-teal-600">
                                  Win: <span className="font-bold">{evPartnerSummary.terawattWon}</span> | ฿<span className="font-bold">{(evPartnerSummary.terawattValue || 0).toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Row 2: Platform Stats, Thailand Map, and Province Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* แหล่งที่มาของลีด */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent" />
                  <span className="mx-4 text-gray-400 font-medium text-lg">
                    แหล่งที่มาของลีด
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-green-200 via-emerald-200 to-transparent" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {stats.platformStats.map((platform, index) => {
                    const colorClass = platformColors[platform.name as keyof typeof platformColors] || 'border-gray-200 text-gray-600';
                    const [borderClass, textClass] = colorClass.split(' ');
                    
                    return (
                      <Card key={index} className={`hover:shadow-lg transition-all duration-300 ${borderClass} border-2`}>
                        <CardContent className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <div className="flex-shrink-0">
                              {getPlatformIcon(platform.name)}
                            </div>
                            <div className={`text-2xl font-bold ${textClass}`}>{platform.count}</div>
                            <div className="text-sm font-medium text-gray-900 truncate">{platform.name}</div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* ภาพรวมข้อมูลตามจังหวัด */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent" />
                  <span className="mx-4 text-gray-400 font-medium text-lg">
                    ภาพรวมข้อมูลตามจังหวัด
                    {leadsLoading && <span className="ml-2 text-sm text-gray-500">(กำลังโหลดข้อมูล...)</span>}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-green-200 via-emerald-200 to-transparent" />
                </div>
                {Object.keys(mapData).length > 0 ? (
                  <ThailandMap 
                    regionData={mapData}
                    onRegionClick={(region) => {
                      // สามารถเพิ่มการนำทางได้ที่นี่
                    }}
                    disableZoom={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-gray-500 text-lg mb-2">
                        {leadsLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่มีข้อมูลลีด'}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {leadsLoading ? 'กรุณารอสักครู่' : 'ข้อมูลลีดจะแสดงบนแผนที่เมื่อมีการเพิ่มลีดใหม่'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* อันดับจังหวัด */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent" />
                  <span className="mx-4 text-gray-400 font-medium text-lg">
                    อันดับจังหวัด
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-green-200 via-emerald-200 to-transparent" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Card ครึ่งซ้าย: อันดับจังหวัดที่มีลีด */}
                  <Card className="bg-white/90 shadow-xl border-green-100 flex flex-col" style={{ height: 'calc(500px + 4rem)', maxHeight: 'calc(500px + 4rem)' }}>
                    <CardHeader className="pb-3 flex-shrink-0">
                      <CardTitle className="text-base font-semibold text-green-700">
                        อันดับจังหวัดที่มีลีด
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                      <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
                      {provinceRanking.length > 0 ? (
                        provinceRanking.map((item, index) => {
                          // สีสำหรับแต่ละอันดับ
                          const getRankColor = (rank: number) => {
                            if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
                            if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
                            if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
                            return 'bg-gray-100 text-gray-700';
                          };

                          return (
                            <div
                              key={item.province}
                              className="flex items-center gap-3 p-3 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200 bg-white"
                            >
                              {/* อันดับ */}
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(index + 1)}`}>
                                {index + 1}
                              </div>
                              
                              {/* ชื่อจังหวัด */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate" title={item.province}>
                                  {item.province}
                                </div>
                              </div>
                              
                              {/* จำนวนลีด */}
                              <div className="flex-shrink-0">
                                <div className="text-lg font-bold text-green-600">
                                  {item.count.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">ลีด</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <div className="text-center">
                            <div className="text-gray-500 text-sm">
                              {leadsLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่มีข้อมูลลีด'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                  {/* Card ครึ่งขวา: อันดับจังหวัดที่มีลีดปิดการขายมากที่สุด */}
                  <Card className="bg-white/90 shadow-xl border-blue-100 flex flex-col" style={{ height: 'calc(500px + 4rem)', maxHeight: 'calc(500px + 4rem)' }}>
                    <CardHeader className="pb-3 flex-shrink-0">
                      <CardTitle className="text-base font-semibold text-blue-700">
                        อันดับจังหวัดที่มีลีดปิดการขายมากที่สุด
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                      <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
                        {provinceClosedRanking.length > 0 ? (
                          provinceClosedRanking.map((item, index) => {
                            // สีสำหรับแต่ละอันดับ
                            const getRankColor = (rank: number) => {
                              if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
                              if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
                              if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
                              return 'bg-gray-100 text-gray-700';
                            };

                            return (
                              <div
                                key={item.province}
                                className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 bg-white"
                              >
                                {/* อันดับ */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(index + 1)}`}>
                                  {index + 1}
              </div>
                                
                                {/* ชื่อจังหวัด */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate" title={item.province}>
                                    {item.province}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    สัดส่วน: {item.winRate.toLocaleString(undefined, {
                                      maximumFractionDigits: 1
                                    })}%
                                  </div>
                                </div>
                                
                                {/* จำนวนลีดที่ปิดการขาย */}
                                <div className="flex-shrink-0 text-right">
                                  <div className="text-lg font-bold text-blue-600">
                                    {item.closedCount.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    /{item.totalCount.toLocaleString()} ลีด
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center justify-center h-32">
                            <div className="text-center">
                              <div className="text-gray-500 text-sm">
                                {leadsLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่มีข้อมูลลีดปิดการขาย'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Sales Funnel & Platform Distribution */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent" />
              <span className="mx-4 text-gray-400 font-medium text-lg">Funnel การขาย & การกระจายตาม Platform</span>
              <div className="flex-1 h-px bg-gradient-to-l from-indigo-200 via-purple-200 to-transparent" />
            </div>
          </div>

          {/* Combined Card: Funnel & Platform Distribution */}
          <Card className="bg-white/90 shadow-xl border-indigo-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Funnel การขาย & การกระจายตาม Platform
              </CardTitle>
              <CardDescription>
                แสดงขั้นตอนการขายและ Platform breakdown แยกตามแต่ละชั้น
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Sales Funnel Chart - Left Side */}
                <div className="flex flex-col h-full">
                  <h3 className="text-md font-semibold text-gray-700 mb-4">Funnel การขาย</h3>
                  <div className="flex-1 w-full" style={{ minHeight: '500px' }}>
                    {funnelStage1 && funnelStage2 && funnelStage3 ? (
                      <div className="w-full h-full">
                        <SalesFunnelChart
                          stage1Data={funnelStage1}
                          stage2Data={funnelStage2}
                          stage3Data={funnelStage3}
                        />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Breakdown - Right Side */}
                <div className="flex flex-col h-full">
                  <h3 className="text-md font-semibold text-gray-700 mb-4">การกระจายตาม Platform</h3>
                  <div className="space-y-6">
                    {/* Stage 1 - Leads */}
                    {funnelStage1 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          ลีดทั้งหมด ({funnelStage1.totalLeads.toLocaleString()})
                        </h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {Object.entries(funnelStage1.platformBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([platform, count]) => {
                              const percentage = funnelStage1.totalLeads > 0 
                                ? ((count / funnelStage1.totalLeads) * 100).toFixed(1) 
                                : '0.0';
                              const colorClass = platformColors[platform as keyof typeof platformColors] || 'border-gray-200 text-gray-600';
                              const [borderClass, textClass] = colorClass.split(' ');
                              
                              return (
                                <Card key={platform} className={`hover:shadow-md transition-shadow ${borderClass} border-2`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="flex-shrink-0">
                                        {getPlatformIcon(platform)}
                                      </div>
                                      <div className="flex flex-col">
                                        <div className={`text-xl font-bold ${textClass}`}>{count.toLocaleString()}</div>
                                        <p className="text-xs text-gray-600">{platform}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Stage 2 - Quotations */}
                    {funnelStage2 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                          QT ทั้งหมด ({funnelStage2.totalQuotations.toLocaleString()})
                        </h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {Object.entries(funnelStage2.platformBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([platform, count]) => {
                              const percentage = funnelStage2.totalQuotations > 0 
                                ? ((count / funnelStage2.totalQuotations) * 100).toFixed(1) 
                                : '0.0';
                              const colorClass = platformColors[platform as keyof typeof platformColors] || 'border-gray-200 text-gray-600';
                              const [borderClass, textClass] = colorClass.split(' ');
                              
                              return (
                                <Card key={platform} className={`hover:shadow-md transition-shadow ${borderClass} border-2`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="flex-shrink-0">
                                        {getPlatformIcon(platform)}
                                      </div>
                                      <div className="flex flex-col">
                                        <div className={`text-xl font-bold ${textClass}`}>{count.toLocaleString()}</div>
                                        <p className="text-xs text-gray-600">{platform}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Stage 3 - Closed Sales */}
                    {funnelStage3 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          ปิดการขาย ({funnelStage3.totalClosedQuotations.toLocaleString()})
                        </h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {Object.entries(funnelStage3.platformBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([platform, count]) => {
                              const percentage = funnelStage3.totalClosedQuotations > 0 
                                ? ((count / funnelStage3.totalClosedQuotations) * 100).toFixed(1) 
                                : '0.0';
                              const colorClass = platformColors[platform as keyof typeof platformColors] || 'border-gray-200 text-gray-600';
                              const [borderClass, textClass] = colorClass.split(' ');
                              
                              return (
                                <Card key={platform} className={`hover:shadow-md transition-shadow ${borderClass} border-2`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="flex-shrink-0">
                                        {getPlatformIcon(platform)}
                                      </div>
                                      <div className="flex flex-col">
                                        <div className={`text-xl font-bold ${textClass}`}>{count.toLocaleString()}</div>
                                        <p className="text-xs text-gray-600">{platform}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {(!funnelStage1 || !funnelStage2 || !funnelStage3) && (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Marketing Performance */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-pink-600" />
              Marketing Dashboard
            </h2>
            {marketingLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                กำลังโหลดข้อมูล...
              </div>
            )}
          </div>

          {/* Row 1: Line Chart Analytics */}
          <div className="mb-6">
            <MarketingLineChart hideSummary={true} />
          </div>

          {/* Row 2: Ad Spend, Inbox Metrics, and RoAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column 1: Ad Spend and Inbox Metrics */}
            <div className="flex flex-col gap-4">
              {/* งบ Ads ทั้งหมด */}
              <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">งบ Ads ทั้งหมด</h3>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-700 p-3 rounded-xl shadow-lg mb-3">
                      <p className="text-white text-xl font-bold drop-shadow-lg">{formatCurrency(marketingData.totalAdBudget)}</p>
                    </div>
                  </div>
                  
                  {/* Facebook Ads */}
                  <div className="mb-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Facebook className="h-5 w-5 text-blue-500" />
                      <span className="text-gray-900 font-bold text-base">FacebookAds</span>
                      <div className={`w-2 h-2 rounded-full ${facebookApiConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                           title={facebookApiConnected ? 'เชื่อมต่อ Facebook API สำเร็จ' : 'ไม่สามารถเชื่อมต่อ Facebook API ได้'}></div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl shadow-md mb-2">
                      {facebookApiConnected ? (
                        <p className="text-white font-bold text-lg text-center drop-shadow-sm">{formatCurrency(marketingData.facebookAds.total)}</p>
                      ) : (
                        <p className="text-white font-bold text-sm text-center drop-shadow-sm">ไม่สามารถดึงข้อมูลได้</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-gray-600 text-xs mb-1 font-medium">Package</p>
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-1 rounded-xl shadow-sm">
                          {facebookApiConnected ? (
                            <p className="text-white text-sm font-bold drop-shadow-sm">{formatCurrency(marketingData.facebookAds.package)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-xs mb-1 font-medium">Wholesales</p>
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-1 rounded-xl shadow-sm">
                          {facebookApiConnected ? (
                            <p className="text-white text-sm font-bold drop-shadow-sm">{formatCurrency(marketingData.facebookAds.wholesales)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-xs mb-1 font-medium">อื่นๆ</p>
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-1 rounded-xl shadow-sm">
                          {facebookApiConnected ? (
                            <p className="text-white text-sm font-bold drop-shadow-sm">{formatCurrency(marketingData.facebookAds.others)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Google Ads */}
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Chrome className="h-5 w-5 text-orange-500" />
                      <span className="text-gray-900 font-bold text-base">GoogleAds</span>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-3 rounded-xl shadow-md">
                      <p className="text-white font-bold text-lg text-center drop-shadow-sm">{formatCurrency(marketingData.googleAds.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ค่า Ads / Lead */}
              <Card className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">ค่า Ads / Lead</h3>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-xl shadow-lg mb-3">
                      <p className="text-white text-xl font-bold drop-shadow-lg">{formatNumber(marketingData.adCostPerLead)}</p>
                    </div>
                    <div className="mb-2">
                      <p className="text-gray-600 text-base font-semibold">Lead ใหม่ ทั้งหมด</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-3 rounded-xl shadow-lg">
                      <p className="text-white text-xl font-bold drop-shadow-lg">{formatNumber(marketingData.totalNewLeads)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Column 3: Ad Performance and RoAS */}
            <div className="flex flex-col gap-4">
              {/* Inbox จาก Ads ทั้งหมด */}
              <Card className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Inbox จาก Ads</h3>
                      <div className={`w-2 h-2 rounded-full ${facebookApiConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                           title={facebookApiConnected ? 'เชื่อมต่อ Facebook API สำเร็จ' : 'ไม่สามารถเชื่อมต่อ Facebook API ได้'}></div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-3 rounded-xl shadow-lg mb-3">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold drop-shadow-lg">{formatNumber(marketingData.totalInboxFromAds)}</p>
                      ) : (
                        <p className="text-white text-base font-bold drop-shadow-lg">ไม่สามารถดึงข้อมูลได้</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-600 text-xs mb-1 text-center font-medium">Package</p>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                          {facebookApiConnected ? (
                            <p className="text-white text-base font-bold text-center drop-shadow-sm">{formatNumber(marketingData.inboxBreakdown.packageMessages)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1 text-center font-medium">ต้นทุน/ข้อความ</p>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                          {facebookApiConnected ? (
                            <p className="text-white text-sm font-bold text-center drop-shadow-sm">{formatCurrency(marketingData.inboxBreakdown.packageCostPerMessage)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-600 text-xs mb-1 text-center font-medium">Wholesales</p>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                          {facebookApiConnected ? (
                            <p className="text-white text-base font-bold text-center drop-shadow-sm">{formatNumber(marketingData.inboxBreakdown.wholesalesMessages)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1 text-center font-medium">ต้นทุน/ข้อความ</p>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                          {facebookApiConnected ? (
                            <p className="text-white text-sm font-bold text-center drop-shadow-sm">{formatCurrency(marketingData.inboxBreakdown.wholesalesCostPerMessage)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-600 text-xs mb-1 text-center font-medium">อื่นๆ</p>
                        <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-2 rounded-xl shadow-md">
                          {facebookApiConnected ? (
                            <p className="text-white text-base font-bold text-center drop-shadow-sm">{formatNumber(marketingData.inboxBreakdown.otherMessages)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1 text-center font-medium">ต้นทุน/ข้อความ</p>
                        <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-2 rounded-xl shadow-md">
                          {facebookApiConnected ? (
                            <p className="text-white text-sm font-bold text-center drop-shadow-sm">{formatCurrency(marketingData.inboxBreakdown.otherCostPerMessage)}</p>
                          ) : (
                            <p className="text-white text-xs font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overall RoAS */}
              <Card className="bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Overall RoAS</h3>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-xl shadow-lg mb-3">
                      <p className="text-white text-xl font-bold drop-shadow-lg">{formatPercentage(marketingData.overallRoas)}</p>
                    </div>
                    <p className="text-gray-500 text-xs mb-3 font-medium">*Return on Ad Spend - % ผลลัพธ์จากการลงทุน</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-600 text-xs mb-1 text-center font-medium">ROAS Package</p>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                          <p className="text-white text-base font-bold text-center drop-shadow-sm">{formatPercentage(marketingData.packageRoas)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1 text-center font-medium">ROAS Wholesales</p>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                          <p className="text-white text-base font-bold text-center drop-shadow-sm">{formatPercentage(marketingData.wholesalesRoas)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Section 3: Permit Tracking Dashboard */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              Dashboard คำขออนุญาต
            </h2>
            {permitLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                กำลังโหลดข้อมูล...
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {permitSummaryData && permitSummaryData.total > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-50 text-sm font-medium">รวมทั้งหมด</p>
                      <p className="text-3xl font-bold">{permitSummaryData.total.toLocaleString()}</p>
                      <p className="text-orange-50 text-xs mt-1">รายการทั้งหมด</p>
                    </div>
                    <div className="p-3 bg-white/30 rounded-full">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">ไม่สามารถดำเนินการได้</p>
                      <p className="text-2xl font-bold text-red-600">{(permitSummaryData.byMainStatus["ไม่สามารถดำเนินการได้"] || 0).toLocaleString()}</p>
                      <p className="text-gray-500 text-xs mt-1">ไม่สามารถดำเนินการได้</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">ระหว่างดำเนินการ</p>
                      <p className="text-2xl font-bold text-yellow-600">{(permitSummaryData.byMainStatus["ระหว่างดำเนินการ"] || 0).toLocaleString()}</p>
                      <p className="text-gray-500 text-xs mt-1">กำลังดำเนินการ</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-full">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">ดำเนินการเสร็จสิ้น</p>
                      <p className="text-2xl font-bold text-green-600">{(permitSummaryData.byMainStatus["ดำเนินการเสร็จสิ้น"] || 0).toLocaleString()}</p>
                      <p className="text-gray-500 text-xs mt-1">เสร็จสิ้นแล้ว</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            !permitLoading && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีข้อมูล</h3>
                      <p className="text-gray-600">ไม่พบข้อมูลคำขออนุญาตในช่วงเวลาที่เลือก</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}

          {/* Dashboard Cards */}
          {permitSummaryData && permitSummaryData.total > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ไม่สามารถดำเนินการได้ */}
              <Card className="bg-white border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-red-50 to-red-100 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-red-800">ไม่สามารถดำเนินการได้</div>
                      <div className="text-sm font-normal text-red-600">
                        {permitSummaryData?.byMainStatus["ไม่สามารถดำเนินการได้"] || 0} รายการ
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {getPermitSubStatusesForCard("ไม่สามารถดำเนินการได้").map((subStatus) => {
                      const item = permitReportData.find(i => 
                        i.main_status === "ไม่สามารถดำเนินการได้" && i.detail_status === subStatus
                      );
                      return (
                        <div key={subStatus} className="group flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                          <span className="text-sm text-gray-700 font-medium group-hover:text-red-800">{subStatus}</span>
                          <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold shadow-sm">
                            {item?.count || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* ระหว่างดำเนินการ */}
              <Card className="bg-white border-l-4 border-l-yellow-500 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-yellow-500 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-yellow-800">ระหว่างดำเนินการ</div>
                      <div className="text-sm font-normal text-yellow-600">
                        {permitSummaryData?.byMainStatus["ระหว่างดำเนินการ"] || 0} รายการ
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {getPermitSubStatusesForCard("ระหว่างดำเนินการ").map((subStatus) => {
                      const item = permitReportData.find(i => 
                        i.main_status === "ระหว่างดำเนินการ" && i.detail_status === subStatus
                      );
                      return (
                        <div key={subStatus} className="group flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors">
                          <span className="text-sm text-gray-700 font-medium group-hover:text-yellow-800">{subStatus}</span>
                          <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-bold shadow-sm">
                            {item?.count || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* ดำเนินการเสร็จสิ้น */}
              <Card className="bg-white border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-green-800">ดำเนินการเสร็จสิ้น</div>
                      <div className="text-sm font-normal text-green-600">
                        {permitSummaryData?.byMainStatus["ดำเนินการเสร็จสิ้น"] || 0} รายการ
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {getPermitSubStatusesForCard("ดำเนินการเสร็จสิ้น").map((detailStatus) => {
                      const item = permitReportData.find(i => 
                        i.main_status === "ดำเนินการเสร็จสิ้น" && i.detail_status === detailStatus
                      );
                      return (
                        <div key={detailStatus} className="group flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                          <span className="text-sm text-gray-700 font-medium group-hover:text-green-800">{detailStatus}</span>
                          <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold shadow-sm">
                            {item?.count || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Section 4: Customer Services Dashboard */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="h-6 w-6 text-orange-600" />
              Customer Services Dashboard
            </h2>
            {(customerServiceStatsLoading || customerServicesLoading) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                กำลังโหลดข้อมูล...
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Pending Service Visit 1 */}
            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">รอบริการครั้งที่ 1</p>
                    <p className="text-3xl font-bold text-gray-900">{customerServiceFilteredStats.pendingServiceVisit1}</p>
                    <p className="text-xs text-gray-500 mt-1">ยังไม่ได้บริการ</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Service Visit 2 */}
            <Card className="border-yellow-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">รอบริการครั้งที่ 2</p>
                    <p className="text-3xl font-bold text-gray-900">{customerServiceFilteredStats.pendingServiceVisit2}</p>
                    <p className="text-xs text-gray-500 mt-1">เสร็จครั้งที่ 1 แล้ว</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Wrench className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Service Visit 3 */}
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">รอบริการครั้งที่ 3</p>
                    <p className="text-3xl font-bold text-gray-900">{customerServiceFilteredStats.pendingServiceVisit3}</p>
                    <p className="text-xs text-gray-500 mt-1">เสร็จครั้งที่ 2 แล้ว</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Wrench className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Service Visit 4 */}
            <Card className="border-purple-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">รอบริการครั้งที่ 4</p>
                    <p className="text-3xl font-bold text-gray-900">{customerServiceFilteredStats.pendingServiceVisit4}</p>
                    <p className="text-xs text-gray-500 mt-1">เสร็จครั้งที่ 3 แล้ว</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Wrench className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Service Visit 5 */}
            <Card className="border-pink-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">รอบริการครั้งที่ 5</p>
                    <p className="text-3xl font-bold text-gray-900">{customerServiceFilteredStats.pendingServiceVisit5}</p>
                    <p className="text-xs text-gray-500 mt-1">เสร็จครั้งที่ 4 แล้ว</p>
                  </div>
                  <div className="p-3 bg-pink-100 rounded-full">
                    <Wrench className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Services */}
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">บริการครบแล้ว</p>
                    <p className="text-3xl font-bold text-gray-900">{customerServiceFilteredStats.completed}</p>
                    <p className="text-xs text-green-600 mt-1 font-medium">{customerServiceCompletionRate}% สำเร็จ</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Customers Card */}
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ลูกค้าทั้งหมด</p>
                  <p className="text-3xl font-bold text-gray-900">{customerServiceFilteredStats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">แสดงข้อมูลทั้งหมด</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Three Donut Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* kW Size Chart */}
            <Card className="bg-white border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  ขนาดที่ติดตั้ง
                </CardTitle>
                <CardDescription>สัดส่วนขนาด kW ที่ติดตั้ง</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ReactECharts option={customerServiceKwSizeChartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </CardContent>
            </Card>

            {/* Province Chart */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  จังหวัด
                </CardTitle>
                <CardDescription>สัดส่วนจังหวัดที่ให้บริการ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ReactECharts option={customerServiceProvinceChartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </CardContent>
            </Card>

            {/* Service Status Chart */}
            <Card className="bg-white border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  สถานะ Service ลูกค้า
                </CardTitle>
                <CardDescription>สัดส่วนสถานะการให้บริการ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ReactECharts option={customerServiceStatusChartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default ExecutiveDashboard;

