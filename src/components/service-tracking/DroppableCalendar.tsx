import { useDroppable } from "@dnd-kit/core";
import ServiceCalendar from "./ServiceCalendar";

interface DroppableCalendarProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

const DroppableCalendar = ({ selectedDate, onSelectDate }: DroppableCalendarProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'calendar-drop-zone',
    data: {
      type: 'calendar',
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`
        relative transition-all duration-200 rounded-lg
        ${isOver ? 'ring-4 ring-orange-500 ring-offset-4 shadow-2xl scale-[1.02]' : ''}
      `}
    >
      <ServiceCalendar 
        selectedDate={selectedDate} 
        onSelectDate={onSelectDate} 
      />
      
      {/* Drop zone indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-orange-500/10 rounded-lg pointer-events-none flex items-center justify-center">
          <div className="bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold">
            วางที่นี่เพื่อสร้างนัดหมาย
          </div>
        </div>
      )}
    </div>
  );
};

export default DroppableCalendar;
