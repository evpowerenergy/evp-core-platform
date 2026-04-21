import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ServiceAppointmentWithCustomer } from "@/hooks/useServiceAppointmentsAPI";
import CompactAppointmentCard from "./CompactAppointmentCard";
import { format, isToday } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarOff } from "lucide-react";

interface WeeklyDayColumnProps {
  date: Date;
  appointments: ServiceAppointmentWithCustomer[];
  onEdit?: (appointment: ServiceAppointmentWithCustomer) => void;
  onDelete?: (id: number) => void;
}

const WeeklyDayColumn = ({ date, appointments, onEdit, onDelete }: WeeklyDayColumnProps) => {
  const today = isToday(date);

  // Group by technician and sort by time
  const appointmentsByTechnician = appointments.reduce((acc, appointment) => {
    const technicianName = appointment.technician_name || "ยังไม่ระบุช่าง";
    if (!acc[technicianName]) {
      acc[technicianName] = [];
    }
    acc[technicianName].push(appointment);
    return acc;
  }, {} as Record<string, ServiceAppointmentWithCustomer[]>);

  // Sort each technician's appointments by time
  Object.keys(appointmentsByTechnician).forEach(technician => {
    appointmentsByTechnician[technician].sort((a, b) => {
      const timeA = a.appointment_time || "00:00";
      const timeB = b.appointment_time || "00:00";
      return timeA.localeCompare(timeB);
    });
  });

  const technicianNames = Object.keys(appointmentsByTechnician).sort();

  // Day name colors (Thai style)
  const dayColors = {
    0: { bg: "bg-red-50", border: "border-t-red-400", text: "text-red-700" }, // Sunday
    1: { bg: "bg-yellow-50", border: "border-t-yellow-400", text: "text-yellow-700" }, // Monday
    2: { bg: "bg-pink-50", border: "border-t-pink-400", text: "text-pink-700" }, // Tuesday
    3: { bg: "bg-green-50", border: "border-t-green-400", text: "text-green-700" }, // Wednesday
    4: { bg: "bg-orange-50", border: "border-t-orange-400", text: "text-orange-700" }, // Thursday
    5: { bg: "bg-blue-50", border: "border-t-blue-400", text: "text-blue-700" }, // Friday
    6: { bg: "bg-purple-50", border: "border-t-purple-400", text: "text-purple-700" }, // Saturday
  };

  const dayOfWeek = date.getDay();
  const colors = dayColors[dayOfWeek as keyof typeof dayColors];

  return (
    <div className="h-full min-w-0">
      <Card className={cn(
        "h-full flex flex-col border-t-4 shadow-sm",
        colors.border,
        today && "ring-2 ring-orange-400 ring-offset-2"
      )}>
        <CardHeader className={cn("pb-2 space-y-1.5 px-3 pt-3", colors.bg)}>
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span className={colors.text}>
              {format(date, "EEEE", { locale: th })}
            </span>
            {today && (
              <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 font-semibold">
                วันนี้
              </Badge>
            )}
          </CardTitle>
          <div className="text-sm font-medium text-muted-foreground">
            {format(date, "d MMMM yyyy", { locale: th })}
          </div>
          
          {/* Summary */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium">
              {appointments.length} นัด
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-2 overflow-hidden">
          {appointments.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-4">
              <CalendarOff className="h-8 w-8 mb-2 text-gray-300" />
              <p className="text-xs font-medium">ไม่มีนัดหมาย</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-1">
              <div className="space-y-2">
                {technicianNames.map((technicianName) => (
                  <div key={technicianName} className="space-y-1.5">
                    {/* Technician Header */}
                    <div className="flex items-center gap-1 sticky top-0 bg-background/95 backdrop-blur py-0.5 z-10">
                      <div className="h-px flex-1 bg-border"></div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                        👨‍🔧 {technicianName} ({appointmentsByTechnician[technicianName].length})
                      </Badge>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>

                    {/* Appointments */}
                    <div className="space-y-1.5">
                      {appointmentsByTechnician[technicianName].map((appointment) => (
                        <CompactAppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyDayColumn;

