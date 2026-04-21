import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { Users, TrendingUp, Calendar, Filter, DollarSign, FileText, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";
import { getQuotationDataFromView, getOpportunityDataFromView } from "@/utils/salesUtils";
import { getCategoryBadgeClassName } from "@/utils/categoryBadgeUtils";
import { TeamFilterSelect } from "@/components/filters/TeamFilterSelect";
import * as XLSX from 'xlsx';

interface SalesOpportunityData {
  opportunityCount: number;
  totalOpportunityValue: number;
  opportunityLeads: any[];
  opportunityLogsWithQuotations: any[];
}

const SalesOpportunity = () => {
  // Get all sales team data
  const { data: salesTeamData, isLoading: salesTeamLoading } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};
  
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(), 
    to: new Date() 
  });
  const [dashboardData, setDashboardData] = useState<SalesOpportunityData>({
    opportunityCount: 0,
    totalOpportunityValue: 0,
    opportunityLeads: [],
    opportunityLogsWithQuotations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRangeFilter, salesFilter, opportunityFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
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

      const salesFilterParam = salesFilter !== 'all' ? salesFilter : undefined;
      
      // ใช้วิธีเดียวกับ CustomerStatus - ดึงข้อมูลจาก quotation data แล้วกรองเป็น opportunity
      const quotationData = await getQuotationDataFromView(
        startDate || new Date().toISOString(), 
        endDate || new Date().toISOString(), 
        undefined, 
        salesFilterParam
      );

      // ใช้ข้อมูล quotation ทั้งหมดเป็นโอกาสการขาย (เหมือน CustomerStatus)
      const opportunityCount = quotationData.quotationCount;
      
      // ดึงข้อมูล avg_electricity_bill จาก leads table
      const leadIds = quotationData.quotationLeads.map(lead => lead.leadId);
      let leadsData: any[] = [];
      
      if (leadIds.length > 0) {
        const { data: leadsResult, error: leadsError } = await supabase
          .from('leads')
          .select('id, avg_electricity_bill')
          .in('id', leadIds);

        if (leadsError) {
          console.error('Error fetching leads data:', leadsError);
        } else {
          leadsData = leadsResult || [];
        }
      }

      // สร้าง map สำหรับ avg_electricity_bill
      const leadsMap = new Map();
      leadsData.forEach(lead => {
        leadsMap.set(lead.id, lead.avg_electricity_bill || 0);
      });

      // Map opportunity leads with proper data structure (เหมือน CustomerStatus)
      const opportunityLeads = quotationData.quotationLeads.map(lead => ({
        id: lead.leadId,
        display_name: lead.displayName || lead.customerName,
        full_name: lead.fullName || lead.customerName,
        category: lead.category,
        platform: lead.platform || 'ไม่ระบุ',
        tel: lead.tel || 'ไม่ระบุ',
        line_id: lead.lineId || 'ไม่ระบุ',
        sale_owner_id: lead.saleOwnerId || 0, // เก็บไว้สำหรับ backward compatibility
        sale_id: lead.saleId || lead.saleOwnerId || 0, // ✅ ใช้ saleId จาก log (คนที่สร้าง QT นี้)
        status: lead.leadStatus,
        created_at_thai: lead.lastActivityDate,
        totalQuotationAmount: lead.totalQuotationAmount,
        totalQuotationCount: lead.totalQuotationCount,
        quotationNumbers: lead.quotationNumbers,
        quotationDocuments: lead.quotationDocuments || [],
        avg_electricity_bill: leadsMap.get(lead.leadId) || 0,
        logs: quotationData.quotationLogsWithQuotations.filter(log => log.leadId === lead.leadId)
      }));


      // ดึงข้อมูล sale_chance_status และ presentation data จาก productivity logs ล่าสุดสำหรับแต่ละ lead
      const opportunityLeadIds = opportunityLeads.map(lead => lead.id);
      let saleChanceData: any[] = [];
      
      if (opportunityLeadIds.length > 0) {
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
          .in('lead_id', opportunityLeadIds)
          .not('sale_chance_status', 'is', null)
          .order('created_at_thai', { ascending: false });

        if (logsError) {
          console.error('Error fetching sale chance data:', logsError);
        } else {
          saleChanceData = logsResult || [];
        }
      }

      // รวมข้อมูล sale_chance_status และ presentation data เข้ากับ opportunity leads
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
      const enrichedOpportunityLeads = opportunityLeads.map(lead => {
        const saleChanceInfo = leadSaleChanceMap.get(lead.id);
        return {
          ...lead,
          sale_chance_status: saleChanceInfo?.sale_chance_status || 'ไม่ระบุ',
          sale_chance_percent: saleChanceInfo?.sale_chance_percent || 0,
          lead_group: saleChanceInfo?.lead_group || 'ไม่ระบุ',
          presentation_type: saleChanceInfo?.presentation_type || 'ไม่ระบุ',
          latest_log: saleChanceInfo?.latest_log || {
            id: lead.id,
            note: 'ไม่มีรายละเอียดการติดตาม',
            next_follow_up: null,
            next_follow_up_details: null,
            created_at_thai: lead.created_at_thai
          }
        };
      });

      // กรองข้อมูลตาม opportunity filter
      let filteredLeads = enrichedOpportunityLeads;
      if (opportunityFilter !== 'all') {
        filteredLeads = enrichedOpportunityLeads.filter(lead => 
          lead.sale_chance_status === opportunityFilter
        );
      }

      // คำนวณ totalOpportunityValue จากยอด QT รวม (ยอดโอกาสการขาย)
      const totalOpportunityValue = filteredLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);
      
      setDashboardData({
        opportunityCount: filteredLeads.length,
        totalOpportunityValue,
        opportunityLeads: filteredLeads,
        opportunityLogsWithQuotations: filteredLeads.map(lead => lead.latest_log)
      });

    } catch (error) {
      console.error('Error fetching opportunity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      'quotation': { label: 'ออก QT', variant: 'secondary' },
      'qt_sent': { label: 'ส่ง QT แล้ว', variant: 'secondary' },
      'opportunity': { label: 'โอกาส', variant: 'outline' },
      'negotiation': { label: 'เจรจา', variant: 'outline' },
      'won': { label: 'ชนะ', variant: 'default' },
      'closed': { label: 'ปิดการขาย', variant: 'default' }
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
    }
    
    return {
      date: formattedDate,
      note: log.note || 'ไม่มีรายละเอียด',
      nextFollowUp: log.next_follow_up,
      nextFollowUpDetails: log.next_follow_up_details
    };
  };

  const exportToExcel = () => {
    if (!dashboardData.opportunityLeads || dashboardData.opportunityLeads.length === 0) {
      alert('ไม่มีข้อมูลให้ export');
      return;
    }

    // เตรียมข้อมูลสำหรับ Excel
    const excelData = dashboardData.opportunityLeads.map((lead, index) => {
      const saleId = lead.sale_id || lead.sale_owner_id || 0; // ✅ ใช้ saleId จาก log (คนที่สร้าง QT นี้)
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
        'Line ID': lead.line_id,
        'Platform': lead.platform
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
      { wch: 15 },  // Line ID
      { wch: 12 }   // Platform
    ];
    ws['!cols'] = colWidths;

    // เพิ่ม worksheet
    XLSX.utils.book_append_sheet(wb, ws, 'โอกาสการขาย');

    // สร้างชื่อไฟล์
    const currentDate = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
    const fileName = `โอกาสการขาย_${currentDate}.xlsx`;

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
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">โอกาสการขาย</h1>
            <p className="text-gray-600 mt-1">ติดตามโอกาสการขายและสถานะลูกค้า</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Filter Header */}
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Filter className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">ตัวกรองข้อมูล</h3>
                <p className="text-xs text-gray-600">เลือกเงื่อนไขเพื่อดูข้อมูลที่ต้องการ</p>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

              {/* Opportunity Status Filter */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  <span>โอกาสการขาย</span>
                </label>
                <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
                  <SelectTrigger className="h-9 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="เลือกโอกาสการขาย" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                        <span>ทั้งหมด</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="มากกว่า 50%" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>มากกว่า 50%</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="50:50" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                        <span>50:50</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="น้อยกว่า 50%" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>น้อยกว่า 50%</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="win" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>win</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="win + สินเชื่อ" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>win + สินเชื่อ</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="มัดจำเงิน" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <span>มัดจำเงิน</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CXL" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        <span>CXL</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ไม่ระบุ" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                        <span>ไม่ระบุ</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Opportunities */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-amber-50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-orange-700">โอกาสการขาย</p>
                  <p className="text-xs text-orange-600">จำนวนลีด</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData.opportunityLeads.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-green-700">มูลค่ารวม</p>
                  <p className="text-xs text-green-600">ยอด QT รวม</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                ฿{dashboardData.totalOpportunityValue.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-bold">รายการโอกาสการขาย</span>
                <p className="text-sm font-normal text-gray-600 mt-1">ข้อมูลลีดที่มีโอกาสการขาย</p>
              </div>
            </CardTitle>
            <Button 
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!dashboardData.opportunityLeads || dashboardData.opportunityLeads.length === 0}
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
                  <TableHead className="font-semibold text-center">ชื่อลูกค้า</TableHead>
                  <TableHead className="font-semibold text-center">QT / ยอด QT</TableHead>
                  <TableHead className="font-semibold text-center">ค่าไฟ</TableHead>
                  <TableHead className="font-semibold text-center">กลุ่มลูกค้า</TableHead>
                  <TableHead className="font-semibold text-center">การนำเสนอ</TableHead>
                  <TableHead className="font-semibold text-center">โอกาสการขาย</TableHead>
                  <TableHead className="font-semibold text-center">รายละเอียดติดตาม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.opportunityLeads.length > 0 ? (
                  dashboardData.opportunityLeads.map((lead) => {
                    const statusInfo = getStatusBadge(lead.status);
                    const saleId = lead.sale_id || lead.sale_owner_id || 0; // ✅ ใช้ saleId จาก log (คนที่สร้าง QT นี้)
                    const salesMemberName = salesTeam.find(member => member.id === saleId)?.name || 'ไม่ระบุ';
                    
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
                          <div>
                            <div className="font-medium">{lead.display_name}</div>
                            <div className="text-xs text-gray-500">{lead.full_name}</div>
                          </div>
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
                          <Badge variant="outline" className={getCategoryBadgeClassName(lead.category)}>
                            {lead.category || 'ไม่ระบุ'}
                          </Badge>
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
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <TrendingUp className="h-8 w-8 text-gray-300" />
                        <div className="text-sm">ไม่มีข้อมูลโอกาสการขาย</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesOpportunity;
