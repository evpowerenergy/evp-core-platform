import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceAppointmentWithCustomer, useUpdateServiceAppointmentAPI as useUpdateServiceAppointment } from "@/hooks/useServiceAppointmentsAPI";
import { Clock, MapPin, User, Zap, Phone, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/useToast";

interface CompactAppointmentCardProps {
  appointment: ServiceAppointmentWithCustomer;
  onEdit?: (appointment: ServiceAppointmentWithCustomer) => void;
  onDelete?: (id: number) => void;
}

const CompactAppointmentCard = ({ appointment, onEdit, onDelete }: CompactAppointmentCardProps) => {
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

  const serviceTypeLabel = {
    visit_1: "ครั้งที่ 1",
    visit_2: "ครั้งที่ 2",
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-400">
      <CardContent className="p-2 space-y-1.5">
        {/* Time and Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
            <span className="font-semibold text-xs">
              {appointment.appointment_time 
                ? format(new Date(`2000-01-01T${appointment.appointment_time}`), "HH:mm")
                : "ไม่ระบุ"
              }
            </span>
            {appointment.estimated_duration_minutes && (
              <span className="text-[10px] text-muted-foreground">
                ({appointment.estimated_duration_minutes}น.)
              </span>
            )}
          </div>
          <div className="flex gap-0.5">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(appointment)}
                className="h-6 w-6"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(appointment.id)}
                className="h-6 w-6 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-200"></div>

        {/* Customer Name */}
        <div className="font-medium text-xs truncate" title={appointment.customer.customer_group}>
          🏢 {appointment.customer.customer_group}
        </div>

        {/* Location */}
        <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-1">
            {appointment.customer.district 
              ? `${appointment.customer.district}, ${appointment.customer.province}`
              : appointment.customer.province
            }
          </span>
        </div>

        {/* Technician */}
        {appointment.technician_name && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{appointment.technician_name}</span>
          </div>
        )}

        {/* Capacity and Phone in one row */}
        <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
          {appointment.customer.capacity_kw && (
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 flex-shrink-0" />
              <span>{appointment.customer.capacity_kw} kW</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <a 
              href={`tel:${appointment.customer.tel}`}
              className="hover:text-orange-600 hover:underline truncate"
            >
              {appointment.customer.tel}
            </a>
          </div>
        </div>

        {/* Service Type Badge */}
        {appointment.service_type && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
              {serviceTypeLabel[appointment.service_type]}
            </Badge>
          </div>
        )}

        {/* Notes */}
        {appointment.notes && (
          <p className="text-[10px] text-muted-foreground pt-0.5 border-t italic line-clamp-1" title={appointment.notes}>
            {appointment.notes}
          </p>
        )}

        {/* Complete Button */}
        {(appointment.status === 'scheduled' || appointment.status === 'in_progress') && (
          <div className="pt-1.5">
            <Button 
              onClick={handleMarkComplete}
              disabled={updateMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-6 text-[10px]"
              size="sm"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              <span>
                {updateMutation.isPending ? 'บันทึก...' : 'เสร็จสิ้น'}
              </span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactAppointmentCard;

