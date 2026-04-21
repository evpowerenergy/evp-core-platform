import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  User,
  Wrench,
  Edit,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Zap,
  Home,
  Info,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/hooks/useToast";
import { 
  useSaleFollowUpCustomerDetailAPI as useSaleFollowUpCustomerDetail,
  useSalesTeamMembersAPI as useSalesTeamMembers,
  useUpdateSaleFollowUpAPI as useUpdateSaleFollowUp
} from "@/hooks/useSaleFollowUpAPI";
import { 
  useUpdateCustomerServiceAPI as useUpdateCustomerService 
} from "@/hooks/useCustomerServicesAPI";
import { 
  useCustomerServicePurchases,
  useCreateCustomerServicePurchase,
  useUpdateCustomerServicePurchase,
  getPackageTypeDisplayName,
  getStatusDisplayName
} from "@/hooks/useCustomerServicePurchasesAPI";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Plus } from "lucide-react";
import { getActiveSalesTeamForFilter } from "@/utils/salesTeamFilter";

// Helper function to safely format dates
const safeFormatDate = (dateValue: string | null | undefined, formatString: string): string => {
  if (!dateValue) return "-";
  
  try {
    const date = new Date(dateValue);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "-";
    }
    return format(date, formatString, { locale: th });
  } catch (error) {
    console.error("Error formatting date:", error, dateValue);
    return "-";
  }
};

const SaleFollowUpDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const customerId = parseInt(id || "0");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false);
  const [isAddPurchaseDialogOpen, setIsAddPurchaseDialogOpen] = useState(false);

  // Fetch data
  const { 
    data: customer, 
    isLoading, 
    error,
    refetch 
  } = useSaleFollowUpCustomerDetail(customerId);
  
  const { data: salesTeamMembers } = useSalesTeamMembers();
  const updateFollowUpMutation = useUpdateSaleFollowUp();
  
  // Filter to show only active members in filter dropdown
  const visibleSalesTeamMembers = salesTeamMembers ? getActiveSalesTeamForFilter(salesTeamMembers) : [];

  // Helper functions
  const getFollowUpStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { 
          text: "รอติดตาม", 
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="h-4 w-4 mr-1" />
        };
      case "completed":
        return { 
          text: "ติดตามแล้ว", 
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-4 w-4 mr-1" />
        };
      case "cancelled":
        return { 
          text: "ยกเลิก", 
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <X className="h-4 w-4 mr-1" />
        };
      default:
        return { 
          text: "ยังไม่ติดตาม", 
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <AlertCircle className="h-4 w-4 mr-1" />
        };
    }
  };

  const getLeadStatusBadge = (leadStatus: string | undefined) => {
    switch (leadStatus) {
      case "รอรับ":
        return { 
          text: "รอรับ", 
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

  const handleBack = () => {
    navigate("/sale-follow-up/management");
  };

  if (isLoading) {
    return <PageLoading type="dashboard" />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button onClick={handleBack} variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-semibold">เกิดข้อผิดพลาด</p>
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button onClick={handleBack} variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-600">
              <Info className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-semibold">ไม่พบข้อมูลลูกค้า</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const followUpStatus = getFollowUpStatusBadge(customer.sale_follow_up_status || "not_started");
  const leadStatus = getLeadStatusBadge(customer.lead_info?.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายละเอียดลูกค้า</h1>
            <p className="text-gray-600">ID: {customer.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditCustomerDialogOpen(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            แก้ไขข้อมูลลูกค้า
          </Button>
          {customer.sale_follow_up_required && (
            <Button onClick={() => setIsEditDialogOpen(true)} variant="default">
              <Edit className="h-4 w-4 mr-2" />
              แก้ไขการติดตาม
            </Button>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ข้อมูลลูกค้า
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">กลุ่มลูกค้า</Label>
                <p className="text-lg font-semibold">{customer.customer_group}</p>
              </div>
              <div>
                <Label className="text-gray-600">ผู้ขาย</Label>
                <p className="text-lg font-semibold">{customer.sale}</p>
              </div>
              <div>
                <Label className="text-gray-600 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  เบอร์โทรศัพท์
                </Label>
                <p className="text-lg font-semibold">{customer.tel}</p>
              </div>
              <div>
                <Label className="text-gray-600 flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  กำลังไฟฟ้า
                </Label>
                <p className="text-lg font-semibold">
                  {customer.capacity_kw ? `${customer.capacity_kw} kW` : "-"}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                ที่อยู่
              </Label>
              <p className="text-lg font-semibold">
                {customer.district}, {customer.province}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  วันที่ติดตั้ง
                </Label>
                <p className="text-lg font-semibold">
                  {safeFormatDate(customer.installation_date, "dd MMMM yyyy")}
                </p>
              </div>
              <div>
                <Label className="text-gray-600 flex items-center gap-1">
                  <Wrench className="h-4 w-4" />
                  ช่างติดตั้ง
                </Label>
                <p className="text-lg font-semibold">{customer.installer_name || "-"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-gray-600">สถานะบริการ</Label>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Badge variant={customer.service_visit_1 ? "default" : "outline"}>
                    Service 1: {customer.service_visit_1 ? "✓" : "✗"}
                  </Badge>
                  {customer.service_visit_1_date && (
                    <span className="text-sm text-gray-600">
                      ({safeFormatDate(customer.service_visit_1_date, "dd/MM/yyyy")})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={customer.service_visit_2 ? "default" : "outline"}>
                    Service 2: {customer.service_visit_2 ? "✓" : "✗"}
                  </Badge>
                  {customer.service_visit_2_date && (
                    <span className="text-sm text-gray-600">
                      ({safeFormatDate(customer.service_visit_2_date, "dd/MM/yyyy")})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {customer.days_after_service_complete !== null && customer.days_after_service_complete !== undefined && (
              <>
                <Separator />
                <div>
                  <Label className="text-gray-600">ระยะเวลาหลังบริการครบ</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {customer.days_after_service_complete} วัน
                    </span>
                    {(() => {
                      // ถ้าติดตามแล้ว (completed) ให้แสดงสถานะเสร็จสิ้น
                      if (customer.sale_follow_up_status === "completed") {
                        return (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            ติดตามเสร็จแล้ว
                          </Badge>
                        );
                      }
                      // ถ้ายกเลิก (cancelled) ให้แสดงสถานะยกเลิก
                      if (customer.sale_follow_up_status === "cancelled") {
                        return (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            <X className="h-4 w-4 mr-1" />
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
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Follow-up Status & Lead Info */}
        <div className="space-y-6">
          {/* Follow-up Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                สถานะการติดตาม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-600">สถานะ</Label>
                <Badge className={`${followUpStatus.color} mt-2 text-base px-3 py-1`}>
                  {followUpStatus.icon}
                  {followUpStatus.text}
                </Badge>
              </div>

              {customer.sale_follow_up_required && (
                <>
                  <Separator />
                  
                  <div>
                    <Label className="text-gray-600">วันที่ติดตาม</Label>
                    <p className="font-semibold">
                      {safeFormatDate(customer.sale_follow_up_date, "dd MMMM yyyy")}
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-600">ผู้รับผิดชอบ</Label>
                    <p className="font-semibold">
                      {customer.assigned_sales_person?.name || "-"}
                    </p>
                  </div>

                  {customer.sale_follow_up_details && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-gray-600">รายละเอียด</Label>
                        <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                          {customer.sale_follow_up_details}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Lead Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                สถานะลีดในระบบ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${leadStatus.color} text-base px-3 py-1`}>
                {leadStatus.icon}
                {leadStatus.text}
              </Badge>

              {customer.lead_info && (
                <div className="mt-4 space-y-2 text-sm">
                  <p><span className="text-gray-600">ลีด ID:</span> <span className="font-semibold">{customer.lead_info.id}</span></p>
                  <p><span className="text-gray-600">ชื่อ:</span> <span className="font-semibold">{customer.lead_info.full_name || '-'}</span></p>
                  <p><span className="text-gray-600">สร้างเมื่อ:</span> <span className="font-semibold">
                    {safeFormatDate(customer.lead_info.created_at, 'dd MMMM yyyy HH:mm')}
                  </span></p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service Package Purchase History */}
      <ServicePackagePurchaseHistory 
        customerId={customerId}
        onAddNew={() => setIsAddPurchaseDialogOpen(true)}
      />

      {/* Service Visit History */}
      {customer.service_visits && customer.service_visits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ประวัติการบริการ
            </CardTitle>
            <CardDescription>ประวัติการเข้าบริการทั้งหมด</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ครั้งที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ช่างเทคนิค</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.service_visits.map((visit: any, index: number) => (
                  <TableRow key={visit.id}>
                    <TableCell>{customer.service_visits.length - index}</TableCell>
                    <TableCell>
                      {safeFormatDate(visit.visit_date, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{visit.technician_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={visit.status === "completed" ? "default" : "secondary"}>
                        {visit.status === "completed" ? "เสร็จสิ้น" : "รอดำเนินการ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{visit.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Purchase Dialog */}
      <AddPurchaseDialog
        isOpen={isAddPurchaseDialogOpen}
        onClose={() => setIsAddPurchaseDialogOpen(false)}
        customerId={customerId}
        installationDate={customer.installation_date}
        onSuccess={refetch}
      />

      {/* Edit Follow-up Dialog */}
      <EditFollowUpDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        customer={customer}
        onSuccess={refetch}
      />

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        isOpen={isEditCustomerDialogOpen}
        onClose={() => setIsEditCustomerDialogOpen(false)}
        customer={customer}
        onSuccess={refetch}
      />
    </div>
  );
};

// Edit Follow-up Dialog Component
interface EditFollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSuccess: () => void;
}

const EditFollowUpDialog = ({ isOpen, onClose, customer, onSuccess }: EditFollowUpDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    sale_follow_up_details: "",
    sale_follow_up_assigned_to: "",
    sale_follow_up_status: "pending",
  });

  const { data: salesTeamMembers } = useSalesTeamMembers();
  const updateFollowUpMutation = useUpdateSaleFollowUp();
  
  // Filter to show only active members in filter dropdown
  const visibleSalesTeamMembers = salesTeamMembers ? getActiveSalesTeamForFilter(salesTeamMembers) : [];

  React.useEffect(() => {
    if (isOpen && customer && customer.sale_follow_up_required) {
      setFormData({
        sale_follow_up_details: customer.sale_follow_up_details || "",
        sale_follow_up_assigned_to: customer.sale_follow_up_assigned_to?.toString() || "",
        sale_follow_up_status: customer.sale_follow_up_status || "pending",
      });
    }
  }, [isOpen, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentDate = new Date().toISOString();
    
    try {
      await updateFollowUpMutation.mutateAsync({
        customerId: customer.id,
        followUpData: {
          sale_follow_up_date: currentDate,
          sale_follow_up_details: formData.sale_follow_up_details,
          sale_follow_up_assigned_to: parseInt(formData.sale_follow_up_assigned_to),
          sale_follow_up_status: formData.sale_follow_up_status,
        },
      });

      toast({
        title: "อัปเดตการติดตาม",
        description: "อัปเดตการติดตามหลังการขายเรียบร้อยแล้ว",
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตการติดตามได้",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขการติดตามหลังการขาย</DialogTitle>
          <DialogDescription>
            ลูกค้า: {customer?.customer_group} (ID: {customer?.id})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="followUpDetails">รายละเอียดการติดตาม</Label>
            <Textarea
              id="followUpDetails"
              value={formData.sale_follow_up_details}
              onChange={(e) => setFormData({ ...formData, sale_follow_up_details: e.target.value })}
              placeholder="รายละเอียดการติดตาม..."
              rows={4}
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
                {visibleSalesTeamMembers.map((member) => (
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
            <Button type="submit" disabled={updateFollowUpMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Customer Dialog Component (placeholder for future implementation)
interface EditCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSuccess: () => void;
}

const EditCustomerDialog = ({ isOpen, onClose, customer, onSuccess }: EditCustomerDialogProps) => {
  const { toast } = useToast();
  const updateCustomerMutation = useUpdateCustomerService();
  const createPurchaseMutation = useCreateCustomerServicePurchase();
  const updatePurchaseMutation = useUpdateCustomerServicePurchase();
  const { data: existingPurchases } = useCustomerServicePurchases(customer?.id || 0);
  const [formData, setFormData] = useState({
    customer_group: "",
    tel: "",
    province: "",
    district: "",
    capacity_kw: "",
    service_package_type: "",
    purchase_number: "1",
  });

  React.useEffect(() => {
    if (isOpen && customer) {
      // Calculate next purchase number from existing purchases
      const nextPurchaseNumber = existingPurchases && existingPurchases.length > 0 
        ? (existingPurchases.length + 1).toString() 
        : "1";
      
      setFormData({
        customer_group: customer.customer_group || "",
        tel: customer.tel || "",
        province: customer.province || "",
        district: customer.district || "",
        capacity_kw: customer.capacity_kw?.toString() || "",
        service_package_type: customer.service_package_type || "",
        purchase_number: nextPurchaseNumber,
      });
    }
  }, [isOpen, customer, existingPurchases]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const oldPackageType = customer?.service_package_type;
      const newPackageType = formData.service_package_type || null;
      
      const customerData: any = {
        customer_group: formData.customer_group,
        tel: formData.tel,
        province: formData.province,
        district: formData.district,
      };

      // Only add capacity_kw if it has a value
      if (formData.capacity_kw && formData.capacity_kw.trim() !== "") {
        customerData.capacity_kw = parseFloat(formData.capacity_kw);
      }

      // Add service_package_type if it has a value
      if (newPackageType && newPackageType.trim() !== "") {
        customerData.service_package_type = newPackageType;
      }

      // Update customer service
      await updateCustomerMutation.mutateAsync({
        id: customer.id,
        data: customerData,
      });

      // Handle purchase record logic
      if (newPackageType) {
        try {
          const purchaseDate = customer.installation_date || new Date().toISOString().split('T')[0];
          const purchaseDateObj = new Date(purchaseDate);
          const purchaseDateThai = new Date(purchaseDateObj);
          purchaseDateThai.setHours(purchaseDateThai.getHours() + 7);

          const purchaseNotes = formData.purchase_number ? `ซื้อครั้งที่ ${formData.purchase_number}` : null;
          
          // Check if there's an existing purchase with the same purchase_number
          // Extract purchase number from notes using regex
          const purchaseNumberRegex = /ซื้อครั้งที่\s*(\d+)/;
          const existingPurchaseWithSameNumber = existingPurchases?.find(purchase => {
            if (!purchase.notes) return false;
            const match = purchase.notes.match(purchaseNumberRegex);
            if (match && match[1] === formData.purchase_number) {
              return true;
            }
            return false;
          });

          if (existingPurchaseWithSameNumber) {
            // If purchase_number exists and service_package_type changed, update the existing record
            if (existingPurchaseWithSameNumber.service_package_type !== newPackageType) {
              await updatePurchaseMutation.mutateAsync({
                id: existingPurchaseWithSameNumber.id,
                data: {
                  service_package_type: newPackageType as '1_year' | '3_year' | '5_year',
                  notes: purchaseNotes,
                },
              });
            }
            // If service_package_type is the same, do nothing (no need to update)
          } else {
            // If purchase_number is new or doesn't exist, create a new purchase record
            await createPurchaseMutation.mutateAsync({
              customer_service_id: customer.id,
              service_package_type: newPackageType as '1_year' | '3_year' | '5_year',
              purchase_date: purchaseDate,
              purchase_date_thai: purchaseDateThai.toISOString(),
              status: 'active',
              notes: purchaseNotes,
            });
          }
        } catch (purchaseError) {
          console.error("Failed to handle purchase record:", purchaseError);
          toast({
            title: "คำเตือน",
            description: "อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว แต่ไม่สามารถบันทึกประวัติการซื้อได้",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "บันทึกสำเร็จ",
        description: "แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update customer error:", error);
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถแก้ไขข้อมูลลูกค้าได้";
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลพื้นฐานของลูกค้า (ID: {customer?.id})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="customer_group">กลุ่มลูกค้า</Label>
              <Input
                id="customer_group"
                value={formData.customer_group}
                onChange={(e) => setFormData({ ...formData, customer_group: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="tel">เบอร์โทรศัพท์</Label>
              <Input
                id="tel"
                value={formData.tel}
                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">จังหวัด</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">อำเภอ</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="capacity_kw">กำลังไฟฟ้า (kW)</Label>
              <Input
                id="capacity_kw"
                type="number"
                step="0.01"
                value={formData.capacity_kw}
                onChange={(e) => setFormData({ ...formData, capacity_kw: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="service_package_type">แพ็คเกจ Service</Label>
              <Select 
                value={formData.service_package_type} 
                onValueChange={(value) => setFormData({ ...formData, service_package_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแพ็คเกจ Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_year">1 ปี (Service 1 ครั้ง)</SelectItem>
                  <SelectItem value="3_year">3 ปี (Service 3 ครั้ง)</SelectItem>
                  <SelectItem value="5_year">5 ปี (Service 5 ครั้ง)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.service_package_type && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="purchase_number">ซื้อ Package ครั้งที่เท่าไหร่</Label>
                <Input
                  id="purchase_number"
                  type="number"
                  min="1"
                  value={formData.purchase_number}
                  onChange={(e) => setFormData({ ...formData, purchase_number: e.target.value })}
                  placeholder="เช่น 1, 2, 3..."
                />
                <p className="text-xs text-gray-500">
                  {existingPurchases && existingPurchases.length > 0 
                    ? `มีประวัติการซื้อ ${existingPurchases.length} ครั้ง - ครั้งถัดไปควรเป็นครั้งที่ ${existingPurchases.length + 1}`
                    : "ครั้งแรกควรเป็นครั้งที่ 1"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={updateCustomerMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateCustomerMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Service Package Purchase History Component
interface ServicePackagePurchaseHistoryProps {
  customerId: number;
  onAddNew: () => void;
}

const ServicePackagePurchaseHistory = ({ customerId, onAddNew }: ServicePackagePurchaseHistoryProps) => {
  const { data: purchases, isLoading } = useCustomerServicePurchases(customerId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-600">กำลังโหลด...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              ประวัติการซื้อ Service Package
            </CardTitle>
            <CardDescription>ประวัติการซื้อ service package ทั้งหมด</CardDescription>
          </div>
          <Button onClick={onAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มการซื้อใหม่
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!purchases || purchases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>ยังไม่มีประวัติการซื้อ service package</p>
            <Button onClick={onAddNew} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มการซื้อครั้งแรก
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>แพ็คเกจ</TableHead>
                <TableHead>วันที่ซื้อ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-semibold">
                    {getPackageTypeDisplayName(purchase.service_package_type)}
                  </TableCell>
                  <TableCell>
                    {safeFormatDate(purchase.purchase_date, "dd MMMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        purchase.status === 'active' ? 'default' :
                        purchase.status === 'completed' ? 'secondary' :
                        'destructive'
                      }
                      className={
                        purchase.status === 'active' ? 'bg-green-100 text-green-800' :
                        purchase.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {getStatusDisplayName(purchase.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {purchase.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// Add Purchase Dialog Component
interface AddPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  installationDate: string | null;
  onSuccess: () => void;
}

const AddPurchaseDialog = ({ isOpen, onClose, customerId, installationDate, onSuccess }: AddPurchaseDialogProps) => {
  const { toast } = useToast();
  const createPurchaseMutation = useCreateCustomerServicePurchase();
  const updateCustomerMutation = useUpdateCustomerService();
  const [formData, setFormData] = useState({
    service_package_type: "",
    purchase_date: installationDate || "",
    notes: "",
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        service_package_type: "",
        purchase_date: installationDate || "",
        notes: "",
      });
    }
  }, [isOpen, installationDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_package_type || !formData.purchase_date) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    try {
      const purchaseDate = new Date(formData.purchase_date);
      const purchaseDateThai = new Date(purchaseDate);
      purchaseDateThai.setHours(purchaseDateThai.getHours() + 7);

      // Create purchase record
      await createPurchaseMutation.mutateAsync({
        customer_service_id: customerId,
        service_package_type: formData.service_package_type as '1_year' | '3_year' | '5_year',
        purchase_date: formData.purchase_date,
        purchase_date_thai: purchaseDateThai.toISOString(),
        status: 'active',
        notes: formData.notes || null,
      });

      // Update customer_services.service_package_type to the new package
      await updateCustomerMutation.mutateAsync({
        id: customerId,
        data: {
          service_package_type: formData.service_package_type,
        },
      });

      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่มการซื้อ service package เรียบร้อยแล้ว",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Create purchase error:", error);
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถเพิ่มการซื้อได้";
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มการซื้อ Service Package</DialogTitle>
          <DialogDescription>
            บันทึกการซื้อ service package ใหม่สำหรับลูกค้า
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service_package_type">แพ็คเกจ Service *</Label>
            <Select 
              value={formData.service_package_type} 
              onValueChange={(value) => setFormData({ ...formData, service_package_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกแพ็คเกจ Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_year">1 ปี (Service 1 ครั้ง)</SelectItem>
                <SelectItem value="3_year">3 ปี (Service 3 ครั้ง)</SelectItem>
                <SelectItem value="5_year">5 ปี (Service 5 ครั้ง)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_date">วันที่ซื้อ *</Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={createPurchaseMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createPurchaseMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaleFollowUpDetail;

