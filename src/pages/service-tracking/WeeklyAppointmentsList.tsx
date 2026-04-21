import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import WeeklyDayColumn from "@/components/service-tracking/WeeklyDayColumn";
import EditAppointmentDialog from "@/components/service-tracking/EditAppointmentDialog";
import {
  useServiceAppointmentsAPI as useServiceAppointments,
  useUpdateServiceAppointmentAPI as useUpdateServiceAppointment,
  useDeleteServiceAppointmentAPI as useDeleteServiceAppointment,
  ServiceAppointmentWithCustomer,
} from "@/hooks/useServiceAppointmentsAPI";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const WeeklyAppointmentsList = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Start on Monday
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return { from: start, to: end };
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<ServiceAppointmentWithCustomer | null>(null);
  const { toast } = useToast();

  // Calculate week range
  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch appointments for the week
  const { data: appointments, isLoading, refetch } = useServiceAppointments({
    startDate: format(weekStart, "yyyy-MM-dd"),
    endDate: format(weekEnd, "yyyy-MM-dd"),
  });

  const updateAppointment = useUpdateServiceAppointment();
  const deleteAppointment = useDeleteServiceAppointment();

  // Get unique technicians
  const technicians = useMemo(() => {
    if (!appointments) return [];
    const uniqueTechnicians = new Set(
      appointments
        .map(apt => apt.technician_name)
        .filter(Boolean)
    );
    return Array.from(uniqueTechnicians).sort();
  }, [appointments]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];

    return appointments.filter(apt => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        apt.customer.customer_group.toLowerCase().includes(searchLower) ||
        apt.customer.tel.includes(searchQuery) ||
        apt.customer.province.toLowerCase().includes(searchLower) ||
        apt.customer.district?.toLowerCase().includes(searchLower);

      // Technician filter
      const matchesTechnician = selectedTechnician === "all" || 
        apt.technician_name === selectedTechnician;

      return matchesSearch && matchesTechnician;
    });
  }, [appointments, searchQuery, selectedTechnician]);

  // Group appointments by day
  const appointmentsByDay = useMemo(() => {
    const grouped: { [key: string]: ServiceAppointmentWithCustomer[] } = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd");
      grouped[dayKey] = [];
    });

    filteredAppointments.forEach(apt => {
      const aptDate = new Date(apt.appointment_date);
      const dayKey = format(aptDate, "yyyy-MM-dd");
      if (grouped[dayKey]) {
        grouped[dayKey].push(apt);
      }
    });

    return grouped;
  }, [filteredAppointments, weekDays]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredAppointments.length;
    return { total };
  }, [filteredAppointments]);

  // Handlers
  const handlePreviousWeek = () => {
    const newStart = subWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newStart);
    setDateRange({ from: newStart, to: endOfWeek(newStart, { weekStartsOn: 1 }) });
  };

  const handleNextWeek = () => {
    const newStart = addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newStart);
    setDateRange({ from: newStart, to: endOfWeek(newStart, { weekStartsOn: 1 }) });
  };

  const handleToday = () => {
    const today = new Date();
    const newStart = startOfWeek(today, { weekStartsOn: 1 });
    setCurrentWeekStart(newStart);
    setDateRange({ from: newStart, to: endOfWeek(newStart, { weekStartsOn: 1 }) });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      // Set to the start of the week of the selected date
      const newStart = startOfWeek(range.from, { weekStartsOn: 1 });
      setCurrentWeekStart(newStart);
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
      setEditDialogOpen(false);
      setEditingAppointment(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบนัดหมายนี้?")) return;

    try {
      await deleteAppointment.mutateAsync(id);
      toast({
        title: "ลบนัดหมายสำเร็จ",
        description: "นัดหมายถูกลบออกจากระบบแล้ว",
      });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบนัดหมายได้",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "รีเฟรชข้อมูล",
      description: "กำลังโหลดข้อมูลใหม่...",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📋 รายการนัดหมาย service ประจำสัปดาห์</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            ดูและจัดการนัดหมายทั้งอาทิตย์ในหน้าเดียว
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>

      {/* Week Navigation and Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Week Navigation */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePreviousWeek}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">อาทิตก่อนหน้า</span>
                  <span className="sm:hidden">ก่อน</span>
                </Button>
                <Button
                  onClick={handleToday}
                  variant="outline"
                  size="sm"
                  className="font-semibold flex-1 sm:flex-none"
                >
                  <Calendar className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">วันนี้</span>
                </Button>
                <Button
                  onClick={handleNextWeek}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">อาทิตถัดไป</span>
                  <span className="sm:hidden">ถัดไป</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="hidden lg:block h-8 w-px bg-border mx-1"></div>
              
              <div className="w-full sm:w-auto">
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  placeholder="เลือกช่วงวันที่"
                  presets={true}
                />
              </div>
              
              <div className="text-sm sm:text-base lg:text-lg font-semibold text-center sm:text-left">
                📅 {format(weekStart, "d MMM", { locale: th })} - {format(weekEnd, "d MMM yyyy", { locale: th })}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">
                ทั้งหมด: {stats.total} นัดหมาย
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาลูกค้า, เบอร์โทร, สถานที่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger>
                <SelectValue placeholder="ช่างทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👨‍🔧 ช่างทั้งหมด</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Columns */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-2" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop: Grid 7 columns */}
          <div className="hidden 2xl:grid grid-cols-7 gap-2 auto-rows-fr min-h-[600px]">
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDay[dayKey] || [];

              return (
                <WeeklyDayColumn
                  key={dayKey}
                  date={day}
                  appointments={dayAppointments}
                  onEdit={handleEditAppointment}
                  onDelete={handleDeleteAppointment}
                />
              );
            })}
          </div>

          {/* Tablet/Laptop: Horizontal scroll with fixed width columns */}
          <div className="2xl:hidden">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-3 min-h-[600px]" style={{ width: 'max-content' }}>
                {weekDays.map((day) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const dayAppointments = appointmentsByDay[dayKey] || [];

                  return (
                    <div key={dayKey} className="w-[280px] sm:w-[320px] flex-shrink-0">
                      <WeeklyDayColumn
                        date={day}
                        appointments={dayAppointments}
                        onEdit={handleEditAppointment}
                        onDelete={handleDeleteAppointment}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              💡 เลื่อนซ้าย-ขวาเพื่อดูวันอื่นๆ
            </p>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <EditAppointmentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        appointment={editingAppointment}
        onConfirm={handleConfirmEdit}
      />
    </div>
  );
};

export default WeeklyAppointmentsList;

