import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Users, 
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
  Wrench,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { useNavigate } from "react-router-dom";
import { 
  useCustomerServicesAPI as useCustomerServices, 
  useCustomerServiceProvincesAPI as useCustomerServiceProvinces, 
  useCustomerServiceSalesAPI as useCustomerServiceSales,
  useCustomerServiceInstallersAPI as useCustomerServiceInstallers,
  useDeleteCustomerServiceAPI as useDeleteCustomerService 
} from "@/hooks/useCustomerServicesAPI";
import { getPackageTypeDisplayName } from "@/hooks/useCustomerServicePurchasesAPI";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

const CustomerServiceList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [saleFilter, setSaleFilter] = useState("all");
  const [installerFilter, setInstallerFilter] = useState("all");
  const [serviceVisitFilter, setServiceVisitFilter] = useState("all");
  
  // Search states for filters
  const [provinceSearch, setProvinceSearch] = useState("");
  const [installerSearch, setInstallerSearch] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch data from Supabase
  const { 
    data: customerServices, 
    isLoading, 
    error 
  } = useCustomerServices({
    search: searchTerm || undefined,
    province: provinceFilter !== "all" ? provinceFilter : undefined,
    sale: saleFilter !== "all" ? saleFilter : undefined,
    installerName: installerFilter !== "all" ? installerFilter : undefined,
    serviceVisit1: serviceVisitFilter === "visit1_pending" ? false : 
                   serviceVisitFilter === "visit1_completed" ? true : undefined,
    serviceVisit2: serviceVisitFilter === "visit2_pending" ? false : 
                   serviceVisitFilter === "visit2_completed" ? true : undefined,
    serviceVisit3: serviceVisitFilter === "visit3_pending" ? false : 
                   serviceVisitFilter === "visit3_completed" ? true : undefined,
    serviceVisit4: serviceVisitFilter === "visit4_pending" ? false : 
                   serviceVisitFilter === "visit4_completed" ? true : undefined,
    serviceVisit5: serviceVisitFilter === "visit5_pending" ? false : 
                   serviceVisitFilter === "visit5_completed" ? true : undefined,
  });

  const { data: provinces } = useCustomerServiceProvinces();
  const { data: sales } = useCustomerServiceSales();
  const { data: installers } = useCustomerServiceInstallers();
  const deleteMutation = useDeleteCustomerService();
  
  // Fetch purchase counts for all customer services
  const [purchaseCounts, setPurchaseCounts] = useState<Record<number, number>>({});
  
  useEffect(() => {
    const fetchPurchaseCounts = async () => {
      if (!customerServices || customerServices.length === 0) return;
      
      const customerServiceIds = customerServices.map(cs => cs.id);
      
      try {
        const { data, error } = await supabase
          .from("customer_service_purchases")
          .select("customer_service_id")
          .in("customer_service_id", customerServiceIds);
        
        if (error) {
          console.error("Failed to fetch purchase counts:", error);
          return;
        }
        
        // Count purchases per customer service
        const counts: Record<number, number> = {};
        data?.forEach((purchase: any) => {
          counts[purchase.customer_service_id] = (counts[purchase.customer_service_id] || 0) + 1;
        });
        
        setPurchaseCounts(counts);
      } catch (error) {
        console.error("Error fetching purchase counts:", error);
      }
    };
    
    fetchPurchaseCounts();
  }, [customerServices]);
  
  // Filter provinces and installers based on search
  const filteredProvinces = provinces?.filter(province =>
    province.toLowerCase().includes(provinceSearch.toLowerCase())
  ) || [];
  
  const filteredInstallers = installers?.filter(installer =>
    installer.toLowerCase().includes(installerSearch.toLowerCase())
  ) || [];


  const getServiceVisitStatus = (service: any) => {
    const completedCount = service.completed_visits_count || 0;
    
    if (completedCount >= 5) {
      return { text: "บริการครบ 5 ครั้ง", color: "bg-green-100 text-green-800 border-green-200" };
    } else if (completedCount >= 4) {
      return { text: "รอบริการครั้งที่ 5", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    } else if (completedCount >= 3) {
      return { text: "รอบริการครั้งที่ 4", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    } else if (completedCount >= 2) {
      return { text: "รอบริการครั้งที่ 3", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    } else if (completedCount >= 1) {
      return { text: "รอบริการครั้งที่ 2", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    } else {
      return { text: "รอบริการครั้งที่ 1", color: "bg-orange-100 text-orange-800 border-orange-200" };
    }
  };

  const handleDelete = async (id: number, customerGroup: string) => {
    if (window.confirm(`คุณต้องการลบข้อมูลลูกค้า ${customerGroup} หรือไม่?`)) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({
          title: "ลบสำเร็จ",
          description: `ลบข้อมูลลูกค้า ${customerGroup} เรียบร้อยแล้ว`,
        });
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบข้อมูลลูกค้าได้",
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


  // Filter customer services based on selected filters
  const allCustomerServices = customerServices || [];
  
  // Pagination calculations
  const totalItems = allCustomerServices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayCustomerServices = allCustomerServices.slice(startIndex, endIndex);
  
  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToPage = (page: number) => setCurrentPage(page);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, provinceFilter, saleFilter, installerFilter, serviceVisitFilter]);
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <TooltipProvider>
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2 md:col-span-2 lg:col-span-2">
              <Label className="text-sm font-medium text-gray-700">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="กลุ่มไลน์ซัพพอร์ตลูกค้า, เบอร์โทร, ช่างติดตั้ง..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">ฝ่ายขาย</Label>
              <Select value={saleFilter} onValueChange={setSaleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกฝ่ายขาย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {sales?.map(sale => (
                    <SelectItem key={sale} value={sale}>{sale}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">จังหวัด</Label>
              <Select 
                value={provinceFilter} 
                onValueChange={(value) => {
                  setProvinceFilter(value);
                  setProvinceSearch("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกจังหวัด" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 sticky top-0 bg-white border-b">
                    <Input
                      placeholder="ค้นหาจังหวัด..."
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-60 overflow-auto">
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {filteredProvinces.length > 0 ? (
                      filteredProvinces.map(province => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))
                    ) : (
                      <div className="py-6 text-center text-sm text-gray-500">
                        ไม่พบจังหวัดที่ค้นหา
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">ช่างติดตั้ง</Label>
              <Select 
                value={installerFilter} 
                onValueChange={(value) => {
                  setInstallerFilter(value);
                  setInstallerSearch("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกช่างติดตั้ง" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 sticky top-0 bg-white border-b">
                    <Input
                      placeholder="ค้นหาช่างติดตั้ง..."
                      value={installerSearch}
                      onChange={(e) => setInstallerSearch(e.target.value)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-60 overflow-auto">
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {filteredInstallers.length > 0 ? (
                      filteredInstallers.map(installer => (
                        <SelectItem key={installer} value={installer}>{installer}</SelectItem>
                      ))
                    ) : (
                      <div className="py-6 text-center text-sm text-gray-500">
                        ไม่พบช่างติดตั้งที่ค้นหา
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">สถานะบริการ</Label>
              <Select value={serviceVisitFilter} onValueChange={setServiceVisitFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="visit1_pending">รอบริการครั้งที่ 1</SelectItem>
                  <SelectItem value="visit1_completed">บริการครั้งที่ 1 เสร็จ</SelectItem>
                  <SelectItem value="visit2_pending">รอบริการครั้งที่ 2</SelectItem>
                  <SelectItem value="visit2_completed">บริการครั้งที่ 2 เสร็จ</SelectItem>
                  <SelectItem value="visit3_pending">รอบริการครั้งที่ 3</SelectItem>
                  <SelectItem value="visit3_completed">บริการครั้งที่ 3 เสร็จ</SelectItem>
                  <SelectItem value="visit4_pending">รอบริการครั้งที่ 4</SelectItem>
                  <SelectItem value="visit4_completed">บริการครั้งที่ 4 เสร็จ</SelectItem>
                  <SelectItem value="visit5_pending">รอบริการครั้งที่ 5</SelectItem>
                  <SelectItem value="visit5_completed">บริการครบ 5 ครั้ง</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          พบ {totalItems} รายการ {totalPages > 1 && `(หน้า ${currentPage} จาก ${totalPages})`}
        </p>
        {totalItems > 0 && (
          <p className="text-xs text-gray-500">
            แสดง {startIndex + 1}-{Math.min(endIndex, totalItems)} จาก {totalItems} รายการ
          </p>
        )}
      </div>

      {/* Customer Services Table */}
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              รายการลูกค้า
            </CardTitle>
            <Button 
              onClick={() => navigate("/service-tracking/customer-services/new")}
              className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มลูกค้าใหม่
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600 mr-2" />
              <span className="text-sm text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
          ) : displayCustomerServices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-orange-200 bg-orange-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">No.</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">ฝ่ายขาย</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">ชื่อลูกค้า / กลุ่ม</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">เบอร์โทร</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">จังหวัด</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">ช่างติดตั้ง</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">กำลังไฟ (kW)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">วันที่ติดตั้ง</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">แพ็คเกจ Service</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">สถานะบริการ</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {displayCustomerServices.map((service, index) => {
                    const serviceStatus = getServiceVisitStatus(service);
                    return (
                      <tr 
                        key={service.id}
                        className="border-b border-gray-200 hover:bg-orange-50/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="text-gray-700 font-medium">
                            {service.sale || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-900">
                              {service.customer_group}
                            </span>
                            {service.notes && (
                              <span className="text-xs text-orange-600 line-clamp-1">
                                {service.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {service.tel || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="line-clamp-1">
                              {service.district ? `${service.district}, ` : ''}{service.province || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {service.installer_name || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <div className="flex items-center justify-center gap-1 text-gray-700">
                            <Zap className="h-3 w-3 text-orange-500" />
                            <span className="font-medium">
                              {service.capacity_kw ? service.capacity_kw : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {service.installation_date ? formatDate(service.installation_date) : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex flex-col gap-1">
                            {service.service_package_type ? (
                              <>
                                <span className="text-gray-700 font-medium">
                                  {getPackageTypeDisplayName(service.service_package_type as '1_year' | '3_year' | '5_year')}
                                </span>
                                {purchaseCounts[service.id] !== undefined && (
                                  <span className="text-xs text-gray-500">
                                    ซื้อครั้งที่ {purchaseCounts[service.id]}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex flex-col gap-1 items-center">
                            <Badge className={`${serviceStatus.color} text-xs px-2 py-1 whitespace-nowrap`}>
                              {serviceStatus.text}
                            </Badge>
                            <div className="flex gap-1 text-xs text-gray-500">
                              <span className={service.service_visit_1 ? "text-green-600" : "text-gray-400"}>
                                {service.service_visit_1 ? "✓" : "○"} ครั้งที่ 1
                              </span>
                              <span className={service.service_visit_2 ? "text-green-600" : "text-gray-400"}>
                                {service.service_visit_2 ? "✓" : "○"} ครั้งที่ 2
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/service-tracking/customer-services/${service.id}/service-visit`)}
                                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                                >
                                  <Wrench className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>บันทึกการบริการ</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/service-tracking/customer-services/${service.id}`)}
                                  className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>ดูรายละเอียด</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/service-tracking/customer-services/${service.id}/edit`)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>แก้ไข</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(service.id, service.customer_group)}
                                  disabled={deleteMutation.isPending}
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                >
                                  {deleteMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>ลบ</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไขการค้นหา</p>
              <Button 
                onClick={() => navigate("/service-tracking/customer-services/new")}
                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มลูกค้าใหม่
              </Button>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && displayCustomerServices.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page as number)}
                      className={`h-8 w-8 p-0 ${
                        currentPage === page 
                          ? "bg-orange-600 hover:bg-orange-700 text-white" 
                          : "hover:bg-orange-50"
                      }`}
                    >
                      {page}
                    </Button>
                  )
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
};

export default CustomerServiceList;
