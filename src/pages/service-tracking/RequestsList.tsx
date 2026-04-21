import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Trash2,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader2,
  X,
  Download,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  usePermitRequests, 
  usePermitRequestProvinces,
  usePermitRequestDistricts,
  usePermitRequestCompanies,
  useDeletePermitRequest 
} from "@/hooks/usePermitRequests";
import { useToast } from "@/hooks/useToast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const RequestsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [executorFilter, setExecutorFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  // Initialize status filters from URL parameters or sessionStorage
  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    const subStatusFromUrl = searchParams.get("subStatus");
    const executorFromUrl = searchParams.get("executor");
    
    // Check if we have saved filters in sessionStorage (from returning from edit page)
    const savedFilters = sessionStorage.getItem('requestsListFilters');
    
    if (statusFromUrl || subStatusFromUrl || executorFromUrl) {
      // Priority: URL parameters (from permit-dashboard)
      if (statusFromUrl) {
        setStatusFilter(decodeURIComponent(statusFromUrl));
      }
      
      if (subStatusFromUrl) {
        setSubStatusFilter(decodeURIComponent(subStatusFromUrl));
      }
      
      if (executorFromUrl) {
        setExecutorFilter(decodeURIComponent(executorFromUrl));
      }
      
      // Save filters to sessionStorage before removing from URL
      const filtersToSave = {
        status: statusFromUrl ? decodeURIComponent(statusFromUrl) : statusFilter,
        subStatus: subStatusFromUrl ? decodeURIComponent(subStatusFromUrl) : subStatusFilter,
        executor: executorFromUrl ? decodeURIComponent(executorFromUrl) : executorFilter,
      };
      sessionStorage.setItem('requestsListFilters', JSON.stringify(filtersToSave));
      
      // Remove the parameters from URL after reading them
      const newSearchParams = new URLSearchParams(searchParams);
      if (statusFromUrl) newSearchParams.delete("status");
      if (subStatusFromUrl) newSearchParams.delete("subStatus");
      if (executorFromUrl) newSearchParams.delete("executor");
      setSearchParams(newSearchParams, { replace: true });
    } else if (savedFilters) {
      // Restore filters from sessionStorage if no URL parameters
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.status && filters.status !== 'all') {
          setStatusFilter(filters.status);
        }
        if (filters.subStatus && filters.subStatus !== 'all') {
          setSubStatusFilter(filters.subStatus);
        }
        if (filters.executor && filters.executor !== 'all') {
          setExecutorFilter(filters.executor);
        }
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }
  }, [searchParams, setSearchParams]);
  
  // Save current filters to sessionStorage whenever they change
  useEffect(() => {
    if (statusFilter !== 'all' || subStatusFilter !== 'all' || executorFilter !== 'all') {
      const filtersToSave = {
        status: statusFilter,
        subStatus: subStatusFilter,
        executor: executorFilter,
      };
      sessionStorage.setItem('requestsListFilters', JSON.stringify(filtersToSave));
    }
  }, [statusFilter, subStatusFilter, executorFilter]);

  // Fetch data from Supabase
  const { 
    data: requests, 
    isLoading, 
    error 
  } = usePermitRequests({
    search: searchTerm || undefined,
    documentNumber: documentNumber || undefined,
    permitNumber: permitNumber || undefined,
    meterNumber: meterNumber || undefined,
    mainStatus: statusFilter !== "all" ? statusFilter : undefined,
    subStatus: subStatusFilter !== "all" ? subStatusFilter : undefined,
    province: provinceFilter !== "all" ? provinceFilter : undefined,
    district: districtFilter !== "all" ? districtFilter : undefined,
    executor: executorFilter !== "all" ? executorFilter : undefined,
    companyName: companyFilter !== "all" ? companyFilter : undefined,
  });

  const { data: provinces } = usePermitRequestProvinces();
  const { data: districts } = usePermitRequestDistricts(provinceFilter);
  const { data: companies } = usePermitRequestCompanies();
  const deleteMutation = useDeletePermitRequest();

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ไม่สามารถดำเนินการได้":
        return <AlertCircle className="h-4 w-4" />;
      case "ระหว่างดำเนินการ":
        return <Clock className="h-4 w-4" />;
      case "ดำเนินการเสร็จสิ้น":
        return <CheckCircle className="h-4 w-4" />;
      case "ไม่ยื่นขออนุญาต":
        return <FileText className="h-4 w-4" />;
      case "ยกเลิกกิจการ":
        return <X className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleDelete = async (id: number, customerName: string) => {
    if (window.confirm(`คุณต้องการลบคำขอของ ${customerName} หรือไม่?`)) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({
          title: "ลบสำเร็จ",
          description: `ลบคำขอของ ${customerName} เรียบร้อยแล้ว`,
        });
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบคำขอได้",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToExcel = () => {
    // Create Excel content with table format
    const excelContent = [
      // Header
      ["รายการคำขออนุญาตทั้งหมด", "", "", "", "", "", "", "", "", ""],
      ["วันที่ดาวน์โหลด", new Date().toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), "", "", "", "", "", "", "", ""],
      [""], // Empty row
      
      // Table headers
      ["ลำดับ", "เลขที่เอกสาร", "บริษัท", "ชื่อลูกค้า", "เบอร์โทร", "จังหวัด", "อำเภอ", "สถานะหลัก", "สถานะย่อย", "ผู้ดำเนินการขออนุญาต", "ผู้ดำเนินการ", "กำลังไฟ (kW)", "เลขที่ขออนุญาต", "เลขมิเตอร์", "วันที่ดำเนินการเสร็จ", "วันออนระบบ"],
      
      // Data rows
      ...sortedRequests.map((request, index) => [
        index + 1,
        request.document_number || "-",
        request.company_name || "-",
        request.requester_name || "-",
        request.phone_number || "-",
        request.province || "-",
        request.district || "-",
        request.main_status || "-",
        request.sub_status || "-",
        request.operator_name || "-",
        request.executor || "-",
        request.capacity_kw || "-",
        request.permit_number || "-",
        request.meter_number || "-",
        request.completion_date ? new Date(request.completion_date).toLocaleDateString('th-TH') : "-",
        request.online_date ? new Date(request.online_date).toLocaleDateString('th-TH') : "-"
      ]),
      
      // Summary row
      [""],
      ["รวมทั้งหมด", `${sortedRequests.length} รายการ`, "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
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
    
    // Create filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `รายการคำขออนุญาต_${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Reset pagination when any filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    resetPagination();
  };

  const handleSubStatusFilterChange = (value: string) => {
    setSubStatusFilter(value);
    resetPagination();
  };

  const handleProvinceFilterChange = (value: string) => {
    setProvinceFilter(value);
    setDistrictFilter("all"); // Reset district when province changes
    resetPagination();
  };

  const handleDistrictFilterChange = (value: string) => {
    setDistrictFilter(value);
    resetPagination();
  };

  const handleExecutorFilterChange = (value: string) => {
    setExecutorFilter(value);
    resetPagination();
  };

  const handleCompanyFilterChange = (value: string) => {
    setCompanyFilter(value);
    resetPagination();
  };

  // Sort requests by ID (ascending order) - filtering is now done by API
  const sortedRequests = (requests || []).sort((a, b) => a.id - b.id);
  
  // Calculate pagination
  const totalItems = sortedRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayRequests = sortedRequests.slice(startIndex, endIndex);

  return (
    <div className="w-full space-y-6">

      {/* Filters */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-600" />
            ค้นหาและกรอง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* General Search */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">ค้นหาทั่วไป</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ชื่อลูกค้า, เบอร์โทร, ช่างติดตั้ง, บริษัท..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Document Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">เลขที่เอกสาร</Label>
                <Input
                  placeholder="SL- / WC- (ค้นหาจากเลขที่เอกสาร)"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
              </div>

              {/* Permit Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">เลขที่ขออนุญาต</Label>
                <Input
                  placeholder="ค้นหาจากเลขที่ขออนุญาต"
                  value={permitNumber}
                  onChange={(e) => setPermitNumber(e.target.value)}
                />
              </div>

              {/* Meter Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">เลขมิเตอร์</Label>
                <Input
                  placeholder="ค้นหาจากเลขมิเตอร์"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">สถานะหลัก</Label>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="ไม่สามารถดำเนินการได้">ไม่สามารถดำเนินการได้</SelectItem>
                    <SelectItem value="ระหว่างดำเนินการ">ระหว่างดำเนินการ</SelectItem>
                    <SelectItem value="ดำเนินการเสร็จสิ้น">ดำเนินการเสร็จสิ้น</SelectItem>
                    <SelectItem value="ไม่ยื่นขออนุญาต">ไม่ยื่นขออนุญาต</SelectItem>
                    <SelectItem value="ยกเลิกกิจการ">ยกเลิกกิจการ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sub Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">สถานะย่อย</Label>
                <Select value={subStatusFilter} onValueChange={handleSubStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะย่อย" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์">ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์</SelectItem>
                    <SelectItem value="รอโควต้าขายไฟรอบใหม่">รอโควต้าขายไฟรอบใหม่</SelectItem>
                    <SelectItem value="รอเอกสารสำคัญเพื่อจัดทำเล่ม">รอเอกสารสำคัญเพื่อจัดทำเล่ม</SelectItem>
                    <SelectItem value="ยื่นคำร้องเข้าระบบการไฟฟ้าเรียบร้อย รอการไฟฟ้าดำเนินการตรวจสอบ">ยื่นคำร้องเข้าระบบการไฟฟ้าเรียบร้อย รอการไฟฟ้าดำเนินการตรวจสอบ</SelectItem>
                    <SelectItem value="การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร">การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร</SelectItem>
                    <SelectItem value="อยู่ระหว่างการชำระเงิน">อยู่ระหว่างการชำระเงิน</SelectItem>
                    <SelectItem value="ชำระค่าบริการแล้ว">ชำระค่าบริการแล้ว</SelectItem>
                    <SelectItem value="การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้หน้างาน">การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้หน้างาน</SelectItem>
                    <SelectItem value="รอ PEA หรือ MEA นัดหมาย เข้าตรวจสอบงานติดตั้ง">รอ PEA หรือ MEA นัดหมาย เข้าตรวจสอบงานติดตั้ง</SelectItem>
                    <SelectItem value="COD เรียบร้อย รอเปลี่ยนมิเตอร์">COD เรียบร้อย รอเปลี่ยนมิเตอร์</SelectItem>
                    <SelectItem value="อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA">อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Province Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">จังหวัด</Label>
                <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={provinceOpen}
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {provinceFilter === "all" ? "เลือกจังหวัด" : provinceFilter}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ค้นหาจังหวัด..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>ไม่พบจังหวัดที่ค้นหา</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="ทั้งหมด"
                            onSelect={() => {
                              handleProvinceFilterChange("all");
                              setProvinceOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                provinceFilter === "all" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            ทั้งหมด
                          </CommandItem>
                          {provinces?.map(province => (
                            <CommandItem
                              key={province}
                              value={province}
                              onSelect={() => {
                                handleProvinceFilterChange(province);
                                setProvinceOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  provinceFilter === province ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {province}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* District Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">อำเภอ</Label>
                <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={districtOpen}
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {districtFilter === "all" ? "เลือกอำเภอ" : districtFilter}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ค้นหาอำเภอ..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>ไม่พบอำเภอที่ค้นหา</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="ทั้งหมด"
                            onSelect={() => {
                              handleDistrictFilterChange("all");
                              setDistrictOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                districtFilter === "all" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            ทั้งหมด
                          </CommandItem>
                          {districts?.map(district => (
                            <CommandItem
                              key={district}
                              value={district}
                              onSelect={() => {
                                handleDistrictFilterChange(district);
                                setDistrictOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  districtFilter === district ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {district}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Executor Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">ผู้ดำเนินการ</Label>
                <Select value={executorFilter} onValueChange={handleExecutorFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผู้ดำเนินการ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="EV ดำเนินการให้">EV ดำเนินการให้</SelectItem>
                    <SelectItem value="ลูกค้าดำเนินการเอง">ลูกค้าดำเนินการเอง</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Company Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">บริษัท</Label>
                <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={companyOpen}
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {companyFilter === "all" ? "เลือกบริษัท" : companyFilter}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ค้นหาบริษัท..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>ไม่พบบริษัทที่ค้นหา</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="ทั้งหมด"
                            onSelect={() => {
                              handleCompanyFilterChange("all");
                              setCompanyOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                companyFilter === "all" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            ทั้งหมด
                          </CommandItem>
                          {companies?.map(company => (
                            <CommandItem
                              key={company}
                              value={company}
                              onSelect={() => {
                                handleCompanyFilterChange(company);
                                setCompanyOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  companyFilter === company ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {company}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count and Export Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          แสดง {startIndex + 1}-{Math.min(endIndex, totalItems)} จาก {totalItems} รายการ
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all"
            disabled={sortedRequests.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            ดาวน์โหลด Excel
          </Button>
          <Button
            onClick={() => navigate("/service-tracking/requests/new")}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow-md transition-all"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มคำขอใหม่
          </Button>
        </div>
      </div>

      {/* Requests Table */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            รายการคำขออนุญาต
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-orange-600 mr-2" />
              <span className="text-sm text-gray-600">กำลังโหลด...</span>
            </div>
          )}
          {displayRequests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">เลขที่เอกสาร</TableHead>
                    <TableHead className="w-[200px]">บริษัท</TableHead>
                    <TableHead className="w-[200px]">ชื่อลูกค้า</TableHead>
                    <TableHead className="w-[150px]">สถานะหลัก</TableHead>
                    <TableHead className="w-[150px]">สถานะย่อย</TableHead>
                    <TableHead className="w-[120px]">เบอร์โทร</TableHead>
                    <TableHead className="w-[200px]">ผู้ดำเนินการขออนุญาต</TableHead>
                    <TableHead className="w-[100px]">กำลังไฟ</TableHead>
                    <TableHead className="w-[120px]">วันที่ดำเนินการเสร็จ</TableHead>
                    <TableHead className="w-[120px]">วันออนระบบ</TableHead>
                    <TableHead className="w-[120px]">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {request.document_number || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{request.company_name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-white rounded shadow-sm">
                            {getStatusIcon(request.main_status)}
                          </div>
                          <span className="font-medium">{request.requester_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.main_status)}>
                          {request.main_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {request.sub_status || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{request.phone_number || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {request.operator_name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {request.capacity_kw ? `${request.capacity_kw} kW` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {request.completion_date ? formatDate(request.completion_date) : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {request.online_date ? formatDate(request.online_date) : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/service-tracking/requests/${request.id}`)}
                                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-200 h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ดูรายละเอียดคำขอ</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/service-tracking/requests/${request.id}/edit`)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>แก้ไขคำขอ</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(request.id, request.requester_name)}
                                disabled={deleteMutation.isPending}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ลบคำขอ</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบคำขอที่ตรงกับเงื่อนไขการค้นหา</p>
              <Button 
                onClick={() => navigate("/service-tracking/requests/new")}
                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มคำขอใหม่
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
};

export default RequestsList;

