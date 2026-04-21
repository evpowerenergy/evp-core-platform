import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from './NotificationDropdown';
import { useAppointmentNotifications } from '@/hooks/useAppointmentNotifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className
}) => {
  const { todayAppointments, todayCount, isLoading } = useAppointmentNotifications();

  return (
    <NotificationDropdown
      appointments={todayAppointments}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-9 w-9",
          className
        )}
        disabled={isLoading}
      >
        <Bell className="h-5 w-5" />
        {todayCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold rounded-full"
          >
            {todayCount > 99 ? '99+' : todayCount}
          </Badge>
        )}
      </Button>
    </NotificationDropdown>
  );
};

