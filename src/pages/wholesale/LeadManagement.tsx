import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

import LeadManagementTable from "@/components/dashboard/LeadManagementTable";
import { useAppData } from "@/hooks/useAppDataAPI";
import { calculateStats, prepareChartData } from "@/utils/dashboardUtils";
import { PageLoading } from "@/components/ui/loading";

import { DateRange } from "react-day-picker";
import { 
  calculateTotalLeads, 
  calculateAssignedLeads, 
  calculateUnassignedLeads, 
  calculateAssignmentRate,
  calculateLeadsByStatus,
  calculateLeadsByPlatform,
  calculateTotalLeadsWithContact,
  calculateLeadsByStatusWithContact,
  calculateLeadsByPlatformWithContact,
  normalizePhoneNumber
} from "@/utils/leadValidation";

const WholesaleLeadManagement = () => {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");


  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Enable realtime updates for this users
  const { isConnected, manualRefresh: refreshRealtime } = useRealtimeUpdates(user?.id);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ใช้ centralized data hook แทนการเรียกหลาย hooks
  const { 
    data: appData, 
    isLoading: appDataLoading,
    acceptLead,
    assignSalesOwner,
    addLead,
    isCreatingLead,
    isAcceptingLead
  } = useAppData({
    category: 'Wholesales',
    includeUserData: true,
    includeSalesTeam: true,
    includeLeads: true
  });

  const { leads = [], salesTeam = [], salesMember: currentSalesMember } = appData || {};
  const leadsLoading = appDataLoading;

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
              // Note: User data and sales member data are now handled by useAppData
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time updates are now handled by useRealtimeUpdates hook
  // This provides better connection management, error handling, and reconnection logic

  // Filter functions
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Use proper date filtering like AllLeadsReport
  const checkDateRange = (createdAt: string) => {
    if (!dateRangeFilter || !dateRangeFilter.from) {
      return true; // Show all if no date range selected
    }

    try {
      const fromDate = dateRangeFilter.from;
      const toDate = dateRangeFilter.to || dateRangeFilter.from;
      
      // Use Intl.DateTimeFormat with Thailand timezone to get correct dates
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      // Format start date - Start from 00:00:00 Thai time
      const startDateString = formatter.format(fromDate);
      const startString = startDateString + 'T00:00:00.000';
      
      // Format end date - End at 23:59:59 Thai time
      const endDateString = formatter.format(toDate);
      const endString = endDateString + 'T23:59:59.999';
      
      // Compare with lead's created_at_thai
      return createdAt >= startString && createdAt <= endString;
    } catch (error) {
      console.error('Error in date range filter:', error);
      return true; // Show all on error
    }
  };

  // Apply filters to all leads data
  const filteredLeads = useMemo(() => {
    // Normalize search term if it's a phone number (starts with digit)
    const isPhoneSearch = /^\d/.test(searchTerm);
    const normalizedSearchTerm = isPhoneSearch 
      ? normalizePhoneNumber(searchTerm) 
      : searchTerm.toLowerCase();

    return leads.filter(lead => {
      // ไม่ต้องตรวจสอบ hasContact แล้ว เพราะ useAppData กรองให้ที่ backend ด้วย has_contact_info column
      
      // ตรวจสอบว่าลีดยังไม่ถูกรับไป (sale_owner_id เป็น null)
      const isUnassigned = !lead.sale_owner_id;
      
      const matchesPlatform = platformFilter === "all" || lead.platform === platformFilter;
      
      // For phone searches, normalize both the search term and the phone number in the database
      const phoneMatches = lead.tel && isPhoneSearch
        ? normalizePhoneNumber(lead.tel).includes(normalizedSearchTerm)
        : lead.tel?.includes(searchTerm);
      
      const matchesSearch = searchTerm === "" || 
        lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phoneMatches ||
        lead.line_id?.includes(searchTerm) ||
        lead.region?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = checkDateRange(lead.created_at_thai);
      
      // ยังไม่ถูกรับไป และผ่านเงื่อนไขอื่นๆ ทั้งหมด
      return isUnassigned && matchesPlatform && matchesSearch && matchesDate;
    });
  }, [leads, platformFilter, searchTerm, dateRangeFilter]);

  const handleAcceptLead = async (leadId: number) => {
    if (!currentSalesMember) return;
    
    // ตรวจสอบอีกครั้งว่าลีดยังไม่ถูกรับไป
    const leadToAccept = leads.find(lead => lead.id === leadId);
    if (!leadToAccept || leadToAccept.sale_owner_id) {
      console.warn('Lead already assigned or not found:', leadId);
      return;
    }
    
    try {
      await acceptLead({ leadId, salesOwnerId: currentSalesMember.id });
    } catch (error) {
      console.error('Error accepting lead:', error);
    }
  };
  
  const handleAssignSalesOwner = async (leadId: number, salesOwnerId: number) => {
    await assignSalesOwner({ leadId, salesOwnerId });
  };
  


  // Calculate statistics using filtered data
  // Card "ลูกค้าผู้สนใจทั้งหมด" คำนวณแบบเดิม (ไม่ต้องมีเบอร์โทร)
  const stats = calculateStats(filteredLeads);
  
  // Card อื่นๆ ต้องมีเบอร์โทรหรือ Line ID
  const statsWithContact = {
    ...stats,
    totalLeads: calculateTotalLeadsWithContact(filteredLeads, true),
    newLeads: calculateLeadsByStatusWithContact(filteredLeads, 'รอรับ', true),
    followingLeads: calculateLeadsByStatusWithContact(filteredLeads, 'กำลังติดตาม', true),
    closedLeads: calculateLeadsByStatusWithContact(filteredLeads, 'ปิดการขาย', true),
    unsuccessfulLeads: calculateLeadsByStatusWithContact(filteredLeads, 'ยังปิดการขายไม่สำเร็จ', true),
  };
  
  const { platformData, statusData } = prepareChartData(filteredLeads);
  
  if (leadsLoading) {
    return <PageLoading type="dashboard" />;
  }
  
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการลีด Wholesales</h1>
          <p className="text-gray-600 mb-1">ภาพรวมการจัดการลีดและการขายโซลูชันพลังงานสะอาด (Wholesale)</p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('th-TH', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Connection Status & Refresh Buttons */}
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
              // Force refetch by invalidating cache
              // The useAppData hook will automatically refetch
              refreshRealtime();
            }} 
            disabled={leadsLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${leadsLoading ? 'animate-spin' : ''}`} />
            {leadsLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </Button>
        </div>
      </div>



      {/* Stats Cards - แสดงเฉพาะลีดทั้งหมด */}
      <DashboardStats
        totalLeads={stats.totalLeads}
      />



      {/* Lead Management Table - ใช้ข้อมูลที่ filter แล้ว */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>หมายเหตุ:</strong> ตารางแสดงเฉพาะลีดที่มีเบอร์โทรศัพท์หรือ Line ID และยังไม่ถูกรับไป เพื่อให้สามารถติดต่อลูกค้าได้ทันที
              </p>
            </div>
          </div>
        </div>
        
        <LeadManagementTable
          leads={filteredLeads}
          salesTeam={salesTeam}
          currentSalesMember={currentSalesMember}
          statusFilter="all"
          setStatusFilter={() => {}}
          operationStatusFilter="all"
          setOperationStatusFilter={() => {}}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateRangeFilter={dateRangeFilter}
          setDateRangeFilter={setDateRangeFilter}
          onAssignSalesOwner={handleAssignSalesOwner}
          onAcceptLead={handleAcceptLead}
          isCreatingLead={isCreatingLead}
          isAcceptingLead={isAcceptingLead}
          preFiltered={true}
          currentPage={currentPage}
          totalCount={filteredLeads.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          hideStatusFilters={true}
        />
      </div>
    </div>
  );
};

export default WholesaleLeadManagement;
