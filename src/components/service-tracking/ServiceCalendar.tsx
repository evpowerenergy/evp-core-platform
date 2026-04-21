import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMonthlyAppointmentsAPI as useMonthlyAppointments } from "@/hooks/useServiceAppointmentsAPI";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DayContentProps } from "react-day-picker";

interface ServiceCalendarProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

const ServiceCalendar = ({ selectedDate, onSelectDate }: ServiceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { data: monthlyAppointments } = useMonthlyAppointments(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  // Count appointments per day
  const appointmentCountByDate = monthlyAppointments?.reduce((acc, appointment) => {
    const dateKey = format(new Date(appointment.appointment_date), "yyyy-MM-dd");
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Custom day component to show appointment count
  const DayContent = (props: DayContentProps) => {
    const dateKey = format(props.date, "yyyy-MM-dd");
    const count = appointmentCountByDate[dateKey];
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{format(props.date, "d")}</span>
        {count && count > 0 && (
          <span className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
            {count}
          </span>
        )}
      </div>
    );
  };

  // Function to determine if a date has appointments
  const hasAppointments = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return appointmentCountByDate[dateKey] > 0;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-orange-600" />
          ปฏิทินนัดหมาย Service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          locale={th}
          className="rounded-md border pointer-events-auto w-full"
          components={{
            DayContent: DayContent,
          }}
          modifiers={{
            hasAppointment: (date) => hasAppointments(date),
          }}
          modifiersClassNames={{
            hasAppointment: "bg-orange-100 text-orange-900 font-semibold hover:bg-orange-200",
          }}
          classNames={{
            day_selected: "bg-orange-600 text-white hover:bg-orange-700 font-bold",
            day_today: "bg-orange-50 text-orange-900 font-semibold border-2 border-orange-300",
            months: "w-full",
            month: "w-full",
            table: "w-full border-collapse",
            head_row: "flex w-full",
            head_cell: "text-muted-foreground rounded-md w-full font-medium text-sm flex-1 text-center",
            row: "flex w-full mt-2",
            cell: "text-center p-0 relative flex-1 text-sm focus-within:relative focus-within:z-20",
            day: "h-9 w-full p-0 font-normal flex items-center justify-center aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
          }}
        />

        {/* Selected date info */}
        {selectedDate && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-900">
              {format(selectedDate, "d MMMM yyyy", { locale: th })}
            </p>
            {appointmentCountByDate[format(selectedDate, "yyyy-MM-dd")] > 0 && (
              <Badge variant="secondary" className="mt-2">
                {appointmentCountByDate[format(selectedDate, "yyyy-MM-dd")]} นัดหมาย
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceCalendar;