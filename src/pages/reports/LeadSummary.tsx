import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactECharts } from '@/utils/echartsLoader.tsx';
import { supabase } from "@/integrations/supabase/client";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Package, Store, TrendingUp, Users, Target, Zap, Smartphone, Filter } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getSalesDataInPeriod, getSalesDataByCategory, getQuotationDataInPeriod, getOpportunityDataInPeriod } from "@/utils/salesUtils";
import { PageLoading } from "@/components/ui/loading";
import { filterLeadsWithContact } from "@/utils/leadQueryFilters";
import { TeamFilterSelect } from "@/components/filters/TeamFilterSelect";

interface LeadSummaryData {
  packageLeads: number;
  wholesaleLeads: number;
  totalLeads: number;
  packageWon: number;
  wholesaleWon: number;
  packageValue: number;
  wholesaleValue: number;
  // EV and Partner data
  evLeads: number;
  evWon: number;
  evValue: number;
  partnerLeads: number;
  huaweiLeads: number;
  huaweiWon: number;
  huaweiValue: number;
  huaweiCILeads: number;
  huaweiCIWon: number;
  huaweiCIValue: number;
  atmoceLeads: number;
  atmoceWon: number;
  atmoceValue: number;
  solarEdgeLeads: number;
  solarEdgeWon: number;
  solarEdgeValue: number;
  sigenergyLeads: number;
  sigenergyWon: number;
  sigenergyValue: number;
  solvanaLeads: number;
  solvanaWon: number;
  solvanaValue: number;
  terawattLeads: number;
  terawattWon: number;
  terawattValue: number;
  // PPA Project data
  ppaProjectLeads: number;
  ppaProjectWon: number;
  ppaProjectValue: number;
}

const LeadSummary = () => {
  const { data: salesTeamData } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};
  const [salesFilter, setSalesFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(), 
    to: new Date() 
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<LeadSummaryData>({
    packageLeads: 0,
    wholesaleLeads: 0,
    totalLeads: 0,
    packageWon: 0,
    wholesaleWon: 0,
    packageValue: 0,
    wholesaleValue: 0,
    evLeads: 0,
    evWon: 0,
    evValue: 0,
    partnerLeads: 0,
    huaweiLeads: 0,
    huaweiWon: 0,
    huaweiValue: 0,
    huaweiCILeads: 0,
    huaweiCIWon: 0,
    huaweiCIValue: 0,
    atmoceLeads: 0,
    atmoceWon: 0,
    atmoceValue: 0,
    solarEdgeLeads: 0,
    solarEdgeWon: 0,
    solarEdgeValue: 0,
    sigenergyLeads: 0,
    sigenergyWon: 0,
    sigenergyValue: 0,
    solvanaLeads: 0,
    solvanaWon: 0,
    solvanaValue: 0,
    terawattLeads: 0,
    terawattWon: 0,
    terawattValue: 0,
    ppaProjectLeads: 0,
    ppaProjectWon: 0,
    ppaProjectValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, [salesFilter, dateRangeFilter]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      
      // Use proper timezone handling for date range (same as CustomerStatus)
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
      // ✅ ลบ filter .not('sale_owner_id', 'is', null) เพื่อให้แสดงลีดทั้งหมดเหมือน AllLeadsReport
      // การคำนวณ won/value จะใช้ข้อมูลจาก salesLeads (ซึ่งมาจาก getSalesDataInPeriod) ที่มีการปิดการขายแล้ว
      let leadsQuery = supabase
        .from('leads')
        .select('id, full_name, display_name, status, platform, region, created_at_thai, updated_at_thai, sale_owner_id, category, tel, line_id, is_from_ppa_project');
      
      // Filter เฉพาะลีดที่มีเบอร์โทรหรือ Line ID (เหมือน AllLeadsReport)
      leadsQuery = filterLeadsWithContact(leadsQuery);

      // Apply filters
      if (startDate && endDate) {
        leadsQuery = leadsQuery
          .gte('created_at_thai', startDate)
          .lte('created_at_thai', endDate);
      }
      
      // Apply sales filter - รวมทั้ง sale_owner_id และ post_sales_owner_id
      if (salesFilter !== 'all') {
        leadsQuery = leadsQuery.or(`sale_owner_id.eq.${salesFilter},post_sales_owner_id.eq.${salesFilter}`);
      }

      // ✅ ดึงข้อมูลทั้งหมดพร้อมกัน (Parallel Queries)
      const [
        leadsResult,
        allSalesData,
        packageQuotationData,
        wholesaleQuotationData
      ] = await Promise.all([
        leadsQuery,
        getSalesDataInPeriod(startDate || '', endDate || '', salesFilterParam),
        getQuotationDataInPeriod(startDate || '', endDate || '', 'Package', salesFilterParam),
        getQuotationDataInPeriod(startDate || '', endDate || '', 'Wholesale', salesFilterParam)
      ]);

      const { data: leadsData } = leadsResult;
      
      // Debug: Check allSalesData structure
      console.log('📊 LeadSummary allSalesData Debug:', {
        allSalesData: allSalesData,
        hasSalesLeads: 'salesLeads' in (allSalesData || {}),
        salesLeadsLength: allSalesData?.salesLeads?.length || 0,
        salesLeadsType: Array.isArray(allSalesData?.salesLeads),
        salesCount: allSalesData?.salesCount || 0,
        totalSalesValue: allSalesData?.totalSalesValue || 0,
        dateRange: { startDate, endDate },
        salesFilter: salesFilterParam
      });
      
      // Debug: Check if leadsData has is_from_ppa_project field
      if (leadsData && leadsData.length > 0) {
        const sampleLead = leadsData[0];
        console.log('📊 LeadSummary Query Debug:', {
          totalLeads: leadsData.length,
          sampleLeadFields: Object.keys(sampleLead),
          hasPpaField: 'is_from_ppa_project' in sampleLead,
          samplePpaValue: sampleLead.is_from_ppa_project,
          ppaLeadsCount: leadsData.filter((l: any) => l.is_from_ppa_project === true).length
        });
      }
      
      // Store leads data in state
      setLeads(leadsData || []);

      // Calculate basic metrics (ไม่ต้องกรอง tel/line_id แล้ว เพราะ backend กรองให้แล้ว)
      const packageLeads = leadsData?.filter(lead => 
        lead.category === 'Package'
      ).length || 0;
      const wholesaleLeads = leadsData?.filter(lead => 
        (lead.category === 'Wholesale' || lead.category === 'Wholesales')
      ).length || 0;
      const totalLeads = leadsData?.length || 0;

      // Calculate EV and Partner metrics with new categorization
      // Helper functions for platform classification
      const isEVLead = (platform: string) => {
        const evPlatforms = ['Facebook', 'Line', 'Website', 'TikTok', 'IG', 'YouTube', 'Shopee', 'Lazada', 'แนะนำ', 'Outbound', 'โทร', 'ลูกค้าเก่า service ครบ'];
        return evPlatforms.includes(platform);
      };

      const isPartnerLead = (platform: string) => {
        const partnerPlatforms = ['Huawei', 'Huawei (C&I)', 'ATMOCE', 'Solar Edge', 'Sigenergy', 'solvana', 'terawatt'];
        return partnerPlatforms.includes(platform);
      };

      // Calculate EV leads (บริษัทหามาเอง - ไม่รวม Partner)
      const evLeads = leadsData?.filter(lead => 
        isEVLead(lead.platform)
      ).length || 0;

      // Calculate Partner leads individually
      const huaweiLeads = leadsData?.filter(lead => 
        lead.platform === 'Huawei'
      ).length || 0;

      const huaweiCILeads = leadsData?.filter(lead => 
        lead.platform === 'Huawei (C&I)'
      ).length || 0;

      const atmoceLeads = leadsData?.filter(lead => 
        lead.platform === 'ATMOCE'
      ).length || 0;

      const solarEdgeLeads = leadsData?.filter(lead => 
        lead.platform === 'Solar Edge'
      ).length || 0;

      const sigenergyLeads = leadsData?.filter(lead => 
        lead.platform === 'Sigenergy'
      ).length || 0;

      const solvanaLeads = leadsData?.filter(lead => 
        lead.platform === 'solvana'
      ).length || 0;

      const terawattLeads = leadsData?.filter(lead => 
        lead.platform === 'terawatt'
      ).length || 0;

      const partnerLeads = huaweiLeads + huaweiCILeads + atmoceLeads + solarEdgeLeads + sigenergyLeads + solvanaLeads + terawattLeads;

      // Calculate PPA Project leads
      // ตรวจสอบทั้ง true และค่า truthy อื่นๆ (เพื่อรองรับกรณีที่อาจเป็น 1, "true", etc.)
      const ppaProjectLeads = leadsData?.filter(lead => 
        lead.is_from_ppa_project === true || lead.is_from_ppa_project === 1
      ).length || 0;

      // Debug: Log PPA calculation
      console.log('📊 LeadSummary PPA Debug:', {
        totalLeads: leadsData?.length || 0,
        ppaProjectLeads: ppaProjectLeads,
        sampleLead: leadsData?.[0] ? {
          id: leadsData[0].id,
          full_name: leadsData[0].full_name,
          is_from_ppa_project: leadsData[0].is_from_ppa_project,
          typeof: typeof leadsData[0].is_from_ppa_project,
          hasField: 'is_from_ppa_project' in (leadsData[0] || {}),
          allFields: Object.keys(leadsData[0] || {})
        } : null,
        allPpaLeads: leadsData?.filter((lead: any) => lead.is_from_ppa_project === true || lead.is_from_ppa_project === 1).map((l: any) => ({ id: l.id, name: l.full_name, ppaValue: l.is_from_ppa_project }))
      });

      // Get won leads (closed sales) - we need to check lead_productivity_logs.leads.status
      // For now, let's get the count from quotations queries instead
      let packageWon = 0;
      let wholesaleWon = 0;
      let evWon = 0;
      let huaweiWon = 0;
      let huaweiCIWon = 0;
      let atmoceWon = 0;
      let solarEdgeWon = 0;
      let sigenergyWon = 0;
      let solvanaWon = 0;
      let terawattWon = 0;
      let packageValue = 0;
      let wholesaleValue = 0;
      let evValue = 0;
      let huaweiValue = 0;
      let huaweiCIValue = 0;
      let atmoceValue = 0;
      let solarEdgeValue = 0;
      let sigenergyValue = 0;
      let solvanaValue = 0;
      let terawattValue = 0;
      let ppaProjectWon = 0;
      let ppaProjectValue = 0;

      // ✅ ใช้ข้อมูลที่ดึงมาแล้วจาก Promise.all

      // แยกข้อมูลตาม category
      const packageSalesLogs = allSalesData.salesLogs.filter(log => log.leads.category === 'Package');
      const wholesaleSalesLogs = allSalesData.salesLogs.filter(log => 
        log.leads.category === 'Wholesale' || log.leads.category === 'Wholesales'
      );

      // ✅ ใช้ข้อมูลจาก salesLeads ที่ผ่าน deduplication แล้ว
      // ตรวจสอบว่า allSalesData.salesLeads มีข้อมูลหรือไม่
      const salesLeads = allSalesData?.salesLeads || [];
      const packageSalesLeads = salesLeads.filter((lead: any) => lead.category === 'Package');
      const wholesaleSalesLeads = salesLeads.filter((lead: any) => 
        lead.category === 'Wholesale' || lead.category === 'Wholesales'
      );
      
      // คำนวณจำนวน QT ที่ปิดการขาย (หลัง deduplication)
      packageWon = packageSalesLeads.reduce((sum, lead) => sum + (lead.totalQuotationCount || 0), 0);
      packageValue = packageSalesLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);
      
      wholesaleWon = wholesaleSalesLeads.reduce((sum, lead) => sum + (lead.totalQuotationCount || 0), 0);
      wholesaleValue = wholesaleSalesLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);

      // ✅ คำนวณ EV และ Partner จาก salesLeads ที่ผ่าน deduplication แล้ว
      const allSalesLeads = salesLeads;
      
      allSalesLeads.forEach(lead => {
        const platform = lead.platform;
        
        // EV vs Partner classification
        if (platform === 'Huawei') {
          huaweiValue += lead.totalQuotationAmount || 0;
          huaweiWon += lead.totalQuotationCount || 0;
        } else if (platform === 'Huawei (C&I)') {
          huaweiCIValue += lead.totalQuotationAmount || 0;
          huaweiCIWon += lead.totalQuotationCount || 0;
        } else if (platform === 'ATMOCE') {
          atmoceValue += lead.totalQuotationAmount || 0;
          atmoceWon += lead.totalQuotationCount || 0;
        } else if (platform === 'Solar Edge') {
          solarEdgeValue += lead.totalQuotationAmount || 0;
          solarEdgeWon += lead.totalQuotationCount || 0;
        } else if (platform === 'Sigenergy') {
          sigenergyValue += lead.totalQuotationAmount || 0;
          sigenergyWon += lead.totalQuotationCount || 0;
        } else if (platform === 'solvana') {
          solvanaValue += lead.totalQuotationAmount || 0;
          solvanaWon += lead.totalQuotationCount || 0;
        } else if (platform === 'terawatt') {
          terawattValue += lead.totalQuotationAmount || 0;
          terawattWon += lead.totalQuotationCount || 0;
        } else {
          // EV leads (บริษัทหามาเอง)
          evValue += lead.totalQuotationAmount || 0;
          evWon += lead.totalQuotationCount || 0;
        }
      });

      // Calculate PPA Project won and value
      // ตรวจสอบทั้ง true และค่า truthy อื่นๆ
      const ppaSalesLeads = allSalesLeads.filter((lead: any) => 
        lead.is_from_ppa_project === true || lead.is_from_ppa_project === 1
      );
      ppaProjectWon = ppaSalesLeads.reduce((sum, lead) => sum + (lead.totalQuotationCount || 0), 0);
      ppaProjectValue = ppaSalesLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);
      
      // Debug: Log PPA sales calculation
      console.log('📊 LeadSummary PPA Sales Debug:', {
        totalSalesLeads: allSalesLeads.length,
        ppaSalesLeads: ppaSalesLeads.length,
        ppaProjectWon: ppaProjectWon,
        ppaProjectValue: ppaProjectValue,
        sampleSalesLead: allSalesLeads[0] ? {
          id: allSalesLeads[0].leadId,
          name: allSalesLeads[0].displayName,
          is_from_ppa_project: (allSalesLeads[0] as any).is_from_ppa_project,
          typeof: typeof (allSalesLeads[0] as any).is_from_ppa_project,
          hasField: 'is_from_ppa_project' in (allSalesLeads[0] || {})
        } : null
      });
      
      // Add fallback value if no quotations found
      if (ppaProjectValue === 0 && ppaProjectWon > 0) {
        ppaProjectValue = ppaProjectWon * 150000; // Average PPA value
      }

      // Add fallback values if no quotations found
      if (packageValue === 0 && packageWon > 0) {
        packageValue = packageWon * 150000; // Average package value
      }
      if (wholesaleValue === 0 && wholesaleWon > 0) {
        wholesaleValue = wholesaleWon * 300000; // Average wholesale value
      }
      if (evValue === 0 && evWon > 0) {
        evValue = evWon * 150000; // Average EV value
      }
      if (huaweiValue === 0 && huaweiWon > 0) {
        huaweiValue = huaweiWon * 200000; // Average Huawei value
      }
      if (huaweiCIValue === 0 && huaweiCIWon > 0) {
        huaweiCIValue = huaweiCIWon * 200000; // Average Huawei (C&I) value
      }
      if (atmoceValue === 0 && atmoceWon > 0) {
        atmoceValue = atmoceWon * 200000; // Average ATMOCE value
      }
      if (solarEdgeValue === 0 && solarEdgeWon > 0) {
        solarEdgeValue = solarEdgeWon * 200000; // Average Solar Edge value
      }
      if (sigenergyValue === 0 && sigenergyWon > 0) {
        sigenergyValue = sigenergyWon * 200000; // Average Sigenergy value
      }
      if (solvanaValue === 0 && solvanaWon > 0) {
        solvanaValue = solvanaWon * 200000; // Average solvana value
      }
      if (terawattValue === 0 && terawattWon > 0) {
        terawattValue = terawattWon * 200000; // Average terawatt value
      }

      // Debug logs for new approach
      

      setSummaryData({
        packageLeads,
        wholesaleLeads,
        totalLeads,
        packageWon,
        wholesaleWon,
        packageValue,
        wholesaleValue,
        evLeads,
        evWon,
        evValue,
        partnerLeads,
        huaweiLeads,
        huaweiWon,
        huaweiValue,
        huaweiCILeads,
        huaweiCIWon,
        huaweiCIValue,
        atmoceLeads,
        atmoceWon,
        atmoceValue,
        solarEdgeLeads,
        solarEdgeWon,
        solarEdgeValue,
        sigenergyLeads,
        sigenergyWon,
        sigenergyValue,
        solvanaLeads,
        solvanaWon,
        solvanaValue,
        ppaProjectLeads,
        ppaProjectWon,
        ppaProjectValue,
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Package', value: summaryData.packageLeads, color: '#10B981' },
    { name: 'Wholesale', value: summaryData.wholesaleLeads, color: '#3B82F6' },
  ];

  const barData = [
    {
      category: 'Package',
      leads: summaryData.packageLeads,
      won: summaryData.packageWon,
      value: summaryData.packageValue,
    },
    {
      category: 'Wholesale',
      leads: summaryData.wholesaleLeads,
      won: summaryData.wholesaleWon,
      value: summaryData.wholesaleValue,
    },
  ];

  // Source distribution data
  const sourceData = [
    { name: 'EV Leads', value: summaryData.evLeads, color: '#10B981' }, // สีเขียว
    { name: 'Huawei', value: summaryData.huaweiLeads, color: '#EF4444' }, // สีแดง
    { name: 'Huawei (C&I)', value: summaryData.huaweiCILeads, color: '#DC2626' }, // สีแดงเข้ม
    { name: 'ATMOCE', value: summaryData.atmoceLeads, color: '#3B82F6' }, // สีน้ำเงิน
    { name: 'Solar Edge', value: summaryData.solarEdgeLeads, color: '#F59E0B' }, // สีเหลือง
    { name: 'Sigenergy', value: summaryData.sigenergyLeads, color: '#8B5CF6' }, // สีม่วง
    { name: 'solvana', value: summaryData.solvanaLeads, color: '#10B981' }, // สีเขียวอ่อน
    { name: 'terawatt', value: summaryData.terawattLeads, color: '#14B8A6' }, // สีเทียล
  ];

  // Performance comparison data
  const performanceData = [
    {
      name: 'EV',
      leads: summaryData.evLeads,
      won: summaryData.evWon,
      value: summaryData.evValue,
      winRate: summaryData.evLeads > 0 ? (summaryData.evWon / summaryData.evLeads) * 100 : 0,
    },
    {
      name: 'Huawei',
      leads: summaryData.huaweiLeads,
      won: summaryData.huaweiWon,
      value: summaryData.huaweiValue,
      winRate: summaryData.huaweiLeads > 0 ? (summaryData.huaweiWon / summaryData.huaweiLeads) * 100 : 0,
    },
    {
      name: 'Huawei (C&I)',
      leads: summaryData.huaweiCILeads,
      won: summaryData.huaweiCIWon,
      value: summaryData.huaweiCIValue,
      winRate: summaryData.huaweiCILeads > 0 ? (summaryData.huaweiCIWon / summaryData.huaweiCILeads) * 100 : 0,
    },
    {
      name: 'ATMOCE',
      leads: summaryData.atmoceLeads,
      won: summaryData.atmoceWon,
      value: summaryData.atmoceValue,
      winRate: summaryData.atmoceLeads > 0 ? (summaryData.atmoceWon / summaryData.atmoceLeads) * 100 : 0,
    },
    {
      name: 'Solar Edge',
      leads: summaryData.solarEdgeLeads,
      won: summaryData.solarEdgeWon,
      value: summaryData.solarEdgeValue,
      winRate: summaryData.solarEdgeLeads > 0 ? (summaryData.solarEdgeWon / summaryData.solarEdgeLeads) * 100 : 0,
    },
    {
      name: 'Sigenergy',
      leads: summaryData.sigenergyLeads,
      won: summaryData.sigenergyWon,
      value: summaryData.sigenergyValue,
      winRate: summaryData.sigenergyLeads > 0 ? (summaryData.sigenergyWon / summaryData.sigenergyLeads) * 100 : 0,
    },
    {
      name: 'solvana',
      leads: summaryData.solvanaLeads,
      won: summaryData.solvanaWon,
      value: summaryData.solvanaValue,
      winRate: summaryData.solvanaLeads > 0 ? (summaryData.solvanaWon / summaryData.solvanaLeads) * 100 : 0,
    },
    {
      name: 'terawatt',
      leads: summaryData.terawattLeads,
      won: summaryData.terawattWon,
      value: summaryData.terawattValue,
      winRate: summaryData.terawattLeads > 0 ? (summaryData.terawattWon / summaryData.terawattLeads) * 100 : 0,
    },
  ];



  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  const selectedSalesName = salesFilter === 'all' 
    ? 'ทุกคน' 
    : salesTeam.find(member => member.id.toString() === salesFilter)?.name || 'ไม่พบชื่อ';

  return (
    <div className="min-h-screen bg-gray-50 space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <Target className="h-8 w-8 text-white" />
            </div> */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                สรุป Lead แยกตามประเภท
              </h1>
              {/* <p className="text-lg text-gray-600 mt-1">
                {selectedSalesName}
              </p> */}
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Filter Header */}
            {/* <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Filter className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">ตัวกรองข้อมูล</h3>
                <p className="text-xs text-gray-600">เลือกเงื่อนไขเพื่อดูข้อมูลที่ต้องการ</p>
              </div>
            </div> */}

            {/* Filter Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-3.5 w-3.5 text-green-500" />
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
                  <Users className="h-3.5 w-3.5 text-blue-500" />
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

      {/* Summary Statistics Section - Top Row */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
          สรุปสถิติ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ลีดทั้งหมด */}
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 mb-2">{summaryData.totalLeads.toLocaleString()}</p>
                <p className="text-lg font-semibold text-gray-700 mb-2">ลีดทั้งหมด</p>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                  <span className="font-bold text-green-600">{summaryData.evLeads}</span> EV + <span className="font-bold text-red-600">{summaryData.partnerLeads}</span> Partner
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Package & Wholesale Performance */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-green-700 mb-4">Package & Wholesale</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-900 mb-1">{summaryData.packageLeads}</p>
                    <p className="text-sm font-semibold text-green-600 mb-2">Package</p>
                    <p className="text-sm font-medium text-green-800">
                      Win: <span className="font-bold">{summaryData.packageWon}</span>
                    </p>
                    <p className="text-sm font-medium text-green-700 mb-1">
                    Package: <span className="font-bold text-green-800">฿{summaryData.packageValue.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900 mb-1">{summaryData.wholesaleLeads}</p>
                    <p className="text-sm font-semibold text-blue-600 mb-2">Wholesale</p>
                    <p className="text-sm font-medium text-blue-800">
                      Win: <span className="font-bold">{summaryData.wholesaleWon}</span>
                    </p>
                    <p className="text-sm font-medium text-blue-700">
                    Wholesale: <span className="font-bold text-blue-800">฿{summaryData.wholesaleValue.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                {/* <div className="border-t border-green-200 pt-4 mt-4">
                  <p className="text-sm font-medium text-green-700 mb-1">
                    Package: <span className="font-bold text-green-800">฿{summaryData.packageValue.toLocaleString()}</span>
                  </p>
                  <p className="text-sm font-medium text-blue-700">
                    Wholesale: <span className="font-bold text-blue-800">฿{summaryData.wholesaleValue.toLocaleString()}</span>
                  </p>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Total Value */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-900 mb-2">
                  ฿{(summaryData.packageValue + summaryData.wholesaleValue).toLocaleString()}
                </p>
                <p className="text-lg font-semibold text-orange-700 mb-2">มูลค่ารวมที่ปิดได้</p>
                <p className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-full">
                  Package + Wholesale
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: ลีด EV */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            ลีด EV
          </h3>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-green-900 mb-2">{summaryData.evLeads.toLocaleString()}</p>
                <p className="text-lg font-semibold text-green-700 mb-2">บริษัทหามาเอง</p>
                <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">EV Leads</p>
              </div>
              <div className="border-t border-green-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-900 mb-1">{summaryData.evWon}</p>
                    <p className="text-sm font-medium text-green-600">ปิดได้</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-900 mb-1">฿{summaryData.evValue.toLocaleString()}</p>
                    <p className="text-sm font-medium text-emerald-600">มูลค่า</p>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-lg font-semibold text-green-700">
                    Conversion Rate (Lead): <span className="font-bold">{summaryData.evLeads > 0 ? ((summaryData.evWon / summaryData.evLeads) * 100).toFixed(1) : 0}%</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: ลีด Partner */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            ลีด Partner
          </h3>
          <div className="space-y-3">
            {/* Partner Summary Card */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-900 mb-1">{summaryData.partnerLeads.toLocaleString()}</p>
                  <p className="text-lg font-semibold text-red-700">รวม Partner</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Individual Partner Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Huawei Card */}
              <Card className="bg-white border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img 
                          src="/icons/huawei_logo.svg" 
                          alt="Huawei" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'block';
                          }}
                        />
                        <span className="text-red-600 font-bold text-sm hidden">HW</span>
                      </div>
                    </div>
                    
                    {/* Data Section - 2 Columns */}
                    <div className="flex-1 flex gap-4">
                      {/* Column 1: Lead Count & Platform Name */}
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-red-900 mb-1">{summaryData.huaweiLeads}</p>
                        <p className="text-sm font-semibold text-red-700">Huawei</p>
                      </div>
                      
                      {/* Column 2: Win & Value */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Win: <span className="font-bold">{summaryData.huaweiWon}</span>
                        </p>
                        <p className="text-sm font-medium text-red-800">
                          ฿<span className="font-bold">{summaryData.huaweiValue.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Huawei (C&I) Card */}
              <Card className="bg-white border-red-300 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img 
                          src="/icons/huawei_logo.svg" 
                          alt="Huawei (C&I)" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'block';
                          }}
                        />
                        <span className="text-red-700 font-bold text-sm hidden">HW C&I</span>
                      </div>
                    </div>
                    <div className="flex-1 flex gap-4">
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-red-900 mb-1">{summaryData.huaweiCILeads}</p>
                        <p className="text-sm font-semibold text-red-700">Huawei (C&I)</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Win: <span className="font-bold">{summaryData.huaweiCIWon}</span>
                        </p>
                        <p className="text-sm font-medium text-red-800">
                          ฿<span className="font-bold">{(summaryData.huaweiCIValue || 0).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* ATMOCE Card */}
              <Card className="bg-white border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img 
                          src="/icons/atmoce_logo.svg" 
                          alt="ATMOCE" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'block';
                          }}
                        />
                        <span className="text-blue-600 font-bold text-sm hidden">AT</span>
                      </div>
                    </div>
                    
                    {/* Data Section - 2 Columns */}
                    <div className="flex-1 flex gap-4">
                      {/* Column 1: Lead Count & Platform Name */}
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-blue-900 mb-1">{summaryData.atmoceLeads}</p>
                        <p className="text-sm font-semibold text-blue-700">ATMOCE</p>
                      </div>
                      
                      {/* Column 2: Win & Value */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          Win: <span className="font-bold">{summaryData.atmoceWon}</span>
                        </p>
                        <p className="text-sm font-medium text-blue-800">
                          ฿<span className="font-bold">{summaryData.atmoceValue.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Solar Edge Card */}
              <Card className="bg-white border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img 
                          src="/icons/solar_edge_logo.svg" 
                          alt="Solar Edge" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'block';
                          }}
                        />
                        <span className="text-yellow-600 font-bold text-sm hidden">SE</span>
                      </div>
                    </div>
                    
                    {/* Data Section - 2 Columns */}
                    <div className="flex-1 flex gap-4">
                      {/* Column 1: Lead Count & Platform Name */}
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-yellow-900 mb-1">{summaryData.solarEdgeLeads}</p>
                        <p className="text-sm font-semibold text-yellow-700">Solar Edge</p>
                      </div>
                      
                      {/* Column 2: Win & Value */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                          Win: <span className="font-bold">{summaryData.solarEdgeWon}</span>
                        </p>
                        <p className="text-sm font-medium text-yellow-800">
                          ฿<span className="font-bold">{summaryData.solarEdgeValue.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Sigenergy Card */}
              <Card className="bg-white border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img 
                          src="/icons/sigenergy_logo.svg" 
                          alt="Sigenergy" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'block';
                          }}
                        />
                        <span className="text-purple-600 font-bold text-sm hidden">SG</span>
                      </div>
                    </div>
                    
                    {/* Data Section - 2 Columns */}
                    <div className="flex-1 flex gap-4">
                      {/* Column 1: Lead Count & Platform Name */}
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-purple-900 mb-1">{summaryData.sigenergyLeads}</p>
                        <p className="text-sm font-semibold text-purple-700">Sigenergy</p>
                      </div>
                      
                      {/* Column 2: Win & Value */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-800 mb-1">
                          Win: <span className="font-bold">{summaryData.sigenergyWon}</span>
                        </p>
                        <p className="text-sm font-medium text-purple-800">
                          ฿<span className="font-bold">{summaryData.sigenergyValue.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* solvana Card */}
              <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img 
                          src="/icons/solvana_logo.svg" 
                          alt="solvana" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'block';
                          }}
                        />
                        <span className="text-emerald-600 font-bold text-sm hidden">SV</span>
                      </div>
                    </div>
                    
                    {/* Data Section - 2 Columns */}
                    <div className="flex-1 flex gap-4">
                      {/* Column 1: Lead Count & Platform Name */}
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-emerald-900 mb-1">{summaryData.solvanaLeads}</p>
                        <p className="text-sm font-semibold text-emerald-700">solvana</p>
                      </div>
                      
                      {/* Column 2: Win & Value */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-800 mb-1">
                          Win: <span className="font-bold">{summaryData.solvanaWon}</span>
                        </p>
                        <p className="text-sm font-medium text-emerald-800">
                          ฿<span className="font-bold">{summaryData.solvanaValue.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* terawatt Card */}
              <Card className="bg-white border-teal-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img 
                          src="/icons/terawatt_logo.svg" 
                          alt="terawatt" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            ((e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement).style.display = 'block';
                          }}
                        />
                        <span className="text-teal-600 font-bold text-sm hidden">TW</span>
                      </div>
                    </div>
                    
                    {/* Data Section - 2 Columns */}
                    <div className="flex-1 flex gap-4">
                      {/* Column 1: Lead Count & Platform Name */}
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-teal-900 mb-1">{summaryData.terawattLeads}</p>
                        <p className="text-sm font-semibold text-teal-700">terawatt</p>
                      </div>
                      
                      {/* Column 2: Win & Value */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-teal-800 mb-1">
                          Win: <span className="font-bold">{summaryData.terawattWon}</span>
                        </p>
                        <p className="text-sm font-medium text-teal-800">
                          ฿<span className="font-bold">{(summaryData.terawattValue || 0).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Column 3: โครงการ PPA */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            โครงการ PPA
          </h3>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-blue-900 mb-2">{summaryData.ppaProjectLeads.toLocaleString()}</p>
                <p className="text-lg font-semibold text-blue-700 mb-2">ลีดจากโครงการ PPA</p>
                <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-full">Power Purchase Agreement</p>
              </div>
              <div className="border-t border-blue-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-800 mb-1">Win</p>
                    <p className="text-xl font-bold text-blue-900">{summaryData.ppaProjectWon.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-800 mb-1">มูลค่า</p>
                    <p className="text-xl font-bold text-blue-900">฿{summaryData.ppaProjectValue.toLocaleString()}</p>
                  </div>
                </div>
                {summaryData.ppaProjectLeads > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-blue-600 text-center">
                      Conversion Rate: <span className="font-bold">{((summaryData.ppaProjectWon / summaryData.ppaProjectLeads) * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          กราฟวิเคราะห์ข้อมูล
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* สัดส่วน Leads ตามประเภท */}
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วน Leads ตามประเภท</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: function(params: any) {
                    const color = params.name === 'Package' ? '#10B981' : '#3B82F6';
                    return `
                      <div style="padding: 8px;">
                        <div style="font-weight: bold; color: #374151; margin-bottom: 4px;">${params.name}</div>
                        <div style="color: #6B7280; font-size: 12px;">จำนวน: ${params.value}</div>
                        <div style="color: ${color}; font-size: 12px;">สัดส่วน: ${params.percent.toFixed(1)}%</div>
                      </div>
                    `;
                  }
                },
                legend: {
                  orient: 'vertical',
                  left: 'left',
                  bottom: 0,
                  textStyle: {
                    color: '#374151'
                  }
                },
                series: [
                  {
                    name: 'ประเภท Leads',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['50%', '50%'],
                    data: pieData.map(item => ({
                      value: item.value,
                      name: item.name,
                      itemStyle: { color: item.color }
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
              }}
              style={{ height: '250px' }}
            />
          </CardContent>
        </Card>

        {/* เปรียบเทียบผลงาน Package vs Wholesale */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">เปรียบเทียบผลงาน Package vs Wholesale</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                  axisPointer: {
                    type: 'shadow'
                  }
                },
                legend: {
                  data: ['จำนวนลีด', 'ลีดที่ปิดได้', 'Win Rate (%)']
                },
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '3%',
                  containLabel: true
                },
                xAxis: {
                  type: 'category',
                  data: ['Package', 'Wholesale']
                },
                yAxis: [
                  {
                    type: 'value',
                    name: 'จำนวน',
                    position: 'left'
                  },
                  {
                    type: 'value',
                    name: 'Win Rate (%)',
                    position: 'right',
                    max: 100
                  }
                ],
                series: [
                  {
                    name: 'จำนวนลีด',
                    type: 'bar',
                    data: [summaryData.packageLeads, summaryData.wholesaleLeads],
                    itemStyle: { color: '#10B981' }
                  },
                  {
                    name: 'ลีดที่ปิดได้',
                    type: 'bar',
                    data: [summaryData.packageWon, summaryData.wholesaleWon],
                    itemStyle: { color: '#3B82F6' }
                  },
                  {
                    name: 'Win Rate (%)',
                    type: 'line',
                    yAxisIndex: 1,
                    data: [
                      summaryData.packageLeads > 0 ? (summaryData.packageWon / summaryData.packageLeads) * 100 : 0,
                      summaryData.wholesaleLeads > 0 ? (summaryData.wholesaleWon / summaryData.wholesaleLeads) * 100 : 0
                    ],
                    itemStyle: { color: '#6B7280' }
                  }
                ]
              }}
              style={{ height: '250px' }}
            />
          </CardContent>
        </Card>

        {/* EV vs Partner Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>EV vs Partner Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
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
                legend: {
                  orient: 'vertical',
                  left: 'left',
                  bottom: 0,
                  textStyle: {
                    color: '#374151'
                  }
                },
                series: [
                  {
                    name: 'EV vs Partner Platforms',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['50%', '50%'],
                    data: sourceData.map(item => ({
                      value: item.value,
                      name: item.name,
                      itemStyle: { color: item.color }
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
              }}
              style={{ height: '250px' }}
            />
          </CardContent>
        </Card>

        {/* เปรียบเทียบผลงาน EV vs Partner Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">เปรียบเทียบผลงาน EV vs Partner Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                  axisPointer: {
                    type: 'shadow'
                  }
                },
                legend: {
                  data: ['จำนวนลีด', 'ลีดที่ปิดได้', 'Win Rate (%)']
                },
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '3%',
                  containLabel: true
                },
                xAxis: {
                  type: 'category',
                  data: performanceData.map(item => item.name)
                },
                yAxis: [
                  {
                    type: 'value',
                    name: 'จำนวน',
                    position: 'left'
                  },
                  {
                    type: 'value',
                    name: 'Win Rate (%)',
                    position: 'right',
                    max: 100
                  }
                ],
                series: [
                  {
                    name: 'จำนวนลีด',
                    type: 'bar',
                    data: performanceData.map(item => item.leads),
                    itemStyle: { 
                      color: (params: any) => {
                        const colors = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6'];
                        return colors[params.dataIndex] || '#6B7280';
                      }
                    }
                  },
                  {
                    name: 'ลีดที่ปิดได้',
                    type: 'bar',
                    data: performanceData.map(item => item.won),
                    itemStyle: { 
                      color: (params: any) => {
                        const colors = ['#059669', '#DC2626', '#2563EB', '#D97706', '#7C3AED'];
                        return colors[params.dataIndex] || '#6B7280';
                      }
                    }
                  },
                  {
                    name: 'Win Rate (%)',
                    type: 'line',
                    yAxisIndex: 1,
                    data: performanceData.map(item => item.winRate),
                    itemStyle: { color: '#6B7280' }
                  }
                ]
              }}
              style={{ height: '250px' }}
            />
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadSummary;





