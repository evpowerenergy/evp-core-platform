import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { Users, TrendingUp, Calendar, Filter, DollarSign, FileText, Eye, Download, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";
import { getSalesDataInPeriod, getQuotationDataFromView } from "@/utils/salesUtils";
import { getCategoryBadgeClassName } from "@/utils/categoryBadgeUtils";
import { TeamFilterSelect } from "@/components/filters/TeamFilterSelect";
import { PLATFORM_OPTIONS } from "@/utils/dashboardUtils";
import * as XLSX from 'xlsx';

interface SalesClosedData {
  salesCount: number;
  totalSalesValue: number;
  salesLeads: any[];
  salesLogsWithQuotations: any[];
  categorySummary: Array<{
    category: string;
    salesCount: number;
    totalSalesValue: number;
    totalQuotations: number;
    winRate: number;
  }>;
  totalQuotations: number;
  overallWinRate: number;
}

const SalesClosed = () => {
  // Get all sales team data
  const { data: salesTeamData, isLoading: salesTeamLoading } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};
  
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(), 
    to: new Date() 
  });
  const [dashboardData, setDashboardData] = useState<SalesClosedData>({
    salesCount: 0,
    totalSalesValue: 0,
    salesLeads: [],
    salesLogsWithQuotations: [],
    categorySummary: [],
    totalQuotations: 0,
    overallWinRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRangeFilter, salesFilter, platformFilter, categoryFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use proper timezone handling for date range
      let startDate: string, endDate: string;
      
      if (dateRangeFilter?.from && dateRangeFilter?.to) {
        const fromDate = new Date(dateRangeFilter.from);
        const toDate = new Date(dateRangeFilter.to);
        
        // Format dates for Thai timezone
        const formatter = new Intl.DateTimeFormat('en-CA', {
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

      const salesFilterParam = salesFilter !== 'all' ? salesFilter : undefined;
      const platformFilterParam = platformFilter !== 'all' ? platformFilter : undefined;
      const categoryFilterParam = categoryFilter !== 'all' ? categoryFilter : undefined;
      
      // ดึงข้อมูลยอดขายที่ปิดการขายสำเร็จ (เหมือนหน้า customer-status)
      const salesData = await getSalesDataInPeriod(
        startDate || new Date().toISOString(), 
        endDate || new Date().toISOString(), 
        salesFilterParam,
        platformFilterParam,
        categoryFilterParam
      );

      // ตรวจสอบข้อมูลก่อนใช้งาน
      if (!salesData || !salesData.salesLeads) {
        console.error('Sales data is undefined or missing salesLeads');
        setDashboardData({
          salesCount: 0,
          totalSalesValue: 0,
          salesLeads: [],
          salesLogsWithQuotations: [],
          categorySummary: [],
          totalQuotations: 0,
          overallWinRate: 0
        });
        return;
      }

      // salesCount ตอนนี้มาจาก getSalesDataInPeriod() แล้วนับจาก QT ทั้งหมด (หลัง deduplication)
      const salesCount = salesData.salesCount;
      // ✅ ใช้ totalSalesValue ที่คำนวณแล้วจาก salesUtils (หลัง deduplication)
      const totalSalesValue = salesData.totalSalesValue;

      // ดึงข้อมูล QT ทั้งหมด (ไม่ซ้ำ) สำหรับคำนวณ Win Rate
      // ใช้วิธีเดียวกับ getSalesDataInPeriod เพื่อให้ช่วงเวลาและ logic ตรงกัน
      let allQuotationLogsQuery = supabase
        .from('lead_productivity_logs')
        .select(`
          id, 
          lead_id, 
          created_at_thai,
          leads!inner(
            id,
            category,
            platform
          )
        `);

      // Filter ตามช่วงเวลา (ใช้ created_at_thai ของ log เหมือน getSalesDataInPeriod)
      if (startDate && endDate) {
        allQuotationLogsQuery = allQuotationLogsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      // Apply sales filter
      if (salesFilterParam) {
        allQuotationLogsQuery = allQuotationLogsQuery.eq('sale_id', parseInt(salesFilterParam));
      }

      // Apply platform filter
      if (platformFilterParam) {
        allQuotationLogsQuery = allQuotationLogsQuery.eq('leads.platform', platformFilterParam);
      }

      // Apply category filter
      if (categoryFilterParam) {
        allQuotationLogsQuery = allQuotationLogsQuery.eq('leads.category', categoryFilterParam);
      }

      const { data: allQuotationLogs, error: allQuotationLogsError } = await allQuotationLogsQuery;

      if (allQuotationLogsError) {
        console.error('Error fetching all quotation logs:', allQuotationLogsError);
        throw allQuotationLogsError;
      }

      // ดึง quotation_documents จาก logs เหล่านั้น
      const allLogIds = allQuotationLogs?.map(log => log.id) || [];
      let allQuotations: any[] = [];
      
      if (allLogIds.length > 0) {
        // ✅ แบ่ง logIds เป็น chunks เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
        // ✅ ลด CHUNK_SIZE จาก 500 เป็น 200 เพื่อหลีกเลี่ยง URL ยาวเกินไป
        const CHUNK_SIZE = 200;
        const logChunks: number[][] = [];
        for (let i = 0; i < allLogIds.length; i += CHUNK_SIZE) {
          logChunks.push(allLogIds.slice(i, i + CHUNK_SIZE));
        }

        // ✅ Query quotation documents แบบ sequential เพื่อหลีกเลี่ยงปัญหา URL ยาวเกินไป
        for (const chunk of logChunks) {
          try {
            const { data, error } = await supabase
              .from('quotation_documents')
              .select(`
                amount, 
                productivity_log_id, 
                document_number,
                created_at_thai
              `)
              .in('productivity_log_id', chunk)
              .eq('document_type', 'quotation');

            if (error) {
              console.error(`Error fetching quotations for chunk:`, error);
              // Continue with next chunk instead of failing completely
            } else if (data) {
              allQuotations = [...allQuotations, ...data];
            }
          } catch (error) {
            console.error(`Error processing quotations chunk:`, error);
            // Continue with next chunk
          }
        }
      }

      // นับ QT ทั้งหมด (ไม่ซ้ำ) โดยใช้ document_number
      const uniqueAllQuotations = new Set(
        allQuotations.map(q => q.document_number?.toLowerCase().replace(/\s+/g, '') || '').filter(Boolean)
      );
      const totalQuotations = uniqueAllQuotations.size;

      // คำนวณจำนวน QT ตาม category
      const categoryQuotationMap = new Map<string, Set<string>>();

      allQuotationLogs?.forEach(log => {
        const category = log.leads?.category || 'ไม่ระบุ';
        const logQuotations = allQuotations.filter(q => q.productivity_log_id === log.id);
        
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
      
      // ดึงข้อมูล avg_electricity_bill และ ad_campaign_id จาก leads table พร้อม join กับ ads_campaigns
      const leadIds = salesData.salesLeads.map(lead => lead.leadId);
      let leadsData: any[] = [];
      
      if (leadIds.length > 0) {
        const { data: leadsResult, error: leadsError } = await supabase
          .from('leads')
          .select(`
            id, 
            avg_electricity_bill,
            ad_campaign_id,
            ads_campaigns (
              id,
              name,
              campaign_name,
              image_url
            )
          `)
          .in('id', leadIds);

        if (leadsError) {
          console.error('Error fetching leads data:', leadsError);
        } else {
          leadsData = leadsResult || [];
        }
      }

      // สร้าง map สำหรับ avg_electricity_bill, ad_campaign_name และ image_url
      const leadsMap = new Map();
      leadsData.forEach(lead => {
        const adCampaignName = lead.ads_campaigns?.name || lead.ads_campaigns?.campaign_name || null;
        const adCampaignImageUrl = lead.ads_campaigns?.image_url || null;
        leadsMap.set(lead.id, {
          avg_electricity_bill: lead.avg_electricity_bill || 0,
          ad_campaign_name: adCampaignName,
          ad_campaign_image_url: adCampaignImageUrl
        });
      });

      // Map sales leads with proper data structure
      // ✅ ตอนนี้ salesLeads แยกตาม log แล้ว (ไม่ group by leadId)
      // แต่ละแถว = 1 log = 1 QT (หรือหลาย QT ใน log เดียวกัน)
      // ดังนั้นแต่ละแถวจะมี sale_id ของตัวเอง (คนที่ปิดการขาย QT นั้นๆ)
      const salesLeads = (salesData.salesLeads || []).map(lead => {
        const leadData = leadsMap.get(lead.leadId) || { avg_electricity_bill: 0, ad_campaign_name: null, ad_campaign_image_url: null };
        return {
          id: lead.logId || lead.leadId, // ✅ ใช้ logId เป็น key ถ้ามี (เพื่อให้แถวแยกกัน)
          leadId: lead.leadId, // เก็บ leadId ไว้ด้วย
          logId: lead.logId, // เก็บ logId ไว้
          display_name: lead.displayName || lead.customerName,
          full_name: lead.fullName || lead.customerName,
          category: lead.category,
          platform: lead.platform || 'ไม่ระบุ',
          tel: lead.tel || 'ไม่ระบุ',
          line_id: lead.lineId || 'ไม่ระบุ',
          sale_owner_id: lead.saleOwnerId || 0, // เก็บไว้สำหรับ backward compatibility
          sale_id: lead.saleId || lead.saleOwnerId || 0, // ✅ ใช้ sale_id จาก log นี้ (คนที่ปิดการขาย QT นี้)
          status: lead.leadStatus,
          created_at_thai: lead.lastActivityDate,
          totalQuotationAmount: lead.totalQuotationAmount,
          totalQuotationCount: lead.totalQuotationCount,
          quotationNumbers: lead.quotationNumbers,
          quotationDocuments: lead.quotationDocuments || [],
          avg_electricity_bill: leadData.avg_electricity_bill,
          ad_campaign_name: leadData.ad_campaign_name,
          ad_campaign_image_url: leadData.ad_campaign_image_url,
          logs: (salesData.salesLogsWithQuotations || []).filter(log => log.logId === lead.logId)
        };
      });

      // ดึงข้อมูล sale_chance_status และ presentation data จาก productivity logs ล่าสุดสำหรับแต่ละ lead
      // ✅ ใช้ leadId แทน id เพราะตอนนี้ id = logId
      const uniqueLeadIds = [...new Set(salesLeads.map(lead => lead.leadId))];
      let saleChanceData: any[] = [];
      
      if (uniqueLeadIds.length > 0) {
        const { data: logsResult, error: logsError } = await supabase
          .from('lead_productivity_logs')
          .select(`
            lead_id,
            sale_chance_status,
            sale_chance_percent,
            lead_group,
            presentation_type,
            note,
            next_follow_up,
            next_follow_up_details,
            created_at_thai
          `)
          .in('lead_id', uniqueLeadIds)
          .not('sale_chance_status', 'is', null)
          .order('created_at_thai', { ascending: false });

        if (logsError) {
          console.error('Error fetching sale chance data:', logsError);
        } else {
          saleChanceData = logsResult || [];
        }
      }

      // รวมข้อมูล sale_chance_status และ presentation data เข้ากับ sales leads
      const leadSaleChanceMap = new Map();
      saleChanceData.forEach(log => {
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
              created_at_thai: log.created_at_thai
            }
          });
        }
      });

      // เพิ่มข้อมูล sale_chance_status และ presentation data ให้กับแต่ละ lead
      // ✅ ใช้ leadId แทน id เพราะตอนนี้ id = logId
      const enrichedSalesLeads = salesLeads.map(lead => {
        const saleChanceInfo = leadSaleChanceMap.get(lead.leadId);
        return {
          ...lead,
          sale_chance_status: saleChanceInfo?.sale_chance_status || 'ไม่ระบุ',
          sale_chance_percent: saleChanceInfo?.sale_chance_percent || 0,
          lead_group: saleChanceInfo?.lead_group || 'ไม่ระบุ',
          presentation_type: saleChanceInfo?.presentation_type || 'ไม่ระบุ',
          latest_log: saleChanceInfo?.latest_log || {
            id: lead.leadId,
            note: 'ไม่มีรายละเอียดการติดตาม',
            next_follow_up: null,
            next_follow_up_details: null,
            created_at_thai: lead.created_at_thai
          }
        };
      });

      const leadsQuery = supabase
        .from('leads')
        .select('id, category, sale_owner_id, post_sales_owner_id')
        .not('sale_owner_id', 'is', null);

      if (dateRangeFilter?.from && dateRangeFilter?.to) {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

        const fromDate = formatter.format(dateRangeFilter.from) + 'T00:00:00.000';
        const toDate = formatter.format(dateRangeFilter.to) + 'T23:59:59.999';

        leadsQuery.gte('created_at_thai', fromDate).lte('created_at_thai', toDate);
      }

      if (salesFilter !== 'all') {
        leadsQuery.or(
          `sale_owner_id.eq.${salesFilter},post_sales_owner_id.eq.${salesFilter}`
        );
      }

      const { data: leadsCreated } = await leadsQuery;

      const categorySummaryMap = new Map<
        string,
        { salesCount: number; totalSalesValue: number; totalQuotations: number }
      >();

      // นับ QT ทั้งหมดตาม category
      categoryQuotationMap.forEach((quotationSet, category) => {
        const summary = categorySummaryMap.get(category) || {
          salesCount: 0,
          totalSalesValue: 0,
          totalQuotations: 0
        };
        summary.totalQuotations = quotationSet.size;
        categorySummaryMap.set(category, summary);
      });

      // นับ QT ที่ปิดการขายตาม category
      (enrichedSalesLeads || []).forEach(lead => {
        const category = lead.category || 'ไม่ระบุ';
        const summary = categorySummaryMap.get(category) || {
          salesCount: 0,
          totalSalesValue: 0,
          totalQuotations: 0
        };
        summary.salesCount += lead.totalQuotationCount || 0;
        summary.totalSalesValue += lead.totalQuotationAmount || 0;
        categorySummaryMap.set(category, summary);
      });

      const categorySummary = Array.from(categorySummaryMap.entries())
        .map(([category, summary]) => ({
          category,
          salesCount: summary.salesCount,
          totalSalesValue: summary.totalSalesValue,
          totalQuotations: summary.totalQuotations,
          winRate:
            summary.totalQuotations > 0
              ? (summary.salesCount / summary.totalQuotations) * 100
              : 0
        }))
        .filter(item => item.category !== 'ไม่ระบุ');

      // คำนวณ Win Rate รวม: QT ที่ปิดการขาย / QT ทั้งหมด
      const overallWinRate = totalQuotations > 0 ? (salesCount / totalQuotations) * 100 : 0;
 
      setDashboardData({
        salesCount,
        totalSalesValue,
        salesLeads: enrichedSalesLeads || [],
        salesLogsWithQuotations: (enrichedSalesLeads || []).map(
          lead => lead.latest_log
        ),
        categorySummary,
        totalQuotations,
        overallWinRate
      });

    } catch (error) {
      console.error('Error fetching sales closed data:', error);
      // Set empty data on error
        setDashboardData({
          salesCount: 0,
          totalSalesValue: 0,
          salesLeads: [],
          salesLogsWithQuotations: [],
          categorySummary: [],
          totalQuotations: 0,
          overallWinRate: 0
        });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'ไม่ระบุ';
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: string } } = {
      'มากกว่า 50%': { label: 'มากกว่า 50%', variant: 'default' },
      '50:50': { label: '50:50', variant: 'secondary' },
      'น้อยกว่า 50%': { label: 'น้อยกว่า 50%', variant: 'outline' },
      'win': { label: 'win', variant: 'default' },
      'win + สินเชื่อ': { label: 'win + สินเชื่อ', variant: 'default' },
      'มัดจำเงิน': { label: 'มัดจำเงิน', variant: 'secondary' },
      'CXL': { label: 'CXL', variant: 'destructive' },
      'ไม่ระบุ': { label: 'ไม่ระบุ', variant: 'outline' }
    };
    
    return statusMap[status] || { label: status, variant: 'outline' };
  };

  const getPresentationType = (lead: any) => {
    // ใช้ข้อมูลจาก lead_group และ presentation_type
    if (lead.lead_group && lead.presentation_type) {
      return `${lead.lead_group} - ${lead.presentation_type}`;
    } else if (lead.lead_group) {
      return lead.lead_group;
    } else if (lead.presentation_type) {
      return lead.presentation_type;
    }
    return 'ไม่ระบุ';
  };

  const getLatestFollowUpLog = (lead: any) => {
    if (!lead.latest_log) return 'ไม่มีข้อมูล';
    
    const log = lead.latest_log;
    const dateStr = log.created_at_thai;
    let formattedDate = '';
    
    if (dateStr) {
      // แปลงจาก 2025-09-17T11:34:08.370852+00:00 เป็น 17/09/2025 , 11:34
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (match) {
        const [, year, month, day, hours, minutes] = match;
        formattedDate = `${day}/${month}/${year} , ${hours}:${minutes}`;
      } else {
        formattedDate = dateStr;
      }
    } else {
      formattedDate = 'ไม่ระบุวันที่';
    }
    
    return {
      date: formattedDate,
      note: log.note || 'ไม่มีรายละเอียด',
      nextFollowUp: log.next_follow_up,
      nextFollowUpDetails: log.next_follow_up_details
    };
  };

  const exportToExcel = () => {
    if (!dashboardData.salesLeads || dashboardData.salesLeads.length === 0) {
      alert('ไม่มีข้อมูลให้ export');
      return;
    }

    // เตรียมข้อมูลสำหรับ Excel
    // ✅ ใช้ sale_id จาก log (คนที่ปิดการขายจริงๆ) แทน sale_owner_id จาก lead
    const excelData = dashboardData.salesLeads.map((lead, index) => {
      const saleId = lead.sale_id || lead.sale_owner_id || 0; // ✅ ใช้ sale_id ก่อน แล้วค่อยใช้ sale_owner_id เป็น fallback
      const salesMember = salesTeam.find(member => member.id === saleId);
      const salesMemberName = salesMember?.name || 'ไม่ระบุ';
      
      // รวบรวมข้อมูล QT
      const qtInfo = lead.quotationDocuments && lead.quotationDocuments.length > 0 
        ? lead.quotationDocuments.map(doc => `${doc.document_number} (฿${parseFloat(doc.amount || 0).toLocaleString()})`).join(', ')
        : 'ไม่มี QT';
      
      const qtAmount = lead.totalQuotationAmount || 0;
      const qtCount = lead.totalQuotationCount || 0;
      
      // รวบรวมข้อมูลการติดตาม
      const followUpData = getLatestFollowUpLog(lead);
      const followUpInfo = typeof followUpData === 'string' 
        ? followUpData 
        : `${followUpData.date}: ${followUpData.note}`;

      return {
        'ลำดับ': index + 1,
        'วันที่': new Date(lead.created_at_thai).toLocaleDateString('th-TH'),
        'รายชื่อเซลล์': salesMemberName,
        'Platform': lead.platform,
        'แหล่งที่มาจากแอด': lead.ad_campaign_name || '-',
        'ชื่อลูกค้า': lead.display_name,
        'ชื่อเต็ม': lead.full_name,
        'QT / ยอด QT': qtInfo,
        'จำนวน QT': qtCount,
        'ยอด QT รวม': qtAmount,
        'ค่าไฟ': lead.avg_electricity_bill || 0,
        'กลุ่มลูกค้า': lead.category,
        'การนำเสนอ': getPresentationType(lead),
        'โอกาสการขาย': lead.sale_chance_status || 'ไม่ระบุ',
        'รายละเอียดติดตาม': followUpInfo,
        'เบอร์โทร': lead.tel,
        'Line ID': lead.line_id
      };
    });

    // สร้าง workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // กำหนดความกว้างของคอลัมน์
    const colWidths = [
      { wch: 8 },   // ลำดับ
      { wch: 12 },  // วันที่
      { wch: 15 },  // รายชื่อเซลล์
      { wch: 12 },  // Platform
      { wch: 25 },  // แหล่งที่มาจากแอด
      { wch: 20 },  // ชื่อลูกค้า
      { wch: 25 },  // ชื่อเต็ม
      { wch: 30 },  // QT / ยอด QT
      { wch: 12 },  // จำนวน QT
      { wch: 15 },  // ยอด QT รวม
      { wch: 12 },  // ค่าไฟ
      { wch: 15 },  // กลุ่มลูกค้า
      { wch: 20 },  // การนำเสนอ
      { wch: 15 },  // โอกาสการขาย
      { wch: 40 },  // รายละเอียดติดตาม
      { wch: 15 },  // เบอร์โทร
      { wch: 15 }   // Line ID
    ];
    ws['!cols'] = colWidths;

    // เพิ่ม worksheet
    XLSX.utils.book_append_sheet(wb, ws, 'รายการปิดการขาย');

    // สร้างชื่อไฟล์
    const currentDate = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
    const fileName = `รายการปิดการขาย_${currentDate}.xlsx`;

    // Export ไฟล์
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายการปิดการขาย</h1>
            <p className="text-gray-600 mt-1">ติดตามรายการที่ปิดการขายสำเร็จ</p>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Filter className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">ตัวกรองข้อมูล</h3>
                <p className="text-xs text-gray-600">เลือกเงื่อนไขเพื่อดูข้อมูลที่ต้องการ</p>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>ช่วงวันที่</span>
              </label>
              <DateRangePicker
                value={dateRangeFilter}
                onChange={setDateRangeFilter}
                placeholder="เลือกช่วงวันที่"
              />
            </div>

            {/* Sales Team Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Users className="h-3.5 w-3.5 text-green-500" />
                <span>เซลทีม</span>
              </label>
              <TeamFilterSelect
                value={salesFilter}
                onValueChange={setSalesFilter}
                salesTeam={salesTeam}
                placeholder="เลือกเซลทีม"
                triggerClassName="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Platform Filter */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Megaphone className="h-3.5 w-3.5 text-blue-500" />
                <span>Platforms</span>
              </label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="เลือก Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุก Platform</SelectItem>
                  {PLATFORM_OPTIONS.map(platform => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter (กลุ่มลูกค้า) */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FileText className="h-3.5 w-3.5 text-purple-500" />
                <span>กลุ่มลูกค้า</span>
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="เลือกกลุ่มลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกกลุ่มลูกค้า</SelectItem>
                  <SelectItem value="Package">Package</SelectItem>
                  <SelectItem value="Wholesales">Wholesales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Sales */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-semibold text-green-700">รายการปิดการขาย</p>
                  <p className="text-sm text-green-600">
                    จำนวน QT ที่ปิด{dashboardData.totalQuotations > 0 ? ' / QT ทั้งหมด' : ''}
                  </p>
                </div>
              </div>
              <div className="text-4xl font-bold text-green-600 ml-auto">
                {dashboardData.salesCount.toLocaleString()}
                {dashboardData.totalQuotations > 0 && (
                  <span className="text-2xl text-green-500 font-normal">/{dashboardData.totalQuotations.toLocaleString()}</span>
                )}
              </div>
            </div>
            {dashboardData.categorySummary.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="bg-green-100/70 rounded-lg p-3">
                  <div className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-1">
                    Win Rate (QT) รวม
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {dashboardData.overallWinRate.toLocaleString(undefined, {
                      maximumFractionDigits: 1
                    })}
                    %
                  </div>
                </div>
                <div className="space-y-2">
                  {dashboardData.categorySummary.map((item) => (
                    <div
                      key={item.category}
                      className="bg-white/70 border border-green-100 rounded-lg p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-700">
                          {item.category}
                        </span>
                        <span className="text-base font-bold text-green-800">
                          {item.salesCount.toLocaleString()}
                          {item.totalQuotations > 0 && (
                            <span className="text-sm text-green-600 font-normal">/{item.totalQuotations.toLocaleString()}</span>
                          )} QT
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-green-600">
                        Win Rate (QT): {item.winRate.toLocaleString(undefined, {
                          maximumFractionDigits: 1
                        })}
                        %
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-semibold text-blue-700">มูลค่าปิดการขาย</p>
                  <p className="text-sm text-blue-600">ยอดขายรวมทั้งหมด</p>
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-600 ml-auto">
                ฿{dashboardData.totalSalesValue.toLocaleString('th-TH')}
              </div>
            </div>
            {dashboardData.categorySummary.length > 0 && (
              <div className="mt-4 space-y-2">
                {dashboardData.categorySummary.map((item) => (
                  <div
                    key={item.category}
                    className="bg-white/70 border border-blue-100 rounded-lg p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-700">
                        {item.category}
                      </span>
                      <span className="text-base font-bold text-blue-800">
                        ฿{item.totalSalesValue.toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-blue-600">
                      จำนวน QT: {item.salesCount.toLocaleString()} | Win Rate: {item.winRate.toLocaleString(undefined, {
                        maximumFractionDigits: 1
                      })}
                      %
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Closed Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-gray-800">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <span className="text-xl font-bold">รายการปิดการขาย</span>
                <p className="text-sm font-normal text-gray-600 mt-1">
                  ข้อมูลรายการที่ปิดการขายสำเร็จ ({dashboardData.salesLeads.length} ลูกค้า, {dashboardData.salesCount} QT)
                </p>
              </div>
            </CardTitle>
            <Button 
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!dashboardData.salesLeads || dashboardData.salesLeads.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-center">วันที่</TableHead>
                  <TableHead className="font-semibold text-center">รายชื่อเซลล์</TableHead>
                  <TableHead className="font-semibold text-center">Platforms</TableHead>
                  <TableHead className="font-semibold text-center">แหล่งที่มาจากแอด</TableHead>
                  <TableHead className="font-semibold text-center">ชื่อลูกค้า</TableHead>
                  <TableHead className="font-semibold text-center">กลุ่มลูกค้า</TableHead>
                  <TableHead className="font-semibold text-center">QT / ยอด QT</TableHead>
                  <TableHead className="font-semibold text-center">ค่าไฟ</TableHead>
                  <TableHead className="font-semibold text-center">การนำเสนอ</TableHead>
                  <TableHead className="font-semibold text-center">โอกาสการขาย</TableHead>
                  <TableHead className="font-semibold text-center">รายละเอียดติดตาม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.salesLeads.map((lead) => {
                  // ✅ ใช้ sale_id จาก log (คนที่ปิดการขายจริงๆ) แทน sale_owner_id จาก lead
                  const saleId = lead.sale_id || lead.sale_owner_id || 0; // ✅ ใช้ sale_id ก่อน แล้วค่อยใช้ sale_owner_id เป็น fallback
                  const salesMember = salesTeam.find(member => member.id === saleId);
                  const salesMemberName = salesMember?.name || 'ไม่ระบุ';
                  const statusInfo = getStatusInfo(lead.sale_chance_status);

                  return (
                    <TableRow key={lead.id} className="hover:bg-gray-50">
                      <TableCell className="text-center text-sm">
                        {formatDate(lead.created_at_thai)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>{salesMemberName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className="text-xs">
                          {lead.platform || 'ไม่ระบุ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {lead.ad_campaign_name ? (
                          <div className="flex items-center justify-center gap-3">
                            {lead.ad_campaign_image_url ? (
                              <img
                                src={lead.ad_campaign_image_url}
                                alt={lead.ad_campaign_name}
                                className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 shadow-md flex-shrink-0"
                                onError={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const img = e.target as HTMLImageElement;
                                  if (img.src.includes('fbcdn.net') || img.src.includes('facebook.com')) {
                                    // Silent error - ไม่ log เพราะเป็นเรื่องปกติที่ Facebook CDN URLs หมดอายุ
                                  }
                                  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo img%3C/text%3E%3C/svg%3E";
                                  img.onerror = null;
                                }}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200 flex-shrink-0 shadow-md">
                                <Megaphone className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {lead.ad_campaign_name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div>
                          <div className="font-medium">{lead.display_name}</div>
                          <div className="text-xs text-gray-500">{lead.full_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className={getCategoryBadgeClassName(lead.category)}>
                          {lead.category || 'ไม่ระบุ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="space-y-1">
                          {lead.quotationDocuments && lead.quotationDocuments.length > 0 ? (
                            lead.quotationDocuments.map((doc: any, index: number) => (
                              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-1 last:pb-0">
                                <div className="text-xs text-blue-600 font-medium">
                                  {doc.document_number}
                                </div>
                                <div className="text-sm font-semibold text-green-600">
                                  ฿{parseFloat(doc.amount || 0).toLocaleString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-400 italic">ไม่มี QT</div>
                          )}
                          {lead.quotationDocuments && lead.quotationDocuments.length > 1 && (
                            <div className="text-xs text-gray-500 font-medium border-t border-gray-200 pt-1 mt-1">
                              รวม: ฿{lead.totalQuotationAmount?.toLocaleString() || '0'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="font-semibold text-green-600">
                          ฿{lead.avg_electricity_bill?.toLocaleString() || '0'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="secondary" className="text-xs">
                          {getPresentationType(lead)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge 
                          variant={statusInfo.variant as any}
                          className="text-xs"
                        >
                          {lead.sale_chance_status || 'ไม่ระบุ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="max-w-xs">
                          {(() => {
                            const followUpData = getLatestFollowUpLog(lead);
                            if (typeof followUpData === 'string') {
                              return <div className="text-xs text-gray-400 italic">{followUpData}</div>;
                            }
                            return (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500">
                                  {followUpData.date}
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                  {followUpData.note.length > 80 
                                    ? `${followUpData.note.substring(0, 80)}...` 
                                    : followUpData.note
                                  }
                                </div>
                                {followUpData.nextFollowUp && (
                                  <div className="text-xs text-blue-600">
                                    นัดถัดไป: {new Date(followUpData.nextFollowUp).toLocaleDateString('th-TH')}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesClosed;

