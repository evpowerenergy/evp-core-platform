import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Zap, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface CustomerServiceCardProps {
  customer: {
    id: number;
    customer_group: string;
    tel: string;
    province: string;
    district: string | null;
    capacity_kw: number | null;
    installation_date: string | null;
    service_visit_1: boolean;
    service_visit_2: boolean;
    service_visit_3: boolean;
    service_visit_4: boolean;
    service_visit_5: boolean;
    installer_name: string | null;
    days_until_service_1_due: number | null;
    days_until_service_2_due: number | null;
    service_status_calculated: string | null;
    completed_visits_count: number | null;
  };
  isDragging?: boolean;
}

const CustomerServiceCard = ({ customer, isDragging }: CustomerServiceCardProps) => {
  // ใช้สถานะและวันที่เหลือจาก VIEW (ไม่ต้องคำนวณที่ frontend)
  const getDueStatus = () => {
    const status = customer.service_status_calculated;
    
    // Service Visit 1
    if (!customer.service_visit_1) {
      const daysRemaining = customer.days_until_service_1_due;
      
      if (status === 'service_1_overdue') {
        return { 
          type: 'overdue', 
          message: `เกินกำหนดบริการครั้งที่ 1`,
          daysOverdue: daysRemaining !== null ? Math.abs(daysRemaining) : 0
        };
      }
      if (status === 'service_1_due_soon') {
        return { 
          type: 'warning', 
          message: `ใกล้ครบกำหนดบริการครั้งที่ 1`,
          daysRemaining: daysRemaining
        };
      }
      return {
        type: 'normal',
        message: `บริการครั้งที่ 1`,
        daysRemaining: daysRemaining
      };
    }
    
    // Service Visit 2
    if (customer.service_visit_1 && !customer.service_visit_2) {
      const daysRemaining = customer.days_until_service_2_due;
      
      if (status === 'service_2_overdue') {
        return { 
          type: 'overdue', 
          message: `เกินกำหนดบริการครั้งที่ 2`,
          daysOverdue: daysRemaining !== null ? Math.abs(daysRemaining) : 0
        };
      }
      if (status === 'service_2_due_soon') {
        return { 
          type: 'warning', 
          message: `ใกล้ครบกำหนดบริการครั้งที่ 2`,
          daysRemaining: daysRemaining
        };
      }
      return {
        type: 'normal',
        message: `บริการครั้งที่ 2`,
        daysRemaining: daysRemaining
      };
    }
    
    return null;
  };

  const dueStatus = getDueStatus();
  
  // หา visit ถัดไปที่ยังไม่เสร็จ
  const getNextVisit = () => {
    if (!customer.service_visit_1) return 'บริการครั้งที่ 1';
    if (!customer.service_visit_2) return 'บริการครั้งที่ 2';
    if (!customer.service_visit_3) return 'บริการครั้งที่ 3';
    if (!customer.service_visit_4) return 'บริการครั้งที่ 4';
    if (!customer.service_visit_5) return 'บริการครั้งที่ 5';
    return 'บริการครบแล้ว';
  };
  
  const pendingVisit = getNextVisit();

  return (
    <Card 
      className={`
        cursor-move
        ${isDragging 
          ? 'opacity-40 shadow-lg' 
          : 'hover:shadow-md transition-shadow duration-150'
        }
        ${dueStatus?.type === 'overdue' ? 'border-l-4 border-l-red-500' : ''}
        ${dueStatus?.type === 'warning' ? 'border-l-4 border-l-amber-500' : ''}
      `}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold text-sm">{customer.customer_group}</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {pendingVisit}
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>
            {customer.district 
              ? `${customer.district}, ${customer.province}`
              : customer.province
            }
          </span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {customer.capacity_kw && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span>{customer.capacity_kw} kW</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <a 
              href={`tel:${customer.tel}`}
              className="hover:text-orange-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {customer.tel}
            </a>
          </div>
        </div>

        {/* Installer */}
        {customer.installer_name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>ติดตั้งโดย: {customer.installer_name}</span>
          </div>
        )}

        {/* Installation Date */}
        {customer.installation_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              ติดตั้ง: {format(new Date(customer.installation_date), "d MMM yy", { locale: th })}
            </span>
          </div>
        )}

        {/* Due Status */}
        {dueStatus && (
          <div className="space-y-1">
            <Badge 
              variant={dueStatus.type === 'overdue' ? 'destructive' : 'default'}
              className={`w-full justify-center text-xs ${
                dueStatus.type === 'warning' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : ''
              } ${
                dueStatus.type === 'normal' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''
              }`}
            >
              {dueStatus.message}
            </Badge>
            {dueStatus.type === 'overdue' && dueStatus.daysOverdue !== undefined && (
              <p className="text-xs text-center text-red-600 font-semibold">
                เกินกำหนด {dueStatus.daysOverdue} วัน
              </p>
            )}
            {dueStatus.type === 'warning' && dueStatus.daysRemaining !== undefined && (
              <p className="text-xs text-center text-amber-700 font-semibold">
                เหลืออีก {dueStatus.daysRemaining} วัน
              </p>
            )}
            {dueStatus.type === 'normal' && dueStatus.daysRemaining !== undefined && (
              <p className="text-xs text-center text-muted-foreground">
                เหลืออีก {dueStatus.daysRemaining} วัน
              </p>
            )}
          </div>
        )}

        {/* Drag Handle Indicator */}
        <div className="flex items-center justify-center pt-2 border-t">
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerServiceCard;