
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Phone, MapPin } from "lucide-react";

type AppointmentType = 'follow-up' | 'engineer' | 'payment';

interface LeadInfo {
  id: number;
  full_name?: string;
  tel?: string;
  region?: string;
  platform?: string;
}

interface BaseAppointment {
  id: number;
  date: string;
  type: AppointmentType;
  lead: LeadInfo;
}

interface FollowUpAppointment extends BaseAppointment {
  type: 'follow-up';
  details?: string;
}

interface EngineerAppointment extends BaseAppointment {
  type: 'engineer';
  location?: string;
  building_details?: string;
  installation_notes?: string;
  status: string;
  note?: string;
}

interface PaymentAppointment extends BaseAppointment {
  type: 'payment';
  total_amount?: number;
  payment_method?: string;
}

type AppointmentDetail = FollowUpAppointment | EngineerAppointment | PaymentAppointment;

interface AppointmentDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentDetail | null;
}

export const AppointmentDetailDialog = ({
  isOpen,
  onOpenChange,
  appointment
}: AppointmentDetailDialogProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>รายละเอียดนัดหมาย</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลลีด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{appointment.lead.full_name || 'ไม่ระบุชื่อ'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{appointment.lead.tel || 'ไม่ระบุ'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{appointment.lead.region || 'ไม่ระบุ'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">แพลตฟอร์ม:</span>
                <span>{appointment.lead.platform || 'ไม่ระบุ'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายละเอียดนัดหมาย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">ประเภท:</span>
                <Badge className="ml-2">
                  {appointment.type === 'follow-up' && 'นัดติดตามครั้งถัดไป'}
                  {appointment.type === 'engineer' && 'นัดหมายวิศวกร'}
                  {appointment.type === 'payment' && 'ประมาณการชำระเงิน'}
                </Badge>
              </div>
              
              {/* Type-specific details */}
              {appointment.type === 'follow-up' && (
                <div>
                  <span className="text-sm text-gray-500">รายละเอียดการติดตาม:</span>
                  <p className="mt-1">{appointment.details || 'การนัดติดตามครั้งถัดไป'}</p>
                </div>
              )}
              
              {appointment.type === 'engineer' && (
                <>
                  <div>
                    <span className="text-sm text-gray-500">สถานะ:</span>
                    <Badge variant="outline" className="ml-2">{appointment.status}</Badge>
                  </div>
                  {appointment.location && (
                    <div>
                      <span className="text-sm text-gray-500">สถานที่:</span>
                      <p className="mt-1">{appointment.location}</p>
                    </div>
                  )}
                  {appointment.building_details && (
                    <div>
                      <span className="text-sm text-gray-500">รายละเอียดอาคาร:</span>
                      <p className="mt-1">{appointment.building_details}</p>
                    </div>
                  )}
                  {appointment.installation_notes && (
                    <div>
                      <span className="text-sm text-gray-500">หมายเหตุการติดตั้ง:</span>
                      <p className="mt-1">{appointment.installation_notes}</p>
                    </div>
                  )}
                  {appointment.note && (
                    <div>
                      <span className="text-sm text-gray-500">หมายเหตุ:</span>
                      <p className="mt-1">{appointment.note}</p>
                    </div>
                  )}
                </>
              )}
              
              {appointment.type === 'payment' && (
                <>
                  {appointment.total_amount && (
                    <div>
                      <span className="text-sm text-gray-500">จำนวนเงิน:</span>
                      <p className="mt-1 font-medium">{appointment.total_amount.toLocaleString()} บาท</p>
                    </div>
                  )}
                  {appointment.payment_method && (
                    <div>
                      <span className="text-sm text-gray-500">วิธีการชำระเงิน:</span>
                      <p className="mt-1">{appointment.payment_method}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
