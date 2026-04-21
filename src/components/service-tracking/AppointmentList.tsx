import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ServiceAppointmentWithCustomer } from "@/hooks/useServiceAppointmentsAPI";
import AppointmentCard from "./AppointmentCard";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarCheck, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AppointmentListProps {
  appointments: ServiceAppointmentWithCustomer[];
  selectedDate: Date | undefined;
  onEdit?: (appointment: ServiceAppointmentWithCustomer) => void;
  onDelete?: (id: number) => void;
}

const AppointmentList = ({ 
  appointments, 
  selectedDate,
  onEdit,
  onDelete 
}: AppointmentListProps) => {
  // Group appointments by technician
  const appointmentsByTechnician = appointments.reduce((acc, appointment) => {
    const technicianName = appointment.technician_name || "ยังไม่ระบุช่าง";
    if (!acc[technicianName]) {
      acc[technicianName] = [];
    }
    acc[technicianName].push(appointment);
    return acc;
  }, {} as Record<string, ServiceAppointmentWithCustomer[]>);

  const technicianNames = Object.keys(appointmentsByTechnician).sort();

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-orange-600" />
            รายการนัดหมาย
          </CardTitle>
          {selectedDate && (
            <Badge variant="outline" className="text-sm">
              {format(selectedDate, "d MMM yyyy", { locale: th })}
            </Badge>
          )}
        </div>
        {appointments.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            ทั้งหมด {appointments.length} นัดหมาย
          </p>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center flex-1 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50/30">
            <CalendarCheck className="h-16 w-16 text-orange-400 mb-4" />
            <p className="text-base font-semibold text-orange-900 mb-2">
              {selectedDate 
                ? "ไม่มีนัดหมายในวันที่เลือก"
                : "เลือกวันที่เพื่อดูนัดหมาย"
              }
            </p>
            <p className="text-sm text-muted-foreground">
              ลากการ์ดลูกค้าจากรายการรอ Service มาวางที่นี่<br/>
              เพื่อสร้างนัดหมายใหม่
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {technicianNames.map((technicianName) => (
                <div key={technicianName}>
                  {/* Technician Header */}
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                    <Users className="h-4 w-4 text-orange-600" />
                    <h3 className="font-semibold text-sm">{technicianName}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {appointmentsByTechnician[technicianName].length} นัด
                    </Badge>
                  </div>

                  {/* Appointments for this technician */}
                  <div className="space-y-3">
                    {appointmentsByTechnician[technicianName]
                      .sort((a, b) => {
                        // Sort by time if available
                        if (a.appointment_time && b.appointment_time) {
                          return a.appointment_time.localeCompare(b.appointment_time);
                        }
                        return 0;
                      })
                      .map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                  </div>

                  {/* Separator between technicians */}
                  {technicianName !== technicianNames[technicianNames.length - 1] && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentList;