
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AppointmentCard } from "./AppointmentCard";

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
  status: string;
}

interface PaymentAppointment extends BaseAppointment {
  type: 'payment';
  total_amount?: number;
}

type AppointmentDetail = FollowUpAppointment | EngineerAppointment | PaymentAppointment;

interface AppointmentCalendarSectionProps {
  appointments: AppointmentDetail[];
  title: string;
  color: string;
  icon: React.ReactNode;
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
}

export const AppointmentCalendarSection = ({
  appointments,
  title,
  color,
  icon,
  selectedDate,
  onDateSelect
}: AppointmentCalendarSectionProps) => {
  const getAppointmentDates = (appointments: AppointmentDetail[]) => {
    return appointments.map(apt => new Date(apt.date));
  };

  const getAppointmentCountByDate = (appointments: AppointmentDetail[]) => {
    const countMap = new Map<string, number>();
    appointments.forEach(apt => {
      const dateKey = new Date(apt.date).toDateString();
      countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
    });
    return countMap;
  };


  const getAppointmentsForSelectedDate = (appointments: AppointmentDetail[]) => {
    if (!selectedDate) return [];
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === selectedDate.toDateString();
    });
  };

  const appointmentDates = getAppointmentDates(appointments);
  const appointmentCountByDate = getAppointmentCountByDate(appointments);
  const selectedDateAppointments = getAppointmentsForSelectedDate(appointments);

  // Get color classes for styling
  const getColorClasses = () => {
    switch (color) {
      case 'text-blue-600':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          accent: '#3b82f6'
        };
      case 'text-green-600':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          accent: '#10b981'
        };
      case 'text-orange-600':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          accent: '#f59e0b'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          accent: '#6b7280'
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="space-y-6 w-full">
      {/* Enhanced Header */}
      <div className={`${colorClasses.bg} ${colorClasses.border} border-2 rounded-xl p-6 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
              {icon}
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${color}`}>{title}</h3>
              <p className="text-gray-600 text-sm mt-1">จัดการนัดหมายของคุณ</p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${colorClasses.border} ${color} bg-white px-4 py-2 text-base font-semibold shadow-sm`}
          >
            {appointments.length} นัดหมาย
          </Badge>
        </div>
      </div>
      
      <div className="grid xl:grid-cols-3 lg:grid-cols-2 grid-cols-1 gap-6 w-full">
        {/* Enhanced Calendar */}
        <Card className="xl:col-span-2 shadow-lg border-0 overflow-hidden">
          <CardHeader className={`${colorClasses.bg} border-b-2 ${colorClasses.border}`}>
            <CardTitle className={`text-xl font-bold ${color} flex items-center gap-2`}>
              📅 ปฏิทินนัดหมาย
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                modifiers={{
                  hasAppointment: appointmentDates
                }}
                components={{
                  Day: ({ date, ...props }) => {
                    const dayKey = date.toDateString();
                    const appointmentCount = appointmentCountByDate.get(dayKey) || 0;
                    const isToday = date.toDateString() === new Date().toDateString();
                    const hasAppointment = appointmentCount > 0;
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    
                    let dayClasses = "h-12 w-full p-1 font-normal relative rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-sm hover:scale-105 hover:shadow-md";
                    
                    if (isSelected && !isToday) {
                      dayClasses += " bg-primary text-primary-foreground font-bold ring-2 ring-primary/50";
                    } else if (isToday) {
                      dayClasses += " bg-calendar-today text-calendar-today-foreground font-bold ring-2 ring-calendar-today/30";
                    } else if (hasAppointment) {
                      dayClasses += " bg-calendar-appointment text-calendar-appointment-foreground font-semibold hover:bg-calendar-appointment/80";
                    } else {
                      dayClasses += " hover:bg-accent hover:text-accent-foreground bg-background text-foreground";
                    }

                    // Filter out props that shouldn't be passed to DOM elements
                    const { displayMonth, ...safeProps } = props;

                    return (
                      <div 
                        className={dayClasses} 
                        {...safeProps}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDateSelect(date);
                        }}
                      >
                        <span className="leading-none">{date.getDate()}</span>
                        {appointmentCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                            {appointmentCount}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
                className="w-full max-w-none scale-110 transform"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-full font-medium text-sm flex-1 text-center p-2",
                  row: "flex w-full mt-2",
                  cell: "flex-1 h-12 text-center text-sm p-1 relative focus-within:relative focus-within:z-20",
                  day_selected: `bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground ring-2 ring-primary/50`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Appointments List */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className={`${colorClasses.bg} border-b-2 ${colorClasses.border}`}>
            <CardTitle className={`text-lg font-bold ${color} flex items-center gap-2`}>
              📋 นัดหมายวันที่ {selectedDate ? selectedDate.toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'ไม่ได้เลือก'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDateAppointments.length > 0 ? (
                selectedDateAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    color={color}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-gray-500 font-medium">
                    {selectedDate ? 'ไม่มีนัดหมายในวันนี้' : 'กรุณาเลือกวันที่เพื่อดูนัดหมาย'}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    เลือกวันที่ในปฏิทินเพื่อดูรายละเอียดนัดหมาย
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
