import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import CustomerServiceCard from "./CustomerServiceCard";

interface DraggableCustomerCardProps {
  customer: {
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
  };
}

const DraggableCustomerCard = ({ customer }: DraggableCustomerCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `customer-${customer.id}`,
    data: {
      type: 'customer',
      customer,
    },
  });

  const style = {
    ...(transform
      ? {
          transform: CSS.Transform.toString(transform),
          zIndex: 999,
        }
      : {}),
    width: isDragging ? '400px' : undefined,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={isDragging ? 'will-change-transform' : ''}
    >
      <CustomerServiceCard customer={customer} isDragging={isDragging} />
    </div>
  );
};

export default DraggableCustomerCard;
