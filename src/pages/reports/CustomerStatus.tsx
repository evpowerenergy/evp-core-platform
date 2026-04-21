import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { Users, FileText, TrendingUp, DollarSign, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { getSalesDataInPeriod, getQuotationDataInPeriod, getQuotationDataFromDocuments, getOpportunityDataInPeriod, getQuotationDataFromView, getOpportunityDataFromView } from "@/utils/salesUtils";
import { PageLoading } from "@/components/ui/loading";
import { filterLeadsWithContact } from "@/utils/leadQueryFilters";
import { TeamFilterSelect } from "@/components/filters/TeamFilterSelect";

interface CustomerStatusData {
  quotationCount: number;
  opportunityCount: number;
  salesCount: number;
  opportunityValue: number;
  salesValue: number;
  quotationLeads: any[];
  opportunityLeads: any[];
  salesLeads: any[];
  salesQuotations: any[];
  salesProductivityLogs: any[];
  salesLogsWithQuotations: any[]; // ✅ ข้อมูลใหม่: แยกตาม log แต่ละตัว
  quotationLogsWithQuotations: any[]; // ✅ ข้อมูลใหม่: แยกตาม log แต่ละตัวสำหรับการออก QT
  opportunityLogsWithQuotations: any[]; // ✅ ข้อมูลใหม่: แยกตาม log แต่ละตัวสำหรับโอกาสการขาย
}

const CustomerStatus = () => {
  // Get all sales team data (not limited to specific role)
  const { data: salesTeamData, isLoading: salesTeamLoading } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};
  
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(), 
    to: new Date() 
  });
  const [dashboardData, setDashboardData] = useState<CustomerStatusData>({
    quotationCount: 0,
    opportunityCount: 0,
    salesCount: 0,
    opportunityValue: 0,
    salesValue: 0,
    quotationLeads: [],
    opportunityLeads: [],
    salesLeads: [],
    salesQuotations: [],
    salesProductivityLogs: [],
    salesLogsWithQuotations: [], // ✅ เพิ่มข้อมูลใหม่ใน initial state
    quotationLogsWithQuotations: [], // ✅ เพิ่มข้อมูลใหม่ใน initial state
    opportunityLogsWithQuotations: [] // ✅ เพิ่มข้อมูลใหม่ใน initial state
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRangeFilter, salesFilter]);

  // 🔧 ฟังก์ชัน fetchDashboardData - ปรับปรุงให้ใช้วิธีเดียวกับหน้า Sales Team
  // การเปลี่ยนแปลงหลัก:
  // - ใช้วิธีเดียวกับหน้า Sales Team: ดึงลีดที่ปิดการขายจากตาราง leads โดยตรง
  // - ใช้ updated_at_thai ของ leads ในการ filter วันที่ (ไม่ใช่ productivity logs)
  // - ไม่ filter category แคบเกินไป (รวมทุก category ที่มีลีดปิดการขาย)
  // - ใช้ productivity logs ที่มี status 'ปิดการขายแล้ว' ในการดึง quotations
  // ผลลัพธ์: ข้อมูลตรงกับหน้า Sales Team และ database จริง
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
             // Use proper timezone handling for date range (same as PackageDashboard) - ใช้ updated_at_thai เป็นหลัก
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
      
      // สร้าง leads query
      let leadsQuery = supabase
        .from('leads')
        .select('id, full_name, display_name, status, platform, region, created_at_thai, updated_at_thai, sale_owner_id, category,  tel, line_id')
        .not('sale_owner_id', 'is', null);
      
      // Filter เฉพาะลีดที่มีเบอร์โทรหรือ Line ID
      leadsQuery = filterLeadsWithContact(leadsQuery);

      // Apply filters
      if (startDate && endDate) {
        leadsQuery = leadsQuery
          .gte('updated_at_thai', startDate)
          .lte('updated_at_thai', endDate);
      }

      if (salesFilter !== 'all') {
        // Apply sales filter - รวมทั้ง sale_owner_id และ post_sales_owner_id
        leadsQuery = leadsQuery.or(`sale_owner_id.eq.${salesFilter},post_sales_owner_id.eq.${salesFilter}`);
      }

      // ✅ ดึงข้อมูลทั้งหมดพร้อมกัน (Parallel Queries)
      // ใช้ระบบใหม่ที่ใช้ view lead_qt_itemized เพื่อความแม่นยำสูงสุด (ไม่ซ้ำ QT)
      const [
        leadsResult,
        quotationData,
        opportunityData,
        salesData
      ] = await Promise.all([
        leadsQuery,
        getQuotationDataFromView(startDate || new Date().toISOString(), endDate || new Date().toISOString(), undefined, salesFilterParam),
        getOpportunityDataFromView(startDate || new Date().toISOString(), endDate || new Date().toISOString(), undefined, salesFilterParam),
        getSalesDataInPeriod(startDate || new Date().toISOString(), endDate || new Date().toISOString(), salesFilterParam)
      ]);

      const { data: leads, error } = leadsResult;

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      if (!leads) return;

      // ไม่ต้อง filter แล้ว เพราะ backend ใช้ filterLeadsWithContact() กรองให้แล้ว
      const validLeads = leads;
      
      // กำหนดค่าจาก quotationData - ใช้ข้อมูลจาก view (ไม่ซ้ำ QT แล้ว)
      const quotationCount = quotationData.quotationCount;
      
      // ✅ ใช้ข้อมูลจาก view ที่ทำ deduplication แล้ว (พร้อมข้อมูล sales person)
      const quotationLeads = quotationData.quotationLeads.map(lead => ({
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
        logs: quotationData.quotationLogsWithQuotations.filter(log => log.leadId === lead.leadId)
      }));
      
      // กำหนดค่าจาก opportunityData - ใช้ข้อมูลจาก view (ไม่ซ้ำ QT แล้ว)
      const opportunityCount = opportunityData.opportunityCount;
      const opportunityValue = opportunityData.totalOpportunityValue;
      
      // ✅ ใช้ข้อมูลจาก view ที่ทำ deduplication แล้ว (พร้อมข้อมูล sales person)
      const opportunityLeads = opportunityData.opportunityLeads.map(lead => ({
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
        totalOpportunityAmount: lead.totalQuotationAmount,
        totalQuotationCount: lead.totalQuotationCount,
        quotationNumbers: lead.quotationNumbers,
        logs: opportunityData.opportunityLogsWithQuotations.filter(log => log.leadId === lead.leadId)
      }));
      
      // ✅ ใช้ข้อมูลที่ดึงมาแล้วจาก Promise.all
      const salesQuotations = salesData.quotations;
      const salesProductivityLogs = salesData.salesLogs;
      const salesValue = salesData.totalSalesValue;
      const salesLogsWithQuotations = salesData.salesLogsWithQuotations;
      
      // ✅ ใช้ salesLeads จาก getSalesDataInPeriod (เหมือนกับ SalesClosed)
      const salesLeads = (salesData.salesLeads || []).map(lead => ({
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
        quotationDocuments: lead.quotationDocuments || []
      }));

      // 🎯 สรุปการเปลี่ยนแปลงที่สำคัญ:
      // 1. ✅ ใช้ utility function getSalesDataInPeriod สำหรับดึงข้อมูลยอดขายที่ถูกต้อง
      // 2. ✅ แก้ไขปัญหายอดขายหายไปจากลีดที่ซื้อซ้ำ
      // 3. ✅ ใช้ productivity logs ที่มี status 'ปิดการขายแล้ว' ในการดึง quotations
      // 4. ✅ รวมยอดขายจากทุก productivity log ที่มี quotation (ไม่ใช่แค่ log ล่าสุด)
      // ผลลัพธ์: ข้อมูลยอดขายครบถ้วนและถูกต้อง
      
      setDashboardData({
        quotationCount,
        opportunityCount,
        salesCount: salesData.salesCount, // ✅ ใช้ salesCount ที่คำนวณแล้วจาก salesUtils (หลัง deduplication)
        opportunityValue,
        salesValue: salesData.totalSalesValue, // ✅ ใช้ totalSalesValue ที่คำนวณแล้วจาก salesUtils
        quotationLeads,
        opportunityLeads,
        salesLeads,
        salesQuotations,
        salesProductivityLogs: salesProductivityLogs,
        salesLogsWithQuotations, // ✅ เพิ่มข้อมูลใหม่
        quotationLogsWithQuotations: quotationData.quotationLogsWithQuotations, // ✅ เพิ่มข้อมูลใหม่
        opportunityLogsWithQuotations: opportunityData.opportunityLogsWithQuotations // ✅ เพิ่มข้อมูลใหม่
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  // ✅ Function to get sales amount for a specific lead (ใช้ข้อมูลใหม่)
  const getLeadSalesAmount = (leadId: number) => {
    // Find productivity logs for this lead from new data structure
    const leadLogs = dashboardData.salesLogsWithQuotations.filter(log => log.leadId === leadId);
    
    // Sum up the total amount from all logs of this lead
    return leadLogs.reduce((total, log) => total + (log.salesAmount || 0), 0);
  };

  // ✅ Function to get individual log sales amount
  const getLogSalesAmount = (logId: number) => {
    const log = dashboardData.salesLogsWithQuotations.find(log => log.logId === logId);
    return log ? log.salesAmount : 0;
  };

  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">สถานะลูกค้า</h1>
            <p className="text-gray-600 mt-1">ติดตามสถานะลูกค้าและโอกาสการขาย</p>
          </div>
        </div>
      </div>

      {/* Compact Filter Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Compact Filter Header */}
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">ตัวกรองข้อมูล</h3>
                <p className="text-xs text-gray-600">เลือกเงื่อนไขเพื่อดูข้อมูลที่ต้องการ</p>
              </div>
            </div>

            {/* Compact Filter Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
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
                  triggerClassName="h-9 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Modern Dashboard Content - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: ออก QT */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-blue-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-bold">ออก QT</span>
                <p className="text-sm font-normal text-blue-600 mt-1">ใบเสนอราคา</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Enhanced Summary Card - กระชับและเป็นระเบียบ */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              {/* จำนวนรวม - ด้านบน */}
              <div className="text-center mb-3">
                <div className="text-3xl font-bold text-blue-600">{dashboardData.quotationLeads.length}</div>
                <div className="text-xs text-gray-600">ลีดทั้งหมด</div>
              </div>
              
              {/* แยกตาม Category - ด้านล่าง */}
              <div className="space-y-2">
                {/* แสดงทุก category ที่มีข้อมูล */}
                {(() => {
                  const categoryCounts = dashboardData.quotationLeads.reduce((acc, lead) => {
                    acc[lead.category] = (acc[lead.category] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const categories = Object.entries(categoryCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
                  
                  return categories.map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">{category}</div>
                      <div className="text-lg font-bold text-blue-600">{count as number}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Enhanced Leads List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">รายชื่อลีด</h4>
                <Badge variant="secondary" className="text-xs">
                  {dashboardData.quotationLeads.length} ลีด
                </Badge>
              </div>
              {dashboardData.quotationLeads.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {dashboardData.quotationLeads.map((leadData) => (
                    <div key={leadData.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">{leadData.display_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{leadData.full_name}</div>
                          <div className="text-xs text-blue-600 mt-1 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(leadData.created_at_thai)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {salesTeam.find(member => member.id === (leadData.sale_id || leadData.sale_owner_id || 0))?.name || 'ไม่ระบุ'}
                          </div>
                          {/* ✅ Display category */}
                          <div className="text-xs text-purple-600 mt-1 flex items-center">
                            <span className="px-2 py-1 bg-purple-100 rounded-full text-xs font-medium">
                              {leadData.category}
                            </span>
                          </div>
                          {/* ✅ Display total quotation amount for this lead */}
                          <div className="text-xs font-semibold text-blue-700 mt-1 flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ฿{leadData.totalQuotationAmount.toLocaleString()}
                          </div>
                          {/* ✅ Display total quotation count for this lead */}
                          <div className="text-xs text-blue-600 mt-1 flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {leadData.totalQuotationCount} QT
                          </div>
                          {/* ✅ Display quotation numbers */}
                          <div className="text-xs text-gray-500 mt-1">
                            QT: {leadData.quotationNumbers.join(', ')}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                            ฿{leadData.totalQuotationAmount.toLocaleString()}
                          </Badge>
                          {/* ✅ Show lead ID and log count */}
                          <Badge variant="outline" className="text-xs text-gray-500">
                            {leadData.logs.length} Logs
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm">ไม่มีข้อมูล</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Column 2: โอกาสยอดขาย */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-orange-800">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <span className="text-xl font-bold">โอกาสยอดขาย</span>
                <p className="text-sm font-normal text-orange-600 mt-1">โอกาสในการปิดการขาย</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Enhanced Summary Card - กระชับและเป็นระเบียบ */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
              {/* จำนวนรวม - ด้านบน */}
              <div className="text-center mb-3">
                <div className="text-3xl font-bold text-orange-600">{dashboardData.opportunityLeads.length}</div>
                <div className="text-xs text-gray-600">ลีดทั้งหมด</div>
              </div>
              
              {/* แยกตาม Category - ด้านล่าง */}
              <div className="space-y-2">
                {/* แสดงทุก category ที่มีข้อมูล */}
                {(() => {
                  const categoryCounts = dashboardData.opportunityLeads.reduce((acc, lead) => {
                    acc[lead.category] = (acc[lead.category] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const categories = Object.entries(categoryCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
                  
                  return categories.map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">{category}</div>
                      <div className="text-lg font-bold text-orange-600">{count as number}</div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* มูลค่ารวม - ด้านล่างสุด */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    ฿{dashboardData.opportunityValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">มูลค่ารวม</div>
                </div>
              </div>
            </div>

            {/* Enhanced Leads List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">รายชื่อลีด</h4>
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  {dashboardData.opportunityLeads.length} ลีด
                </Badge>
              </div>
              {dashboardData.opportunityLeads.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {dashboardData.opportunityLeads.map((leadData) => (
                    <div key={leadData.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">{leadData.display_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{leadData.full_name}</div>
                          <div className="text-xs text-orange-600 mt-1 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(leadData.created_at_thai)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {salesTeam.find(member => member.id === (leadData.sale_id || leadData.sale_owner_id || 0))?.name || 'ไม่ระบุ'}
                          </div>
                          {/* ✅ Display category */}
                          <div className="text-xs text-purple-600 mt-1 flex items-center">
                            <span className="px-2 py-1 bg-purple-100 rounded-full text-xs font-medium">
                              {leadData.category}
                            </span>
                          </div>
                          {/* ✅ Display total opportunity amount for this lead */}
                          <div className="text-xs font-semibold text-orange-700 mt-1 flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ฿{leadData.totalOpportunityAmount.toLocaleString()}
                          </div>
                          {/* ✅ Display total quotation count for this lead */}
                          <div className="text-xs text-orange-600 mt-1 flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {leadData.totalQuotationCount} QT
                          </div>
                          {/* ✅ Display quotation numbers */}
                          <div className="text-xs text-gray-500 mt-1">
                            QT: {leadData.quotationNumbers.join(', ')}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant="default" className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-100">
                            ฿{leadData.totalOpportunityAmount.toLocaleString()}
                          </Badge>
                          {/* ✅ Show lead ID and log count */}
                          <Badge variant="outline" className="text-xs text-gray-500">
                            {leadData.logs.length} Logs
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm">ไม่มีข้อมูล</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Column 3: ยอดขาย */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-green-800">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <span className="text-xl font-bold">ยอดขาย</span>
                <p className="text-sm font-normal text-green-600 mt-1">ปิดการขายสำเร็จ</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Enhanced Summary Card - กระชับและเป็นระเบียบ */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
              {/* จำนวนรวม - ด้านบน */}
              <div className="text-center mb-3">
                <div className="text-3xl font-bold text-green-600">{dashboardData.salesCount}</div>
                <div className="text-xs text-gray-600">QT ที่ปิดทั้งหมด</div>
              </div>
              
              {/* แยกตาม Category - ด้านล่าง */}
              <div className="space-y-2">
                {/* แสดงทุก category ที่มีข้อมูล */}
                {(() => {
                  const categoryCounts = dashboardData.salesLeads.reduce((acc, lead) => {
                    acc[lead.category] = (acc[lead.category] || 0) + (lead.totalQuotationCount || 0);
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const categories = Object.entries(categoryCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
                  
                  return categories.map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">{category}</div>
                      <div className="text-lg font-bold text-green-600">{count as number}</div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* มูลค่ารวม - ด้านล่างสุด */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ฿{dashboardData.salesValue?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-600">มูลค่ารวม</div>
                </div>
              </div>
            </div>

            {/* Enhanced Leads List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">รายชื่อลีด</h4>
                <Badge variant="default" className="text-xs text-white bg-green-600">
                  {dashboardData.salesLeads.length} ลูกค้า ({dashboardData.salesCount} QT)
                </Badge>
              </div>
              {dashboardData.salesLeads.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {dashboardData.salesLeads.map((leadData) => {
                    return (
                      <div key={leadData.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{leadData.display_name}</div>
                            <div className="text-xs text-gray-500 mt-1">{leadData.full_name}</div>
                            <div className="text-xs text-green-600 mt-1 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(leadData.created_at_thai)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {salesTeam.find(member => member.id === (leadData.sale_id || leadData.sale_owner_id || 0))?.name || 'ไม่ระบุ'}
                            </div>
                            {/* ✅ Display category */}
                            <div className="text-xs text-purple-600 mt-1 flex items-center">
                              <span className="px-2 py-1 bg-purple-100 rounded-full text-xs font-medium">
                                {leadData.category}
                              </span>
                            </div>
                            {/* ✅ Display total sales amount for this lead */}
                            <div className="text-xs font-semibold text-green-700 mt-1 flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ฿{leadData.totalQuotationAmount.toLocaleString()}
                            </div>
                            {/* ✅ Display total quotation count for this lead */}
                            <div className="text-xs text-blue-600 mt-1 flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {leadData.totalQuotationCount} QT
                            </div>
                            {/* ✅ Display quotation numbers */}
                            <div className="text-xs text-gray-500 mt-1">
                              QT: {leadData.quotationNumbers.join(', ')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                              ฿{leadData.totalQuotationAmount.toLocaleString()}
                            </Badge>
                            {/* ✅ Show QT count */}
                            <Badge variant="outline" className="text-xs text-gray-500">
                              {leadData.totalQuotationCount} QT
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm">ไม่มีข้อมูล</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerStatus;
