import { useState } from "react";
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
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Building2, Calendar, Clock, User } from "lucide-react";

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: number;
    customer_group: string;
    tel: string;
    province: string;
    district: string | null;
    service_visit_1: boolean;
    service_visit_2: boolean;
  } | null;
  selectedDate: Date | undefined;
  onConfirm: (data: {
    customerId: number;
    date: string;
    time: string;
    technician: string;
    serviceType: 'visit_1' | 'visit_2';
    serviceTypeLabel: string;
    notes: string;
  }) => void;
}

const CreateAppointmentDialog = ({
  open,
  onOpenChange,
  customer,
  selectedDate,
  onConfirm,
}: CreateAppointmentDialogProps) => {
  const [time, setTime] = useState("09:00");
  const [technician, setTechnician] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!customer || !selectedDate) return;

    // หา visit ครั้งถัดไปที่ยังไม่เสร็จ
    const getNextVisitInfo = (customer: any) => {
      if (!customer.service_visit_1) return { type: 'visit_1', label: 'บริการครั้งที่ 1' };
      if (!customer.service_visit_2) return { type: 'visit_2', label: 'บริการครั้งที่ 2' };
      if (!customer.service_visit_3) return { type: 'visit_3', label: 'บริการครั้งที่ 3' };
      if (!customer.service_visit_4) return { type: 'visit_4', label: 'บริการครั้งที่ 4' };
      if (!customer.service_visit_5) return { type: 'visit_5', label: 'บริการครั้งที่ 5' };
      return null; // ครบ 5 ครั้งแล้ว
    };

    const visitInfo = getNextVisitInfo(customer);
    if (!visitInfo) return; // ไม่สามารถสร้างนัดหมายได้

    const visitType = visitInfo.type as 'visit_1' | 'visit_2' | 'visit_3' | 'visit_4' | 'visit_5';
    const serviceTypeLabel = visitInfo.label;

    onConfirm({
      customerId: customer.id,
      date: format(selectedDate, "yyyy-MM-dd"),
      time,
      technician,
      serviceType: visitType,
      serviceTypeLabel,
      notes,
    });

    // Reset form
    setTime("09:00");
    setTechnician("");
    setNotes("");
    onOpenChange(false);
  };

  if (!customer || !selectedDate) return null;

  // หา visit ครั้งถัดไปที่ยังไม่เสร็จ
  const getNextVisitInfo = (customer: any) => {
    if (!customer.service_visit_1) return { type: 'visit_1', label: 'บริการครั้งที่ 1' };
    if (!customer.service_visit_2) return { type: 'visit_2', label: 'บริการครั้งที่ 2' };
    if (!customer.service_visit_3) return { type: 'visit_3', label: 'บริการครั้งที่ 3' };
    if (!customer.service_visit_4) return { type: 'visit_4', label: 'บริการครั้งที่ 4' };
    if (!customer.service_visit_5) return { type: 'visit_5', label: 'บริการครั้งที่ 5' };
    return null; // ครบ 5 ครั้งแล้ว
  };

  const visitInfo = getNextVisitInfo(customer);
  const serviceType = visitInfo?.label || "ไม่สามารถสร้างนัดหมายได้";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            สร้างนัดหมาย Service
          </DialogTitle>
          <DialogDescription>
            กรอกรายละเอียดการนัดหมาย service สำหรับลูกค้า
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4 text-orange-600" />
              {customer.customer_group}
            </div>
            <div className="text-sm text-muted-foreground">
              {customer.district 
                ? `${customer.district}, ${customer.province}` 
                : customer.province}
            </div>
            <div className="text-sm font-medium text-orange-600">
              {serviceType}
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
              value={format(selectedDate, "d MMMM yyyy", { locale: th })}
              disabled
              className="bg-muted"
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
            disabled={!technician.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            สร้างนัดหมาย
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAppointmentDialog;
