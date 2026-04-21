import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { useCustomerServicesAPI as useCustomerServices } from "@/hooks/useCustomerServicesAPI";
import { useCustomerServiceInstallers } from "@/hooks/useCustomerServices";
import ProvinceGroup from "./ProvinceGroup";
import { Button } from "@/components/ui/button";
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

const PendingServiceList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [technicianOpen, setTechnicianOpen] = useState(false);

  const { data: customerServices, isLoading } = useCustomerServices();
  const { data: installers } = useCustomerServiceInstallers();

  // Function to get customer status (ใช้จาก VIEW แทนการคำนวณ)
  const getCustomerStatus = (customer: any) => {
    const status = customer.service_status_calculated;
    
    if (status === 'service_1_overdue' || status === 'service_2_overdue') {
      return 'overdue';
    }
    if (status === 'service_1_due_soon' || status === 'service_2_due_soon') {
      return 'warning';
    }
    return 'normal';
  };

  // Filter customers who need service
  const pendingServices = useMemo(() => {
    if (!customerServices) return [];
    
    return customerServices.filter(customer => {
      // ต้องมีการติดตั้งแล้ว
      if (!customer.installation_date) return false;
      
      // ยังไม่ได้ service ครบ 5 ครั้ง (ใช้ completed_visits_count)
      if (customer.completed_visits_count >= 5) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          customer.customer_group.toLowerCase().includes(query) ||
          customer.tel.includes(query) ||
          customer.province.toLowerCase().includes(query) ||
          customer.district?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }
      
      // Province filter
      if (provinceFilter !== "all" && customer.province !== provinceFilter) {
        return false;
      }
      
      // District filter
      if (districtFilter !== "all" && customer.district !== districtFilter) {
        return false;
      }
      
      // Visit type filter
      if (visitTypeFilter !== "all") {
        if (visitTypeFilter === "visit_1" && customer.service_visit_1) return false;
        if (visitTypeFilter === "visit_2" && (!customer.service_visit_1 || customer.service_visit_2)) return false;
        if (visitTypeFilter === "visit_3" && (!customer.service_visit_2 || customer.service_visit_3)) return false;
        if (visitTypeFilter === "visit_4" && (!customer.service_visit_3 || customer.service_visit_4)) return false;
        if (visitTypeFilter === "visit_5" && (!customer.service_visit_4 || customer.service_visit_5)) return false;
      }
      
      // Status filter
      if (statusFilter !== "all") {
        const customerStatus = getCustomerStatus(customer);
        if (statusFilter !== customerStatus) return false;
      }
      
      // Technician filter (ใช้ installer_name แทน service_visit_*_technician)
      if (technicianFilter !== "all") {
        if (customer.installer_name !== technicianFilter) return false;
      }
      
      return true;
    });
  }, [customerServices, searchQuery, provinceFilter, districtFilter, visitTypeFilter, statusFilter, technicianFilter]);

  // Group by province
  const customersByProvince = useMemo(() => {
    return pendingServices.reduce((acc, customer) => {
      const province = customer.province;
      if (!acc[province]) {
        acc[province] = [];
      }
      acc[province].push(customer);
      return acc;
    }, {} as Record<string, typeof pendingServices>);
  }, [pendingServices]);

  const provinces = Object.keys(customersByProvince).sort((a, b) => 
    customersByProvince[b].length - customersByProvince[a].length
  );

  // Get unique provinces for filter
  const allProvinces = useMemo(() => {
    if (!customerServices) return [];
    const provinceSet = new Set(customerServices.map(c => c.province));
    return Array.from(provinceSet).sort();
  }, [customerServices]);

  // Get unique districts for filter (filter by province if selected)
  const allDistricts = useMemo(() => {
    if (!customerServices) return [];
    let filteredServices = customerServices;
    
    // If province is selected, only show districts in that province
    if (provinceFilter !== "all") {
      filteredServices = customerServices.filter(c => c.province === provinceFilter);
    }
    
    const districtSet = new Set(
      filteredServices
        .map(c => c.district)
        .filter(district => district) // Filter out null/undefined
    );
    return Array.from(districtSet).sort();
  }, [customerServices, provinceFilter]);

  return (
    <Card className="w-full flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          รายการรอ Service
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          ทั้งหมด {pendingServices.length} รายการ
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden">
        {/* Filters */}
        <div className="space-y-2 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ, เบอร์, จังหวัด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Province Searchable Dropdown */}
            <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={provinceOpen}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="truncate">
                      {provinceFilter === "all" ? "จังหวัด" : provinceFilter}
                    </span>
                  </div>
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
                        value="ทุกจังหวัด"
                        onSelect={() => {
                          setProvinceFilter("all");
                          setDistrictFilter("all");
                          setProvinceOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            provinceFilter === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        ทุกจังหวัด
                      </CommandItem>
                      {allProvinces.map((province) => (
                        <CommandItem
                          key={province}
                          value={province}
                          onSelect={() => {
                            setProvinceFilter(province);
                            setDistrictFilter("all"); // Reset district when province changes
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

            {/* District Searchable Dropdown */}
            <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={districtOpen}
                  className="w-full justify-between"
                  disabled={provinceFilter === "all" && allDistricts.length === 0}
                >
                  <span className="truncate">
                    {districtFilter === "all" ? "อำเภอ" : districtFilter}
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
                        value="ทุกอำเภอ"
                        onSelect={() => {
                          setDistrictFilter("all");
                          setDistrictOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            districtFilter === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        ทุกอำเภอ
                      </CommandItem>
                      {allDistricts.map((district) => (
                        <CommandItem
                          key={district}
                          value={district}
                          onSelect={() => {
                            setDistrictFilter(district);
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

            <Select value={visitTypeFilter} onValueChange={setVisitTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="visit_1">บริการครั้งที่ 1</SelectItem>
                <SelectItem value="visit_2">บริการครั้งที่ 2</SelectItem>
                <SelectItem value="visit_3">บริการครั้งที่ 3</SelectItem>
                <SelectItem value="visit_4">บริการครั้งที่ 4</SelectItem>
                <SelectItem value="visit_5">บริการครั้งที่ 5</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="overdue">เกินกำหนด</SelectItem>
                <SelectItem value="warning">ใกล้ครบกำหนด</SelectItem>
                <SelectItem value="normal">ปกติ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Technician Filter */}
          <div className="w-full">
            <Popover open={technicianOpen} onOpenChange={setTechnicianOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={technicianOpen}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="truncate">
                      {technicianFilter === "all" ? "ช่าง" : technicianFilter}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="ค้นหาช่าง..." />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>ไม่พบช่างที่ค้นหา</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="ทุกช่าง"
                        onSelect={() => {
                          setTechnicianFilter("all");
                          setTechnicianOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            technicianFilter === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        ทุกช่าง
                      </CommandItem>
                      {installers?.map((installer) => (
                        <CommandItem
                          key={installer}
                          value={installer}
                          onSelect={() => {
                            setTechnicianFilter(installer);
                            setTechnicianOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              technicianFilter === installer ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {installer}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active filters badge */}
          {(provinceFilter !== "all" || districtFilter !== "all" || visitTypeFilter !== "all" || statusFilter !== "all" || technicianFilter !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">กรองแล้ว:</span>
              {provinceFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {provinceFilter}
                </Badge>
              )}
              {districtFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  อำเภอ: {districtFilter}
                </Badge>
              )}
              {visitTypeFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {visitTypeFilter === "visit_1" ? "บริการครั้งที่ 1" : "บริการครั้งที่ 2"}
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    statusFilter === "overdue" ? "bg-red-100 text-red-800" :
                    statusFilter === "warning" ? "bg-amber-100 text-amber-800" :
                    "bg-blue-100 text-blue-800"
                  }`}
                >
                  {statusFilter === "overdue" ? "เกินกำหนด" : 
                   statusFilter === "warning" ? "ใกล้ครบกำหนด" : "ปกติ"}
                </Badge>
              )}
              {technicianFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  ช่าง: {technicianFilter}
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  "{searchQuery}"
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Customer List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
            </div>
          ) : pendingServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {searchQuery || provinceFilter !== "all" || districtFilter !== "all" || visitTypeFilter !== "all" || statusFilter !== "all" || technicianFilter !== "all"
                  ? "ไม่พบรายการที่ตรงกับเงื่อนไข"
                  : "ไม่มีรายการรอ service"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {provinces.map((province) => (
                <ProvinceGroup
                  key={province}
                  provinceName={province}
                  customers={customersByProvince[province]}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingServiceList;