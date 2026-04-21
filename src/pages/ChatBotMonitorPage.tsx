import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bot, Search, Calendar, X } from 'lucide-react';
import { useChatBotMonitor, useChatBotStats } from '@/hooks/useChatBotMonitor';
import { ChatBotStatsCards } from '@/components/chat-bot-monitor/ChatBotStatsCards';
import { ChatBotMonitorTable } from '@/components/chat-bot-monitor/ChatBotMonitorTable';
import { ElectricityLoadingMedium } from '@/components/ui/loading';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

export default function ChatBotMonitorPage() {
  // ตั้งค่า date range default เป็นวันนี้
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: today, 
    to: today 
  });
  
  // ส่ง dateRange ไปที่ hook เพื่อทำ server-side filtering
  const { data, isLoading, error } = useChatBotMonitor(dateRangeFilter);

  // Client-side filtering สำหรับ search และ status (date filter ทำที่ server-side แล้ว)
  const filteredData = data?.filter(customer => {
    // Search filter
    const matchesSearch = 
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.tel?.includes(searchTerm) ||
      customer.line_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && customer.is_bot_active) ||
      (statusFilter === 'inactive' && !customer.is_bot_active);
    
    return matchesSearch && matchesStatus;
  });
  
  // คำนวณ stats จาก filteredData เพื่อให้สะท้อนการ filter ทั้งหมด
  const stats = useChatBotStats(filteredData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ElectricityLoadingMedium />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6 border-red-200">
          <p className="text-red-600">เกิดข้อผิดพลาด: {error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Chat Bot Monitor</h1>
          <p className="text-muted-foreground">
            จัดการระบบ Chatbot ของลูกค้า - ดูข้อความล่าสุดและเปิด/ปิดบอท
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && <ChatBotStatsCards stats={stats} />}

      {/* Filters */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-700/50 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-100">ค้นหาและกรอง</CardTitle>
          {(searchTerm || statusFilter !== 'all') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const resetToday = new Date();
                resetToday.setHours(0, 0, 0, 0);
                setDateRangeFilter({ from: resetToday, to: resetToday });
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              <X className="h-4 w-4 mr-1" />
              ล้างตัวกรอง
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* All Filters in One Row */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
              {/* Date Range Filter */}
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                <DateRangePicker
                  value={dateRangeFilter}
                  onChange={setDateRangeFilter}
                  placeholder="เลือกช่วงเวลา"
                  presets={true}
                  className="w-full lg:w-auto"
                />
              </div>

              {/* Divider */}
              <div className="hidden lg:block h-8 w-px bg-gray-300"></div>

              {/* Search */}
              <div className="relative flex-1 min-w-0 w-full lg:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อ, เบอร์โทร, Line ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="สถานะ Bot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">🟢 เปิดใช้งาน</SelectItem>
                  <SelectItem value="inactive">🔴 ปิดใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            {filteredData && (
              <div className="text-sm text-slate-300 flex items-center justify-between">
                <div>
                  แสดง <span className="font-semibold text-emerald-400">{filteredData.length}</span> รายการ
                  {data && filteredData.length < data.length && (
                    <span className="text-slate-400"> จากทั้งหมด {data.length} รายการ</span>
                  )}
                </div>
                {dateRangeFilter?.from && (
                  <div className="text-xs text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full border border-slate-600">
                    📅 {dateRangeFilter.from.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })} 
                    {dateRangeFilter.to && dateRangeFilter.from.getTime() !== dateRangeFilter.to.getTime() && 
                      ` - ${dateRangeFilter.to.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}`
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <ChatBotMonitorTable data={filteredData || []} />
    </div>
  );
}
