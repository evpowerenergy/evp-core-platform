import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  MapPin,
  Calendar,
  Loader2,
  Wrench,
  Zap,
  Phone,
  Download,
  BarChart3
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerServiceStatsAPI as useCustomerServiceStats, useCustomerServicesAPI as useCustomerServices } from "@/hooks/useCustomerServicesAPI";
import { useServiceVisitsAPI as useServiceVisits, useUpcomingServiceVisitsAPI as useUpcomingServiceVisits } from "@/hooks/useServiceVisitsAPI";
import { PageLoading } from "@/components/ui/loading";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import ReactECharts from 'echarts-for-react';

const CustomerServiceDashboard = () => {
  const navigate = useNavigate();
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);

  // Fetch data from Supabase
  const { data: stats, isLoading: statsLoading, error: statsError } = useCustomerServiceStats();
  const { data: recentCustomerServices, isLoading: servicesLoading, error: servicesError } = useCustomerServices();
  const { data: upcomingVisits, isLoading: upcomingLoading, error: upcomingError } = useUpcomingServiceVisits();


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export to Excel function
  const handleExportExcel = () => {
    if (!recentCustomerServices || recentCustomerServices.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    // Create CSV content
    const headers = [
      'ฝ่ายขาย',
      'กลุ่มไลน์ซัพพอร์ตลูกค้า', 
      'เบอร์โทร',
      'จังหวัด',
      'อำเภอ',
      'ขนาดที่ติดตั้ง',
      'วันที่ติดตั้ง',
      'วันที่ Service ครั้งที่ 1',
      'วันที่ Service ครั้งที่ 2',
      'วันที่ Service ครั้งที่ 3',
      'วันที่ Service ครั้งที่ 4',
      'วันที่ Service ครั้งที่ 5',
      'หมายเหตุ',
      'ช่างติดตั้ง',
      'บริการครั้งที่ 1',
      'บริการครั้งที่ 2',
      'บริการครั้งที่ 3',
      'บริการครั้งที่ 4',
      'บริการครั้งที่ 5',
      'จำนวนครั้งที่เสร็จสิ้น'
    ];

    const csvContent = [
      headers.join(','),
      ...recentCustomerServices.map(service => [
        service.sale || '',
        service.customer_group,
        service.tel,
        service.province,
        service.district || '',
        service.capacity_kw ? `${service.capacity_kw} kW` : '',
        service.installation_date_thai ? new Date(service.installation_date_thai).toLocaleDateString('th-TH') : '',
        service.service_visit_1_date_thai ? new Date(service.service_visit_1_date_thai).toLocaleDateString('th-TH') : '',
        service.service_visit_2_date_thai ? new Date(service.service_visit_2_date_thai).toLocaleDateString('th-TH') : '',
        service.service_visit_3_date_thai ? new Date(service.service_visit_3_date_thai).toLocaleDateString('th-TH') : '',
        service.service_visit_4_date_thai ? new Date(service.service_visit_4_date_thai).toLocaleDateString('th-TH') : '',
        service.service_visit_5_date_thai ? new Date(service.service_visit_5_date_thai).toLocaleDateString('th-TH') : '',
        service.notes || '',
        service.installer_name || '',
        service.service_visit_1 ? 'เสร็จสิ้น' : 'รอดำเนินการ',
        service.service_visit_2 ? 'เสร็จสิ้น' : 'รอดำเนินการ',
        service.service_visit_3 ? 'เสร็จสิ้น' : 'รอดำเนินการ',
        service.service_visit_4 ? 'เสร็จสิ้น' : 'รอดำเนินการ',
        service.service_visit_5 ? 'เสร็จสิ้น' : 'รอดำเนินการ',
        service.completed_visits_count || 0
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customer-services-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (statsLoading || servicesLoading || upcomingLoading) {
    return <PageLoading type="dashboard" />;
  }

  // Error state
  if (statsError || servicesError || upcomingError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <p className="text-gray-600 text-sm mt-2">
            {statsError?.message || servicesError?.message || upcomingError?.message}
          </p>
        </div>
      </div>
    );
  }



  const displayStats = stats || {
    total: 0,
    completed: 0,
    serviceVisit1Completed: 0,
    serviceVisit2Completed: 0,
    pendingServiceVisit1: 0,
    pendingServiceVisit2: 0,
  };
  const displayRecentServices = recentCustomerServices || [];
  const displayUpcomingVisits = upcomingVisits || [];

  // Filter data by date range
  const filteredCustomerServices = (recentCustomerServices || []).filter(service => {
    if (!dateRangeFilter || !dateRangeFilter.from) return true;
    
    const serviceDate = service.installation_date_thai ? new Date(service.installation_date_thai) : null;
    if (!serviceDate) return false;
    
    const fromDate = dateRangeFilter.from;
    const toDate = dateRangeFilter.to || dateRangeFilter.from;
    
    // Reset time to start of day for fromDate (00:00:00)
    const fromDateTime = new Date(fromDate);
    fromDateTime.setHours(0, 0, 0, 0);
    
    // Reset time to end of day for toDate (23:59:59)
    const toDateTime = new Date(toDate);
    toDateTime.setHours(23, 59, 59, 999);
    
    // Compare dates
    if (serviceDate < fromDateTime) return false;
    if (serviceDate > toDateTime) return false;
    
    return true;
  });

  // Calculate filtered stats
  const filteredStats = {
    total: filteredCustomerServices.length,
    completed: filteredCustomerServices.filter(item => item.completed_visits_count >= 2).length,
    serviceVisit1Completed: filteredCustomerServices.filter(item => item.service_visit_1 === true).length,
    serviceVisit2Completed: filteredCustomerServices.filter(item => item.service_visit_2 === true).length,
    serviceVisit3Completed: filteredCustomerServices.filter(item => item.service_visit_3 === true).length,
    serviceVisit4Completed: filteredCustomerServices.filter(item => item.service_visit_4 === true).length,
    serviceVisit5Completed: filteredCustomerServices.filter(item => item.service_visit_5 === true).length,
    pendingServiceVisit1: filteredCustomerServices.filter(item => item.service_visit_1 !== true).length,
    pendingServiceVisit2: filteredCustomerServices.filter(item => item.service_visit_1 === true && item.service_visit_2 !== true).length,
    pendingServiceVisit3: filteredCustomerServices.filter(item => item.service_visit_2 === true && item.service_visit_3 !== true).length,
    pendingServiceVisit4: filteredCustomerServices.filter(item => item.service_visit_3 === true && item.service_visit_4 !== true).length,
    pendingServiceVisit5: filteredCustomerServices.filter(item => item.service_visit_4 === true && item.service_visit_5 !== true).length,
  };
  
  // Calculate completion rate
  const completionRate = filteredStats.total > 0 
    ? Math.round((filteredStats.completed / filteredStats.total) * 100) 
    : 0;

  // Calculate statistics for charts
  const customerServiceKwSizeStats = filteredCustomerServices.reduce((acc, item) => {
    const kwSize = item.capacity_kw || 'ไม่ระบุ';
    const sizeKey = typeof kwSize === 'number' ? `${kwSize} kW` : kwSize;
    acc[sizeKey] = (acc[sizeKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const customerServiceProvinceStats = filteredCustomerServices.reduce((acc, item) => {
    const province = item.province || 'ไม่ระบุ';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Chart options for kW Size
  const customerServiceKwSizeChartOption = {
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
  };

  // Chart options for Province
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

  // Chart options for Service Status
  const customerServiceStatusChartOption = {
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
          { value: filteredStats.pendingServiceVisit1, name: 'ยังไม่ได้รับบริการ', itemStyle: { color: '#6b7280' } },
          { value: filteredStats.serviceVisit1Completed, name: 'บริการครั้งที่ 1 ครบแล้ว', itemStyle: { color: '#f59e0b' } },
          { value: filteredStats.serviceVisit2Completed, name: 'บริการครั้งที่ 2 ครบแล้ว', itemStyle: { color: '#3b82f6' } },
          { value: filteredStats.serviceVisit3Completed, name: 'บริการครั้งที่ 3 ครบแล้ว', itemStyle: { color: '#8b5cf6' } },
          { value: filteredStats.serviceVisit4Completed, name: 'บริการครั้งที่ 4 ครบแล้ว', itemStyle: { color: '#ec4899' } },
          { value: filteredStats.serviceVisit5Completed, name: 'บริการครั้งที่ 5 ครบแล้ว', itemStyle: { color: '#10b981' } }
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

  return (
    <div className="w-full space-y-6">

      {/* Stats Cards and Date Filter */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 flex-1">
        {/* Pending Service Visit 1 */}
        <Card className="border-orange-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">รอบริการครั้งที่ 1</p>
                <p className="text-3xl font-bold text-gray-900">{filteredStats.pendingServiceVisit1}</p>
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
                <p className="text-3xl font-bold text-gray-900">{filteredStats.pendingServiceVisit2}</p>
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
                <p className="text-3xl font-bold text-gray-900">{filteredStats.pendingServiceVisit3}</p>
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
                <p className="text-3xl font-bold text-gray-900">{filteredStats.pendingServiceVisit4}</p>
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
                <p className="text-3xl font-bold text-gray-900">{filteredStats.pendingServiceVisit5}</p>
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
                <p className="text-3xl font-bold text-gray-900">{filteredStats.completed}</p>
                <p className="text-xs text-green-600 mt-1 font-medium">{completionRate}% สำเร็จ</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ลูกค้าทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">{filteredStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">ในช่วงเวลาที่เลือก</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Date Filter */}
        <div className="flex items-start justify-end">
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <Calendar className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">ช่วงเวลา:</span>
            <div className="w-64">
              <DateRangePicker
                value={dateRangeFilter}
                onChange={setDateRangeFilter}
                placeholder="ทั้งหมด"
                presets={true}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Three Donut Charts - Single Row */}
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

      {/* Upcoming Service Visits - Full Width */}
      {/* <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            รอบริการที่ใกล้เข้ามา
          </CardTitle>
          <CardDescription>ลูกค้าที่ต้องบริการในเร็วๆ นี้</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayUpcomingVisits.length > 0 ? (
              displayUpcomingVisits.slice(0, 6).map((visit) => (
                <div key={visit.id} className="p-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors border border-gray-200 hover:border-orange-300">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium text-gray-900 line-clamp-1">{visit.customerGroup}</h4>
                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{visit.tel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{visit.district}, {visit.province}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {visit.pendingVisit1 && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          รอครั้งที่ 1
                        </Badge>
                      )}
                      {visit.pendingVisit2 && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          รอครั้งที่ 2
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 col-span-full">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">ไม่มีรอบริการที่รอดำเนินการ</p>
                <p className="text-gray-400 text-sm mt-1">ลูกค้าทั้งหมดได้รับการบริการครบถ้วนแล้ว</p>
              </div>
            )}
          </div>
          {displayUpcomingVisits.length > 6 && (
            <div className="mt-4 text-center pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/service-tracking/customer-services")}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                ดูทั้งหมด ({displayUpcomingVisits.length} รายการ)
              </Button>
            </div>
          )}
        </CardContent>
      </Card> */}

      {/* All Customer Services */}
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                รายละเอียดลูกค้าทั้งหมด
              </CardTitle>
              {/* <CardDescription>รายการลูกค้าทั้งหมดในระบบ</CardDescription> */}
            </div>
            <Button 
              variant="outline"
              onClick={handleExportExcel}
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              ดาวโหลด Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-24">ฝ่ายขาย</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">กลุ่มไลน์ซัพพอร์ตลูกค้า</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-24">เบอร์โทร</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-24">จังหวัด</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-24">อำเภอ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-28">ขนาดที่ติดตั้ง</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-28">วันที่ติดตั้ง</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">วันที่ Service ครั้งที่ 1</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">วันที่ Service ครั้งที่ 2</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">วันที่ Service ครั้งที่ 3</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">วันที่ Service ครั้งที่ 4</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">วันที่ Service ครั้งที่ 5</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">หมายเหตุ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-28">ช่างติดตั้ง</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-40">บริการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomerServices.map((service) => (
                  <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600 w-24">{service.sale || '-'}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 w-32">{service.customer_group}</td>
                    <td className="py-3 px-4 text-gray-600 w-24 break-words whitespace-normal">{service.tel}</td>
                    <td className="py-3 px-4 text-gray-600 w-24">{service.province}</td>
                    <td className="py-3 px-4 text-gray-600 w-24">{service.district || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 w-28">{service.capacity_kw ? `${service.capacity_kw} kW` : '-'}</td>
                    <td className="py-3 px-4 text-gray-600 w-28">
                      {service.installation_date_thai 
                        ? new Date(service.installation_date_thai).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '-'
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-32">
                      {service.service_visit_1_date_thai 
                        ? new Date(service.service_visit_1_date_thai).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '-'
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-32">
                      {service.service_visit_2_date_thai 
                        ? new Date(service.service_visit_2_date_thai).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '-'
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-32">
                      {service.service_visit_3_date_thai 
                        ? new Date(service.service_visit_3_date_thai).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '-'
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-32">
                      {service.service_visit_4_date_thai 
                        ? new Date(service.service_visit_4_date_thai).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '-'
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-32">
                      {service.service_visit_5_date_thai 
                        ? new Date(service.service_visit_5_date_thai).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '-'
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 w-32">{service.notes || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 w-28">{service.installer_name || '-'}</td>
                    <td className="py-3 px-4 w-40">
                      <div className="flex gap-1 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.service_visit_1 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          ครั้งที่ 1
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.service_visit_2 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          ครั้งที่ 2
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.service_visit_3 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          ครั้งที่ 3
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.service_visit_4 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          ครั้งที่ 4
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.service_visit_5 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          ครั้งที่ 5
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerServiceDashboard;