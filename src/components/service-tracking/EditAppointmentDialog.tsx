import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { Building2, Calendar, Clock, User } from "lucide-react";
import { ServiceAppointmentWithCustomer } from "@/hooks/useServiceAppointmentsAPI";

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: ServiceAppointmentWithCustomer | null;
  onConfirm: (updates: any) => void;
}

const EditAppointmentDialog = ({
  open,
  onOpenChange,
  appointment,
  onConfirm,
}: EditAppointmentDialogProps) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [technician, setTechnician] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("scheduled");

  // Load appointment data when dialog opens
  useEffect(() => {
    if (appointment && open) {
      const appointmentDate = parseISO(appointment.appointment_date);
      setDate(format(appointmentDate, "yyyy-MM-dd"));
      const rawTime = appointment.appointment_time || "09:00";
      const hhmm = rawTime.length > 5 ? rawTime.slice(0,5) : rawTime;
      setTime(hhmm);
      setTechnician(appointment.technician_name || "");
      setNotes(appointment.notes || "");
      setStatus(appointment.status || "scheduled");
    }
  }, [appointment, open]);

  const handleSubmit = () => {
    if (!appointment) return;

    // Convert to database format
    const appointmentDateTime = `${date}T${time}:00`;
    
    onConfirm({
      appointment_date: appointmentDateTime,
      appointment_time: time,
      technician_name: technician,
      notes: notes,
      status: status,
    });

    onOpenChange(false);
  };

  if (!appointment) return null;

  const serviceTypeLabel = appointment.service_type === 'visit_1' 
    ? "บริการครั้งที่ 1" 
    : "บริการครั้งที่ 2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            แก้ไขนัดหมาย Service
          </DialogTitle>
          <DialogDescription>
            แก้ไขรายละเอียดการนัดหมาย service
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4 text-orange-600" />
              {appointment.customer.customer_group}
            </div>
            <div className="text-sm text-muted-foreground">
              {appointment.customer.district 
                ? `${appointment.customer.district}, ${appointment.customer.province}` 
                : appointment.customer.province}
            </div>
            <div className="text-sm font-medium text-orange-600">
              {serviceTypeLabel}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              วันที่
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              เวลา
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Technician */}
          <div className="space-y-2">
            <Label htmlFor="technician" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              ช่างเทคนิค
            </Label>
            <Input
              id="technician"
              placeholder="ระบุชื่อช่างเทคนิค"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">สถานะ</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    กำหนดการ
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    กำลังดำเนินการ
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    เสร็จสิ้น ✅
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    ยกเลิก
                  </div>
                </SelectItem>
                <SelectItem value="rescheduled">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                    เลื่อนนัด
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {status === 'completed' && (
              <p className="text-xs text-green-600 font-medium">
                ⚠️ การเปลี่ยนเป็น "เสร็จสิ้น" จะอัปเดตสถานะการบริการอัตโนมัติ
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ (ถ้ามี)</Label>
            <Textarea
              id="notes"
              placeholder="รายละเอียดเพิ่มเติม..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!technician.trim() || !date}
            className="bg-orange-600 hover:bg-orange-700"
          >
            บันทึกการเปลี่ยนแปลง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentDialog;
