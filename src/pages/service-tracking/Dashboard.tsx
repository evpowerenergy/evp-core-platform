import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  MapPin,
  Calendar,
  Loader2,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePermitRequestStats, usePermitRequests } from "@/hooks/usePermitRequests";
import { useCustomerServiceStatsAPI as useCustomerServiceStats, useCustomerServicesAPI as useCustomerServices } from "@/hooks/useCustomerServicesAPI";
import { PageLoading } from "@/components/ui/loading";
import ReactECharts from 'echarts-for-react';
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

const ServiceTrackingDashboard = () => {
  const navigate = useNavigate();
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date() 
  });

  // Fetch data from both systems
  const { data: permitStats, isLoading: permitStatsLoading, error: permitStatsError } = usePermitRequestStats();
  const { data: permitRequests, isLoading: permitRequestsLoading, error: permitRequestsError } = usePermitRequests({});
  const { data: customerServiceStats, isLoading: customerServiceStatsLoading, error: customerServiceStatsError } = useCustomerServiceStats();
  const { data: customerServices, isLoading: customerServicesLoading, error: customerServicesError } = useCustomerServices({});

  // Loading state
  const isLoading = permitStatsLoading || permitRequestsLoading || customerServiceStatsLoading || customerServicesLoading;
  const hasError = permitStatsError || permitRequestsError || customerServiceStatsError || customerServicesError;

  // Filter data based on date range
  const filterDataByDateRange = (data: any[]) => {
    if (!dateRangeFilter?.from) return data;
    
    const fromDate = dateRangeFilter.from;
    const toDate = dateRangeFilter.to || dateRangeFilter.from;
    
    return data.filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= fromDate && itemDate <= toDate;
    });
  };

  const filteredPermitRequests = filterDataByDateRange(permitRequests || []);
  const filteredCustomerServices = filterDataByDateRange(customerServices || []);

  // Calculate combined statistics with filtered data
  const totalWork = filteredPermitRequests.length + filteredCustomerServices.length;
  const totalCompleted = (permitStats?.completed || 0) + (customerServiceStats?.completed || 0);
  const totalPending = (permitStats?.pending || 0) + (customerServiceStats?.pendingServiceVisit1 || 0) + (customerServiceStats?.pendingServiceVisit2 || 0) + (customerServiceStats?.pendingServiceVisit3 || 0) + (customerServiceStats?.pendingServiceVisit4 || 0) + (customerServiceStats?.pendingServiceVisit5 || 0);
  const totalInProgress = (permitStats?.inProgress || 0) + (customerServiceStats?.serviceVisit1Completed || 0) - (customerServiceStats?.completed || 0);

  // Calculate province statistics from both systems (filtered)
  const combinedProvinceStats = [...filteredPermitRequests, ...filteredCustomerServices].reduce((acc, item) => {
    const province = item.province || 'ไม่ระบุ';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate province statistics for each system separately (filtered)
  const permitProvinceStats = filteredPermitRequests.reduce((acc, item) => {
    const province = item.province || 'ไม่ระบุ';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const customerServiceProvinceStats = filteredCustomerServices.reduce((acc, item) => {
    const province = item.province || 'ไม่ระบุ';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate kW size statistics for customer services
  const customerServiceKwSizeStats = filteredCustomerServices.reduce((acc, item) => {
    const kwSize = item.capacity_kw || 'ไม่ระบุ';
    const sizeKey = typeof kwSize === 'number' ? `${kwSize} kW` : kwSize;
    acc[sizeKey] = (acc[sizeKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ไม่สามารถดำเนินการได้":
        return "bg-red-100 text-red-800 border-red-200";
      case "ระหว่างดำเนินการ":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ดำเนินการเสร็จสิ้น":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ไม่สามารถดำเนินการได้":
        return <AlertCircle className="h-4 w-4" />;
      case "ระหว่างดำเนินการ":
        return <Clock className="h-4 w-4" />;
      case "ดำเนินการเสร็จสิ้น":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get recent 5 requests (will be overridden below)

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Chart configurations
  const permitStatusChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: 'คำขออนุญาต',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: [
          { value: permitStats?.pending || 0, name: 'ไม่สามารถดำเนินการได้', itemStyle: { color: '#ef4444' } },
          { value: permitStats?.inProgress || 0, name: 'ระหว่างดำเนินการ', itemStyle: { color: '#f59e0b' } },
          { value: permitStats?.completed || 0, name: 'เสร็จสิ้น', itemStyle: { color: '#10b981' } }
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
  };

  const customerServiceStatusChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: 'Service ลูกค้า',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: [
          { value: customerServiceStats?.pendingServiceVisit1 || 0, name: 'ยังไม่ได้รับบริการ', itemStyle: { color: '#ef4444' } },
          { value: (customerServiceStats?.serviceVisit1Completed || 0) - (customerServiceStats?.completed || 0), name: 'บริการครั้งที่ 1', itemStyle: { color: '#f59e0b' } },
          { value: customerServiceStats?.completed || 0, name: 'บริการครบแล้ว 2 ครั้ง', itemStyle: { color: '#10b981' } }
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
  };

  const permitProvinceChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'category',
      data: Object.keys(permitProvinceStats).slice(0, 8),
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'จำนวนคำขอ',
        type: 'bar',
        data: Object.values(permitProvinceStats).slice(0, 8),
        itemStyle: { color: '#f97316' }
      }
    ]
  };

  const customerServiceProvinceChartOption = {
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
  };

  const customerServiceKwSizeChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      bottom: '5px',
      itemGap: 15,
      textStyle: {
        fontSize: 10
      }
    },
    grid: {
      show: false
    },
    xAxis: {
      show: false
    },
    yAxis: {
      show: false
    },
    series: [
      {
        name: 'ขนาด kW',
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '45%'],
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}',
          fontSize: 12,
          distance: 10
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 5
        },
        data: Object.entries(customerServiceKwSizeStats).map(([key, value]) => ({
          value,
          name: key,
          itemStyle: { 
            color: key === 'ไม่ระบุ' ? '#6b7280' : 
                   key.includes('5') ? '#ef4444' :
                   key.includes('10') ? '#f59e0b' :
                   key.includes('15') ? '#10b981' :
                   key.includes('20') ? '#3b82f6' :
                   key.includes('25') ? '#8b5cf6' :
                   key.includes('30') ? '#ec4899' :
                   '#6366f1'
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
  };

  // Calculate monthly statistics (filtered) - separate by data type
  const permitMonthlyStats = filteredPermitRequests.reduce((acc, item) => {
    if (item.online_date) {
      const month = new Date(item.online_date).toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const serviceMonthlyStats = filteredCustomerServices.reduce((acc, item) => {
    if (item.service_date_visit2) {
      const month = new Date(item.service_date_visit2).toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Combine all months from both datasets
  const allMonths = [...Object.keys(permitMonthlyStats), ...Object.keys(serviceMonthlyStats)];
  const uniqueMonths = Array.from(new Set(allMonths)).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const monthlyTrendChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['คำขออนุญาต (วันออนระบบ)', 'Service ลูกค้า (ครบ 2 ครั้ง)'],
      top: 'bottom'
    },
    xAxis: {
      type: 'category',
      data: uniqueMonths
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'คำขออนุญาต (วันออนระบบ)',
        type: 'line',
        data: uniqueMonths.map(month => permitMonthlyStats[month] || 0),
        itemStyle: { color: '#f97316' }
      },
      {
        name: 'Service ลูกค้า (ครบ 2 ครั้ง)',
        type: 'line',
        data: uniqueMonths.map(month => serviceMonthlyStats[month] || 0),
        itemStyle: { color: '#3b82f6' }
      }
    ]
  };

  if (isLoading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              Service Tracking Dashboard รวม
            </h1>
            <p className="text-gray-600">ภาพรวมการติดตามการขออนุญาตและบริการลูกค้า</p>
            {hasError && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">ช่วงเวลา:</span>
              <div className="w-64">
                <DateRangePicker
                  value={dateRangeFilter}
                  onChange={setDateRangeFilter}
                  placeholder="เลือกช่วงเวลา"
                  presets={true}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate("/service-tracking/requests/new")}
                className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                เพิ่มคำขออนุญาต
              </Button>
              <Button 
                onClick={() => navigate("/service-tracking/customer-services/new")}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Users className="h-4 w-4 mr-2" />
                เพิ่ม Service ลูกค้า
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats Cards - 2 Columns Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column - ระบบคำขออนุญาต */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ระบบคำขออนุญาต
              </h3>
              <div className="text-right">
                <p className="text-sm text-orange-600">ทั้งหมด</p>
                <p className="text-2xl font-bold text-orange-800">{permitStats?.total || 0}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white border-red-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-red-600 mb-2">ไม่สามารถดำเนินการได้</p>
                    <p className="text-xl font-bold text-red-800">{permitStats?.pending || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-yellow-600 mb-2">ระหว่างดำเนินการ</p>
                    <p className="text-xl font-bold text-yellow-800">{permitStats?.inProgress || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-green-600 mb-2">ดำเนินการเสร็จสิ้น</p>
                    <p className="text-xl font-bold text-green-800">{permitStats?.completed || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Column - ระบบ Service ลูกค้า */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                ระบบ Service ลูกค้า
              </h3>
              <div className="text-right">
                <p className="text-sm text-blue-600">ทั้งหมด</p>
                <p className="text-2xl font-bold text-blue-800">{customerServiceStats?.total || 0}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white border-red-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-red-600 mb-2">ยังไม่ได้รับบริการ</p>
                    <p className="text-xl font-bold text-red-800">{customerServiceStats?.pendingServiceVisit1 || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-yellow-600 mb-2">บริการครั้งที่ 1</p>
                    <p className="text-xl font-bold text-yellow-800">{(customerServiceStats?.serviceVisit1Completed || 0) - (customerServiceStats?.completed || 0)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-green-600 mb-2">บริการครบแล้ว 2 ครั้ง</p>
                    <p className="text-xl font-bold text-green-800">{customerServiceStats?.completed || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* System Analysis - 2 Columns Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column - ระบบคำขออนุญาต */}
        <div className="space-y-6">

          {/* Status Chart */}
          <Card className="bg-white border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                สถานะคำขออนุญาต
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ReactECharts option={permitStatusChartOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </CardContent>
          </Card>

          {/* Province Chart */}
          {/* <Card className="bg-white border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                จังหวัด - คำขออนุญาต
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ReactECharts option={permitProvinceChartOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </CardContent>
          </Card> */}

          {/* Action Button */}
          {/* <Button 
            variant="outline" 
            onClick={() => navigate("/service-tracking/permit-dashboard")}
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 h-12 text-lg font-medium"
          >
            <FileText className="h-5 w-5 mr-2" />
            ดู Dashboard คำขออนุญาต
          </Button> */}
        </div>

        {/* Right Column - ระบบ Service ลูกค้า */}
        <div className="space-y-6">

          {/* Status Chart */}
          <Card className="bg-white border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                สถานะ Service ลูกค้า
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ReactECharts option={customerServiceStatusChartOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </CardContent>
          </Card>

          {/* Province and kW Size Charts - Same Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Province Chart */}
            {/* <Card className="bg-white border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  จังหวัด - Service ลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ReactECharts option={customerServiceProvinceChartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </CardContent>
            </Card> */}

            {/* kW Size Chart */}
            {/* <Card className="bg-white border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  ขนาด kW ที่ติดตั้ง 
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ReactECharts option={customerServiceKwSizeChartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Action Button */}
          {/* <Button 
            variant="outline" 
            onClick={() => navigate("/service-tracking/customer-services-dashboard")}
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 h-12 text-lg font-medium"
          >
            <Users className="h-5 w-5 mr-2" />
            ดู Dashboard Service ลูกค้า
          </Button> */}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              แนวโน้มรายเดือน
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ReactECharts option={monthlyTrendChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceTrackingDashboard;

