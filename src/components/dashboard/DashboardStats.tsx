import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface DashboardStatsProps {
  totalLeads: number;
}

const DashboardStats = ({ totalLeads }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-r from-green-100 to-emerald-100 text-gray-900 hover:shadow-lg transition-shadow flex flex-col justify-center items-center min-h-[140px]">
        <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2 text-center">
          <CardTitle className="text-lg font-bold text-gray-900">ลีดทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="text-4xl font-extrabold text-gray-900">{totalLeads}</div>
          <p className="text-base text-gray-700 mt-2">ลูกค้าผู้สนใจทั้งหมด</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
