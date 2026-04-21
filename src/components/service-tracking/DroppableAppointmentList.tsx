import { useDroppable } from "@dnd-kit/core";
import AppointmentList from "./AppointmentList";
import { ServiceAppointmentWithCustomer } from "@/hooks/useServiceAppointmentsAPI";

interface DroppableAppointmentListProps {
  appointments: ServiceAppointmentWithCustomer[];
  selectedDate: Date | undefined;
  onEdit?: (appointment: ServiceAppointmentWithCustomer) => void;
  onDelete?: (id: number) => void;
}

const DroppableAppointmentList = ({ 
  appointments, 
  selectedDate, 
  onEdit, 
  onDelete 
}: DroppableAppointmentListProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'appointment-list-drop-zone',
    data: {
      type: 'appointment-list',
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        relative transition-all duration-150 rounded-lg h-full
        ${isOver ? 'ring-2 ring-orange-400 shadow-lg' : ''}
      `}
    >
      <AppointmentList 
        appointments={appointments}
        selectedDate={selectedDate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      
      {/* Drop zone indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-orange-500/5 rounded-lg pointer-events-none flex items-center justify-center z-50">
          <div className="bg-orange-600 text-white px-4 py-2 rounded-md shadow font-medium text-sm">
            📅 วางที่นี่เพื่อสร้างนัดหมาย
          </div>
        </div>
      )}
    </div>
  );
};

export default DroppableAppointmentList;

