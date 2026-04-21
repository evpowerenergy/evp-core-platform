import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
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

interface DistrictGroupProps {
  districtName: string;
  customers: Customer[];
}

const DistrictGroup = ({ districtName, customers }: DistrictGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium text-sm">{districtName}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {customers.length}
          </Badge>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="space-y-2 pl-6 pt-2">
          {customers.map((customer) => (
            <DraggableCustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DistrictGroup;