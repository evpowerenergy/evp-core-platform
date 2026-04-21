import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermitRequest } from "@/hooks/usePermitRequests";
import { PageLoading } from "@/components/ui/loading";
import { 
  Edit, 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Calendar,
  Zap,
  Wrench,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  Trash2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AttachmentCard from "@/components/service-tracking/AttachmentCard";

const RequestDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch request data from Supabase
  const { data: request, isLoading, error } = usePermitRequest(
    id ? parseInt(id, 10) : 0
  );

  if (isLoading) {
    return <PageLoading type="form" />;
  }

  if (error || !request) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบข้อมูลคำขออนุญาต</h3>
          <p className="text-gray-600 mb-4">ไม่สามารถโหลดข้อมูลคำขออนุญาตได้</p>
          <Button 
            onClick={() => navigate("/service-tracking/requests")}
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปยังรายการคำขอ
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ไม่สามารถดำเนินการได้":
        return "bg-red-100 text-red-800 border-red-200";
      case "ระหว่างดำเนินการ":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ดำเนินการเสร็จสิ้น":
        return "bg-green-100 text-green-800 border-green-200";
      case "ไม่ยื่นขออนุญาต":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "ยกเลิกกิจการ":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ไม่สามารถดำเนินการได้":
        return <AlertCircle className="h-5 w-5" />;
      case "ระหว่างดำเนินการ":
        return <Clock className="h-5 w-5" />;
      case "ดำเนินการเสร็จสิ้น":
        return <CheckCircle className="h-5 w-5" />;
      case "ไม่ยื่นขออนุญาต":
        return <FileText className="h-5 w-5" />;
      case "ยกเลิกกิจการ":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'ไม่ระบุ';
    
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok' // เพิ่ม timezone ไทย
      });
    } catch (error) {
      return 'ไม่ระบุ';
    }
  };

  const handleEdit = () => {
    navigate(`/service-tracking/requests/${id}/edit`);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
  };

  const handleBack = () => {
    navigate("/service-tracking/requests");
  };

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
            <h1 className="text-3xl font-bold text-gray-900">รายละเอียดคำขออนุญาต</h1>
            <p className="text-gray-600 mt-1">ข้อมูลคำขออนุญาตหมายเลข #{request.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ลบ
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                {getStatusIcon(request.main_status)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">สถานะปัจจุบัน</h3>
                <p className="text-gray-600">{request.sub_status || 'ไม่ระบุสถานะย่อย'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${getStatusColor(request.main_status)} text-lg px-4 py-2`}>
                {request.main_status}
              </Badge>
              {request.sub_status && (
                <Badge variant="outline" className="text-sm px-3 py-1 border-orange-300 text-orange-700">
                  {request.sub_status}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer and Document Information */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <User className="h-5 w-5" />
            ข้อมูลลูกค้าและเอกสาร
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ผู้ดำเนินการขออนุญาต */}
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">ผู้ดำเนินการขออนุญาต</p>
                <p className="font-medium text-gray-900">{request.operator_name || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* บริษัท */}
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">บริษัท</p>
                <p className="font-medium text-gray-900">{request.company_name || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* เลขที่เอกสาร */}
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">เลขที่เอกสาร</p>
                <p className="font-medium text-gray-900">{request.document_number || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* ชื่อผู้ขอ */}
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">ชื่อผู้ขอ</p>
                <p className="font-medium text-gray-900">{request.requester_name || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* ชื่อที่ขออนุญาต */}
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">ชื่อที่ขออนุญาต</p>
                <p className="font-medium text-gray-900">{request.requested_name || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                <p className="font-medium text-gray-900">{request.phone_number || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* จังหวัด */}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">จังหวัด</p>
                <p className="font-medium text-gray-900">{request.province || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* อำเภอ */}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">อำเภอ</p>
                <p className="font-medium text-gray-900">{request.district || 'ไม่ระบุ'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Information */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Zap className="h-5 w-5" />
            ข้อมูลการติดตั้ง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ขนาดติดตั้ง */}
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">ขนาดติดตั้ง (kW)</p>
                <p className="font-medium text-gray-900">{request.capacity_kw ? `${request.capacity_kw} kW` : 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* ผู้คุมงาน + ทีมช่าง */}
            <div className="flex items-center gap-3">
              <Wrench className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">ผู้คุมงาน + ทีมช่าง</p>
                <p className="font-medium text-gray-900">{request.team_leader || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* ขนาน/ขาย */}
            <div className="flex items-center gap-3">
              <Wrench className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">ขนาน/ขาย</p>
                <p className="font-medium text-gray-900">{request.connection_type || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* เลขมิเตอร์ */}
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">เลขมิเตอร์</p>
                <p className="font-medium text-gray-900">{request.meter_number || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* เลขที่ขออนุญาต */}
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">เลขที่ขออนุญาต</p>
                <p className="font-medium text-gray-900">{request.permit_number || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* MAP */}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">MAP</p>
                <p className="font-medium text-gray-900">{request.map_reference || 'ไม่ระบุ'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Information */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Calendar className="h-5 w-5" />
            วันที่ดำเนินการ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* วันที่รับเอกสาร */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">วันที่รับเอกสาร</p>
                <p className="font-medium text-gray-900">
                  {request.document_received_date ? formatDate(request.document_received_date) : 'ไม่ระบุ'}
                </p>
              </div>
            </div>

            {/* วันที่ดำเนินการเสร็จ */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">วันที่ดำเนินการเสร็จ</p>
                <p className="font-medium text-gray-900">
                  {request.completion_date ? formatDate(request.completion_date) : 'ไม่ระบุ'}
                </p>
              </div>
            </div>

            {/* วันที่ออนระบบ */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">วันที่ออนระบบ</p>
                <p className="font-medium text-gray-900">
                  {request.online_date ? formatDate(request.online_date) : 'ไม่ระบุ'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            สถานะการดำเนินการ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ผู้ดำเนินการ */}
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">ผู้ดำเนินการ</p>
                <p className="font-medium text-gray-900">{request.executor || 'ไม่ระบุ'}</p>
              </div>
            </div>

            {/* สถานะหลัก */}
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">สถานะหลัก</p>
                <Badge className={`${getStatusColor(request.main_status)} text-sm`}>
                  {request.main_status}
                </Badge>
              </div>
            </div>
          </div>

          {/* สถานะย่อย */}
          {request.sub_status && (
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">สถานะย่อย</p>
                <p className="font-medium text-gray-900">{request.sub_status}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {request.note && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              หมายเหตุ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{request.note}</p>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {request.attachments && (
        <AttachmentCard 
          attachments={
            typeof request.attachments === 'string' 
              ? JSON.parse(request.attachments) 
              : request.attachments
          } 
        />
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
                <p className="font-medium text-gray-900">สร้างคำขอใหม่</p>
                <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">อัปเดตสถานะ</p>
                <p className="text-sm text-gray-500">{formatDate(request.updated_at)}</p>
                <p className="text-sm text-gray-600 mt-1">{request.sub_status || 'ไม่ระบุ'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button 
          variant="outline"
          onClick={handleBack}
          className="border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปรายการ
        </Button>
        <Button 
          onClick={handleEdit}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Edit className="h-4 w-4 mr-2" />
          แก้ไขข้อมูล
        </Button>
      </div>
    </div>
  );
};

export default RequestDetail;


