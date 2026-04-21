import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";
import { Calendar, TrendingUp, DollarSign, Users, BarChart3, Loader2, Download, RefreshCw, Eye, EyeOff, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/useToast";
import * as XLSX from 'xlsx';

interface CampaignPerformance {
  campaignId: number;
  campaignName: string;
  adName: string;
  imageUrl: string | null;
  facebookAdId: string | null;
  facebookCampaignId: string | null;
  description: string | null;
  campaignStartTime: string | null;
  campaignStopTime: string | null;
  platform: string | null;
  status: string | null;
  campaignStatus: string | null;
  facebookCreatedTime: string | null;
  totalSales: number;
  totalLeadsCount: number;
  closedLeadsCount: number;
  totalQuotations: number;
  packageSales: number;
  wholesalesSales: number;
  packageLeads: number;
  wholesalesLeads: number;
}

interface PerformanceSummary {
  totalSales: number;
  totalClosedLeads: number;
  totalQuotations: number;
  totalCampaigns: number;
  packageSales: number;
  wholesalesSales: number;
  packageLeads: number;
  wholesalesLeads: number;
}

const AdsPerformanceReport = () => {
  // Default date range: เดือนนี้ (This Month)
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: startOfMonth, to: now };
  });

  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary>({
    totalSales: 0,
    totalClosedLeads: 0,
    totalQuotations: 0,
    totalCampaigns: 0,
    packageSales: 0,
    wholesalesSales: 0,
    packageLeads: 0,
    wholesalesLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'name' | 'campaign' | 'sales' | 'leads' | 'totalLeads'>('sales');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { toast } = useToast();

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRangeFilter]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Format dates for Thai timezone
      let startDate: string, endDate: string;
      
      if (dateRangeFilter?.from && dateRangeFilter?.to) {
        const fromDate = new Date(dateRangeFilter.from);
        const toDate = new Date(dateRangeFilter.to);
        
        const formatter = new Intl.DateTimeFormat('en-CA', {
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
        // No date range - show all data
        startDate = '';
        endDate = '';
      }

      // Step 1: ดึงลีดทั้งหมดในช่วงเวลาที่เลือก (เพื่อหาแคมเปญที่มีลีด)
      let allLeadsQuery = supabase
        .from('leads')
        .select('id, ad_campaign_id, category, created_at_thai')
        .not('ad_campaign_id', 'is', null);

      // กรองตามช่วงเวลาที่เลือก (ใช้ created_at_thai ของลีด)
      if (startDate && endDate) {
        allLeadsQuery = allLeadsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: allLeads, error: allLeadsError } = await allLeadsQuery;

      if (allLeadsError) {
        console.error('Error fetching leads:', allLeadsError);
        throw allLeadsError;
      }

      if (!allLeads || allLeads.length === 0) {
        setCampaignPerformance([]);
        setSummary({
          totalSales: 0,
          totalClosedLeads: 0,
          totalQuotations: 0,
          totalCampaigns: 0,
          packageSales: 0,
          wholesalesSales: 0,
          packageLeads: 0,
          wholesalesLeads: 0
        });
        setLoading(false);
        return;
      }

      // Step 2: หา campaign_ids ที่มีลีดในช่วงเวลานั้น
      const campaignIdsSet = new Set<number>();
      allLeads.forEach(lead => {
        if (lead.ad_campaign_id) {
          campaignIdsSet.add(lead.ad_campaign_id);
        }
      });
      const campaignIds = Array.from(campaignIdsSet);

      // Step 3: ดึงข้อมูลแคมเปญทั้งหมดที่มีลีดในช่วงเวลานั้น
      const { data: campaigns, error: campaignsError } = await supabase
        .from('ads_campaigns')
        .select('id, name, campaign_name, image_url, facebook_ad_id, facebook_campaign_id, description, campaign_start_time, campaign_stop_time, platform, status, campaign_status, facebook_created_time')
        .in('id', campaignIds);

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        throw campaignsError;
      }

      // Step 4: ดึง productivity logs ที่ปิดการขายแล้วในช่วงเวลาที่เลือก (สำหรับคำนวณยอดขาย)
      let salesLogsQuery = supabase
        .from('lead_productivity_logs')
        .select(`
          id,
          lead_id,
          created_at_thai,
          leads!inner(
            id,
            ad_campaign_id,
            category
          )
        `)
        .eq('status', 'ปิดการขายแล้ว')
        .or(`sale_chance_status.eq.win,and(sale_chance_status.eq.win + สินเชื่อ,credit_approval_status.eq.อนุมัติ)`);

      if (startDate && endDate) {
        salesLogsQuery = salesLogsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }

      const { data: salesLogs, error: salesLogsError } = await salesLogsQuery;

      if (salesLogsError) {
        console.error('Error fetching sales logs:', salesLogsError);
        throw salesLogsError;
      }

      // Step 5: ดึง quotation_documents จาก logs ที่ปิดการขาย (ถ้ามี)
      let quotations: any[] = [];
      if (salesLogs && salesLogs.length > 0) {
        const logIds = salesLogs.map(log => log.id);
        const { data: quotationsData, error: quotationsError } = await supabase
          .from('quotation_documents')
          .select('amount, productivity_log_id, document_number')
          .in('productivity_log_id', logIds)
          .eq('document_type', 'quotation');

        if (quotationsError) {
          console.error('Error fetching quotations:', quotationsError);
          throw quotationsError;
        }

        quotations = quotationsData || [];
      }

      // Step 6: สร้าง map จาก log_id ไปยัง lead_id และ category (สำหรับคำนวณยอดขาย)
      const logToLeadMap = new Map<number, { leadId: number; campaignId: number | null; category: string | null }>();
      if (salesLogs) {
        salesLogs.forEach(log => {
          if (log.leads) {
            logToLeadMap.set(log.id, {
              leadId: log.leads.id,
              campaignId: log.leads.ad_campaign_id,
              category: log.leads.category
            });
          }
        });
      }

      // Step 7: จัดกลุ่มยอดขายตาม ad_campaign_id (สำหรับแอดที่มีการปิดการขาย)
      const salesCampaignMap = new Map<number, {
        campaignId: number;
        leadIds: Set<number>;
        quotations: Array<{ amount: number; leadId: number; category: string | null }>;
      }>();

      quotations?.forEach(qt => {
        const leadInfo = logToLeadMap.get(qt.productivity_log_id);
        if (leadInfo && leadInfo.campaignId) {
          if (!salesCampaignMap.has(leadInfo.campaignId)) {
            salesCampaignMap.set(leadInfo.campaignId, {
              campaignId: leadInfo.campaignId,
              leadIds: new Set(),
              quotations: []
            });
          }
          const campaign = salesCampaignMap.get(leadInfo.campaignId)!;
          campaign.leadIds.add(leadInfo.leadId);
          campaign.quotations.push({
            amount: parseFloat(qt.amount?.toString() || '0'),
            leadId: leadInfo.leadId,
            category: leadInfo.category
          });
        }
      });

      // Step 8: นับจำนวนลีดทั้งหมดของแต่ละแคมเปญ (จากข้อมูลที่ดึงมาแล้ว)
      const totalLeadsMap = new Map<number, number>();
      allLeads.forEach(lead => {
        if (lead.ad_campaign_id) {
          const currentCount = totalLeadsMap.get(lead.ad_campaign_id) || 0;
          totalLeadsMap.set(lead.ad_campaign_id, currentCount + 1);
        }
      });
      
      // ตั้งค่า 0 สำหรับแคมเปญที่ไม่มีลีดในช่วงเวลาที่เลือก
      campaignIds.forEach(campaignId => {
        if (!totalLeadsMap.has(campaignId)) {
          totalLeadsMap.set(campaignId, 0);
        }
      });

      // Step 9: คำนวณ performance ของแต่ละแคมเปญ (แสดงแอดทั้งหมดที่มีลีด)
      const performance: CampaignPerformance[] = campaigns.map(campaign => {
        const salesData = salesCampaignMap.get(campaign.id);
        const totalLeadsCount = totalLeadsMap.get(campaign.id) || 0;
        
        // ถ้าแอดนี้ไม่มียอดขาย (ไม่มี sales data)
        if (!salesData) {
        return {
          campaignId: campaign.id,
          campaignName: campaign.campaign_name || 'ไม่ระบุ',
          adName: campaign.name,
          imageUrl: campaign.image_url,
          facebookAdId: campaign.facebook_ad_id,
          facebookCampaignId: campaign.facebook_campaign_id,
          description: campaign.description,
          campaignStartTime: campaign.campaign_start_time,
          campaignStopTime: campaign.campaign_stop_time,
          platform: campaign.platform,
          status: campaign.status,
          campaignStatus: campaign.campaign_status,
          facebookCreatedTime: campaign.facebook_created_time,
          totalSales: 0,
          totalLeadsCount,
          closedLeadsCount: 0,
          totalQuotations: 0,
          packageSales: 0,
          wholesalesSales: 0,
          packageLeads: 0,
          wholesalesLeads: 0
        };
        }

        // คำนวณยอดขายและจำนวนลีดแยกตาม category (สำหรับแอดที่มีการปิดการขาย)
        let packageSales = 0;
        let wholesalesSales = 0;
        const packageLeadIds = new Set<number>();
        const wholesalesLeadIds = new Set<number>();

        salesData.quotations.forEach(qt => {
          const category = qt.category?.toLowerCase() || '';
          if (category.includes('package')) {
            packageSales += qt.amount;
            packageLeadIds.add(qt.leadId);
          } else if (category.includes('wholesale')) {
            wholesalesSales += qt.amount;
            wholesalesLeadIds.add(qt.leadId);
          }
        });

        const totalSales = salesData.quotations.reduce((sum, qt) => sum + qt.amount, 0);

        return {
          campaignId: campaign.id,
          campaignName: campaign.campaign_name || 'ไม่ระบุ',
          adName: campaign.name,
          imageUrl: campaign.image_url,
          facebookAdId: campaign.facebook_ad_id,
          facebookCampaignId: campaign.facebook_campaign_id,
          description: campaign.description,
          campaignStartTime: campaign.campaign_start_time,
          campaignStopTime: campaign.campaign_stop_time,
          platform: campaign.platform,
          status: campaign.status,
          campaignStatus: campaign.campaign_status,
          facebookCreatedTime: campaign.facebook_created_time,
          totalSales,
          totalLeadsCount,
          closedLeadsCount: salesData.leadIds.size,
          totalQuotations: salesData.quotations.length,
          packageSales,
          wholesalesSales,
          packageLeads: packageLeadIds.size,
          wholesalesLeads: wholesalesLeadIds.size
        };
      });

      // Step 10: คำนวณ summary
      const totalSales = performance.reduce((sum, p) => sum + p.totalSales, 0);
      const totalClosedLeads = new Set(
        Array.from(salesCampaignMap.values()).flatMap(c => Array.from(c.leadIds))
      ).size;
      const totalQuotations = quotations?.length || 0;
      const packageSales = performance.reduce((sum, p) => sum + p.packageSales, 0);
      const wholesalesSales = performance.reduce((sum, p) => sum + p.wholesalesSales, 0);
      
      // คำนวณ packageLeads และ wholesalesLeads จากข้อมูลที่คำนวณแล้วในแต่ละแคมเปญ
      // แต่ต้องรวม leads ทั้งหมดที่ไม่ซ้ำกัน
      const packageLeadSet = new Set<number>();
      const wholesalesLeadSet = new Set<number>();
      
      // วนลูปผ่านทุก campaign และรวบรวม lead IDs ตาม category (จาก sales data)
      performance.forEach(p => {
        const salesData = salesCampaignMap.get(p.campaignId);
        if (salesData) {
          salesData.quotations.forEach(qt => {
            const category = qt.category?.toLowerCase() || '';
            if (category.includes('package')) {
              packageLeadSet.add(qt.leadId);
            } else if (category.includes('wholesale')) {
              wholesalesLeadSet.add(qt.leadId);
            }
          });
        }
      });

      setSummary({
        totalSales,
        totalClosedLeads,
        totalQuotations,
        totalCampaigns: performance.length,
        packageSales,
        wholesalesSales,
        packageLeads: packageLeadSet.size,
        wholesalesLeads: wholesalesLeadSet.size
      });

      setCampaignPerformance(performance);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setCampaignPerformance([]);
      setSummary({
        totalSales: 0,
        totalClosedLeads: 0,
        totalQuotations: 0,
        totalCampaigns: 0,
        packageSales: 0,
        wholesalesSales: 0,
        packageLeads: 0,
        wholesalesLeads: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Sort campaigns
  const sortedCampaigns = useMemo(() => {
    const sorted = [...campaignPerformance];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.adName.localeCompare(b.adName, 'th');
          break;
        case 'campaign':
          comparison = (a.campaignName || '').localeCompare(b.campaignName || '', 'th');
          break;
        case 'sales':
          comparison = a.totalSales - b.totalSales;
          break;
        case 'leads':
          comparison = a.closedLeadsCount - b.closedLeadsCount;
          break;
        case 'totalLeads':
          comparison = a.totalLeadsCount - b.totalLeadsCount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [campaignPerformance, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'campaign' | 'sales' | 'leads' | 'totalLeads') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: 'name' | 'campaign' | 'sales' | 'leads' | 'totalLeads') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 text-pink-600" />
      : <ArrowDown className="h-4 w-4 ml-1 text-pink-600" />;
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "archived":
        return "Archived";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: string | null) => {
    return status === "active" ? (
      <Eye className="h-3 w-3 mr-1" />
    ) : (
      <EyeOff className="h-3 w-3 mr-1" />
    );
  };

  // Pagination
  const totalPages = Math.ceil(sortedCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, sortedCampaigns.length);
  const paginatedCampaigns = sortedCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRangeFilter, sortField, sortDirection]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportToExcel = () => {
    const worksheetData = [
      ['รายงานผลลัพธ์แอดโฆษณา'],
      ['ช่วงเวลา:', dateRangeFilter?.from ? format(dateRangeFilter.from, 'dd/MM/yyyy', { locale: th }) : '', 
       'ถึง', dateRangeFilter?.to ? format(dateRangeFilter.to, 'dd/MM/yyyy', { locale: th }) : ''],
      [],
      ['ชื่อแอด', 'ชื่อแคมเปญ', 'ยอดขายรวม', 'จำนวนลีดที่ปิด', 'จำนวน QT', 'ยอดขาย Package', 'ยอดขาย Wholesale', 'ลีด Package', 'ลีด Wholesale']
    ];

    sortedCampaigns.forEach(campaign => {
      worksheetData.push([
        campaign.adName,
        campaign.campaignName,
        campaign.totalSales,
        campaign.closedLeadsCount,
        campaign.totalQuotations,
        campaign.packageSales,
        campaign.wholesalesSales,
        campaign.packageLeads,
        campaign.wholesalesLeads
      ]);
    });

    worksheetData.push([]);
    worksheetData.push(['สรุป', '', summary.totalSales, summary.totalClosedLeads, summary.totalQuotations, 
      summary.packageSales, summary.wholesalesSales, summary.packageLeads, summary.wholesalesLeads]);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานผลลัพธ์แอดโฆษณา');
    
    const fileName = `ads-performance-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายงานผลลัพธ์แอดโฆษณา</h1>
          <p className="text-gray-600 mt-2">
            ดูผลลัพธ์ยอดขายที่ปิดการขายแล้ว แยกตามแคมเปญโฆษณา
          </p>
          <p className="text-sm text-pink-600 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            💡 กรองตามวันที่ปิดการขาย (created_at_thai จาก lead_productivity_logs)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">ช่วงเวลาปิดการขาย:</span>
            <DateRangePicker
              value={dateRangeFilter}
              onChange={setDateRangeFilter}
              placeholder="เลือกช่วงเวลา"
              presets={true}
              className="w-auto"
            />
          </div>

          <Button
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              ยอดขายรวม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-pink-700">{formatCurrency(summary.totalSales)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.totalQuotations} QT
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              ลีดที่ปิดการขาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{summary.totalClosedLeads}</p>
            <p className="text-xs text-gray-500 mt-1">
              จาก {summary.totalCampaigns} แคมเปญ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ยอดขาย Package
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(summary.packageSales)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.packageLeads} ลีด
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              ยอดขาย Wholesale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-700">{formatCurrency(summary.wholesalesSales)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.wholesalesLeads} ลีด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-pink-50 to-rose-50">
                <TableHead className="w-20 font-semibold">รูปภาพ</TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    ชื่อแอด
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('campaign')}
                >
                  <div className="flex items-center">
                    Campaign
                    {getSortIcon('campaign')}
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Caption/ข้อความ</TableHead>
                <TableHead className="font-semibold">ช่วงเวลารัน Campaign</TableHead>
                <TableHead className="font-semibold">แพลตฟอร์ม</TableHead>
                <TableHead className="font-semibold">สถานะ</TableHead>
                <TableHead 
                  className="text-center font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('totalLeads')}
                >
                  <div className="flex items-center justify-center">
                    จำนวนลีดทั้งหมด
                    {getSortIcon('totalLeads')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-center font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('leads')}
                >
                  <div className="flex items-center justify-center">
                    ลีดที่ปิดการขาย
                    {getSortIcon('leads')}
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <span>ลีดที่ปิดการขาย</span>
                    <span className="text-xs font-normal text-gray-600">แยก Category</span>
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold">จำนวน QT</TableHead>
                <TableHead 
                  className="text-center font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('sales')}
                >
                  <div className="flex items-center justify-center">
                    ยอดขาย
                    {getSortIcon('sales')}
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <span>ยอดขาย</span>
                    <span className="text-xs font-normal text-gray-600">แยก Category</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">ไม่พบข้อมูลยอดขายในช่วงเวลาที่เลือก</p>
                        <p className="text-gray-500 text-sm mt-1">
                          ลองเปลี่ยนช่วงเวลาหรือตรวจสอบว่ามีการปิดการขายในช่วงเวลานี้หรือไม่
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCampaigns.map((campaign) => (
                  <TableRow
                    key={campaign.campaignId}
                    className="hover:bg-pink-50/50 transition-colors"
                  >
                    <TableCell>
                      {campaign.imageUrl ? (
                        <img
                          src={campaign.imageUrl}
                          alt={campaign.adName}
                          className="w-14 h-14 rounded-md object-cover border-2 border-gray-200 shadow-sm"
                          onError={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const img = e.target as HTMLImageElement;
                            if (img.src.includes('fbcdn.net') || img.src.includes('facebook.com')) {
                              // Silent error
                            }
                            img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo img%3C/text%3E%3C/svg%3E";
                            img.onerror = null;
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center border-2 border-gray-200">
                          <span className="text-xs text-gray-400 font-medium">No img</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="max-w-xs">
                        <p className="truncate">{campaign.adName}</p>
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {campaign.facebookAdId && (
                            <p className="truncate">
                              Ad ID: {campaign.facebookAdId}
                            </p>
                          )}
                          {campaign.facebookCampaignId && (
                            <p className="truncate">
                              Campaign ID: {campaign.facebookCampaignId}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs">
                      <div>
                        <p className="truncate font-medium">{campaign.campaignName || "-"}</p>
                        {campaign.campaignStatus && (
                          <p className="text-xs text-gray-500 mt-1">
                            Campaign: {campaign.campaignStatus === 'active' ? '🟢 Active' : campaign.campaignStatus === 'inactive' ? '🟡 Inactive' : '⚫ Archived'}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-md">
                      {campaign.description ? (
                        <div className="space-y-1">
                          <p className="line-clamp-2 text-gray-700">
                            {campaign.description}
                          </p>
                          {campaign.description.length > 80 && (
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                              onClick={() => {
                                navigator.clipboard.writeText(campaign.description || '');
                                toast({
                                  title: "✅ คัดลอกแล้ว",
                                  description: "คัดลอกข้อความไปยัง Clipboard แล้ว",
                                });
                              }}
                            >
                              📋 คัดลอกข้อความทั้งหมด
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs italic">ไม่มีข้อความ</span>
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            📷 Story/Image-only
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {campaign.campaignStartTime || campaign.campaignStopTime ? (
                        <div>
                          {campaign.campaignStartTime && (
                            <p className="font-medium text-green-700">
                              เริ่ม: {format(new Date(campaign.campaignStartTime), "dd MMM yy")}
                            </p>
                          )}
                          {campaign.campaignStopTime ? (
                            <p className="font-medium text-red-600">
                              สิ้นสุด: {format(new Date(campaign.campaignStopTime), "dd MMM yy")}
                            </p>
                          ) : (
                            <p className="text-xs text-blue-600 mt-1">
                              🔄 รันต่อเนื่อง
                            </p>
                          )}
                        </div>
                      ) : campaign.facebookCreatedTime ? (
                        <div>
                          <p className="font-medium text-gray-600">
                            สร้าง: {format(new Date(campaign.facebookCreatedTime), "dd MMM yy")}
                          </p>
                          <p className="text-xs text-gray-500">
                            (ไม่มีข้อมูลช่วงรัน)
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {campaign.platform || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(campaign.status)}
                        className="flex items-center w-fit"
                      >
                        {getStatusIcon(campaign.status)}
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {campaign.totalLeadsCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-semibold">
                        {campaign.closedLeadsCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs w-full justify-center">
                          P: {campaign.packageLeads}
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs w-full justify-center">
                          W: {campaign.wholesalesLeads}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {campaign.totalQuotations}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-lg font-bold text-green-700">
                        ฿{campaign.totalSales.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs w-full justify-center">
                          P: ฿{campaign.packageSales.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs w-full justify-center">
                          W: ฿{campaign.wholesalesSales.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {sortedCampaigns.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            แสดง {startIndex} ถึง {endIndex} จากทั้งหมด {sortedCampaigns.length} แคมเปญ
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              ก่อนหน้า
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 ${
                      currentPage === pageNum
                        ? "bg-pink-600 text-white hover:bg-pink-700"
                        : ""
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              ถัดไป
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            หน้า {currentPage} จาก {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsPerformanceReport;

