
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategoryBadgeClassName } from "@/utils/categoryBadgeUtils";

type AppointmentType = 'follow-up' | 'engineer' | 'payment';

interface LeadInfo {
  id: number;
  full_name?: string;
  tel?: string;
  region?: string;
  platform?: string;
  category?: string; // เพิ่ม category เพื่อตรวจสอบประเภทของ lead
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

interface AppointmentCardProps {
  appointment: AppointmentDetail;
  color: string;
  onClick?: (appointment: AppointmentDetail) => void;
}

export const AppointmentCard = ({ appointment, color, onClick }: AppointmentCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppointmentDetail = () => {
    switch (appointment.type) {
      case 'follow-up':
        return appointment.details || 'การนัดติดตามครั้งถัดไป';
      case 'engineer':
        return appointment.location || 'ไม่ระบุสถานที่';
      case 'payment':
        return appointment.total_amount 
          ? `${appointment.total_amount.toLocaleString()} บาท` 
          : 'ไม่ระบุจำนวนเงิน';
      default:
        return 'ไม่มีรายละเอียด';
    }
  };

  const getBadgeText = () => {
    switch (appointment.type) {
      case 'follow-up':
        return 'นัดติดตาม';
      case 'engineer':
        return appointment.status || 'กำหนดการ';
      case 'payment':
        return 'ชำระเงิน';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (appointment.type) {
      case 'follow-up':
        return <Clock className="h-4 w-4" />;
      case 'engineer':
        return <MapPin className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getHoverBg = () => {
    switch (color) {
      case 'text-blue-600':
        return 'hover:bg-blue-50';
      case 'text-green-600':
        return 'hover:bg-green-50';
      case 'text-orange-600':
        return 'hover:bg-orange-50';
      case 'text-purple-600':
        return 'hover:bg-purple-50';
      default:
        return 'hover:bg-gray-50';
    }
  };

  const getIconBg = () => {
    switch (appointment.type) {
      case 'follow-up':
        return 'bg-blue-100';
      case 'engineer':
        return 'bg-green-100';
      case 'payment':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getBadgeColor = () => {
    switch (appointment.type) {
      case 'follow-up':
        return 'border-blue-200 text-blue-600';
      case 'engineer':
        return 'border-green-200 text-green-600';
      case 'payment':
        return 'border-orange-200 text-orange-600';
      default:
        return 'border-gray-200 text-gray-600';
    }
  };

  // กำหนด route ตามประเภทของ lead และ context
  const getLeadRoute = () => {
    const leadCategory = appointment.lead.category;
    
    // ตรวจสอบประเภทของ lead และนำทางไปยัง route ที่ถูกต้อง
    if (leadCategory === 'Wholesale' || leadCategory === 'Wholesales') {
      return `/wholesale/leads/${appointment.lead.id}/timeline`;
    } else {
      // สำหรับ Package และประเภทอื่นๆ ใช้ route หลัก
      return `/leads/${appointment.lead.id}/timeline`;
    }
  };

  // ตรวจสอบว่าเป็น wholesale lead หรือไม่
  const isWholesaleLead = appointment.lead.category === 'Wholesale' || appointment.lead.category === 'Wholesales';

  return (
    <Link 
      to={getLeadRoute()}
      className={`w-full p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 ${getHoverBg()} hover:shadow-md hover:border-gray-300 block group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
              {appointment.lead.full_name || 'ไม่ระบุชื่อ'}
            </h4>
            <p className="text-gray-600 text-xs">
              {appointment.lead.tel || 'ไม่ระบุเบอร์โทร'}
            </p>
            {appointment.lead.category && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-500">ประเภท:</span>
                <Badge 
                  variant="outline" 
                  className={`${getCategoryBadgeClassName(appointment.lead.category)} px-2 py-0.5`}
                >
                  {appointment.lead.category}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${getBadgeColor()} text-xs font-medium`}
          >
            {getBadgeText()}
          </Badge>
          <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="h-3 w-3 text-gray-500" />
          <span>{formatDate(appointment.date)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="h-3 w-3 text-gray-500" />
          <span>{appointment.lead.region || 'ไม่ระบุภูมิภาค'}</span>
        </div>
        
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
          {getAppointmentDetail()}
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:text-blue-700 transition-colors">
          <span>คลิกเพื่อดูรายละเอียดการติดตาม</span>
          <ExternalLink className="h-3 w-3" />
        </p>
      </div>
    </Link>
  );
};
