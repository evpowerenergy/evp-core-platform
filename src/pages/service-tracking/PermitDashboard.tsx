import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
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

const PermitDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);

  // Handle navigation to requests page with status filter (navigates in same tab)
  const handleStatusClick = (mainStatus: string, subStatus?: string) => {
    const searchParams = new URLSearchParams();
    
    if (subStatus) {
      // For "ดำเนินการเสร็จสิ้น", sub-statuses like "EV ดำเนินการให้" and "ลูกค้าดำเนินการเอง" 
      // are actually executor values, not sub_status
      // For "ไม่ยื่นขออนุญาต" and "ยกเลิกกิจการ", they are main_status values in the database
      if (mainStatus === "ดำเนินการเสร็จสิ้น") {
        if (subStatus === "EV ดำเนินการให้" || subStatus === "ลูกค้าดำเนินการเอง") {
          // These are executor values - filter by main_status="ดำเนินการเสร็จสิ้น" + executor
          searchParams.set("status", "ดำเนินการเสร็จสิ้น");
          searchParams.set("executor", subStatus);
        } else if (subStatus === "ไม่ยื่นขออนุญาต" || subStatus === "ยกเลิกกิจการ") {
          // These are actually main_status values in the database
          searchParams.set("status", subStatus);
        } else {
          searchParams.set("status", mainStatus);
          searchParams.set("subStatus", subStatus);
        }
      } else {
        searchParams.set("status", mainStatus);
        searchParams.set("subStatus", subStatus);
      }
    } else {
      // No sub-status, just filter by main status
      searchParams.set("status", mainStatus);
    }
    
    navigate(`/service-tracking/requests?${searchParams.toString()}`);
  };


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
        
        // Format dates for Thailand timezone
        const formatDateForDB = (date: Date, isEndOfDay = false) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const time = isEndOfDay ? '23:59:59.999' : '00:00:00.000';
          return `${year}-${month}-${day}T${time}`;
        };
        
        const startDate = formatDateForDB(fromDate, false);
        const endDate = formatDateForDB(toDate, true);
        
        query = query.gte("created_at", startDate).lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
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

      // Group and sum by main_status and detail_status
      const groupedData = processedData.reduce((acc, item) => {
        const key = `${item.main_status}-${item.detail_status}`;
        if (acc[key]) {
          acc[key].count += item.count;
        } else {
          acc[key] = { ...item };
        }
        return acc;
      }, {} as { [key: string]: ReportData });

      setReportData(Object.values(groupedData));
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
      case "ไม่สามารถดำเนินการได้":
        return "bg-red-100 text-red-800 border-red-200";
      case "ระหว่างดำเนินการ":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ดำเนินการเสร็จสิ้น":
        return "bg-green-100 text-green-800 border-green-200";
      case "ไม่ยื่นขออนุญาต":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "ยกเลิกกิจการ":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const exportToExcel = () => {
    // Create Excel content with table format
    const excelContent = [
      // Header
      ["Overall report on status permit request", "", "", ""],
      ["รายงานสถานการขออนุญาตทั้งหมด", "", "", ""],
      [""], // Empty row
      ["วันที่อัพเดทสถานะล่าสุด", "", "", new Date().toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })],
      [""], // Empty row
      
      // Table headers
      ["รายการที่", "สถานะ", "จำนวน", "หมายเหตุ"],
      
      // Main status 1: ดำเนินการเสร็จสิ้น
      ["1", "ดำเนินการเสร็จสิ้น", summaryData?.byMainStatus["ดำเนินการเสร็จสิ้น"] || 0, ""],
      ...getSubStatusDataWithNumber("ดำเนินการเสร็จสิ้น", 1),
      
      // Main status 2: ระหว่างดำเนินการ
      ["2", "ระหว่างดำเนินการ", summaryData?.byMainStatus["ระหว่างดำเนินการ"] || 0, ""],
      ...getSubStatusDataWithNumber("ระหว่างดำเนินการ", 2),
      
      // Main status 3: ไม่สามารถดำเนินการได้
      ["3", "ไม่สามารถดำเนินการได้", summaryData?.byMainStatus["ไม่สามารถดำเนินการได้"] || 0, ""],
      ...getSubStatusDataWithNumber("ไม่สามารถดำเนินการได้", 3),
      
      // Total row
      ["", "รวมทั้งหมด", summaryData?.total || 0, "ราย"]
    ];

    // Convert to CSV format for Excel with proper encoding
    const csvContent = excelContent.map(row => 
      row.map(cell => {
        // Handle empty cells and special characters
        if (cell === "") return "";
        return `"${String(cell).replace(/"/g, '""')}"`;
      }).join(",")
    ).join("\n");

    // Add BOM for UTF-8 encoding
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานสถานะการขออนุญาตทั้งหมด_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSubStatusDataWithNumber = (mainStatus: string, mainNumber: number) => {
    const subStatusOptions = {
      "ดำเนินการเสร็จสิ้น": [
        "ไม่ยื่นขออนุญาต",
        "ลูกค้าดำเนินการเอง",
        "EV ดำเนินการให้",
        "ยกเลิกกิจการ"
      ],
      "ระหว่างดำเนินการ": [
        "รอเอกสารสำคัญเพื่อจัดทำเล่ม",
        "อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA",
        "ยื่นคำร้องเข้าระบบการไฟฟ้าเรียบร้อย รอการไฟฟ้าดำเนินการตรวจสอบ",
        "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร",
        "อยู่ระหว่างการชำระเงิน",
        "ชำระค่าบริการแล้ว",
        "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้หน้างาน",
        "รอ PEA หรือ MEA นัดหมาย เข้าตรวจสอบงานติดตั้ง",
        "COD เรียบร้อย รอเปลี่ยนมิเตอร์"
      ],
      "ไม่สามารถดำเนินการได้": [
        "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์",
        "รอโควต้าขายไฟรอบใหม่"
      ]
    };

    const predefinedSubStatuses = subStatusOptions[mainStatus as keyof typeof subStatusOptions] || [];
    const dataSubStatuses = reportData
      .filter(item => item.main_status === mainStatus)
      .map(item => item.detail_status);
    
    // Combine predefined + any additional sub-statuses from data
    const allSubStatuses = Array.from(new Set([...predefinedSubStatuses, ...dataSubStatuses]));

    return allSubStatuses.map(subStatus => {
      const item = reportData.find(i => 
        i.main_status === mainStatus && i.detail_status === subStatus
      );
      return ["", subStatus, item?.count || 0, ""];
    });
  };

  const getSubStatusData = (mainStatus: string) => {
    // Get sub-status options for this main status
    const subStatusOptions = {
      "ดำเนินการเสร็จสิ้น": [
        "EV ดำเนินการให้",
        "ลูกค้าดำเนินการเอง", 
        "ไม่ยื่นขออนุญาต",
        "ยกเลิกกิจการ"
      ],
      "ระหว่างดำเนินการ": [
        "รอเอกสารสำคัญเพื่อจัดทำเล่ม",
        "ยื่นคำร้องเข้าระบบการไฟฟ้าเรียบร้อย รอการไฟฟ้าดำเนินการตรวจสอบ",
        "อยู่ระหว่างการชำระเงิน",
        "ชำระค่าบริการแล้ว",
        "อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA",
        "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร หรือแก้หน้างาน",
        "COD เรียบร้อย รอเปลี่ยนมิเตอร์"
      ],
      "ไม่สามารถดำเนินการได้": [
        "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์",
        "รอโควต้าขายไฟรอบใหม่"
      ]
    };

    // Get predefined sub-statuses
    const predefinedSubStatuses = subStatusOptions[mainStatus as keyof typeof subStatusOptions] || [];
    
    // Get all sub-statuses from reportData for this main status
    const dataSubStatuses = reportData
      .filter(item => item.main_status === mainStatus)
      .map(item => item.detail_status);

    // Combine predefined + any additional sub-statuses from data (like "ไม่ระบุ")
    const allSubStatuses = Array.from(new Set([...predefinedSubStatuses, ...dataSubStatuses]));

    return allSubStatuses.map(subStatus => {
      const item = reportData.find(i => 
        i.main_status === mainStatus && i.detail_status === subStatus
      );
      return ["", subStatus, item?.count || 0];
    });
  };

  // Helper function to get all sub-statuses for a main status
  const getSubStatusesForCard = (mainStatus: string) => {
    const subStatusOptions = {
      "ดำเนินการเสร็จสิ้น": [
        "EV ดำเนินการให้",
        "ลูกค้าดำเนินการเอง", 
        "ไม่ยื่นขออนุญาต",
        "ยกเลิกกิจการ"
      ],
      "ระหว่างดำเนินการ": [
        "รอเอกสารสำคัญเพื่อจัดทำเล่ม",
        "อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA",
        "ยื่นคำร้องเข้าระบบการไฟฟ้าเรียบร้อย รอการไฟฟ้าดำเนินการตรวจสอบ",
        "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร",
        "อยู่ระหว่างการชำระเงิน",
        "ชำระค่าบริการแล้ว",
        "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้หน้างาน",
        "รอ PEA หรือ MEA นัดหมาย เข้าตรวจสอบงานติดตั้ง",
        "COD เรียบร้อย รอเปลี่ยนมิเตอร์"
      ],
      "ไม่สามารถดำเนินการได้": [
        "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์",
        "รอโควต้าขายไฟรอบใหม่"
      ]
    };

    const predefinedSubStatuses = subStatusOptions[mainStatus as keyof typeof subStatusOptions] || [];
    const dataSubStatuses = reportData
      .filter(item => item.main_status === mainStatus)
      .map(item => item.detail_status);

    // Combine predefined + any additional sub-statuses from data
    return Array.from(new Set([...predefinedSubStatuses, ...dataSubStatuses]));
  };

  if (isLoading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                Dashboard คำขออนุญาต
              </h1>
              <p className="text-gray-600">ภาพรวมสถานะการขออนุญาตทั้งหมดในระบบ</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">ช่วงเวลา:</span>
                <div className="w-64">
                  <DateRangePicker
                    value={dateRangeFilter}
                    onChange={setDateRangeFilter}
                    placeholder="เลือกช่วงเวลา"
                    presets={true}
                    className="w-full"
                  />
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                  {dateRangeFilter ? (
                    `${dateRangeFilter.from?.toLocaleDateString('th-TH')} - ${dateRangeFilter.to?.toLocaleDateString('th-TH') || dateRangeFilter.from?.toLocaleDateString('th-TH')}`
                  ) : (
                    "แสดงข้อมูลทั้งหมด"
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {dateRangeFilter && (
                  <Button 
                    onClick={() => setDateRangeFilter(undefined)}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    แสดงทั้งหมด
                  </Button>
                )}
                <Button 
                  onClick={fetchReportData}
                  variant="outline"
                  size="sm"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเฟรช
                </Button>
                <Button 
                  onClick={exportToExcel}
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลด Excel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        {summaryData && summaryData.total > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-50 text-sm font-medium">รวมทั้งหมด</p>
                    <p className="text-3xl font-bold">{summaryData.total.toLocaleString()}</p>
                    <p className="text-orange-50 text-xs mt-1">รายการทั้งหมด</p>
                  </div>
                  <div className="p-3 bg-white/30 rounded-full">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleStatusClick("ไม่สามารถดำเนินการได้")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">ไม่สามารถดำเนินการได้</p>
                    <p className="text-2xl font-bold text-red-600">{(summaryData.byMainStatus["ไม่สามารถดำเนินการได้"] || 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-xs mt-1">คลิกเพื่อดูรายละเอียด</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleStatusClick("ระหว่างดำเนินการ")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">ระหว่างดำเนินการ</p>
                    <p className="text-2xl font-bold text-yellow-600">{(summaryData.byMainStatus["ระหว่างดำเนินการ"] || 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-xs mt-1">คลิกเพื่อดูรายละเอียด</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleStatusClick("ดำเนินการเสร็จสิ้น")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">ดำเนินการเสร็จสิ้น</p>
                    <p className="text-2xl font-bold text-green-600">{(summaryData.byMainStatus["ดำเนินการเสร็จสิ้น"] || 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-xs mt-1">คลิกเพื่อดูรายละเอียด</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีข้อมูล</h3>
                  <p className="text-gray-600">ไม่พบข้อมูลคำขออนุญาตในช่วงเวลาที่เลือก</p>
                  <p className="text-sm text-gray-500 mt-2">ลองเปลี่ยนช่วงเวลาหรือเพิ่มข้อมูลใหม่</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Cards */}
        {summaryData && summaryData.total > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ไม่สามารถดำเนินการได้ */}
          <Card 
            className="bg-white border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => handleStatusClick("ไม่สามารถดำเนินการได้")}
          >
            <CardHeader className="pb-4 bg-gradient-to-r from-red-50 to-red-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-red-800">ไม่สามารถดำเนินการได้</div>
                  <div className="text-sm font-normal text-red-600">
                    {summaryData?.byMainStatus["ไม่สามารถดำเนินการได้"] || 0} รายการ
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {getSubStatusesForCard("ไม่สามารถดำเนินการได้").map((subStatus) => {
                  const item = reportData.find(i => 
                    i.main_status === "ไม่สามารถดำเนินการได้" && i.detail_status === subStatus
                  );
                  return (
                    <div 
                      key={subStatus} 
                      className="group flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick("ไม่สามารถดำเนินการได้", subStatus);
                      }}
                    >
                      <span className="text-sm text-gray-700 font-medium group-hover:text-red-800">{subStatus}</span>
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold shadow-sm">
                        {item?.count || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ระหว่างดำเนินการ */}
          <Card 
            className="bg-white border-l-4 border-l-yellow-500 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => handleStatusClick("ระหว่างดำเนินการ")}
          >
            <CardHeader className="pb-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-yellow-800">ระหว่างดำเนินการ</div>
                  <div className="text-sm font-normal text-yellow-600">
                    {summaryData?.byMainStatus["ระหว่างดำเนินการ"] || 0} รายการ
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {getSubStatusesForCard("ระหว่างดำเนินการ").map((subStatus) => {
                  const item = reportData.find(i => 
                    i.main_status === "ระหว่างดำเนินการ" && i.detail_status === subStatus
                  );
                  return (
                    <div 
                      key={subStatus} 
                      className="group flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick("ระหว่างดำเนินการ", subStatus);
                      }}
                    >
                      <span className="text-sm text-gray-700 font-medium group-hover:text-yellow-800">{subStatus}</span>
                      <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-bold shadow-sm">
                        {item?.count || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ดำเนินการเสร็จสิ้น */}
          <Card 
            className="bg-white border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => handleStatusClick("ดำเนินการเสร็จสิ้น")}
          >
            <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-green-800">ดำเนินการเสร็จสิ้น</div>
                  <div className="text-sm font-normal text-green-600">
                    {summaryData?.byMainStatus["ดำเนินการเสร็จสิ้น"] || 0} รายการ
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {getSubStatusesForCard("ดำเนินการเสร็จสิ้น").map((detailStatus) => {
                  const item = reportData.find(i => 
                    i.main_status === "ดำเนินการเสร็จสิ้น" && i.detail_status === detailStatus
                  );
                  return (
                    <div 
                      key={detailStatus} 
                      className="group flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick("ดำเนินการเสร็จสิ้น", detailStatus);
                      }}
                    >
                      <span className="text-sm text-gray-700 font-medium group-hover:text-green-800">{detailStatus}</span>
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold shadow-sm">
                        {item?.count || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          </div>
        )}
    </div>
  );
};

export default PermitDashboard;

