import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Calendar,
  Zap,
  Wrench,
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  Trash2,
  Wrench as ServiceIcon
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomerServiceAPI as useCustomerService, useDeleteCustomerServiceAPI as useDeleteCustomerService } from "@/hooks/useCustomerServicesAPI";
import { useServiceVisitsAPI as useServiceVisits } from "@/hooks/useServiceVisitsAPI";
import { useToast } from "@/hooks/useToast";
import { PageLoading } from "@/components/ui/loading";

const CustomerServiceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  // Fetch data from Supabase
  const { data: customerService, isLoading, error } = useCustomerService(Number(id) || 0);
  const { data: serviceVisits } = useServiceVisits(Number(id) || 0);
  const deleteMutation = useDeleteCustomerService();


  const getServiceVisitStatus = (service: any) => {
    if (service.service_visit_1 && service.service_visit_2) {
      return { text: "บริการครบ", color: "bg-green-100 text-green-800 border-green-200" };
    } else if (service.service_visit_1 && !service.service_visit_2) {
      return { text: "รอบริการครั้งที่ 2", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    } else {
      return { text: "รอบริการครั้งที่ 1", color: "bg-orange-100 text-orange-800 border-orange-200" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateThai = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEdit = () => {
    navigate(`/service-tracking/customer-services/${id}/edit`);
  };

  const handleServiceVisit = () => {
    navigate(`/service-tracking/customer-services/${id}/service-visit`);
  };

  const handleDelete = async () => {
    if (customerService && window.confirm(`คุณต้องการลบข้อมูลลูกค้า ${customerService.customer_group} หรือไม่?`)) {
      try {
        await deleteMutation.mutateAsync(customerService.id);
        toast({
          title: "ลบสำเร็จ",
          description: `ลบข้อมูลลูกค้า ${customerService.customer_group} เรียบร้อยแล้ว`,
        });
        navigate("/service-tracking/customer-services");
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบข้อมูลลูกค้าได้",
          variant: "destructive",
        });
      }
    }
  };

  const handleBack = () => {
    navigate("/service-tracking/customer-services");
  };

  if (isLoading) {
    return <PageLoading type="form" />;
  }

  if (error || !customerService) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <p className="text-gray-600 text-sm mt-2">
            {error?.message || "ไม่พบข้อมูลลูกค้า"}
          </p>
          <Button 
            onClick={handleBack}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
        </div>
      </div>
    );
  }

  const serviceStatus = getServiceVisitStatus(customerService);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={handleBack}
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายละเอียดลูกค้า</h1>
            <p className="text-gray-600 mt-1">ข้อมูลลูกค้า ID #{customerService.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={handleServiceVisit}
            className="border-green-200 text-green-600 hover:bg-green-50"
          >
            <ServiceIcon className="h-4 w-4 mr-2" />
            บริการลูกค้า
          </Button>
          <Button 
            variant="outline"
            onClick={handleEdit}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            แก้ไข
          </Button>
          <Button 
            variant="outline"
            onClick={handleDelete}
            className="border-red-200 text-red-600 hover:bg-red-50"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ลบ
          </Button>
        </div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <ServiceIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">สถานะบริการ</h3>
                  <p className="text-gray-600">{serviceStatus.text}</p>
                </div>
              </div>
              <Badge className={`${serviceStatus.color} text-lg px-4 py-2`}>
                {serviceStatus.text}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              ข้อมูลลูกค้า
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">กลุ่มไลน์ซัพพอร์ตลูกค้า</p>
                  <p className="font-medium text-gray-900">{customerService.customer_group}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                  <p className="font-medium text-gray-900">{customerService.tel}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">ที่อยู่</p>
                  <p className="font-medium text-gray-900">
                    {customerService.district ? `${customerService.district}, ` : ''}{customerService.province}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">ฝ่ายขาย</p>
                  <p className="font-medium text-gray-900">{customerService.sale || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Information */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              ข้อมูลการติดตั้ง
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">วันที่ติดตั้ง</p>
                  <p className="font-medium text-gray-900">
                    {customerService.installation_date ? formatDateThai(customerService.installation_date) : '-'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">กำลังไฟที่ติดตั้ง</p>
                  <p className="font-medium text-gray-900">
                    {customerService.capacity_kw ? `${customerService.capacity_kw} kW` : '-'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Wrench className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">ช่างติดตั้ง</p>
                  <p className="font-medium text-gray-900">{customerService.installer_name || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Visits */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServiceIcon className="h-5 w-5 text-orange-600" />
            ประวัติการบริการ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Service Visit 1 */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${customerService.service_visit_1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {customerService.service_visit_1 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">บริการครั้งที่ 1</h4>
                  <Badge className={customerService.service_visit_1 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {customerService.service_visit_1 ? "เสร็จสิ้น" : "รอดำเนินการ"}
                  </Badge>
                </div>
                {customerService.service_visit_1 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p><span className="font-medium">วันที่:</span> {customerService.service_visit_1_date ? formatDateThai(customerService.service_visit_1_date) : '-'}</p>
                    <p><span className="font-medium">ช่าง:</span> {customerService.service_visit_1_technician || '-'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Service Visit 2 */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${customerService.service_visit_2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {customerService.service_visit_2 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">บริการครั้งที่ 2</h4>
                  <Badge className={customerService.service_visit_2 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {customerService.service_visit_2 ? "เสร็จสิ้น" : "รอดำเนินการ"}
                  </Badge>
                </div>
                {customerService.service_visit_2 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p><span className="font-medium">วันที่:</span> {customerService.service_visit_2_date ? formatDateThai(customerService.service_visit_2_date) : '-'}</p>
                    <p><span className="font-medium">ช่าง:</span> {customerService.service_visit_2_technician || '-'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {customerService.notes && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              หมายเหตุ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{customerService.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            ประวัติการดำเนินการ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">สร้างข้อมูลลูกค้า</p>
                <p className="text-sm text-gray-500">
                  {customerService.created_at ? formatDate(customerService.created_at) : '-'}
                </p>
              </div>
            </div>
            
            {customerService.updated_at && customerService.updated_at !== customerService.created_at && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">อัปเดตล่าสุด</p>
                  <p className="text-sm text-gray-500">{formatDate(customerService.updated_at)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default CustomerServiceDetail;
