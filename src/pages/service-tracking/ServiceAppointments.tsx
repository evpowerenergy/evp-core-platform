import { useState } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import ServiceCalendar from "@/components/service-tracking/ServiceCalendar";
import DroppableAppointmentList from "@/components/service-tracking/DroppableAppointmentList";
import PendingServiceList from "@/components/service-tracking/PendingServiceList";
import ServiceDueAlert from "@/components/service-tracking/ServiceDueAlert";
import CreateAppointmentDialog from "@/components/service-tracking/CreateAppointmentDialog";
import EditAppointmentDialog from "@/components/service-tracking/EditAppointmentDialog";
import { Card } from "@/components/ui/card";
import { 
  useServiceAppointmentsAPI as useServiceAppointments, 
  useCreateServiceAppointmentAPI as useCreateServiceAppointment,
  useUpdateServiceAppointmentAPI as useUpdateServiceAppointment,
  useDeleteServiceAppointmentAPI as useDeleteServiceAppointment,
  ServiceAppointmentWithCustomer
} from "@/hooks/useServiceAppointmentsAPI";
import { format } from "date-fns";
import { useToast } from "@/hooks/useToast";

const ServiceAppointments = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState<any>(null);
  const [editingAppointment, setEditingAppointment] = useState<ServiceAppointmentWithCustomer | null>(null);
  const { toast } = useToast();

  // Configure sensors for better drag and drop experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // ต้องลาก 8px ก่อนถึงจะเริ่ม drag (ป้องกัน accidental drag)
      },
    })
  );

  // Fetch appointments for selected date
  const { data: appointments, isLoading } = useServiceAppointments({
    date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
  });

  const createAppointment = useCreateServiceAppointment();
  const updateAppointment = useUpdateServiceAppointment();
  const deleteAppointment = useDeleteServiceAppointment();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // ถ้า drop บน appointment list
    if (over.id === 'appointment-list-drop-zone' && active.data.current?.type === 'customer') {
      const customer = active.data.current.customer;
      setPendingAppointment(customer);
      setAppointmentDialogOpen(true);
    }
  };

  const handleConfirmAppointment = async (data: {
    customerId: number;
    date: string;
    time: string;
    technician: string;
    serviceType: 'visit_1' | 'visit_2';
    serviceTypeLabel: string;
    notes: string;
  }) => {
    try {
      const timeHHmm = data.time && data.time.length > 5 ? data.time.slice(0,5) : data.time;
      await createAppointment.mutateAsync({
        customer_service_id: data.customerId,
        appointment_date: `${data.date}T${timeHHmm}:00`,
        appointment_time: timeHHmm,
        technician_name: data.technician,
        service_type: data.serviceType,
        notes: data.notes,
        status: 'scheduled',
      });

      toast({
        title: "สำเร็จ",
        description: "สร้างนัดหมาย service เรียบร้อยแล้ว",
      });

      setPendingAppointment(null);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const handleEditAppointment = (appointment: ServiceAppointmentWithCustomer) => {
    setEditingAppointment(appointment);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async (updates: any) => {
    if (!editingAppointment) return;

    try {
      await updateAppointment.mutateAsync({
        id: editingAppointment.id,
        updates,
      });

      toast({
        title: "สำเร็จ",
        description: "อัปเดตนัดหมายเรียบร้อยแล้ว",
      });

      setEditDialogOpen(false);
      setEditingAppointment(null);
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error?.message || "ไม่สามารถอัปเดตนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!confirm("คุณต้องการลบนัดหมายนี้ใช่หรือไม่?")) return;

    try {
      await deleteAppointment.mutateAsync(id);
      
      toast({
        title: "สำเร็จ",
        description: "ลบนัดหมายเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-orange-900">การจัดการนัดหมาย Service</h1>
          <p className="text-muted-foreground mt-1">
            💡 <strong>วิธีใช้:</strong> ลากการ์ดลูกค้าจากรายการรอ Service (ฝั่งซ้าย) มาวางที่รายการนัดหมาย (ฝั่งขวาล่าง) เพื่อสร้างนัดหมาย
          </p>
        </div>

        {/* Service Due Alert - แสดงสถานะกำหนดบริการ */}
        <div className="mb-6">
          <ServiceDueAlert />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ gridAutoRows: '1fr' }}>
          {/* Left Side: Pending Service List - วางไว้ฝั่งซ้ายเพื่อลากไปขวาได้สะดวก */}
          <div className="order-2 lg:order-1 min-h-[800px]">
            <PendingServiceList />
          </div>

          {/* Right Side: Calendar + Appointment List */}
          <div className="order-1 lg:order-2 flex flex-col gap-6 min-h-[800px]">
            {/* Calendar */}
            <Card>
              <ServiceCalendar 
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate} 
              />
            </Card>

            {/* Appointment List (Droppable) */}
            <div className="flex-1">
              <DroppableAppointmentList 
                appointments={appointments || []}
                selectedDate={selectedDate}
                onEdit={handleEditAppointment}
                onDelete={handleDeleteAppointment}
              />
            </div>
          </div>
        </div>


        {/* Create Appointment Dialog */}
        <CreateAppointmentDialog
          open={appointmentDialogOpen}
          onOpenChange={setAppointmentDialogOpen}
          customer={pendingAppointment}
          selectedDate={selectedDate}
          onConfirm={handleConfirmAppointment}
        />

        {/* Edit Appointment Dialog */}
        <EditAppointmentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          appointment={editingAppointment}
          onConfirm={handleConfirmEdit}
        />
      </div>
    </DndContext>
  );
};

export default ServiceAppointments;