import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import DistrictGroup from "./DistrictGroup";
import DraggableCustomerCard from "./DraggableCustomerCard";

interface Customer {
  id: number;
  customer_group: string;
  tel: string;
  province: string;
  district: string | null;
  capacity_kw: number | null;
  installation_date: string | null;
  service_visit_1: boolean;
  service_visit_2: boolean;
  service_visit_3: boolean;
  service_visit_4: boolean;
  service_visit_5: boolean;
  installer_name: string | null;
  days_until_service_1_due: number | null;
  days_until_service_2_due: number | null;
  service_status_calculated: string | null;
  completed_visits_count: number | null;
}

interface ProvinceGroupProps {
  provinceName: string;
  customers: Customer[];
}

const ProvinceGroup = ({ provinceName, customers }: ProvinceGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // Group customers by district
  const customersByDistrict = customers.reduce((acc, customer) => {
    const district = customer.district || "ไม่ระบุอำเภอ";
    if (!acc[district]) {
      acc[district] = [];
    }
    acc[district].push(customer);
    return acc;
  }, {} as Record<string, Customer[]>);

  const districts = Object.keys(customersByDistrict).sort();
  const hasMultipleDistricts = districts.length > 1;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-orange-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-orange-600" />
            )}
            <MapPin className="h-4 w-4 text-orange-600" />
            <span className="font-semibold text-orange-900">{provinceName}</span>
          </div>
          <Badge className="bg-orange-600 hover:bg-orange-700">
            {customers.length}
          </Badge>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="space-y-2 pl-2 pt-3">
          {hasMultipleDistricts ? (
            districts.map((district) => (
              <DistrictGroup
                key={district}
                districtName={district}
                customers={customersByDistrict[district]}
              />
            ))
          ) : (
            // ถ้ามีแค่ 1 อำเภอ แสดงการ์ดโดยตรง
            <div className="space-y-2">
              {customers.map((customer) => (
                <DraggableCustomerCard key={customer.id} customer={customer} />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ProvinceGroup;