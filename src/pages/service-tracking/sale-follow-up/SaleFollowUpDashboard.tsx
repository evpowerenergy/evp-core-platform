import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Calendar,
  User,
  Phone,
  MapPin,
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Info,
  X
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/hooks/useToast";
import { 
  useCompletedServiceCustomersAPI as useCompletedServiceCustomers,
  useSaleFollowUpStatsAPI as useSaleFollowUpStats,
  useSalesTeamMembersAPI as useSalesTeamMembers,
  useSaleFollowUpProvincesAPI as useSaleFollowUpProvinces,
  useSaleFollowUpSalesPersonsAPI as useSaleFollowUpSalesPersons
} from "@/hooks/useSaleFollowUpAPI";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { th } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import ReactECharts from 'echarts-for-react';

const SaleFollowUpDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [salesFilter, setSalesFilter] = useState("all");
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState("all");

  // Fetch data
  const apiFilters = useMemo(() => {
    // สำหรับ pending_urgent และ pending_normal ให้ส่ง pending ไปที่ API
    let followUpStatus = undefined;
    if (followUpStatusFilter !== "all") {
      if (followUpStatusFilter === "pending_urgent" || followUpStatusFilter === "pending_normal") {
        followUpStatus = "pending";
      } else {
        followUpStatus = followUpStatusFilter;
      }
    }

    return {
      sale: salesFilter !== "all" ? salesFilter : undefined,
      followUpStatus,
    };
  }, [salesFilter, followUpStatusFilter]);

  const { 
    data: customers, 
    isLoading, 
    error,
    refetch: refetchCustomers
  } = useCompletedServiceCustomers(apiFilters);

  const { data: stats, refetch: refetchStats } = useSaleFollowUpStats();
  const { data: provinces } = useSaleFollowUpProvinces();
  const { data: salesPersons } = useSaleFollowUpSalesPersons();
  const { data: salesTeamMembers } = useSalesTeamMembers();

  // Filter customers เพิ่มเติมสำหรับ pending_urgent และ pending_normal
  const filteredByStatus = useMemo(() => {
    if (!customers) return [];

    if (followUpStatusFilter === "pending_urgent") {
      return customers.filter(c => 
        c.sale_follow_up_status === 'pending' && 
        c.days_after_service_complete !== null &&
        c.days_after_service_complete !== undefined &&
        c.days_after_service_complete > 90
      );
    }

    if (followUpStatusFilter === "pending_normal") {
      return customers.filter(c => 
        c.sale_follow_up_status === 'pending' && 
        (c.days_after_service_complete === null ||
         c.days_after_service_complete === undefined ||
         c.days_after_service_complete <= 90)
      );
    }

    return customers;
  }, [customers, followUpStatusFilter]);

  // Filter by date range (based on when service was completed - service visit 2 date)
  const filteredCustomers = filteredByStatus?.filter(customer => {
    if (!dateRangeFilter || !dateRangeFilter.from) return true;
    
    // Use service_visit_2_date as the completion date
    const completionDateField = customer.service_visit_2_date;
    if (!completionDateField) return false; // Skip if no service completion date
    
    const customerDate = new Date(completionDateField);
    const fromDate = dateRangeFilter.from;
    const toDate = dateRangeFilter.to || dateRangeFilter.from;
    
    // Reset time to start of day for fromDate (00:00:00)
    const fromDateTime = new Date(fromDate);
    fromDateTime.setHours(0, 0, 0, 0);
    
    // Reset time to end of day for toDate (23:59:59)
    const toDateTime = new Date(toDate);
    toDateTime.setHours(23, 59, 59, 999);
    
    return customerDate >= fromDateTime && customerDate <= toDateTime;
  });

  // คำนวณสถิติแยก pending ออกเป็น urgent และ normal (ใช้ customers ทั้งหมด ไม่ใช่ filtered)
  const calculatedStats = useMemo(() => {
    if (!customers) {
      return {
        pending_urgent: 0,
        pending_normal: 0,
        completed: 0,
        cancelled: 0,
        not_started: 0,
        lead_closed: 0,
      };
    }

    return {
      pending_urgent: customers.filter(c => 
        c.sale_follow_up_status === 'pending' && 
        c.days_after_service_complete !== null &&
        c.days_after_service_complete !== undefined &&
        c.days_after_service_complete > 90
      ).length,
      pending_normal: customers.filter(c => 
        c.sale_follow_up_status === 'pending' && 
        (c.days_after_service_complete === null ||
         c.days_after_service_complete === undefined ||
         c.days_after_service_complete <= 90)
      ).length,
      completed: customers.filter(c => c.sale_follow_up_status === 'completed').length,
      cancelled: customers.filter(c => c.sale_follow_up_status === 'cancelled').length,
      not_started: customers.filter(c => 
        !c.sale_follow_up_status || 
        c.sale_follow_up_status === 'not_started'
      ).length,
      lead_closed: customers.filter(c => c.lead_info?.status === 'ปิดการขาย').length,
    };
  }, [customers]);

  // Calculate additional stats
  const additionalStats = {
    totalProvinces: provinces?.length || 0,
    totalSalesPersons: salesPersons?.length || 0,
    totalTeamMembers: salesTeamMembers?.length || 0,
    completionRate: stats ? Math.round((stats.completed_follow_up / stats.total_completed_services) * 100) : 0,
  };

  // Calculate province statistics for chart
  const provinceStats = filteredCustomers?.reduce((acc, customer) => {
    const province = customer.province || 'ไม่ระบุ';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate follow-up status statistics for chart (แยก pending ออกเป็น urgent และ normal)
  const followUpStatusStats = filteredCustomers?.reduce((acc, customer) => {
    const status = customer.sale_follow_up_status || 'not_started';
    let statusText = '';
    
    if (status === 'pending') {
      // แยก pending ออกเป็น urgent และ normal
      if (customer.days_after_service_complete !== null && 
          customer.days_after_service_complete !== undefined && 
          customer.days_after_service_complete > 90) {
        statusText = 'รอติดตามด่วน';
      } else {
        statusText = 'รอติดตามไม่ด่วน';
      }
    } else if (status === 'completed') {
      statusText = 'ติดตามแล้ว';
    } else if (status === 'cancelled') {
      statusText = 'ยกเลิก';
    } else {
      statusText = 'ยังไม่ติดตาม';
    }
    
    acc[statusText] = (acc[statusText] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Chart option for Province
  const provinceChartOption = {
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
        data: Object.entries(provinceStats)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 10)
          .map(([key, value], index) => ({
            value,
            name: key,
            itemStyle: { 
              color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'][index] || '#6b7280'
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

  // Chart option for Follow-up Status
  const followUpStatusChartOption = {
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
        name: 'สถานะการติดตาม',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: Object.entries(followUpStatusStats).map(([key, value]) => ({
          value,
          name: key,
          itemStyle: { 
            color: key === 'ยังไม่ติดตาม' ? '#6b7280' :
                   key === 'รอติดตามด่วน' ? '#ef4444' :
                   key === 'รอติดตามไม่ด่วน' ? '#f59e0b' :
                   key === 'ติดตามแล้ว' ? '#10b981' :
                   key === 'ยกเลิก' ? '#6b7280' : '#6b7280'
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

  const getFollowUpStatusBadge = (status: string, daysAfterComplete?: number | null) => {
    // แยก pending ออกเป็น 2 ระดับตามจำนวนวัน
    if (status === "pending") {
      if (daysAfterComplete !== null && daysAfterComplete !== undefined && daysAfterComplete > 90) {
        return { 
          text: "รอติดตามด่วน", 
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <AlertTriangle className="h-3 w-3 mr-1" />
        };
      }
      return { 
        text: "รอติดตามไม่ด่วน", 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-3 w-3 mr-1" />
      };
    }
    
    switch (status) {
      case "completed":
        return { 
          text: "ติดตามแล้ว", 
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3 w-3 mr-1" />
        };
      case "cancelled":
        return { 
          text: "ยกเลิก", 
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <X className="h-3 w-3 mr-1" />
        };
      default:
        return { 
          text: "ยังไม่ติดตาม", 
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <AlertCircle className="h-3 w-3 mr-1" />
        };
    }
  };

  const getLeadStatusBadge = (leadStatus: string | undefined) => {
    switch (leadStatus) {
      case "รอรับ":
        return { 
          text: "สร้างลีดแล้ว (รอรับ)", 
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="h-3 w-3 mr-1" />
        };
      case "กำลังติดตาม":
        return { 
          text: "กำลังติดตาม", 
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <User className="h-3 w-3 mr-1" />
        };
      case "ปิดการขาย":
        return { 
          text: "ปิดการขายแล้ว", 
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3 w-3 mr-1" />
        };
      case "ยังปิดการขายไม่สำเร็จ":
        return { 
          text: "ยังปิดการขายไม่สำเร็จ", 
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <AlertCircle className="h-3 w-3 mr-1" />
        };
      default:
        return { 
          text: "ยังไม่สร้างลีด", 
          color: "bg-gray-50 text-gray-600 border-gray-300",
          icon: null
        };
    }
  };

  const handleViewManagement = () => {
    navigate("/service-tracking/sale-follow-up/management");
  };

  if (isLoading) return <PageLoading />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard การติดตามหลังการขาย</h1>
            <p className="text-gray-600">ภาพรวมการติดตามลูกค้าหลังจากการบริการครบ 2 ครั้ง</p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">ช่วงเวลา:</span>
              <DateRangePicker
                value={dateRangeFilter}
                onChange={setDateRangeFilter}
                placeholder="ทั้งหมด"
                presets={true}
                className="w-64"
              />
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
              <User className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">ผู้ขาย:</span>
              <Select value={salesFilter} onValueChange={setSalesFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="เลือกผู้ขาย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {salesPersons?.map((sale) => (
                    <SelectItem key={sale} value={sale}>
                      {sale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">สถานะการติดตาม:</span>
              <Select value={followUpStatusFilter} onValueChange={setFollowUpStatusFilter}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอติดตาม (ทั้งหมด)</SelectItem>
                  <SelectItem value="pending_urgent">รอติดตามด่วน (&gt; 90 วัน)</SelectItem>
                  <SelectItem value="pending_normal">รอติดตามไม่ด่วน (≤ 90 วัน)</SelectItem>
                  <SelectItem value="completed">ติดตามแล้ว</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* ลูกค้าที่ Service ครบ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าที่ Service ครบ</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.total_completed_services || 0}</div>
            <p className="text-xs text-gray-500">
              {filteredCustomers?.length || 0} รายการในช่วงที่เลือก
            </p>
          </CardContent>
        </Card>

        {/* รอติดตามด่วน */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอติดตามด่วน</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{calculatedStats.pending_urgent}</div>
            <p className="text-xs text-red-600 mt-1">เกิน 90 วัน</p>
          </CardContent>
        </Card>

        {/* รอติดตามไม่ด่วน */}
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอติดตามไม่ด่วน</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{calculatedStats.pending_normal}</div>
            <p className="text-xs text-yellow-600 mt-1">ไม่เกิน 90 วัน</p>
          </CardContent>
        </Card>

        {/* ติดตามแล้ว */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ติดตามแล้ว</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{calculatedStats.completed}</div>
          </CardContent>
        </Card>

        {/* ปิดการขายแล้ว */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปิดการขายแล้ว</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{calculatedStats.lead_closed}</div>
            <p className="text-xs text-blue-600 mt-1">สร้างลีดสำเร็จ</p>
          </CardContent>
        </Card>

        {/* อัตราการติดตาม */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราการติดตาม</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{additionalStats.completionRate}%</div>
            <p className="text-xs text-gray-500">
              {stats?.completed_follow_up || 0} / {stats?.total_completed_services || 0} รายการ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Donut Charts - Single Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Province Chart */}
        <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              จังหวัด
            </CardTitle>
            <CardDescription>สัดส่วนจังหวัดที่มีลูกค้า (Top 10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ReactECharts option={provinceChartOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Status Chart */}
        <Card className="bg-white border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              สถานะการติดตาม
            </CardTitle>
            <CardDescription>สัดส่วนสถานะการติดตามลูกค้า</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ReactECharts option={followUpStatusChartOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Customers */}
      <Card>
        <CardHeader>
          <CardTitle>ลูกค้าที่ Service ครบ</CardTitle>
          <CardDescription>
            ลูกค้าที่บริการครบ 2 ครั้งแล้ว (กรองตามวันที่บริการครั้งที่ 2 เสร็จ) - {filteredCustomers?.length || 0} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ลำดับ</TableHead>
                  <TableHead>กลุ่มลูกค้า</TableHead>
                  <TableHead>ผู้ขาย</TableHead>
                  <TableHead>ติดต่อ</TableHead>
                  <TableHead>ที่อยู่</TableHead>
                  <TableHead>วันที่ติดตั้ง</TableHead>
                  <TableHead>วันที่บริการครบ</TableHead>
                  <TableHead>บริการครบไปกี่วัน</TableHead>
                  <TableHead>สถานะการติดตาม</TableHead>
                  <TableHead className="w-48">รายละเอียดการติดตาม</TableHead>
                  <TableHead>ผู้รับผิดชอบ</TableHead>
                  <TableHead>สถานะลีดในระบบ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.map((customer, index) => {
                  const followUpStatus = getFollowUpStatusBadge(
                    customer.sale_follow_up_status || "not_started",
                    customer.days_after_service_complete
                  );
                  
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium text-center">{index + 1}</TableCell>
                      <TableCell>{customer.customer_group}</TableCell>
                      <TableCell>{customer.sale}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {customer.tel}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {customer.district}, {customer.province}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.installation_date
                          ? format(new Date(customer.installation_date), "dd/MM/yyyy", { locale: th })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {customer.service_visit_2_date
                          ? format(new Date(customer.service_visit_2_date), "dd/MM/yyyy", { locale: th })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {customer.days_after_service_complete !== null && customer.days_after_service_complete !== undefined ? (
                          customer.days_after_service_complete >= 0 ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold">
                                {customer.days_after_service_complete} วัน
                              </span>
                              {(() => {
                                // ถ้าติดตามแล้ว (completed) ให้แสดงสถานะเสร็จสิ้น
                                if (customer.sale_follow_up_status === "completed") {
                                  return (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      ติดตามเสร็จแล้ว
                                    </Badge>
                                  );
                                }
                                // ถ้ายกเลิก (cancelled) ให้แสดงสถานะยกเลิก
                                if (customer.sale_follow_up_status === "cancelled") {
                                  return (
                                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                                      <X className="h-3 w-3 mr-1" />
                                      ยกเลิกแล้ว
                                    </Badge>
                                  );
                                }
                                // ถ้ายังไม่ติดตาม หรือรอติดตาม ให้แสดงตามระยะเวลา
                                return (
                                  <Badge 
                                    variant={
                                      customer.days_after_service_complete > 90 ? "destructive" :
                                      customer.days_after_service_complete > 60 ? "default" :
                                      "secondary"
                                    }
                                    className={
                                      customer.days_after_service_complete > 90 ? "" :
                                      customer.days_after_service_complete > 60 ? "bg-amber-100 text-amber-800" :
                                      "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    {customer.days_after_service_complete > 90 ? "ควรติดตามด่วน" :
                                     customer.days_after_service_complete > 60 ? "ควรติดตาม" :
                                     "ปกติ"}
                                  </Badge>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                บริการครบก่อนกำหนด
                              </Badge>
                            </div>
                          )
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={followUpStatus.color}>
                          {followUpStatus.icon}
                          {followUpStatus.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-48">
                        {customer.sale_follow_up_details ? (
                          <div className="text-sm break-words whitespace-normal line-clamp-3">
                            {customer.sale_follow_up_details}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.assigned_sales_person
                          ? customer.assigned_sales_person.name
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const leadStatus = getLeadStatusBadge(customer.lead_info?.status);
                          return (
                            <div className="flex items-center gap-2">
                              <Badge className={leadStatus.color}>
                                {leadStatus.icon}
                                {leadStatus.text}
                              </Badge>
                              {customer.lead_info && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button className="p-0 h-auto bg-transparent border-0 cursor-pointer">
                                        <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs space-y-1">
                                        <p><strong>ลีด ID:</strong> {customer.lead_info.id}</p>
                                        <p><strong>ชื่อ:</strong> {customer.lead_info.full_name || '-'}</p>
                                        <p><strong>สถานะ:</strong> {customer.lead_info.status}</p>
                                        <p><strong>สร้างเมื่อ:</strong> {format(new Date(customer.lead_info.created_at), 'dd/MM/yyyy HH:mm', { locale: th })}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          );
                        })()}
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

export default SaleFollowUpDashboard;
