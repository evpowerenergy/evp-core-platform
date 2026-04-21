import React from 'react';
import { Clock, MapPin, Phone, User, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppointmentNotification } from '@/hooks/useAppointmentNotifications';

interface NotificationItemProps {
  appointment: AppointmentNotification;
  onViewDetails?: (appointment: AppointmentNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  appointment,
  onViewDetails
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case 'follow-up':
        return 'นัดติดตาม';
      case 'engineer':
        return 'นัดหมายวิศวกร';
      case 'payment':
        return 'ประมาณการชำระ';
      default:
        return 'นัดหมาย';
    }
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'follow-up':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'engineer':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'payment':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'follow-up':
        return <Clock className="h-4 w-4" />;
      case 'engineer':
        return <User className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={`text-xs px-2 py-0.5 ${getAppointmentTypeColor(appointment.type)}`}
            >
              <span className="flex items-center gap-1">
                {getAppointmentTypeIcon(appointment.type)}
                {getAppointmentTypeLabel(appointment.type)}
              </span>
            </Badge>
          </div>

          {/* Customer Info */}
          <div className="space-y-1 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {appointment.lead?.full_name || 'ไม่ระบุชื่อ'}
              </span>
            </div>
            
            {appointment.lead?.tel && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{appointment.lead.tel}</span>
              </div>
            )}

            {appointment.location && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{appointment.location}</span>
              </div>
            )}
          </div>

          {/* Time */}
          {appointment.date && (
            <div className="flex items-center gap-2 text-xs text-gray-700 mb-2">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{formatTime(appointment.date)}</span>
            </div>
          )}

          {/* Details */}
          {appointment.details && (
            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
              {appointment.details}
            </p>
          )}

          {/* Payment Info (for payment type) */}
          {appointment.type === 'payment' && appointment.total_amount && (
            <div className="text-xs text-gray-600 mt-1">
              <span className="font-medium">ยอดเงิน: </span>
              <span>{appointment.total_amount.toLocaleString('th-TH')} บาท</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

