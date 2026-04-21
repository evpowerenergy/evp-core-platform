import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

// Lazy load ReactECharts to reduce initial bundle size
const ReactECharts = lazy(() => import('echarts-for-react'));
import { useFilteredSalesTeamData } from "@/hooks/useAppDataAPI";
import { Package, TrendingUp, Target, Users, Calendar, MapPin, Zap, FileText, UserX, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamFilterSelect } from "@/components/filters/TeamFilterSelect";
import SaleChanceChart from "@/components/dashboard/SaleChanceChart";
import { useSaleChanceStats } from "@/hooks/useSaleChanceStats";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import MetricLeadsDialog from "@/components/reports/MetricLeadsDialog";
import { getSalesDataInPeriod, getSalesDataByCategory, getQuotationDataInPeriod, getQuotationDataFromDocuments, getOpportunityDataInPeriod, getQuotationDataFromView, getOpportunityDataFromView } from "@/utils/salesUtils";
import { PageLoading } from "@/components/ui/loading";
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

interface PackageDashboardData {
  totalProjects: number;
  totalActiveLeads: number;  // เพิ่มตัวแปรนี้
  activeLeadsCount: number;  // เพิ่มจำนวนลีดที่ยังไม่ปิดการขาย
  adminLeadsCount: number;   // จำนวนลีดจากแอดมิน
  salesLeadsCount: number;   // จำนวนลีดจากเซลทีม
  adminLeadsPercentage: number; // สัดส่วนลีดจากแอดมิน
  salesLeadsPercentage: number; // สัดส่วนลีดจากเซลทีม
  opportunityValue: number;
  winValue: number;
  winRate: number;
  newCustomers: number;
  existingCustomers: number;
  followUpCount: number;
  statusData: Array<{ name: string; value: number; color: string }>;
  sourceData: Array<{ name: string; value: number; color: string }>;
  regionData: Array<{ name: string; value: number }>;
  paymentMethodData: Array<{ name: string; value: number }>;
  appointmentRate: number;
  quotationRate: number;
  contactableRate: number;
  uncontactableRate: number;
}

const PackageDashboard = () => {
  // Get sales team data for package (including manager_sale)
  const { data: salesTeamData, loading: salesTeamLoading } = useFilteredSalesTeamData('sale_package');
  const { salesTeam = [] } = salesTeamData || {};
  
  const [salesFilter, setSalesFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(), 
    to: new Date() 
  });
  const [dashboardData, setDashboardData] = useState<PackageDashboardData>({
    totalProjects: 0,
    opportunityValue: 0,
    winValue: 0,
    winRate: 0,
    newCustomers: 0,
    existingCustomers: 0,
    followUpCount: 0,
    statusData: [],
    sourceData: [],
    regionData: [],
    paymentMethodData: [],
    appointmentRate: 0,
    quotationRate: 0,
    contactableRate: 0,
    uncontactableRate: 0,
    totalActiveLeads: 0,
    activeLeadsCount: 0,
    adminLeadsCount: 0,
    salesLeadsCount: 0,
    adminLeadsPercentage: 0,
    salesLeadsPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal state for metric details
  const [metricModalState, setMetricModalState] = useState({
    isOpen: false,
    title: '',
    leads: [] as any[],
    metricType: 'quotation' as 'quotation' | 'contactable' | 'uncontactable' | 'appointment'
  });

  const { saleChanceData, loading: chartLoading, error: chartError, refetch: refetchChart } = useSaleChanceStats({
    dateRange: dateRangeFilter,
    salesFilter,
    category: 'Package'
  });

  // ✅ ดึงข้อมูล leads จาก Edge Function (เหมือน Index และ Executive Dashboard)
  // เพื่อให้กรอง platform EV + Partner และ has_contact_info = true สำหรับ Conversion Rate
  const { data: leadsFromEdgeFunction, isLoading: leadsFromEdgeFunctionLoading } = useQuery({
    queryKey: ['all-leads-for-package-dashboard', dateRangeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      params.append('from', startDate);
      params.append('to', endDate);

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
      // Filter เฉพาะ Package category
      return (result.data || []).filter((lead: any) => lead.category === 'Package');
    },
    enabled: !!dateRangeFilter,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    // รอให้ leadsFromEdgeFunction โหลดเสร็จก่อน (ถ้ามี)
    if (!leadsFromEdgeFunctionLoading) {
      fetchDashboardData();
    }
  }, [dateRangeFilter, salesFilter, leadsFromEdgeFunction, leadsFromEdgeFunctionLoading]);

  // Function to get leads for specific metrics
  const getLeadsForMetric = async (metricType: 'quotation' | 'contactable' | 'uncontactable' | 'appointment') => {
    try {
      // Get current leads data with same filters
      let startDate: string, endDate: string;
      
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
        startDate = startDateString + 'T00:00:00.000';
        
        const endDateString = formatter.format(toDate);
        endDate = endDateString + 'T23:59:59.999';
      } else {
        const formatter = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const today = new Date();
        const todayString = formatter.format(today);
        
        startDate = todayString + 'T00:00:00.000';
        endDate = todayString + 'T23:59:59.999';
      }

      // Get base leads (ใช้ created_at_thai เพื่อให้ได้ลีดที่สร้างในช่วงนั้น)
      let leadsQuery = supabase
        .from('leads')
        .select('id, full_name, status, platform, region, created_at_thai, sale_owner_id, post_sales_owner_id, category,  tel, line_id')
        .eq('category', 'Package')
        .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null') // รวมทั้ง sale_owner_id และ post_sales_owner_id
        .gte('created_at_thai', startDate)
        .lte('created_at_thai', endDate);

      // Apply sales filter - รวมทั้ง sale_owner_id และ post_sales_owner_id
      if (salesFilter !== 'all') {
        leadsQuery = leadsQuery.or(`sale_owner_id.eq.${salesFilter},post_sales_owner_id.eq.${salesFilter}`);
      }

      const { data: allLeads } = await leadsQuery;
      if (!allLeads) return [];

      // ไม่ต้อง filter แล้ว เพราะ leadsQuery ใช้ filterLeadsWithContact() กรองให้แล้ว (ใน fetchDashboardData)
      const validLeads = allLeads;
      
      if (metricType === 'quotation') {
        // ✅ ใช้ utility function เดียวกันกับ main calculation เพื่อความสอดคล้อง
        const salesFilterParam = salesFilter !== 'all' ? salesFilter : undefined;
        
        // ดึงข้อมูลการออก QT สำหรับ Package (ใช้ระบบใหม่ที่ใช้ quotation_documents)
        // ใช้ระบบใหม่ที่ใช้ view lead_qt_itemized เพื่อความแม่นยำสูงสุด (ไม่ซ้ำ QT)
        const quotationData = await getQuotationDataFromView(
          startDate || new Date().toISOString(),
          endDate || new Date().toISOString(),
          'Package',
          salesFilterParam
        );
        
        // ✅ ใช้ข้อมูลจาก view ที่ทำ deduplication แล้ว
        return quotationData.quotationLeads.map(lead => {
          // หา lead data สำหรับ lead นี้
          const leadData = validLeads.find(l => l.id === lead.leadId);
          
          if (!leadData) {
            // ถ้าไม่เจอ lead data ให้สร้างข้อมูลพื้นฐาน
            return {
              id: lead.leadId,
              full_name: lead.customerName || 'ไม่ระบุ',
              tel: 'ไม่ระบุ', // view ไม่มี tel
              platform: 'ไม่ระบุ', // view ไม่มี platform
              region: 'ไม่ระบุ',
              status: lead.leadStatus || 'ไม่ระบุ',
              category: lead.category || 'Package',
              sale_owner_id: 0, // จะต้องดึงเพิ่มเติมถ้าต้องการ
              created_at_thai: lead.lastActivityDate,
              totalQuotationAmount: lead.totalQuotationAmount,
              totalQuotationCount: lead.totalQuotationCount,
              quotationLogs: [{
                logId: lead.quotationItems[0]?.log_id || 0,
                logDate: lead.lastActivityDate,
                quotationAmount: lead.totalQuotationAmount,
                quotationCount: lead.totalQuotationCount
              }]
            };
          } else {
            // ใช้ lead data ที่มีอยู่
            return {
              ...leadData,
              totalQuotationAmount: lead.totalQuotationAmount,
              totalQuotationCount: lead.totalQuotationCount,
              quotationLogs: [{
                logId: lead.quotationItems[0]?.log_id || 0,
                logDate: lead.lastActivityDate,
                quotationAmount: lead.totalQuotationAmount,
                quotationCount: lead.totalQuotationCount
              }]
            };
          }
        });
        
      } else if (metricType === 'contactable' || metricType === 'uncontactable') {
        // ✅ ใช้วิธีเดียวกับ fetchDashboardData เพื่อให้ข้อมูลสอดคล้องกัน
        // Query leads โดยใช้ updated_at_thai (เหมือน activityLeadsQuery)
        let leadsQueryForContact = supabase
          .from('leads')
          .select('id, full_name, status, platform, region, created_at_thai, sale_owner_id, post_sales_owner_id, category, tel, line_id')
          .eq('category', 'Package')
          .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null');
        
        leadsQueryForContact = filterLeadsWithContact(leadsQueryForContact);
        
        // ใช้ updated_at_thai เพื่อให้สอดคล้องกับ activityLeadsQuery
        if (startDate && endDate) {
          leadsQueryForContact = leadsQueryForContact
            .gte('updated_at_thai', startDate)
            .lte('updated_at_thai', endDate);
        }
        
        // Apply sales filter
        if (salesFilter !== 'all') {
          leadsQueryForContact = leadsQueryForContact.or(`sale_owner_id.eq.${salesFilter},post_sales_owner_id.eq.${salesFilter}`);
        }
        
        const { data: allLeadsForContact } = await leadsQueryForContact;
        if (!allLeadsForContact || allLeadsForContact.length === 0) return [];
        
        const leadIds = allLeadsForContact.map(lead => lead.id);
        const targetStatus = metricType === 'contactable' ? 'ติดต่อได้' : 'ติดต่อไม่ได้';
        
        // Query contact logs โดยใช้ sale_id จาก productivity logs (เหมือน fetchDashboardData)
        let contactLogsQuery = supabase
          .from('lead_productivity_logs')
          .select('lead_id, sale_id, contact_status, created_at_thai')
          .in('lead_id', leadIds)
          .eq('contact_status', targetStatus)
          .order('created_at_thai', { ascending: false });

        // Apply date filter if dates are selected
        if (startDate && endDate) {
          contactLogsQuery = contactLogsQuery
            .gte('created_at_thai', startDate)
            .lte('created_at_thai', endDate);
        }
        
        // Apply sales filter using sale_id from productivity logs (เหมือน fetchDashboardData)
        if (salesFilter !== 'all') {
          contactLogsQuery = contactLogsQuery.eq('sale_id', parseInt(salesFilter));
        }

        const { data: contactLogs } = await contactLogsQuery;
        
        // Get latest log for each lead
        const latestLogsByLead = new Map();
        contactLogs?.forEach(log => {
          if (!latestLogsByLead.has(log.lead_id)) {
            latestLogsByLead.set(log.lead_id, log);
          }
        });
        
        const leadsWithContactStatus = new Set(Array.from(latestLogsByLead.keys()));
        return allLeadsForContact.filter(lead => leadsWithContactStatus.has(lead.id));
        
      } else if (metricType === 'appointment') {
        // Get leads with appointments
        const leadIds = validLeads.map(lead => lead.id);
        
        let appointmentLogsQuery = supabase
          .from('lead_productivity_logs')
          .select(`
            id,
            lead_id,
            appointments!inner(id)
          `)
          .in('lead_id', leadIds);

        // Only apply date filter if dates are selected
        if (startDate && endDate) {
          appointmentLogsQuery = appointmentLogsQuery
            .gte('created_at_thai', startDate)
            .lte('created_at_thai', endDate);
        }

        const { data: appointmentLogs } = await appointmentLogsQuery;
        const leadsWithAppointments = new Set(appointmentLogs?.map(log => log.lead_id) || []);
        
        return validLeads.filter(lead => leadsWithAppointments.has(lead.id));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting leads for metric:', error);
      return [];
    }
  };

  // Handle metric click
  const handleMetricClick = async (metricType: 'quotation' | 'contactable' | 'uncontactable' | 'appointment') => {
    const leads = await getLeadsForMetric(metricType);
    
    const titles = {
      quotation: 'ลีดที่ออกใบเสนอราคา',
      contactable: 'ลีดที่ติดต่อได้',
      uncontactable: 'ลีดที่ติดต่อไม่ได้',
      appointment: 'ลีดที่ทำนัดฟิลด์'
    };
    
    setMetricModalState({
      isOpen: true,
      title: titles[metricType],
      leads,
      metricType
    });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Use proper timezone handling for date range
      let startDate: string, endDate: string;
      
      if (dateRangeFilter && dateRangeFilter.from) {
        const fromDate = dateRangeFilter.from;
        const toDate = dateRangeFilter.to || dateRangeFilter.from;
        
        // Use Intl.DateTimeFormat with Thailand timezone to get correct dates
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
      } else {
        // No date range selected - show all data (no date filter)
        startDate = '';
        endDate = '';
      }

      // ✅ แก้ไข N+1 Queries: ใช้ Promise.all สำหรับ parallel queries
      const salesFilterParam = salesFilter !== 'all' ? salesFilter : undefined;
      
      // สร้าง queries ทั้งหมดก่อน
      let newLeadsCountQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Package')
        .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null'); // รวมทั้ง sale_owner_id และ post_sales_owner_id
      
      newLeadsCountQuery = filterLeadsWithContact(newLeadsCountQuery);

      let activityLeadsQuery = supabase
        .from('leads')
        .select('id, full_name, status, platform, region, created_at_thai, sale_owner_id, post_sales_owner_id, category,  tel, line_id')
        .eq('category', 'Package')
        .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null'); // รวมทั้ง sale_owner_id และ post_sales_owner_id
      
      // Filter เฉพาะลีดที่มีเบอร์โทรหรือ Line ID
      activityLeadsQuery = filterLeadsWithContact(activityLeadsQuery);

      // ดึงข้อมูล admin user IDs ก่อน
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin_page');
      
      const adminUserIds = adminUsers?.map(u => u.id) || [];

      // เพิ่ม queries สำหรับแยกประเภทลีด
      let adminLeadsCountQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Package')
        .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null'); // รวมทั้ง sale_owner_id และ post_sales_owner_id
      
      adminLeadsCountQuery = filterLeadsWithContact(adminLeadsCountQuery);

      let salesLeadsCountQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Package')
        .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null'); // รวมทั้ง sale_owner_id และ post_sales_owner_id
      
      salesLeadsCountQuery = filterLeadsWithContact(salesLeadsCountQuery);

      // ใช้ filter ตาม admin user IDs
      if (adminUserIds.length > 0) {
        adminLeadsCountQuery = adminLeadsCountQuery.in('created_by', adminUserIds);
        salesLeadsCountQuery = salesLeadsCountQuery.not('created_by', 'in', `(${adminUserIds.join(',')})`);
      } else {
        // ถ้าไม่มี admin users ให้ salesLeadsCountQuery เป็นทั้งหมด
        adminLeadsCountQuery = adminLeadsCountQuery.eq('created_by', '00000000-0000-0000-0000-000000000000'); // ไม่มีผลลัพธ์
      }

      // Apply date filters
      if (startDate && endDate) {
        newLeadsCountQuery = newLeadsCountQuery
          .gte('assigned_at_thai', startDate)
          .lte('assigned_at_thai', endDate);
        // ✅ ใช้ updated_at_thai เพื่อดึงลีดที่มีการอัปเดตในช่วงเวลานั้น (รวมถึงลีดที่สร้างก่อนหน้านี้แต่มีการอัปเดตวันนี้)
        // เพื่อให้ charts (statusData, sourceData, regionData) แสดงข้อมูลได้ถูกต้อง
        activityLeadsQuery = activityLeadsQuery
          .gte('updated_at_thai', startDate)
          .lte('updated_at_thai', endDate);
        adminLeadsCountQuery = adminLeadsCountQuery
          .gte('assigned_at_thai', startDate)
          .lte('assigned_at_thai', endDate);
        salesLeadsCountQuery = salesLeadsCountQuery
          .gte('assigned_at_thai', startDate)
          .lte('assigned_at_thai', endDate);
      }

      // Apply sales filters - รวมทั้ง sale_owner_id และ post_sales_owner_id
      if (salesFilter !== 'all') {
        const salesFilterOr = `sale_owner_id.eq.${salesFilter},post_sales_owner_id.eq.${salesFilter}`;
        newLeadsCountQuery = newLeadsCountQuery.or(salesFilterOr);
        activityLeadsQuery = activityLeadsQuery.or(salesFilterOr);
        adminLeadsCountQuery = adminLeadsCountQuery.or(salesFilterOr);
        salesLeadsCountQuery = salesLeadsCountQuery.or(salesFilterOr);
      }

      // ✅ ดึงข้อมูลทั้งหมดพร้อมกัน (Parallel Queries)
      const [
        newLeadsCountResult,
        activityLeadsResult,
        adminLeadsCountResult,
        salesLeadsCountResult,
        packageSalesData,
        quotationData,
        opportunityData
      ] = await Promise.all([
        newLeadsCountQuery,
        activityLeadsQuery,
        adminLeadsCountQuery,
        salesLeadsCountQuery,
        // ดึงข้อมูลยอดขายที่ปิดการขายสำเร็จ (กรองตาม category Package)
        startDate && endDate ? getSalesDataByCategory(startDate, endDate, 'Package', salesFilterParam) : Promise.resolve({ quotations: [], salesLogs: [], totalSalesValue: 0, salesCount: 0, uniqueLeadIds: [], salesLeads: [] }),
        // ดึงข้อมูลการออก QT (ใช้ระบบใหม่ที่ใช้ view lead_qt_itemized)
        getQuotationDataFromView(startDate || new Date().toISOString(), endDate || new Date().toISOString(), 'Package', salesFilterParam),
        // ดึงข้อมูลโอกาสการขาย
        getOpportunityDataFromView(startDate || new Date().toISOString(), endDate || new Date().toISOString(), 'Package', salesFilterParam)
      ]);

      const { count: totalProjects } = newLeadsCountResult;
      const { data: activityLeads } = activityLeadsResult;
      const { count: adminLeadsCount } = adminLeadsCountResult;
      const { count: salesLeadsCount } = salesLeadsCountResult;
      // ข้อมูลยอดขายที่ปิดการขายสำเร็จ (packageSalesData มาจาก Promise.all แล้ว)

      if (totalProjects === null || !activityLeads) return;

      // คำนวณสัดส่วน
      const adminSalesLeadsCount = (adminLeadsCount || 0) + (salesLeadsCount || 0);
      const adminLeadsPercentage = adminSalesLeadsCount > 0 ? ((adminLeadsCount || 0) / adminSalesLeadsCount) * 100 : 0;
      const salesLeadsPercentage = adminSalesLeadsCount > 0 ? ((salesLeadsCount || 0) / adminSalesLeadsCount) * 100 : 0;

      // ใช้ activityLeads สำหรับการคำนวณเมตริกอื่นๆ
      // ไม่ต้อง filter แล้ว เพราะ activityLeadsQuery ใช้ filterLeadsWithContact() กรองให้แล้ว
      const validActivityLeads = activityLeads;
      
      // ✅ ใช้ข้อมูลยอดขายที่ปิดการขายสำเร็จจาก getSalesDataByCategory
      const allQuotations = packageSalesData.quotations;
      const productivityLogsData = packageSalesData.salesLogs;
      
      // กำหนดค่าจาก opportunityData
      const opportunityValue = opportunityData.totalOpportunityValue;
      
      // ✅ Win value ใช้ totalSalesValue ที่คำนวณแล้วจาก salesUtils (หลัง deduplication)
      const winValue = packageSalesData.totalSalesValue || 0;
      
      // ✅ Calculate Conversion Rate (Lead) - ใช้ leads จาก Edge Function (กรอง platform EV + Partner แล้ว)
      // เพื่อให้ตรงกับ Index, Executive Dashboard และ Sales Closed Report
      // ตรวจสอบว่า leadsFromEdgeFunction มีค่าหรือไม่ (อาจยังไม่โหลดเสร็จ)
      let winRate = 0;
      if (leadsFromEdgeFunction && Array.isArray(leadsFromEdgeFunction)) {
        const totalLeadsFromEdgeFunction = leadsFromEdgeFunction.length;
        
        // นับจำนวนลีดที่ปิดการขายจริงๆ (ไม่ใช่ QT) จาก salesLeads
        const closedLeadIds = new Set();
        if (packageSalesData.salesLeads) {
          packageSalesData.salesLeads.forEach((lead: any) => {
            closedLeadIds.add(lead.leadId);
          });
        }
        const actualClosedLeadsCount = closedLeadIds.size;
        
        winRate = totalLeadsFromEdgeFunction > 0 
          ? (actualClosedLeadsCount / totalLeadsFromEdgeFunction) * 100 
          : 0;
      }
      
      // คำนวณจำนวนลีดที่ยังไม่ปิดการขาย (สำหรับ Card โอกาส)
      const activeLeadsCount = validActivityLeads.filter(lead => 
        lead.status !== 'ปิดการขาย' && lead.status !== 'ยังปิดการขายไม่สำเร็จ'
      ).length;
      


      // Status distribution
      const statusCount = activityLeads.reduce((acc, lead) => {
        acc[lead.status || 'ไม่ระบุ'] = (acc[lead.status || 'ไม่ระบุ'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusData = Object.entries(statusCount).map(([status, count], index) => ({
        name: status,
        value: count,
        color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
      }));

      const sourceCount = activityLeads.reduce((acc, lead) => {
        acc[lead.platform || 'ไม่ระบุ'] = (acc[lead.platform || 'ไม่ระบุ'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sourceData = Object.entries(sourceCount).map(([source, count], index) => ({
        name: source,
        value: count,
        color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'][index % 6]
      }));

      const regionCount = activityLeads.reduce((acc, lead) => {
        acc[lead.region || 'ไม่ระบุ'] = (acc[lead.region || 'ไม่ระบุ'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const regionData = Object.entries(regionCount).map(([region, count]) => ({
        name: region,
        value: count
      }));

      





      // Get real payment method data from quotations - CORRECTED LOGIC
      // Use quotations that come from productivity logs within date range
      const paymentMethodCount = (quotationData.quotations || []).reduce((acc, q) => {
        // เนื่องจาก quotation_documents ไม่มี payment_method field
        // ใช้ค่า default เป็น 'ไม่ระบุ' สำหรับตอนนี้
        const method = 'ไม่ระบุ';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const paymentMethodData = Object.entries(paymentMethodCount).map(([name, value]) => ({
        name,
        value: value as number
      }));



      // Get customer group data from productivity logs - CORRECTED LOGIC
      // Use 2-step query to avoid foreign key filter issues
      let customerGroupQuery;
      
      if (startDate && endDate) {
        // Step 1: Get leads with updated_at_thai in date range
        const { data: leadsInDateRange } = await supabase
          .from('leads')
          .select('id, sale_owner_id, post_sales_owner_id')
          .eq('category', 'Package')
          .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null') // รวมทั้ง sale_owner_id และ post_sales_owner_id
          .gte('updated_at_thai', startDate)
          .lte('updated_at_thai', endDate);

        let filteredLeads = leadsInDateRange || [];
        // Client-side filter - รวมทั้ง sale_owner_id และ post_sales_owner_id
        if (salesFilter !== 'all') {
          const salesFilterId = parseInt(salesFilter);
          filteredLeads = filteredLeads.filter(lead => 
            lead.sale_owner_id === salesFilterId || lead.post_sales_owner_id === salesFilterId
          );
        }

        const leadIds = filteredLeads.map(lead => lead.id);

        // Step 2: Get productivity logs for these leads
        if (leadIds.length > 0) {
          customerGroupQuery = supabase
            .from('lead_productivity_logs')
            .select(`
              lead_group, 
              lead_id,
              sale_id,
              leads!inner(
                id,
                category
              )
            `)
            .in('lead_id', leadIds)
            .not('lead_group', 'is', null)
            .order('lead_id', { ascending: false });
        } else {
          // If no leads found, create an empty query to avoid undefined error
          customerGroupQuery = supabase
            .from('lead_productivity_logs')
            .select(`
              lead_group, 
              lead_id,
              sale_id,
              leads!inner(
                id,
                category
              )
            `)
            .eq('lead_id', -1); // This will return no results
        }
      } else {
        // No date filter - get all leads with customer groups
        customerGroupQuery = supabase
          .from('lead_productivity_logs')
          .select(`
            lead_group,
            lead_id,
            sale_id,
            leads!inner(
              id,
              category
            )
          `)
          .eq('leads.category', 'Package')
          .not('lead_group', 'is', null)
          .order('lead_id', { ascending: false });
      }

      // Apply sales filter after all other filters - ใช้ sale_id จาก productivity logs
      if (salesFilter !== 'all' && customerGroupQuery) {
        customerGroupQuery = customerGroupQuery.eq('sale_id', parseInt(salesFilter));
      }

      // Ensure customerGroupQuery is defined before executing
      let customerGroupLogs = [];
      let customerGroupError = null;
      
      if (!customerGroupQuery) {
        // Skip customer group data fetch if query is undefined
      } else {
        const result = await customerGroupQuery;
        customerGroupLogs = result.data || [];
        customerGroupError = result.error;
      }
      
      // Check for errors
      if (customerGroupError) {
        console.error('Error fetching customer group data:', customerGroupError);
      }

      // Use only the latest log for each lead
      const latestCustomerGroupLogs = new Map();
      customerGroupLogs?.forEach(log => {
        if (!latestCustomerGroupLogs.has(log.lead_id)) {
          latestCustomerGroupLogs.set(log.lead_id, log);
        }
      });

      const newCustomers = Array.from(latestCustomerGroupLogs.values()).filter(log => log.lead_group === 'ลูกค้าใหม่').length;
      const existingCustomers = Array.from(latestCustomerGroupLogs.values()).filter(log => log.lead_group === 'ลูกค้าเดิม').length;
      


      // Get follow-up count from productivity logs - CORRECTED LOGIC
      // Filter productivity logs directly by date instead of filtering leads first
      // ✅ ใช้ sale_id จาก productivity logs แทน leads.sale_owner_id
      let followUpQuery = supabase
        .from('lead_productivity_logs')
        .select(`
          id,
          lead_id,
          sale_id,
          created_at_thai,
          leads!inner(
            id,
            category,
            created_at_thai
          )
        `)
        .eq('leads.category', 'Package');

      // Only apply date filter if dates are selected
      if (startDate && endDate) {
        followUpQuery = followUpQuery
          .gte('created_at_thai', startDate)  // ✅ Filter by productivity log date
          .lte('created_at_thai', endDate);
      }

      // Apply sales filter after all other filters - ใช้ sale_id จาก productivity logs
      if (salesFilter !== 'all') {
        followUpQuery = followUpQuery.eq('sale_id', parseInt(salesFilter));
      }

      const { data: followUpLogs, error: followUpError } = await followUpQuery;
      

      
      const followUpCount = followUpLogs?.length || 0;

      // Calculate additional metrics
      
      // Get total unique leads with activity in selected date range for rate calculation
      // ✅ ใช้ sale_id จาก productivity logs แทน leads.sale_owner_id
      let activityQuery = supabase
        .from('lead_productivity_logs')
        .select(`
          lead_id,
          sale_id,
          leads!inner(
            id,
            category
          )
        `)
        .eq('leads.category', 'Package');

      // Only apply date filter if dates are selected
      if (startDate && endDate) {
        activityQuery = activityQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      // Apply sales filter after all other filters - ใช้ sale_id จาก productivity logs
      if (salesFilter !== 'all') {
        activityQuery = activityQuery.eq('sale_id', parseInt(salesFilter));
      }

      const { data: activityLogs } = await activityQuery;
      const totalLeadsWithActivity = new Set(activityLogs?.map(log => log.lead_id) || []).size;
      
      // Get appointments data for appointment rate calculation - CORRECTED LOGIC
      // Filter productivity logs directly by date instead of filtering leads first
              const validLeadIds = validActivityLeads.map(lead => lead.id);
      let leadsWithAppointments = new Set();
      
      if (validLeadIds.length > 0) {
        // Get productivity logs for appointments with date filter - CORRECTED LOGIC
        // ✅ ใช้ sale_id จาก productivity logs แทน leads.sale_owner_id
        let productivityLogsForAppointmentsQuery = supabase
          .from('lead_productivity_logs')
          .select(`
            lead_id, 
            id, 
            sale_id,
            created_at_thai,
            leads!inner(
              id,
              category
            )
          `)
          .eq('leads.category', 'Package')
          .in('lead_id', validLeadIds);

        // Only apply date filter if dates are selected
        if (startDate && endDate) {
          productivityLogsForAppointmentsQuery = productivityLogsForAppointmentsQuery
            .gte('created_at_thai', startDate)  // ✅ Filter by productivity log date
            .lte('created_at_thai', endDate);
        }

        // Apply sales filter after all other filters - ใช้ sale_id จาก productivity logs
        if (salesFilter !== 'all') {
          productivityLogsForAppointmentsQuery = productivityLogsForAppointmentsQuery.eq('sale_id', parseInt(salesFilter));
        }

        const { data: productivityLogsForAppointments, error: appointmentsLogsError } = await productivityLogsForAppointmentsQuery;
        


        if (productivityLogsForAppointments && productivityLogsForAppointments.length > 0) {
          const productivityLogIds = productivityLogsForAppointments.map(log => log.id);

          if (productivityLogIds.length > 0) {
            // Get appointments for these productivity logs
            const { data: appointmentsData, error: appointmentsError } = await supabase
              .from('appointments')
              .select('productivity_log_id')
              .in('productivity_log_id', productivityLogIds);

            if (appointmentsError) {
              console.error('Error fetching appointments:', appointmentsError);
            }

            // Count unique leads that have appointments
            appointmentsData?.forEach(appointment => {
              const productivityLog = productivityLogsForAppointments.find(log => log.id === appointment.productivity_log_id);
              if (productivityLog) {
                leadsWithAppointments.add(productivityLog.lead_id);
              }
            });


          }
        }
      }

      const appointmentRate = totalLeadsWithActivity > 0 ? (leadsWithAppointments.size / totalLeadsWithActivity) * 100 : 0;

      // ✅ ใช้ข้อมูลจาก quotationData แทนการคำนวณซับซ้อน
      // ใช้จำนวน productivity logs ที่มี quotations แทน unique leads เพื่อให้สอดคล้องกับ customer-status
      const quotationRate = totalLeadsWithActivity > 0 ? (quotationData.quotationLogsWithQuotations.length / totalLeadsWithActivity) * 100 : 0;

      // Calculate contactable rate from productivity logs - CORRECTED LOGIC
      // Filter productivity logs directly by date instead of filtering leads first
      let leadsWithContactableStatus = new Set();
      let leadsWithUncontactableStatus = new Set();
      let leadsWithContactStatus = new Set(); // Total leads with any contact status
      
      if (validLeadIds.length > 0) {
        // Get latest productivity logs for contact status calculation
        // ✅ ใช้ sale_id จาก productivity logs แทน leads.sale_owner_id
        let productivityLogsForContactQuery = supabase
          .from('lead_productivity_logs')
          .select(`
            lead_id, 
            sale_id,
            contact_status, 
            created_at_thai,
            leads!inner(
              id
            )
          `)
          .in('lead_id', validLeadIds)
          .order('created_at_thai', { ascending: false });

        // Only apply date filter if dates are selected
        if (startDate && endDate) {
          productivityLogsForContactQuery = productivityLogsForContactQuery
            .gte('created_at_thai', startDate)  // ✅ Filter by productivity log date
            .lte('created_at_thai', endDate);
        }

        // Apply sales filter after all other filters - ใช้ sale_id จาก productivity logs
        if (salesFilter !== 'all') {
          productivityLogsForContactQuery = productivityLogsForContactQuery.eq('sale_id', parseInt(salesFilter));
        }

        const { data: productivityLogsForContact, error: contactError } = await productivityLogsForContactQuery;
        

        
        // ✅ ใช้ productivity logs ทั้งหมดที่มี quotation แทนการใช้เฉพาะ log ล่าสุด
        // เหตุผล: ต้องการยอดขายครบถ้วนจากทุก productivity log ที่มี quotation
        const logsWithQuotations = productivityLogsForContact?.filter(log => {
          // ตรวจสอบว่ามี quotation หรือไม่ (จะดึง quotations แยกในขั้นตอนถัดไป)
          return true; // ใช้ logs ทั้งหมดเพื่อให้ครบถ้วน
        }) || [];
        
        const processedContactStatusLeads = new Set<number>();

        logsWithQuotations.forEach(log => {
          if (processedContactStatusLeads.has(log.lead_id)) {
            return;
          }

          processedContactStatusLeads.add(log.lead_id);

          if (log.contact_status === 'ติดต่อได้') {
            leadsWithContactableStatus.add(log.lead_id);
            leadsWithContactStatus.add(log.lead_id);
          } else if (log.contact_status === 'ติดต่อไม่ได้') {
            leadsWithUncontactableStatus.add(log.lead_id);
            leadsWithContactStatus.add(log.lead_id);
          }
        });
      }
 
      const totalLeadsWithContactStatus = leadsWithContactStatus.size;

      const contactableRate = totalLeadsWithContactStatus > 0
        ? (leadsWithContactableStatus.size / totalLeadsWithContactStatus) * 100
        : 0;
      const uncontactableRate = totalLeadsWithContactStatus > 0
        ? (leadsWithUncontactableStatus.size / totalLeadsWithContactStatus) * 100
        : 0;
      


      






      setDashboardData({
        totalProjects,
        totalActiveLeads: validActivityLeads.length,  // เพิ่มบรรทัดนี้
        activeLeadsCount,  // เพิ่มจำนวนลีดที่ยังไม่ปิดการขาย
        adminLeadsCount: adminLeadsCount || 0,
        salesLeadsCount: salesLeadsCount || 0,
        adminLeadsPercentage,
        salesLeadsPercentage,
        opportunityValue,
        winValue,
        winRate,
        newCustomers,
        existingCustomers,
        followUpCount,
        statusData,
        sourceData,
        regionData,
        paymentMethodData,
        // Add new metrics
        appointmentRate,
        quotationRate,
        contactableRate,
        uncontactableRate,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };



  // Skeleton loading component
  const SkeletonCard = () => (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </CardHeader>
      <CardContent className="py-3">
        <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      </CardContent>
    </Card>
  );

  const SkeletonChart = () => (
    <Card className="bg-white">
      <CardHeader className="pb-1">
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </CardHeader>
      <CardContent className="py-6 flex items-center justify-center h-72">
        <div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse"></div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  const selectedSalesName = salesFilter === 'all' 
    ? 'ทุกคน' 
    : salesTeam.find(member => member.id.toString() === salesFilter)?.name || 'ไม่พบชื่อ';

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Package - {selectedSalesName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {new Date().toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TeamFilterSelect
              value={salesFilter}
              onValueChange={setSalesFilter}
              salesTeam={salesTeam}
              placeholder="เลือก Sales"
              allOptionLabel="ทุกคน (รวม)"
              triggerClassName="w-48"
            />
            <DateRangePicker
              value={dateRangeFilter}
              onChange={setDateRangeFilter}
              placeholder="เลือกช่วงเวลา"
              presets={true}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 min-h-[120px]">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-green-800">จำนวนลีดที่รับมา</CardTitle>
              <Target className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-2xl font-bold text-green-900">{dashboardData.totalProjects.toLocaleString()}</div>
              {/* <p className="text-sm font-medium text-green-700 mt-1">Projects</p> */}
              
              {/* แสดงการแยกประเภทลีด */}
              <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-green-700 mt-1">ผู้ที่เพิ่มลีด</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">เซลทีม</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-blue-600">{dashboardData.salesLeadsCount.toLocaleString()}</span>
                    <span className="text-gray-500 ml-1">({dashboardData.salesLeadsPercentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">แอดมิน</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-orange-600">{dashboardData.adminLeadsCount.toLocaleString()}</span>
                    <span className="text-gray-500 ml-1">({dashboardData.adminLeadsPercentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-red-800">ยอดจำนวนการโทร/ติดตาม</CardTitle>
              <Phone className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-2xl font-bold text-red-900">{dashboardData.followUpCount.toLocaleString()}</div>
              <p className="text-sm font-medium text-red-700 mt-1">Follow-ups</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-cyan-800">การนำเสนอ</CardTitle>
              <Users className="h-5 w-5 text-cyan-600" />
            </CardHeader>
            <CardContent className="py-3">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-900">{dashboardData.newCustomers}</div>
                  <p className="text-sm font-medium text-cyan-700">ลูกค้าใหม่</p>
                </div>
                <div className="w-px h-10 bg-cyan-300"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-900">{dashboardData.existingCustomers}</div>
                  <p className="text-sm font-medium text-cyan-700">ลูกค้าเดิม</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-blue-800">โอกาส (Opportunity)</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-2xl font-bold text-blue-900">฿{dashboardData.opportunityValue.toLocaleString()}</div>
              <p className="text-sm font-medium text-blue-700 mt-1">Total Value</p>
              <div className="text-xs text-blue-600 mt-1">
                จาก {dashboardData.activeLeadsCount} ลีดที่ยังไม่ปิดการขาย
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-orange-800">Win (ยอดขายปิดได้)</CardTitle>
              <Package className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-2xl font-bold text-orange-900">฿{dashboardData.winValue.toLocaleString()}</div>
              <p className="text-sm font-medium text-orange-700 mt-1">Closed Deals</p>
              <div className="text-xs text-orange-600 mt-1">
                จาก {dashboardData.totalActiveLeads} ลีดที่มีการอัพเดท
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-purple-800">Conversion Rate (Lead)</CardTitle>
              <Zap className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-2xl font-bold text-purple-900">{dashboardData.winRate.toFixed(1)}%</div>
              <p className="text-sm font-medium text-purple-700 mt-1">ลีดที่ปิด / ลีดทั้งหมด</p>
              <div className="text-xs text-purple-600 mt-1">
                {dashboardData.winRate > 0 ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Metrics: 2 rows, 4 columns each */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-2 min-w-0 min-h-[600px]">

          <Card className="shadow-lg border-0 transition-transform hover:scale-[1.02] hover:shadow-xl bg-white">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">สถานะ Lead</CardTitle>
            </CardHeader>
            <CardContent className="py-6 flex items-center justify-center h-72">
              <Suspense fallback={<div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse"></div>}>
                <ReactECharts
                  option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: function(params: any) {
                      return `
                        <div style="padding: 8px;">
                          <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params.name}</div>
                          <div style="color: #6B7280; font-size: 12px;">จำนวน: ${params.value}</div>
                          <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${params.percent.toFixed(1)}%</div>
                        </div>
                      `;
                    }
                  },
                  series: [
                    {
                      name: 'สถานะ Lead',
                      type: 'pie',
                      radius: ['45%', '75%'], // Changed to doughnut chart
                      center: ['50%', '50%'],
                      data: dashboardData.statusData.map(item => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: {
                          color: item.color
                        }
                      })),
                      label: {
                        show: true,
                        formatter: function(params: any) {
                          return `${params.name}\n${params.value} | ${params.percent.toFixed(1)}%`;
                        },
                        fontSize: 12,
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
                }}
                style={{ height: '240px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
              </Suspense>
            </CardContent>
          </Card>

          {/* Card โอกาสการขาย (SaleChanceChart) */}
          {chartLoading ? (
            <Card className="shadow-lg border-0 transition-transform hover:scale-[1.02] hover:shadow-xl bg-white min-w-0">
              <CardContent className="py-6 flex items-center justify-center h-72 min-w-0">
                <div className="animate-pulse min-w-0">
                  <div className="h-64 bg-gray-200 rounded-lg min-w-0"></div>
                </div>
              </CardContent>
            </Card>
          ) : chartError ? (
            <Card className="shadow-lg border-0 transition-transform hover:scale-[1.02] hover:shadow-xl bg-white min-w-0">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">โอกาสการขาย</CardTitle>
              </CardHeader>
              <CardContent className="py-6 flex items-center justify-center h-72 min-w-0">
                <div className="text-center text-gray-500 min-w-0">
                  <p>ไม่สามารถโหลดข้อมูลได้</p>
                  <Button 
                    onClick={refetchChart} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    ลองใหม่
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg border-0 transition-transform hover:scale-[1.02] hover:shadow-xl bg-white min-w-0">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">โอกาสการขาย</CardTitle>
              </CardHeader>
              <CardContent className="py-6 flex items-center justify-center h-72 min-w-0">
                <SaleChanceChart saleChanceData={saleChanceData} />
              </CardContent>
            </Card>
          )}

          {/* Card เมตริกเพิ่มเติม - MOVED TO REPLACE จังหวัด (Top 5) */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">เมตริกเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 py-2">
               <div className="flex flex-col gap-2">
                <div 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => handleMetricClick('appointment')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-xs">ทำนัด Field</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-blue-600">
                      {dashboardData.appointmentRate > 0 ? dashboardData.appointmentRate.toFixed(1) : '0.0'}%
                    </span>
                                      <div className="text-xs text-gray-500">
                    {dashboardData.appointmentRate > 0 ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
                  </div>
                  <div className="text-xs text-gray-400">
                    จาก {dashboardData.totalActiveLeads} ลีดที่มีการอัพเดท
                  </div>
                  </div>
                </div>
                <div 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                  onClick={() => handleMetricClick('quotation')}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-xs">ออก QT</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-green-600">
                      {dashboardData.quotationRate > 0 ? dashboardData.quotationRate.toFixed(1) : '0.0'}%
                    </span>
                    <div className="text-xs text-gray-500">
                      {dashboardData.quotationRate > 0 ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
                    </div>
                    <div className="text-xs text-gray-400">
                      จาก {dashboardData.totalActiveLeads} ลีดที่มีการอัพเดท
                    </div>
                  </div>
                </div>
                <div 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors"
                  onClick={() => handleMetricClick('contactable')}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span className="font-medium text-xs">ติดต่อได้</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-purple-600">
                      {dashboardData.contactableRate > 0 ? dashboardData.contactableRate.toFixed(1) : '0.0'}%
                    </span>
                                      <div className="text-xs text-gray-500">
                    {dashboardData.contactableRate > 0 ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
                  </div>
                  <div className="text-xs text-gray-400">
                    จาก {dashboardData.totalActiveLeads} ลีดที่มีการอัพเดท
                  </div>
                  </div>
                </div>
                <div 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                  onClick={() => handleMetricClick('uncontactable')}
                >
                  <div className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-xs">ติดต่อไม่ได้</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-red-600">
                      {dashboardData.uncontactableRate > 0 ? dashboardData.uncontactableRate.toFixed(1) : '0.0'}%
                    </span>
                                      <div className="text-xs text-gray-500">
                    {dashboardData.uncontactableRate > 0 ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
                  </div>
                  <div className="text-xs text-gray-400">
                    จาก {dashboardData.totalActiveLeads} ลีดที่มีการอัพเดท
                  </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card จังหวัด (Top 5) - MOVED TO REPLACE เมตริกเพิ่มเติม */}
          <Card className="shadow-lg border-0 transition-transform hover:scale-[1.02] hover:shadow-xl bg-white">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">จังหวัด (Top 5)</CardTitle>
            </CardHeader>
            <CardContent className="py-6 flex items-center justify-center h-72">
              <div className="h-60 w-full">
                <Suspense fallback={<div className="h-60 w-full bg-gray-200 rounded-lg animate-pulse"></div>}>
                  <ReactECharts
                  option={{
                    tooltip: {
                      trigger: 'axis',
                      axisPointer: {
                        type: 'shadow'
                      }
                    },
                    grid: {
                      left: '3%',
                      right: '4%',
                      bottom: '3%',
                      containLabel: true
                    },
                    xAxis: {
                      type: 'value',
                      name: 'จำนวน',
                      nameLocation: 'middle',
                      nameGap: 30,
                      axisLabel: {
                        fontSize: 12,
                        fontWeight: 'bold'
                      }
                    },
                    yAxis: {
                      type: 'category',
                      data: dashboardData.regionData.slice(0, 5).map(item => item.name),
                      axisLabel: {
                        fontSize: 12,
                        fontWeight: 'bold'
                      }
                    },
                    series: [
                      {
                        name: 'จำนวน',
                        type: 'bar',
                        data: dashboardData.regionData.slice(0, 5).map(item => item.value),
                        itemStyle: {
                          color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                              { offset: 0, color: '#10B981' },
                              { offset: 1, color: '#059669' }
                            ]
                          },
                          borderRadius: [0, 4, 4, 0]
                        },
                        label: {
                          show: true,
                          position: 'right',
                          fontSize: 12,
                          fontWeight: 'bold',
                          color: '#374151'
                        },
                        emphasis: {
                          itemStyle: {
                            color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 1,
                              y2: 0,
                              colorStops: [
                                { offset: 0, color: '#059669' },
                                { offset: 1, color: '#047857' }
                              ]
                            }
                          }
                        }
                      }
                    ],
                    animation: true,
                    animationDuration: 1000,
                    animationEasing: 'cubicOut'
                  }}
                  style={{ height: '240px', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
                </Suspense>
              </div>
            </CardContent>
          </Card>


          {/* Card วิธีการชำระเงิน - ADDED BACK */}
          <Card className="shadow-lg border-0 transition-transform hover:scale-[1.02] hover:shadow-xl bg-white">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">วิธีการชำระเงิน</CardTitle>
            </CardHeader>
            <CardContent className="py-6 flex items-center justify-center h-72">
              <Suspense fallback={<div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse"></div>}>
                <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: function(params: any) {
                      return `
                        <div style="padding: 8px;">
                          <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params.name}</div>
                          <div style="color: #6B7280; font-size: 12px;">จำนวน: ${params.value}</div>
                          <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${params.percent.toFixed(1)}%</div>
                        </div>
                      `;
                    }
                  },
                  series: [
                    {
                      name: 'วิธีการชำระเงิน',
                      type: 'pie',
                      radius: ['45%', '75%'], // Changed to doughnut chart
                      center: ['50%', '50%'],
                      data: dashboardData.paymentMethodData.map((item, index) => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: {
                          color: ["#10B981", "#3B82F6"][index]
                        }
                      })),
                      label: {
                        show: true,
                        formatter: function(params: any) {
                          return `${params.name}\n${params.value} | ${params.percent.toFixed(1)}%`;
                        },
                        fontSize: 12,
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
                }}
                style={{ height: '240px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
              </Suspense>
            </CardContent>
          </Card>

          {/* Card Source (แหล่งที่มา) - MOVED TO REPLACE เมตริกเพิ่มเติม */}
          <Card className="shadow-lg border-0 transition-transform hover:scale-[1.02] hover:shadow-xl bg-white">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Source (แหล่งที่มา)</CardTitle>
            </CardHeader>
            <CardContent className="py-6 flex items-center justify-center h-72">
              <Suspense fallback={<div className="h-64 w-full bg-gray-200 rounded-lg animate-pulse"></div>}>
                <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: function(params: any) {
                      return `
                        <div style="padding: 8px;">
                          <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params.name}</div>
                          <div style="color: #6B7280; font-size: 12px;">จำนวน: ${params.value}</div>
                          <div style="color: #3B82F6; font-size: 12px;">สัดส่วน: ${params.percent.toFixed(1)}%</div>
                        </div>
                      `;
                    }
                  },
                  series: [
                    {
                      name: 'แหล่งที่มา',
                      type: 'pie',
                      radius: ['45%', '75%'], // Changed to doughnut chart
                      center: ['50%', '50%'],
                      data: dashboardData.sourceData.map(item => ({
                        name: item.name,
                        value: item.value,
                        itemStyle: {
                          color: item.color
                        }
                      })),
                      label: {
                        show: true,
                        formatter: function(params: any) {
                          return `${params.name}\n${params.value} | ${params.percent.toFixed(1)}%`;
                        },
                        fontSize: 12,
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
                }}
                style={{ height: '240px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal for showing metric leads */}
      <MetricLeadsDialog
        isOpen={metricModalState.isOpen}
        onClose={() => setMetricModalState(prev => ({ ...prev, isOpen: false }))}
        title={metricModalState.title}
        leads={metricModalState.leads}
        metricType={metricModalState.metricType}
      />
    </div>
  );
};

export default PackageDashboard;
