import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceAppointmentWithCustomer, useUpdateServiceAppointmentAPI as useUpdateServiceAppointment } from "@/hooks/useServiceAppointmentsAPI";
import { Clock, MapPin, User, Zap, Phone, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

interface AppointmentCardProps {
  appointment: ServiceAppointmentWithCustomer;
  onEdit?: (appointment: ServiceAppointmentWithCustomer) => void;
  onDelete?: (id: number) => void;
}

const AppointmentCard = ({ appointment, onEdit, onDelete }: AppointmentCardProps) => {
  const { toast } = useToast();
  const updateMutation = useUpdateServiceAppointment();

  const handleMarkComplete = async () => {
    try {
      await updateMutation.mutateAsync({
        id: appointment.id,
        updates: {
          status: 'completed'
        }
      });

      toast({
        title: "✅ บันทึกสำเร็จ",
        description: "สถานะการบริการถูกอัปเดตแล้ว",
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const statusConfig = {
    scheduled: {
      label: "กำหนดการ",
      variant: "default" as const,
      className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
    in_progress: {
      label: "กำลังดำเนินการ",
      variant: "default" as const,
      className: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    },
    completed: {
      label: "เสร็จสิ้น",
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 hover:bg-green-200",
    },
    cancelled: {
      label: "ยกเลิก",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 hover:bg-red-200",
    },
    rescheduled: {
      label: "เลื่อนนัด",
      variant: "outline" as const,
      className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    },
  };

  const serviceTypeLabel = {
    visit_1: "บริการครั้งที่ 1",
    visit_2: "บริการครั้งที่ 2",
  };

  const status = statusConfig[appointment.status];

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      appointment.status === 'in_progress' && "border-l-4 border-l-amber-500",
      appointment.status === 'scheduled' && "border-l-4 border-l-blue-500"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{appointment.customer.customer_group}</h3>
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(appointment)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(appointment.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 text-sm">
        {/* Time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {appointment.appointment_time 
              ? format(new Date(`2000-01-01T${appointment.appointment_time}`), "HH:mm น.")
              : "ไม่ระบุเวลา"
            }
          </span>
          {appointment.estimated_duration_minutes && (
            <span className="text-xs">
              (~{appointment.estimated_duration_minutes} นาที)
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {appointment.customer.district 
              ? `${appointment.customer.district}, ${appointment.customer.province}`
              : appointment.customer.province
            }
          </span>
        </div>

        {/* Capacity */}
        {appointment.customer.capacity_kw && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>{appointment.customer.capacity_kw} kW</span>
          </div>
        )}

        {/* Technician */}
        {appointment.technician_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>ช่าง: {appointment.technician_name}</span>
          </div>
        )}

        {/* Phone */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <a 
            href={`tel:${appointment.customer.tel}`}
            className="hover:text-orange-600 hover:underline"
          >
            {appointment.customer.tel}
          </a>
        </div>

        {/* Service Type */}
        {appointment.service_type && (
          <Badge variant="outline" className="mt-2">
            {serviceTypeLabel[appointment.service_type]}
          </Badge>
        )}

        {/* Notes */}
        {appointment.notes && (
          <p className="text-xs text-muted-foreground pt-2 border-t italic">
            {appointment.notes}
          </p>
        )}

        {/* Complete Button */}
        {(appointment.status === 'scheduled' || appointment.status === 'in_progress') && (
          <div className="pt-3 border-t">
            <Button 
              onClick={handleMarkComplete}
              disabled={updateMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'กำลังบันทึก...' : 'บริการเสร็จสิ้น'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;