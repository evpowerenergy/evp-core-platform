import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { filterLeads } from "@/utils/dashboardUtils";
import { isInDateRange } from "@/utils/dateFilterUtils";
import { normalizePhoneNumber } from "@/utils/leadValidation";
import LeadTableHeader from "./LeadTableHeader";
import LeadTableRow from "./LeadTableRow";
import Pagination from "@/components/ui/pagination";
import { DateRange } from "react-day-picker";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface LeadManagementTableProps {
  leads: any[];
  salesTeam: any[];
  currentSalesMember: any;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  operationStatusFilter: string;
  setOperationStatusFilter: (value: string) => void;
  platformFilter: string;
  setPlatformFilter: (value: string) => void;
  callStatusFilter?: string;
  setCallStatusFilter?: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  dateRangeFilter: DateRange | undefined;
  setDateRangeFilter: (value: DateRange | undefined) => void;
  onAssignSalesOwner: (leadId: number, salesOwnerId: number) => void;
  onAcceptLead: (leadId: number) => void;
  onTransferLead?: (leadId: number, newCategory: string) => void; // เพิ่ม prop สำหรับโอนลีด
  onEditLead?: (leadId: number) => void; // เพิ่ม prop สำหรับแก้ไขลีด
  onDeleteLead?: (leadId: number) => void; // เพิ่ม prop สำหรับลบลีด
  isCreatingLead: boolean;
  isAcceptingLead: boolean;
  isTransferringLead?: boolean; // เพิ่ม prop สำหรับ loading state
  hideActions?: boolean;
  hideTableHeader?: boolean;
  hideStatusFilters?: boolean; // เพิ่ม prop สำหรับซ่อน filter สถานะ
  preFiltered?: boolean; // เพิ่ม prop นี้เพื่อบอกว่าข้อมูลถูก filter แล้ว
  isMyLeads?: boolean; // เพิ่ม prop สำหรับควบคุมการแสดงปุ่มในหน้าลีดของฉัน
  showAcceptLeadColumn?: boolean; // เพิ่ม prop สำหรับควบคุมการแสดงคอลัมน์รับ Lead
  showAssignColumn?: boolean; // เพิ่ม prop สำหรับควบคุมการแสดงคอลัมน์มอบหมายให้
  showActionsColumn?: boolean; // เพิ่ม prop สำหรับควบคุมการแสดงคอลัมน์จัดการ
  categoryFilter?: string; // เพิ่มกลับมาเพื่อรองรับ AllLeadsReport
  setCategoryFilter?: (value: string) => void; // เพิ่มกลับมาเพื่อรองรับ AllLeadsReport
  ppaFilter?: string; // เพิ่ม prop สำหรับ PPA filter
  setPpaFilter?: (value: string) => void; // เพิ่ม prop สำหรับ set PPA filter
  creatorNames?: { [key: string]: string }; // เพิ่ม prop สำหรับชื่อผู้ที่เพิ่มลีด
  dateField?: 'created_at_thai' | 'updated_at_thai'; // เพิ่ม prop สำหรับระบุ field ที่ใช้ในการกรองวันที่
  // Pagination props
  currentPage?: number;
  totalCount?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

const LeadManagementTable = ({
  leads,
  salesTeam,
  currentSalesMember,
  statusFilter,
  setStatusFilter,
  operationStatusFilter,
  setOperationStatusFilter,
  platformFilter,
  setPlatformFilter,
  callStatusFilter = 'all',
  setCallStatusFilter = () => {},
  searchTerm,
  setSearchTerm,
  dateRangeFilter,
  setDateRangeFilter,
  onAssignSalesOwner,
  onAcceptLead,
  onTransferLead,
  onEditLead,
  onDeleteLead,
  isCreatingLead,
  isAcceptingLead,
  isTransferringLead = false,
  hideActions = false,
  hideTableHeader = false,
  hideStatusFilters = false, // เพิ่ม default
  preFiltered = false, // เพิ่ม default
  isMyLeads = false, // เพิ่ม default
  showAcceptLeadColumn = true, // เพิ่ม default
  showAssignColumn = true, // เพิ่ม default
  showActionsColumn = true, // เพิ่ม default
  categoryFilter = 'all', // เพิ่มกลับมาเพื่อรองรับ AllLeadsReport
  setCategoryFilter = () => {}, // เพิ่มกลับมาเพื่อรองรับ AllLeadsReport
  ppaFilter = 'all', // เพิ่ม default
  setPpaFilter = () => {}, // เพิ่ม default
  creatorNames = {}, // เพิ่ม default
  dateField = 'created_at_thai', // เพิ่ม default
  // Pagination props with defaults
  currentPage = 1,
  totalCount = 0,
  itemsPerPage = 10,
  onPageChange = () => {},
  loading = false,
}: LeadManagementTableProps) => {
  // Sort state for in/out time (วันที่บันทึก / อัพเดทล่าสุด) column
  const [sortDateOrder, setSortDateOrder] = useState<'asc' | 'desc' | null>(null);

  // Use refs to track filter changes and avoid infinite loops
  const prevFiltersRef = useRef({
    statusFilter,
    operationStatusFilter,
    platformFilter,
    categoryFilter,
    callStatusFilter,
    searchTerm,
    dateRangeFilter
  });

  const handleSortDateClick = () => {
    setSortDateOrder(prev => {
      if (prev === null) return 'desc';
      if (prev === 'desc') return 'asc';
      return null;
    });
  };

  // Use utility function for date filtering
  const checkDateRange = (createdAt: string) => {
    return isInDateRange(createdAt, dateRangeFilter);
  };

  // Reset to first page when filters change (but not when currentPage changes)
  useEffect(() => {
    // Check if any filter actually changed
    const currentFilters = {
      statusFilter,
      operationStatusFilter,
      platformFilter,
      categoryFilter,
      callStatusFilter,
      searchTerm,
      dateRangeFilter
    };
    
    const prevFilters = prevFiltersRef.current;
    const hasFilterChanged = JSON.stringify(currentFilters) !== JSON.stringify(prevFilters);
    
         // Only reset page when filters actually changed
     if (hasFilterChanged && currentPage > 1) {
       onPageChange(1);
       // Update ref with current filters
       prevFiltersRef.current = currentFilters;
     }
  }, [statusFilter, operationStatusFilter, platformFilter, categoryFilter, callStatusFilter, searchTerm, dateRangeFilter, currentPage, onPageChange]);

  // Filter leads - ข้ามการ filter ถ้าข้อมูลถูก filter แล้ว
  const filteredLeads = useMemo(() => {
    // Normalize search term if it's a phone number (starts with digit)
    const isPhoneSearch = /^\d/.test(searchTerm);
    const normalizedSearchTerm = isPhoneSearch 
      ? normalizePhoneNumber(searchTerm) 
      : searchTerm.toLowerCase();

    if (preFiltered) {
      // เมื่อ preFiltered เป็น true ข้อมูลถูก filter ใน backend แล้ว
      // กรองเฉพาะ searchTerm และ callStatusFilter ใน frontend
      const filtered = leads.filter(lead => {
        // For phone searches, normalize both the search term and the phone number in the database
        const phoneMatches = lead.tel && isPhoneSearch
          ? normalizePhoneNumber(lead.tel).includes(normalizedSearchTerm)
          : lead.tel?.includes(searchTerm);
        
        const matchesSearch = searchTerm === "" || 
          lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phoneMatches ||
          lead.line_id?.includes(searchTerm) ||
          lead.region?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Call status filter
        const matchesCallStatus = callStatusFilter === "all" || 
          (callStatusFilter === "called" && lead.latest_productivity_log) ||
          (callStatusFilter === "not_called" && !lead.latest_productivity_log);
        
        // PPA filter (even when preFiltered, we can filter PPA on frontend)
        const matchesPpa = ppaFilter === "all" || 
          (ppaFilter === "ppa" && lead.is_from_ppa_project === true) ||
          (ppaFilter === "non_ppa" && (lead.is_from_ppa_project === false || !lead.is_from_ppa_project));
        
        return matchesSearch && matchesCallStatus && matchesPpa;
      });
      
      // Sort by updated_at_thai (latest first) for MyLeads pages
      if (isMyLeads) {
        filtered.sort((a, b) => {
          const dateA = new Date(a[dateField] || a.created_at_thai || 0);
          const dateB = new Date(b[dateField] || b.created_at_thai || 0);
          return dateB.getTime() - dateA.getTime();
        });
      }
      
      return filtered;
    } else {
      // เมื่อ preFiltered เป็น false ให้ filter ตามปกติ รวมถึง category
      const filtered = leads.filter(lead => {
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        const matchesOperationStatus = operationStatusFilter === "all" || lead.operation_status === operationStatusFilter;
        const matchesPlatform = platformFilter === "all" || lead.platform === platformFilter;
        const matchesCategory = categoryFilter === "all" || lead.category === categoryFilter;
        
        // PPA filter
        const matchesPpa = ppaFilter === "all" || 
          (ppaFilter === "ppa" && lead.is_from_ppa_project === true) ||
          (ppaFilter === "non_ppa" && (lead.is_from_ppa_project === false || !lead.is_from_ppa_project));
        
        // For phone searches, normalize both the search term and the phone number in the database
        const phoneMatches = lead.tel && isPhoneSearch
          ? normalizePhoneNumber(lead.tel).includes(normalizedSearchTerm)
          : lead.tel?.includes(searchTerm);
        
        const matchesSearch = searchTerm === "" || 
          lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phoneMatches ||
          lead.line_id?.includes(searchTerm) ||
          lead.region?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = checkDateRange(lead[dateField]);
        
        // Call status filter
        const matchesCallStatus = callStatusFilter === "all" || 
          (callStatusFilter === "called" && lead.latest_productivity_log) ||
          (callStatusFilter === "not_called" && !lead.latest_productivity_log);
        
        return matchesStatus && matchesOperationStatus && matchesPlatform && matchesCategory && matchesPpa && matchesSearch && matchesDate && matchesCallStatus;
      });
      
              // Sort by updated_at_thai (latest first) for MyLeads pages
        if (isMyLeads) {
          filtered.sort((a, b) => {
            const dateA = new Date(a[dateField] || a.created_at_thai || 0);
            const dateB = new Date(b[dateField] || b.created_at_thai || 0);
            return dateB.getTime() - dateA.getTime();
          });
        }
      
      return filtered;
    }
  }, [leads, statusFilter, operationStatusFilter, platformFilter, categoryFilter, ppaFilter, callStatusFilter, searchTerm, dateRangeFilter, preFiltered, isMyLeads, dateField]);

  // Apply sort by date (in/out time) when sortDateOrder is set
  const sortedLeads = useMemo(() => {
    if (!sortDateOrder) return filteredLeads;
    const sorted = [...filteredLeads];
    const field = dateField;
    sorted.sort((a, b) => {
      const dateA = new Date(a[field] || a.created_at_thai || 0).getTime();
      const dateB = new Date(b[field] || b.created_at_thai || 0).getTime();
      return sortDateOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  }, [filteredLeads, sortDateOrder, dateField]);

  // Calculate total pages for pagination - use filtered count when filters are applied
  const hasActiveFilters = statusFilter !== "all" || operationStatusFilter !== "all" || platformFilter !== "all" || callStatusFilter !== "all" || searchTerm !== "" || dateRangeFilter !== undefined;
  const effectiveTotalCount = preFiltered
    ? sortedLeads.length
    : hasActiveFilters
      ? sortedLeads.length
      : totalCount || sortedLeads.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / itemsPerPage));



  // Get paginated data for current page
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedLeads.slice(startIndex, endIndex);
  }, [sortedLeads, currentPage, itemsPerPage]);

  const getSalesMemberName = (salesOwnerId: number) => {
    // Check if salesTeam is still loading or empty
    if (!salesTeam || salesTeam.length === 0) {
      return 'กำลังโหลด...';
    }
    
    const member = salesTeam.find(m => m.id === salesOwnerId);
    return member ? member.name : 'ไม่ระบุ';
  };

  // Check if sales team data is still loading
  const isSalesTeamLoading = !salesTeam || salesTeam.length === 0;

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  return (
    <>
      {!hideTableHeader && (
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <LeadTableHeader
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
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              ppaFilter={ppaFilter}
              setPpaFilter={setPpaFilter}
              hideStatusFilters={hideStatusFilters}
              isMyLeads={isMyLeads}
            />
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold w-20 min-w-20 max-w-20 text-center">แพลตฟอร์ม</TableHead>
              <TableHead className="font-semibold w-40 min-w-40 text-center">ชื่อลูกค้า</TableHead>
              <TableHead className="font-semibold w-32 min-w-32 text-center">ประเภทขาย</TableHead>
              <TableHead className="font-semibold text-center">ค่าไฟ</TableHead>
              <TableHead className="font-semibold text-center">เบอร์/Line ID</TableHead>
              <TableHead className="font-semibold text-center">จังหวัด</TableHead>
              <TableHead className="font-semibold text-center">รายละเอียดเพิ่มเติม</TableHead>
              <TableHead className="font-semibold text-center">รายละเอียดการติดตาม</TableHead>
              <TableHead className="font-semibold text-center">สถานะ</TableHead>
              {isMyLeads && <TableHead className="font-semibold text-center">การโทร</TableHead>}
              <TableHead className="font-semibold text-center">ผู้ที่เพิ่มลีด</TableHead>
              <TableHead className="font-semibold text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -mx-2 font-semibold"
                  onClick={handleSortDateClick}
                >
                  {isMyLeads ? 'อัพเดทล่าสุด' : 'วันที่บันทึก'}
                  {sortDateOrder === 'asc' && <ArrowUp className="ml-1 h-4 w-4" />}
                  {sortDateOrder === 'desc' && <ArrowDown className="ml-1 h-4 w-4" />}
                  {sortDateOrder === null && <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />}
                </Button>
              </TableHead>
              {!hideActions && showAcceptLeadColumn && !isMyLeads && <TableHead className="font-semibold text-center">รับ Lead</TableHead>}
              {!hideActions && showAssignColumn && <TableHead className="font-semibold text-center">มอบหมายให้</TableHead>}
              {!hideActions && showActionsColumn && <TableHead className="font-semibold text-center">จัดการ</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading state
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </TableCell>
                  {isMyLeads && (
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </TableCell>
                  )}
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  {!hideActions && showAcceptLeadColumn && !isMyLeads && (
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </TableCell>
                  )}
                  {!hideActions && showAssignColumn && (
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </TableCell>
                  )}
                  {!hideActions && showActionsColumn && (
                    <TableCell className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              // Actual data - use paginated leads
              paginatedLeads.map((lead) => (
                <LeadTableRow
                  key={lead.id}
                  lead={lead}
                  currentSalesMember={currentSalesMember}
                  getSalesMemberName={getSalesMemberName}
                  onAcceptLead={onAcceptLead}
                  onTransferLead={onTransferLead}
                  onEditLead={onEditLead}
                  onDeleteLead={onDeleteLead}
                  isAcceptingLead={isAcceptingLead}
                  isTransferringLead={isTransferringLead}
                  hideActions={hideActions}
                  showRegion={true}
                  isMyLeads={isMyLeads}
                  showAcceptLeadColumn={showAcceptLeadColumn}
                  showAssignColumn={showAssignColumn}
                  showActionsColumn={showActionsColumn}
                  creatorNames={creatorNames}
                />
              ))
            )}
          </TableBody>
        </Table>
        {!loading && sortedLeads.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ไม่พบข้อมูลลีดที่ตรงกับการค้นหา
          </div>
        )}
        {!loading && sortedLeads.length > 0 && paginatedLeads.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ไม่พบข้อมูลลีดในหน้านี้ กรุณาลองเปลี่ยนหน้าหรือปรับ itemsPerPage
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {effectiveTotalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={effectiveTotalCount}
          showItemsPerPage={false}
          itemsPerPageOptions={[10, 20, 50, 100]}
        />
      )}
    </>
  );
};

export default LeadManagementTable;