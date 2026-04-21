import { Button } from "@/components/ui/button";
import MarketingLineChart from "@/components/marketing/MarketingLineChart";
import SalesAdsLineChart from "@/components/marketing/SalesAdsLineChart";
import { 
  Download,
  Filter
} from "lucide-react";

const Analytics = () => {

  return (
    <div className="space-y-6">
      {/* Header.. */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Analytics</h1>
          <p className="text-gray-600 mt-2">วิเคราะห์ผลการตลาดและ ROI ด้วย Line Chart</p>
          <p className="text-sm text-gray-600 mt-1">
            ข้อมูลสรุปวันนี้ | กราฟรายวันสามารถเลือกช่วงเวลาได้ | แสดงงบ Ads และยอดขาย
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            กรองข้อมูล
          </Button>
          <Button className="bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-400 hover:to-rose-500">
            <Download className="h-4 w-4 mr-2" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      {/* Line Chart Component */}
      <MarketingLineChart />

      {/* Sales & Ads Performance Chart */}
      <SalesAdsLineChart />

    </div>
  );
};

export default Analytics;
