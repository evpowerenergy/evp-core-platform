import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { useCustomerServicesAPI as useCustomerServices } from "@/hooks/useCustomerServicesAPI";
import { useMemo } from "react";

interface ServiceStats {
  overdue: number;
  warning: number;
  upcoming: number;
  total: number;
}

const ServiceDueAlert = () => {
  const { data: customerServices, isLoading } = useCustomerServices();

  const stats: ServiceStats = useMemo(() => {
    if (!customerServices) {
      return { overdue: 0, warning: 0, upcoming: 0, total: 0 };
    }

    let overdue = 0;
    let warning = 0;
    let upcoming = 0;

    customerServices.forEach((customer) => {
      // ใช้ service_status_calculated จาก VIEW
      const status = customer.service_status_calculated;
      
      if (status === 'service_1_overdue' || status === 'service_2_overdue') {
        overdue++;
      } else if (status === 'service_1_due_soon' || status === 'service_2_due_soon') {
        warning++;
      } else if (status === 'service_1_pending' || status === 'service_2_pending') {
        upcoming++;
      }
    });

    return {
      overdue,
      warning,
      upcoming,
      total: overdue + warning + upcoming,
    };
  }, [customerServices]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-orange-600" />
          สถานะกำหนดบริการ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-muted-foreground mt-1">รอบริการทั้งหมด</div>
          </div>

          {/* Overdue */}
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
            </div>
            <div className="text-sm text-red-700 font-semibold">เกินกำหนด</div>
            <div className="text-xs text-red-600 mt-1">ควรนัดหมายด่วน</div>
          </div>

          {/* Warning */}
          <div className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="text-3xl font-bold text-amber-600">{stats.warning}</div>
            </div>
            <div className="text-sm text-amber-700 font-semibold">ใกล้ครบกำหนด</div>
            <div className="text-xs text-amber-600 mt-1">เหลือน้อยกว่า 30 วัน</div>
          </div>

          {/* Upcoming */}
          <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="text-3xl font-bold text-blue-600">{stats.upcoming}</div>
            </div>
            <div className="text-sm text-blue-700 font-semibold">กำลังจะถึง</div>
            <div className="text-xs text-blue-600 mt-1">ยังมีเวลาเพียงพอ</div>
          </div>
        </div>

        {/* Alert Message */}
        {stats.overdue > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                มีลูกค้า {stats.overdue} รายที่เกินกำหนดบริการ
              </p>
              <p className="text-xs text-red-700 mt-1">
                กรุณาติดต่อและนัดหมายบริการโดยเร็วที่สุด
              </p>
            </div>
          </div>
        )}

        {stats.warning > 0 && stats.overdue === 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                มีลูกค้า {stats.warning} รายที่ใกล้ครบกำหนดบริการ
              </p>
              <p className="text-xs text-amber-700 mt-1">
                ควรเตรียมติดต่อและนัดหมายบริการล่วงหน้า
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceDueAlert;

