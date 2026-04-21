
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, Clock, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyLeadsData } from "@/hooks/useAppDataAPI";
import { useAppointmentsAPI as useAppointments } from "@/hooks/useAppointmentsAPI";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

import { AppointmentCalendarSection } from "@/components/appointments/AppointmentCalendarSection";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";

type AppointmentType = 'follow-up' | 'engineer' | 'payment';

interface LeadInfo {
  id: number;
  full_name?: string;
  tel?: string;
  region?: string;
  platform?: string;
}

interface BaseAppointment {
  id: number;
  date: string;
  type: AppointmentType;
  lead: LeadInfo;
  source: string;
}

interface FollowUpAppointment extends BaseAppointment {
  type: 'follow-up';
  details?: string;
  source: 'productivity_log';
}

interface EngineerAppointment extends BaseAppointment {
  type: 'engineer';
  location?: string;
  building_details?: string;
  installation_notes?: string;
  status: string;
  note?: string;
  source: 'appointment';
}

interface PaymentAppointment extends BaseAppointment {
  type: 'payment';
  total_amount?: number;
  payment_method?: string;
  source: 'quotation';
}

type AppointmentDetail = FollowUpAppointment | EngineerAppointment | PaymentAppointment;

const MyAppointments = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Enable realtime updates for this user
  const { isConnected, manualRefresh: refreshRealtime } = useRealtimeUpdates(user?.id);

  // ใช้ hook ใหม่ที่รวมข้อมูล user และ appointments
  // ใช้ centralized data hook แทนการเรียกหลาย hooks
  const { data: myLeadsData, isLoading: myLeadsLoading } = useMyLeadsData('Package');
  const { data: appointmentsData, isLoading: appointmentsLoading, refetch: refetchAppointments } = useAppointments();
  
  const { user: currentUser, salesMember } = myLeadsData || {};
  const userDataLoading = myLeadsLoading;
  
  const followUpAppointments = appointmentsData?.followUp || [];
  const engineerAppointments = appointmentsData?.engineer || [];
  const paymentAppointments = appointmentsData?.payment || [];

  const isLoading = appointmentsLoading || userDataLoading || !currentUser;

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date || new Date());
  };

  if (isLoading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Enhanced Tabbed Calendar Sections with Integrated Header - Full Width */}
      <div className="bg-white shadow-xl border-b-2 border-gray-100">
        <Tabs defaultValue="follow-up" className="w-full">
          {/* Integrated Header with Tabs */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
            <div className="px-8 py-6 pb-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">ตารางนัดหมายของฉัน</h1>
                    <p className="text-gray-600 mb-1">จัดการและติดตามนัดหมายทั้งหมดของคุณ</p>
                    <p className="text-sm text-gray-500">
                      {new Date().toLocaleDateString('th-TH', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-600">
                        {isConnected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
                      </span>
                    </div>
                    
                    {/* Refresh Button */}
                    <Button 
                      onClick={() => {
                        refetchAppointments();
                        refreshRealtime();
                      }} 
                      disabled={appointmentsLoading}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${appointmentsLoading ? 'animate-spin' : ''}`} />
                      {appointmentsLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">รวมนัดหมายทั้งหมด</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {followUpAppointments.length + engineerAppointments.length + paymentAppointments.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <TabsList className="grid w-full grid-cols-3 h-16 bg-white/80 backdrop-blur-sm rounded-none border-b-2 border-blue-100 mx-8 mb-0">
              <TabsTrigger 
                value="follow-up" 
                className="flex items-center gap-3 text-base font-semibold h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                <Clock className="h-5 w-5" />
                นัดติดตาม
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                  {followUpAppointments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="engineer" 
                className="flex items-center gap-3 text-base font-semibold h-full data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
              >
                <User className="h-5 w-5" />
                นัดหมายวิศวกร
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                  {engineerAppointments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                className="flex items-center gap-3 text-base font-semibold h-full data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-b-2 data-[state=active]:border-orange-500"
              >
                <CalendarDays className="h-5 w-5" />
                ประมาณการชำระ
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                  {paymentAppointments.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-8 py-8">
            <TabsContent value="follow-up" className="mt-0">
              <AppointmentCalendarSection
                appointments={followUpAppointments}
                title="นัดติดตามครั้งถัดไป"
                color="text-blue-600"
                icon={<Clock className="h-6 w-6 text-blue-600" />}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </TabsContent>

            <TabsContent value="engineer" className="mt-0">
              <AppointmentCalendarSection
                appointments={engineerAppointments}
                title="นัดหมายวิศวกร"
                color="text-green-600"
                icon={<User className="h-6 w-6 text-green-600" />}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </TabsContent>

            <TabsContent value="payment" className="mt-0">
              <AppointmentCalendarSection
                appointments={paymentAppointments}
                title="ประมาณการชำระเงิน"
                color="text-orange-600"
                icon={<CalendarDays className="h-6 w-6 text-orange-600" />}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default MyAppointments;
