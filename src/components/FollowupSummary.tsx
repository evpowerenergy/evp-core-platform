
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle } from "lucide-react";

interface FollowupSummaryProps {
  total: number;
  notStarted: number;
}

const FollowupSummary = ({ total, notStarted }: FollowupSummaryProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          สรุปการติดตามลูกค้า
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">ลีดทั้งหมด</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{notStarted}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              ยังไม่โทรติดตาม
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowupSummary;
