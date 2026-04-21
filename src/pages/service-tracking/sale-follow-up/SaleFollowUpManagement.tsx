import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Search, 
  Filter,
  Calendar,
  User,
  Phone,
  MapPin,
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Info
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/hooks/useToast";
import { 
  useCompletedServiceCustomersAPI as useCompletedServiceCustomers,
  useSaleFollowUpStatsAPI as useSaleFollowUpStats,
  useSalesTeamMembersAPI as useSalesTeamMembers,
  useSaleFollowUpProvincesAPI as useSaleFollowUpProvinces,
  useSaleFollowUpSalesPersonsAPI as useSaleFollowUpSalesPersons,
  useCreateSaleFollowUpAPI as useCreateSaleFollowUp,
  useUpdateSaleFollowUpAPI as useUpdateSaleFollowUp
} from "@/hooks/useSaleFollowUpAPI";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { getActiveSalesTeamForFilter } from "@/utils/salesTeamFilter";

const SaleFollowUpManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [saleFilter, setSaleFilter] = useState("all");
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Debounce search term (รอ 500ms หลังจากผู้ใช้หยุดพิมพ์)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => {
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
      search: debouncedSearchTerm || undefined,
      province: provinceFilter !== "all" ? provinceFilter : undefined,
      sale: saleFilter !== "all" ? saleFilter : undefined,
      followUpStatus,
      assignedTo: assignedToFilter !== "all" ? parseInt(assignedToFilter) : undefined,
    };
  }, [debouncedSearchTerm, provinceFilter, saleFilter, followUpStatusFilter, assignedToFilter]);

  // Fetch data
  const { 
    data: customers, 
    isLoading, 
    error,
    refetch: refetchCustomers
  } = useCompletedServiceCustomers(filters);

  const { data: stats, refetch: refetchStats } = useSaleFollowUpStats();
  const { data: provinces } = useSaleFollowUpProvinces();
  const { data: salesPersons } = useSaleFollowUpSalesPersons();
  const { data: salesTeamMembers } = useSalesTeamMembers();
  const createFollowUpMutation = useCreateSaleFollowUp();
  const updateFollowUpMutation = useUpdateSaleFollowUp();
  
  // Filter to show only active members in filter dropdown
  const visibleSalesTeamMembers = salesTeamMembers ? getActiveSalesTeamForFilter(salesTeamMembers) : [];

  // Filter customers เพิ่มเติมใน Frontend สำหรับ pending_urgent และ pending_normal
  const filteredCustomers = useMemo(() => {
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

    // สำหรับ filter อื่นๆ ให้ใช้ customers ตามปกติ
    return customers;
  }, [customers, followUpStatusFilter]);

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

  const handleCreateFollowUp = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCreateDialogOpen(true);
  };

  const handleEditFollowUp = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };


  const handleViewDetails = (customerId: number) => {
    navigate(`/sale-follow-up/detail/${customerId}`);
  };

  // Show error if there's one
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการการติดตามหลังการขาย</h1>
          <p className="text-gray-600">จัดการการติดตามลูกค้าหลังจากการบริการครบ 2 ครั้ง</p>
        </div>
        {/* <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างการติดตามใหม่
        </Button> */}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าที่ Service ครบ</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.total_completed_services || 0}</div>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ติดตามแล้ว</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{calculatedStats.completed}</div>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยกเลิก</CardTitle>
            <X className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{calculatedStats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรองข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="ค้นหาลูกค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>จังหวัด</Label>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกจังหวัด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {provinces?.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ผู้ขาย</Label>
              <Select value={saleFilter} onValueChange={setSaleFilter}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>สถานะการติดตาม</Label>
              <Select value={followUpStatusFilter} onValueChange={setFollowUpStatusFilter}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>ผู้รับผิดชอบ</Label>
              <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {visibleSalesTeamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการลูกค้าที่ต้องติดตาม ({filteredCustomers.length} รายการ)</CardTitle>
          <CardDescription>
            ลูกค้าที่บริการครบ 2 ครั้ง และสถานะการติดตามหลังการขาย
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {/* Loading overlay - แสดงเฉพาะตอน search */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">กำลังค้นหา...</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-2">ลำดับ</TableHead>
                  <TableHead className="px-2 w-40">กลุ่มลูกค้า</TableHead>
                  <TableHead className="px-2">ผู้ขาย</TableHead>
                  <TableHead className="px-2">ติดต่อ</TableHead>
                  <TableHead className="px-2">ที่อยู่</TableHead>
                  <TableHead className="px-2">กำลังไฟฟ้า</TableHead>
                  <TableHead className="px-2">วันที่ติดตั้ง</TableHead>
                  <TableHead className="px-2">ช่างติดตั้ง</TableHead>
                  <TableHead>บริการครบไปกี่วัน</TableHead>
                  <TableHead>สถานะการติดตาม</TableHead>
                  <TableHead className="w-48">รายละเอียดการติดตาม</TableHead>
                  <TableHead>วันที่ติดตาม</TableHead>
                  <TableHead>ผู้รับผิดชอบ</TableHead>
                  <TableHead>สถานะลีดในระบบ</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => {
                  const followUpStatus = getFollowUpStatusBadge(
                    customer.sale_follow_up_status || "not_started",
                    customer.days_after_service_complete
                  );
                  
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium text-center px-2">{index + 1}</TableCell>
                      <TableCell className="px-2 w-40">
                        <div className="text-sm break-words whitespace-normal">
                          {customer.customer_group}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 whitespace-nowrap">{customer.sale}</TableCell>
                      <TableCell className="px-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{customer.tel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm whitespace-nowrap">{customer.district}, {customer.province}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 text-sm whitespace-nowrap">
                        {customer.capacity_kw ? `${customer.capacity_kw} kW` : "-"}
                      </TableCell>
                      <TableCell className="px-2 text-sm whitespace-nowrap">
                        {customer.installation_date
                          ? format(new Date(customer.installation_date), "dd/MM/yyyy", { locale: th })
                          : "-"}
                      </TableCell>
                      <TableCell className="px-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Wrench className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{customer.installer_name || "-"}</span>
                        </div>
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
                        {customer.sale_follow_up_date
                          ? format(new Date(customer.sale_follow_up_date), "dd/MM/yyyy", { locale: th })
                          : "-"}
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(customer.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>ดูรายละเอียด</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {!customer.sale_follow_up_required ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleCreateFollowUp(customer)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>สร้างการติดตาม</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditFollowUp(customer)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>แก้ไขการติดตาม</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
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

      {/* Create Follow-up Dialog */}
      <FollowUpFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        customer={selectedCustomer}
        mode="create"
        onSubmit={createFollowUpMutation.mutateAsync}
        onSuccess={() => {
          refetchCustomers();
          refetchStats();
        }}
      />

      {/* Edit Follow-up Dialog */}
      <FollowUpFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        customer={selectedCustomer}
        mode="edit"
        onSubmit={updateFollowUpMutation.mutateAsync}
        onSuccess={() => {
          refetchCustomers();
          refetchStats();
        }}
      />
    </div>
  );
};

// Follow-up Form Dialog Component
interface FollowUpFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  mode: "create" | "edit";
  onSubmit: (data: any) => Promise<any>;
  onSuccess?: () => void;
}

const FollowUpFormDialog = ({ isOpen, onClose, customer, mode, onSubmit, onSuccess }: FollowUpFormDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    sale_follow_up_details: "",
    sale_follow_up_assigned_to: "",
    sale_follow_up_status: "pending",
  });

  const { data: salesTeamMembers } = useSalesTeamMembers();

  // Reset form when dialog opens/closes or customer changes
  React.useEffect(() => {
    if (isOpen && customer) {
      if (mode === "edit" && customer.sale_follow_up_required) {
        // Load existing data for edit mode
        setFormData({
          sale_follow_up_details: customer.sale_follow_up_details || "",
          sale_follow_up_assigned_to: customer.sale_follow_up_assigned_to?.toString() || "",
          sale_follow_up_status: customer.sale_follow_up_status || "pending",
        });
      } else {
        // Reset form for create mode
        setFormData({
          sale_follow_up_details: "",
          sale_follow_up_assigned_to: "",
          sale_follow_up_status: "pending",
        });
      }
    }
  }, [isOpen, customer, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ใช้วันที่ปัจจุบันอัตโนมัติ
    const currentDate = new Date().toISOString();
    
    console.log("Form submission data:", {
      customerId: customer.id,
      followUpData: {
        sale_follow_up_date: currentDate,
        sale_follow_up_details: formData.sale_follow_up_details,
        sale_follow_up_assigned_to: parseInt(formData.sale_follow_up_assigned_to),
        sale_follow_up_status: formData.sale_follow_up_status,
      },
    });
    
    try {
      await onSubmit({
        customerId: customer.id,
        followUpData: {
          sale_follow_up_date: currentDate,
          sale_follow_up_details: formData.sale_follow_up_details,
          sale_follow_up_assigned_to: parseInt(formData.sale_follow_up_assigned_to),
          sale_follow_up_status: formData.sale_follow_up_status,
        },
      });

      toast({
        title: mode === "create" ? "สร้างการติดตาม" : "อัปเดตการติดตาม",
        description: mode === "create" 
          ? "สร้างการติดตามหลังการขายเรียบร้อยแล้ว" 
          : "อัปเดตการติดตามหลังการขายเรียบร้อยแล้ว",
      });

      // Call onSuccess callback to refetch data
      if (onSuccess) {
        onSuccess();
      }

      onClose();
      // Reset form after successful submission
      setFormData({
        sale_follow_up_details: "",
        sale_follow_up_assigned_to: "",
        sale_follow_up_status: "pending",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: mode === "create" 
          ? "ไม่สามารถสร้างการติดตามได้" 
          : "ไม่สามารถอัปเดตการติดตามได้",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "สร้างการติดตามหลังการขาย" : "แก้ไขการติดตามหลังการขาย"}
          </DialogTitle>
          <DialogDescription>
            {customer && `ลูกค้า: ${customer.customer_group} (ID: ${customer.id})`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="followUpDetails">รายละเอียดการติดตาม</Label>
            <Input
              id="followUpDetails"
              value={formData.sale_follow_up_details}
              onChange={(e) => setFormData({ ...formData, sale_follow_up_details: e.target.value })}
              placeholder="รายละเอียดการติดตาม..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">ผู้รับผิดชอบ</Label>
            <Select
              value={formData.sale_follow_up_assigned_to}
              onValueChange={(value) => setFormData({ ...formData, sale_follow_up_assigned_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
              </SelectTrigger>
              <SelectContent>
                {salesTeamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followUpStatus">สถานะ</Label>
            <Select
              value={formData.sale_follow_up_status}
              onValueChange={(value) => setFormData({ ...formData, sale_follow_up_status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">รอติดตาม</SelectItem>
                <SelectItem value="completed">ติดตามแล้ว</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit">
              {mode === "create" ? "สร้าง" : "อัปเดต"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaleFollowUpManagement;
