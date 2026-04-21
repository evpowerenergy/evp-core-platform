
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, CalendarDays } from "lucide-react";

interface AppointmentSummaryCardsProps {
  followUpCount: number;
  engineerCount: number;
  paymentCount: number;
}

export const AppointmentSummaryCards = ({
  followUpCount,
  engineerCount,
  paymentCount
}: AppointmentSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            นัดติดตามครั้งถัดไป
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{followUpCount}</div>
          <p className="text-xs text-muted-foreground">นัดหมายทั้งหมด</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
            <User className="h-4 w-4" />
            นัดหมายวิศวกร
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{engineerCount}</div>
          <p className="text-xs text-muted-foreground">นัดหมายทั้งหมด</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            ประมาณการชำระเงิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paymentCount}</div>
          <p className="text-xs text-muted-foreground">นัดหมายทั้งหมด</p>
        </CardContent>
      </Card>
    </div>
  );
};
