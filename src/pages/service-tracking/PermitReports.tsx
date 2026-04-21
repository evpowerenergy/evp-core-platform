import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Download, 
  RefreshCw,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Calendar
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface ReportData {
  main_status: string;
  detail_status: string;
  count: number;
}

interface SummaryData {
  total: number;
  byMainStatus: { [key: string]: number };
  byDetailStatus: { [key: string]: number };
}

const PermitReports = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date() 
  });

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from("permit_requests")
        .select("main_status, sub_status, executor, province, created_at");

      // Apply date filter
      if (dateRangeFilter && dateRangeFilter.from) {
        const fromDate = dateRangeFilter.from;
        const toDate = dateRangeFilter.to || dateRangeFilter.from;
        
        // Use Intl.DateTimeFormat with Thailand timezone to get correct dates
        const formatter = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        // Format start date - Start from 00:00:00 Thai time
        const startDateString = formatter.format(fromDate);
        const startDate = startDateString + 'T00:00:00.000';
        
        // Format end date - End at 23:59:59 Thai time
        const endDateString = formatter.format(toDate);
        const endDate = endDateString + 'T23:59:59.999';
        
        query = query.gte("created_at", startDate).lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
      }

      // Process data for report
      const processedData: ReportData[] = [];
      const summary: SummaryData = {
        total: 0,
        byMainStatus: {},
        byDetailStatus: {}
      };

      data?.forEach((item) => {
        let mainStatus = item.main_status;
        let detailStatus = item.sub_status;

        // Move "ไม่ยื่นขออนุญาต" and "ยกเลิกกิจการ" under "ดำเนินการเสร็จสิ้น"
        if (item.main_status === "ไม่ยื่นขออนุญาต" || item.main_status === "ยกเลิกกิจการ") {
          mainStatus = "ดำเนินการเสร็จสิ้น";
          detailStatus = item.main_status;
        } else if (item.main_status === "ดำเนินการเสร็จสิ้น") {
          detailStatus = item.executor;
        }

        // Use fallback if detailStatus is empty
        if (!detailStatus) {
          detailStatus = "ไม่ระบุ";
        }

        processedData.push({
          main_status: mainStatus,
          detail_status: detailStatus,
          count: 1
        });

        // Update summary
        summary.total += 1;
        summary.byMainStatus[mainStatus] = (summary.byMainStatus[mainStatus] || 0) + 1;
        summary.byDetailStatus[detailStatus] = (summary.byDetailStatus[detailStatus] || 0) + 1;
      });

      // Group and sum data
      const groupedData: { [key: string]: ReportData } = {};
      processedData.forEach((item) => {
        const key = `${item.main_status}-${item.detail_status}`;
        if (groupedData[key]) {
          groupedData[key].count += item.count;
        } else {
          groupedData[key] = { ...item };
        }
      });

      const finalData = Object.values(groupedData);

      setReportData(finalData);
      setSummaryData(summary);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายงานได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when date range changes
  useEffect(() => {
    fetchReportData();
  }, [dateRangeFilter]);

  // Auto-refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchReportData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dateRangeFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ไม่สามารถดำเนินการได้":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "ระหว่างดำเนินการ":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "ดำเนินการเสร็จสิ้น":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "ไม่ยื่นขออนุญาต":
        return <FileText className="h-4 w-4 text-gray-600" />;
      case "ยกเลิกกิจการ":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ไม่ยื่นขออนุญาต":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "EV ดำเนินการให้":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ลูกค้าดำเนินการเอง":
        return "bg-green-100 text-green-800 border-green-200";
      case "ยกเลิกกิจการ":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["สถานะหลัก", "สถานะย่อย/ผู้ดำเนินการ", "จำนวน"],
      ...reportData.map(item => [item.main_status, item.detail_status, item.count.toString()])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `permit-reports-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">รายงานคำขออนุญาต</h1>
            <p className="text-sm text-gray-600">สรุปข้อมูลสถานะการขออนุญาตทั้งหมด</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <DateRangePicker
                value={dateRangeFilter}
                onChange={setDateRangeFilter}
                placeholder="เลือกช่วงวันที่"
                presets={true}
                className="w-[280px]"
              />
            </div>
            <Button 
              onClick={fetchReportData}
              variant="outline"
              size="sm"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              รีเฟรช
            </Button>
            <Button 
              onClick={exportToCSV}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {summaryData && (
        <Card className="border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">รวมทั้งหมด</p>
                <p className="text-xl font-bold text-gray-900">{summaryData.total}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Table */}
      <Card className="border-orange-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            รายงานสถานะ
          </CardTitle>
          <CardDescription className="text-xs">แสดงจำนวนคำขออนุญาตแยกตามสถานะ</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[
              "ดำเนินการเสร็จสิ้น",
              "ระหว่างดำเนินการ", 
              "ไม่สามารถดำเนินการได้"
            ].map((mainStatus) => {
              const items = reportData.filter(item => item.main_status === mainStatus);
              return (
                <div key={mainStatus} className="space-y-1">
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                    {getStatusIcon(mainStatus)}
                    <span className="font-semibold text-gray-900 text-sm">{mainStatus}</span>
                    <span className="ml-auto px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs font-bold">
                      {items.reduce((sum, item) => sum + item.count, 0)}
                    </span>
                  </div>
                  
                  <div className="ml-3 space-y-0.5">
                    {mainStatus === "ไม่สามารถดำเนินการได้" && [
                      "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์",
                      "รอโควต้าขายไฟรอบใหม่"
                    ].map((subStatus) => {
                      const item = items.find(i => i.detail_status === subStatus);
                      return (
                        <div key={subStatus} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-xs text-gray-700 flex-1">{subStatus}</span>
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded text-xs font-bold">
                            {item?.count || 0}
                          </span>
                        </div>
                      );
                    })}
                    
                    {mainStatus === "ระหว่างดำเนินการ" && [
                      "รอเอกสารสำคัญเพื่อจัดทำเล่ม",
                      "อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA",
                      "ยื่นคำร้องเข้าระบบการไฟฟ้าเรียบร้อย รอการไฟฟ้าดำเนินการตรวจสอบ",
                      "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร",
                      "อยู่ระหว่างการชำระเงิน",
                      "ชำระค่าบริการแล้ว",
                      "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้หน้างาน",
                      "รอ PEA หรือ MEA นัดหมาย เข้าตรวจสอบงานติดตั้ง",
                      "COD เรียบร้อย รอเปลี่ยนมิเตอร์"
                    ].map((subStatus) => {
                      const item = items.find(i => i.detail_status === subStatus);
                      return (
                        <div key={subStatus} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-xs text-gray-700 flex-1">{subStatus}</span>
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded text-xs font-bold">
                            {item?.count || 0}
                          </span>
                        </div>
                      );
                    })}
                    
                    {mainStatus === "ดำเนินการเสร็จสิ้น" && [
                      "EV ดำเนินการให้",
                      "ลูกค้าดำเนินการเอง",
                      "ไม่ยื่นขออนุญาต",
                      "ยกเลิกกิจการ"
                    ].map((detailStatus) => {
                      const item = items.find(i => i.detail_status === detailStatus);
                      return (
                        <div key={detailStatus} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-xs text-gray-700 flex-1">{detailStatus}</span>
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded text-xs font-bold">
                            {item?.count || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermitReports;