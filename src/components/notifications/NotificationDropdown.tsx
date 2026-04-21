import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { AppointmentNotification } from '@/hooks/useAppointmentNotifications';
import { useNavigate } from 'react-router-dom';

interface NotificationDropdownProps {
  appointments: AppointmentNotification[];
  onViewDetails?: (appointment: AppointmentNotification) => void;
  children: React.ReactNode;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  appointments,
  onViewDetails,
  children
}) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/my-appointments');
  };

  const handleViewDetails = (appointment: AppointmentNotification) => {
    if (onViewDetails) {
      onViewDetails(appointment);
    } else {
      // Default: ไปที่หน้า timeline ของ lead
      if (appointment.lead?.id) {
        navigate(`/leads/${appointment.lead.id}/timeline`);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            นัดหมายวันนี้
          </h3>
          {appointments.length > 0 && (
            <span className="text-xs text-gray-600">
              ({appointments.length})
            </span>
          )}
        </div>

        {/* Content */}
        {appointments.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="p-2 space-y-2">
              {appointments.map((appointment) => (
                <NotificationItem
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">
              ไม่มีนัดหมายวันนี้
            </p>
            <p className="text-xs text-gray-500">
              คุณไม่มีนัดหมายในวันนี้
            </p>
          </div>
        )}

        {/* Footer */}
        {appointments.length > 0 && (
          <div className="p-2 border-t bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleViewAll}
            >
              ดูทั้งหมด
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

