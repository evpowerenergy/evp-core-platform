import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { Users, TrendingUp, Calendar, Filter, DollarSign, FileText, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { getSalesDataInPeriod } from "@/utils/salesUtils";
import { getQuotationDataFromDocuments } from "@/utils/salesUtils";
import SalesFunnelChart from "@/components/charts/SalesFunnelChart";
import { TeamFilterSelect } from "@/components/filters/TeamFilterSelect";
import * as XLSX from 'xlsx';

interface FunnelData {
  stage1: {
    totalLeads: number;
    platformBreakdown: { [key: string]: number };
    categoryBreakdown: { [key: string]: number };
  };
  stage2: {
    totalQuotations: number;
    totalValue: number;
    platformBreakdown: { [key: string]: number };
    categoryBreakdown: { [key: string]: number };
  };
  stage3: {
    totalClosedQuotations: number;
    totalClosedValue: number;
    platformBreakdown: { [key: string]: number };
    categoryBreakdown: { [key: string]: number };
  };
}

const SalesFunnel = () => {
  const { data: salesTeamData, isLoading: salesTeamLoading } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};
  
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(), 
    to: new Date() 
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [funnelData, setFunnelData] = useState<FunnelData>({
    stage1: { totalLeads: 0, platformBreakdown: {}, categoryBreakdown: {} },
    stage2: { totalQuotations: 0, totalValue: 0, platformBreakdown: {}, categoryBreakdown: {} },
    stage3: { totalClosedQuotations: 0, totalClosedValue: 0, platformBreakdown: {}, categoryBreakdown: {} }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, [dateRangeFilter, salesFilter, categoryFilter]);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      
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
        startDate = '';
        endDate = '';
      }

      const salesFilterParam = salesFilter !== 'all' ? salesFilter : undefined;
      const categoryParam = categoryFilter !== 'all' ? categoryFilter : undefined;

      const [stage1Data, stage2Data, stage3Data] = await Promise.all([
        fetchStage1Data(startDate, endDate, salesFilterParam, categoryParam),
        fetchStage2Data(startDate, endDate, salesFilterParam, categoryParam),
        fetchStage3Data(startDate, endDate, salesFilterParam, categoryParam)
      ]);

      setFunnelData({
        stage1: stage1Data,
        stage2: stage2Data,
        stage3: stage3Data
      });

    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStage1Data = async (startDate: string, endDate: string, salesFilter?: string, category?: string) => {
    let query = supabase
      .from('leads')
      .select('id, platform, category, sale_owner_id, post_sales_owner_id')
      .or('sale_owner_id.not.is.null,post_sales_owner_id.not.is.null') // รวมทั้ง sale_owner_id และ post_sales_owner_id
      .eq('is_archived', false);

    if (startDate && endDate) {
      query = query.gte('created_at_thai', startDate).lte('created_at_thai', endDate);
    }

    if (salesFilter) {
      // Apply sales filter - รวมทั้ง sale_owner_id และ post_sales_owner_id
      query = query.or(`sale_owner_id.eq.${salesFilter},post_sales_owner_id.eq.${salesFilter}`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching stage 1 data:', error);
      return { totalLeads: 0, platformBreakdown: {}, categoryBreakdown: {} };
    }

    const platformBreakdown: { [key: string]: number } = {};
    const categoryBreakdown: { [key: string]: number } = {};

    leads?.forEach(lead => {
      const platform = lead.platform || 'ไม่ระบุ';
      const category = lead.category || 'ไม่ระบุ';
      
      platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    return {
      totalLeads: leads?.length || 0,
      platformBreakdown,
      categoryBreakdown
    };
  };

  const fetchStage2Data = async (startDate: string, endDate: string, salesFilter?: string, category?: string) => {
    try {
      const quotationData = await getQuotationDataFromDocuments(
        startDate || new Date().toISOString(), 
        endDate || new Date().toISOString(), 
        category,
        salesFilter
      );

      const platformBreakdown: { [key: string]: number } = {};
      const categoryBreakdown: { [key: string]: number } = {};

      quotationData.quotationLogsWithQuotations?.forEach(log => {
        // ใช้ leadPlatform และ leadCategory เพราะ getQuotationDataFromDocuments ส่งมาแบบนี้
        const platform = log.leadPlatform || 'ไม่ระบุ';
        const category = log.leadCategory || 'ไม่ระบุ';
        
        platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      });

      return {
        totalQuotations: quotationData.quotationCount || 0,
        totalValue: quotationData.totalQuotationValue || 0,
        platformBreakdown,
        categoryBreakdown
      };
    } catch (error) {
      console.error('Error fetching stage 2 data:', error);
      return { totalQuotations: 0, totalValue: 0, platformBreakdown: {}, categoryBreakdown: {} };
    }
  };

  const fetchStage3Data = async (startDate: string, endDate: string, salesFilter?: string, category?: string) => {
    try {
      const salesData = await getSalesDataInPeriod(
        startDate || new Date().toISOString(), 
        endDate || new Date().toISOString(), 
        salesFilter
      );

      const platformBreakdown: { [key: string]: number } = {};
      const categoryBreakdown: { [key: string]: number } = {};

      salesData.salesLeads?.forEach(lead => {
        const platform = lead.platform || 'ไม่ระบุ';
        const category = lead.category || 'ไม่ระบุ';
        
        platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      });

      return {
        totalClosedQuotations: salesData.salesCount || 0,
        totalClosedValue: salesData.totalSalesValue || 0,
        platformBreakdown,
        categoryBreakdown
      };
    } catch (error) {
      console.error('Error fetching stage 3 data:', error);
      return { totalClosedQuotations: 0, totalClosedValue: 0, platformBreakdown: {}, categoryBreakdown: {} };
    }
  };

  const getConversionRate = (current: number, previous: number): number => {
    return previous > 0 ? (current / previous) * 100 : 0;
  };

  const exportToExcel = () => {
    const stage1ToStage2Rate = getConversionRate(funnelData.stage2.totalQuotations, funnelData.stage1.totalLeads);
    const stage2ToStage3Rate = getConversionRate(funnelData.stage3.totalClosedQuotations, funnelData.stage2.totalQuotations);

    const excelData = [
      {
        'ชั้น': '1. ลีดที่เซลล์รับแล้ว',
        'จำนวน': funnelData.stage1.totalLeads,
        'เปอร์เซ็นต์': '100%',
        'มูลค่า': '-',
        'Conversion Rate': '-'
      },
      {
        'ชั้น': '2. QT ทั้งหมด',
        'จำนวน': funnelData.stage2.totalQuotations,
        'เปอร์เซ็นต์': `${stage1ToStage2Rate.toFixed(1)}%`,
        'มูลค่า': funnelData.stage2.totalValue,
        'Conversion Rate': `${stage1ToStage2Rate.toFixed(1)}%`
      },
      {
        'ชั้น': '3. QT ที่ปิดการขาย',
        'จำนวน': funnelData.stage3.totalClosedQuotations,
        'เปอร์เซ็นต์': `${getConversionRate(funnelData.stage3.totalClosedQuotations, funnelData.stage1.totalLeads).toFixed(1)}%`,
        'มูลค่า': funnelData.stage3.totalClosedValue,
        'Conversion Rate': `${stage2ToStage3Rate.toFixed(1)}%`
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Funnel การขาย');

    const currentDate = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
    const fileName = `Funnel_การขาย_${currentDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  const stage1ToStage2Rate = getConversionRate(funnelData.stage2.totalQuotations, funnelData.stage1.totalLeads);
  const stage2ToStage3Rate = getConversionRate(funnelData.stage3.totalClosedQuotations, funnelData.stage2.totalQuotations);
  const overallRate = getConversionRate(funnelData.stage3.totalClosedQuotations, funnelData.stage1.totalLeads);

  return (
    <div className="space-y-4">
      {/* Compact Filter Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                <span>ประเภท</span>
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="Package">Package</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ลีดทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {funnelData.stage1.totalLeads.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">ชั้นที่ 1</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">QT ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {funnelData.stage2.totalQuotations.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">ชั้นที่ 2</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ปิดการขาย</p>
                <p className="text-2xl font-bold text-gray-900">
                  {funnelData.stage3.totalClosedQuotations.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">ชั้นที่ 3</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">อัตราการแปลง</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">รวมทั้งหมด</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-700">ลีด → QT</p>
              <p className="text-3xl font-bold text-blue-600">
                {stage1ToStage2Rate.toFixed(1)}%
              </p>
              <p className="text-xs text-blue-600">
                {funnelData.stage2.totalQuotations.toLocaleString()} จาก {funnelData.stage1.totalLeads.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-green-700">QT → ปิดการขาย</p>
              <p className="text-3xl font-bold text-green-600">
                {stage2ToStage3Rate.toFixed(1)}%
              </p>
              <p className="text-xs text-green-600">
                {funnelData.stage3.totalClosedQuotations.toLocaleString()} จาก {funnelData.stage2.totalQuotations.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart and Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <div>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Funnel การขาย
                </CardTitle>
                <Button 
                  onClick={exportToExcel}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <SalesFunnelChart 
                  stage1Data={funnelData.stage1}
                  stage2Data={funnelData.stage2}
                  stage3Data={funnelData.stage3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        <div>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                การกระจายตาม Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Stage 1 - Leads */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    ลีดทั้งหมด ({funnelData.stage1.totalLeads.toLocaleString()})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(funnelData.stage1.platformBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([platform, count]) => {
                        const percentage = funnelData.stage1.totalLeads > 0 
                          ? ((count / funnelData.stage1.totalLeads) * 100).toFixed(1) 
                          : '0.0';
                        return (
                          <div key={platform} className="bg-blue-50 p-2 rounded-lg">
                            <div className="text-xs font-medium text-blue-900 truncate" title={platform}>{platform}</div>
                            <div className="text-sm font-bold text-blue-600">{count.toLocaleString()}</div>
                            <div className="text-xs text-blue-600">{percentage}%</div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Stage 2 - Quotations */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    QT ทั้งหมด ({funnelData.stage2.totalQuotations.toLocaleString()})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(funnelData.stage2.platformBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([platform, count]) => {
                        const percentage = funnelData.stage2.totalQuotations > 0 
                          ? ((count / funnelData.stage2.totalQuotations) * 100).toFixed(1) 
                          : '0.0';
                        return (
                          <div key={platform} className="bg-orange-50 p-2 rounded-lg">
                            <div className="text-xs font-medium text-orange-900 truncate" title={platform}>{platform}</div>
                            <div className="text-sm font-bold text-orange-600">{count.toLocaleString()}</div>
                            <div className="text-xs text-orange-600">{percentage}%</div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Stage 3 - Closed Sales */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    ปิดการขาย ({funnelData.stage3.totalClosedQuotations.toLocaleString()})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(funnelData.stage3.platformBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([platform, count]) => {
                        const percentage = funnelData.stage3.totalClosedQuotations > 0 
                          ? ((count / funnelData.stage3.totalClosedQuotations) * 100).toFixed(1) 
                          : '0.0';
                        return (
                          <div key={platform} className="bg-green-50 p-2 rounded-lg">
                            <div className="text-xs font-medium text-green-900 truncate" title={platform}>{platform}</div>
                            <div className="text-sm font-bold text-green-600">{count.toLocaleString()}</div>
                            <div className="text-xs text-green-600">{percentage}%</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Value Summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            สรุปมูลค่าการขาย
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">มูลค่า QT ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{funnelData.stage2.totalValue.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">มูลค่าปิดการขาย</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{funnelData.stage3.totalClosedValue.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">มูลค่าเฉลี่ยต่อ QT</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{funnelData.stage2.totalQuotations > 0 
                  ? (funnelData.stage2.totalValue / funnelData.stage2.totalQuotations).toLocaleString() 
                  : '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesFunnel;
