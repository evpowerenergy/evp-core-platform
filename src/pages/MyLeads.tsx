import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyLeadsWithMutations } from "@/hooks/useAppDataAPI";
import { useFollowupStats } from "@/hooks/useFollowupStats";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, User, Phone, MapPin, Calendar, Clock, Eye, RefreshCw } from "lucide-react";
import FollowupSummary from "@/components/FollowupSummary";
import OperationStatusSummary from "@/components/OperationStatusSummary";
import FollowupStatus from "@/components/FollowupStatus";
import LeadManagementTable from "@/components/dashboard/LeadManagementTable";
import { getFollowupSummary } from "@/hooks/useFollowupStats";
import { getLeadStatusColor, getOperationStatusColor } from "@/utils/leadStatusUtils";
import { isInDateRange } from "@/utils/dateFilterUtils";
import { DateRange } from "react-day-picker";
import { PageLoading } from "@/components/ui/loading";
import { normalizePhoneNumber } from "@/utils/leadValidation";

// Constants
const LEAD_STATUS_OPTIONS = [
  "ใหม่",
  "กำลังติดตาม",
  "ปิดการขาย",
  "ไม่สำเร็จ"
];

// ใช้ OPERATION_STATUS_OPTIONS จาก leadStatusUtils แทน
import { OPERATION_STATUS_OPTIONS } from "@/utils/leadStatusUtils";

const MyLeads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Enable realtime updates for this user
  const { isConnected, manualRefresh: refreshRealtime } = useRealtimeUpdates(user?.id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [operationStatusFilter, setOperationStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [callStatusFilter, setCallStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  // ใช้ hook ใหม่ที่รวมข้อมูล user และ sales member
  // ใช้ centralized data hook แทนการเรียกหลาย hooks
  const { data: myLeadsData, isLoading: myLeadsLoading, refetch: refetchMyLeads } = useMyLeadsWithMutations('Package');
  const { leads: myLeads = [], user: currentUser, salesMember } = myLeadsData || {};
  const userDataLoading = myLeadsLoading;
  const leadsLoading = myLeadsLoading;

  // Get followup statistics
  const leadIds = myLeads.map(lead => lead.id);
  const { data: followupCounts = {} } = useFollowupStats(leadIds);

  // Use utility function for date filtering
  const checkDateRange = (createdAt: string) => {
    return isInDateRange(createdAt, dateRangeFilter);
  };

  const dateFieldKey: 'updated_at_thai' | 'created_at_thai' = 'updated_at_thai';

  const filteredLeadsForSummary = useMemo(() => {
    const isPhoneSearch = /^\d/.test(searchTerm);
    const lowerSearchTerm = searchTerm.toLowerCase();
    const normalizedSearchTerm = isPhoneSearch
      ? normalizePhoneNumber(searchTerm)
      : lowerSearchTerm;

    return myLeads
      .filter(lead => {
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        const matchesOperationStatus = operationStatusFilter === "all" || lead.operation_status === operationStatusFilter;
        const matchesPlatform = platformFilter === "all" || lead.platform === platformFilter;

        const leadTel = String(lead.tel || "");
        const phoneMatches = leadTel && isPhoneSearch
          ? normalizePhoneNumber(leadTel).includes(normalizedSearchTerm)
          : leadTel.toLowerCase().includes(lowerSearchTerm);

        const matchesSearch =
          searchTerm === "" ||
          String(lead.full_name || "").toLowerCase().includes(lowerSearchTerm) ||
          phoneMatches ||
          String(lead.line_id || "").toLowerCase().includes(lowerSearchTerm) ||
          String(lead.region || "").toLowerCase().includes(lowerSearchTerm);

        const matchesDate = isInDateRange(lead[dateFieldKey] || lead.created_at_thai, dateRangeFilter);

        const matchesCallStatus =
          callStatusFilter === "all" ||
          (callStatusFilter === "called" && lead.latest_productivity_log) ||
          (callStatusFilter === "not_called" && !lead.latest_productivity_log);

        return (
          matchesStatus &&
          matchesOperationStatus &&
          matchesPlatform &&
          matchesSearch &&
          matchesDate &&
          matchesCallStatus
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a[dateFieldKey] || a.created_at_thai || 0).getTime();
        const dateB = new Date(b[dateFieldKey] || b.created_at_thai || 0).getTime();
        return dateB - dateA;
      });
  }, [
    myLeads,
    statusFilter,
    operationStatusFilter,
    platformFilter,
    callStatusFilter,
    searchTerm,
    dateRangeFilter
  ]);

  // Calculate summary statistics - ส่ง leadIds ที่ filter แล้ว
  const filteredLeadIds = filteredLeadsForSummary.map(lead => lead.id);
  const summaryStats = getFollowupSummary(followupCounts, filteredLeadsForSummary.length, filteredLeadIds);

  const getStatusColor = getLeadStatusColor;

  const handleOperationStatusFilter = (status: string) => {
    setOperationStatusFilter(status);
  };


  if (leadsLoading || userDataLoading || !currentUser) {
    return <PageLoading type="table" />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ลีดของ {salesMember?.name || 'ฉัน'}
          </h1>
          <p className="text-gray-600 mb-1">จัดการลีดที่รับผิดชอบ ({myLeads.length} รายการ)</p>
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
              refetchMyLeads();
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



      {/* Followup Summary */}
      <FollowupSummary {...summaryStats} />

      {/* Operation Status Summary */}
      <OperationStatusSummary 
        leads={filteredLeadsForSummary} 
        onStatusFilter={handleOperationStatusFilter}
      />

      {/* Lead Management Table with Pagination */}
      <LeadManagementTable
        leads={myLeads}
        salesTeam={[salesMember].filter(Boolean)}
        currentSalesMember={salesMember}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        operationStatusFilter={operationStatusFilter}
        setOperationStatusFilter={setOperationStatusFilter}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
        callStatusFilter={callStatusFilter}
        setCallStatusFilter={setCallStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateRangeFilter={dateRangeFilter}
        setDateRangeFilter={setDateRangeFilter}
        onAssignSalesOwner={() => {}}
        onAcceptLead={() => {}}
        isCreatingLead={false}
        isAcceptingLead={false}
        hideActions={false}
        hideTableHeader={false}
        preFiltered={false}
        isMyLeads={true}
        dateField="updated_at_thai"
        currentPage={currentPage}
        totalCount={filteredLeadsForSummary.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default MyLeads;
