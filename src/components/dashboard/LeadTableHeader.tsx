
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import QuotationSearchDialog from "./QuotationSearchDialog";
import { PLATFORM_OPTIONS } from "@/utils/dashboardUtils";
import { getOperationStatusColor, OPERATION_STATUS_OPTIONS } from "@/utils/leadStatusUtils";

interface LeadTableHeaderProps {
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
  categoryFilter?: string;
  setCategoryFilter?: (value: string) => void;
  ppaFilter?: string; // เพิ่ม prop สำหรับ PPA filter
  setPpaFilter?: (value: string) => void;
  hideStatusFilters?: boolean; // เพิ่ม prop สำหรับซ่อน filter สถานะ
  isMyLeads?: boolean; // เพิ่ม prop เพื่อแสดง call status filter เฉพาะหน้า MyLeads
}

const LeadTableHeader = ({
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
  categoryFilter,
  setCategoryFilter,
  ppaFilter = 'all',
  setPpaFilter = () => {},
  hideStatusFilters = false,
  isMyLeads = false,
}: LeadTableHeaderProps) => {

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">จัดการข้อมูล Lead</h2>
        <p className="text-muted-foreground">เพิ่ม, แก้ไข, และจัดการข้อมูล Lead ของคุณ</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:gap-4 w-full">
        <div className="min-w-[200px] lg:w-72">
          <div className="relative group search-input-enhanced search-glow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-green-600 transition-colors duration-200 z-10" />
            <Input
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-md hover:shadow-lg focus:shadow-xl focus:border-green-300 focus:ring-2 focus:ring-green-200/50 transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] group-hover:border-green-200 search-enhanced-hover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          </div>
        </div>

        {/* Quotation Search Button */}
        <QuotationSearchDialog />
        
        {/* Date Range Picker */}
        <div className="min-w-[140px] lg:w-64 relative">
          <DateRangePicker
            value={dateRangeFilter}
            onChange={setDateRangeFilter}
            placeholder="ช่วงเวลาทั้งหมด"
            presets={true}
          />
        </div>

        <div className="min-w-[140px] lg:w-48">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-md hover:shadow-lg focus:shadow-xl focus:border-green-300 focus:ring-2 focus:ring-green-200/50 transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] group-hover:border-green-200">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="แพลตฟอร์ม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกแพลตฟอร์ม</SelectItem>
              {PLATFORM_OPTIONS.map(platform => (
                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {categoryFilter !== undefined && categoryFilter !== 'all' && (
          <div className="min-w-[140px] lg:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-md hover:shadow-lg focus:shadow-xl focus:border-green-300 focus:ring-2 focus:ring-green-200/50 transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] group-hover:border-green-200">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="ประเภทการขาย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภทการขาย</SelectItem>
                <SelectItem value="Package">Package</SelectItem>
                <SelectItem value="Wholesales">Wholesales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status Filter - ซ่อนได้เมื่อ hideStatusFilters เป็น true */}
        {!hideStatusFilters && (
          <div className="min-w-[140px] lg:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-md hover:shadow-lg focus:shadow-xl focus:border-green-300 focus:ring-2 focus:ring-green-200/50 transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] group-hover:border-green-200">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="ใหม่">ใหม่</SelectItem>
                <SelectItem value="กำลังติดตาม">กำลังติดตาม</SelectItem>
                <SelectItem value="ปิดการขาย">ปิดการขาย</SelectItem>
                <SelectItem value="ไม่สำเร็จ">ไม่สำเร็จ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Operation Status Filter - ซ่อนได้เมื่อ hideStatusFilters เป็น true */}
        {!hideStatusFilters && (
          <div className="min-w-[140px] lg:w-48">
            <Select value={operationStatusFilter} onValueChange={setOperationStatusFilter}>
              <SelectTrigger className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-md hover:shadow-lg focus:shadow-xl focus:border-green-300 focus:ring-2 focus:ring-green-200/50 transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] group-hover:border-green-200">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="สถานะการดำเนินงาน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะการดำเนินงาน</SelectItem>
                {OPERATION_STATUS_OPTIONS.map(status => (
                  <SelectItem 
                    key={status} 
                    value={status}
                    className={`${getOperationStatusColor(status)} hover:opacity-80 transition-opacity`}
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Call Status Filter - แสดงเฉพาะในหน้า MyLeads */}
        {isMyLeads && (
          <div className="min-w-[140px] lg:w-48">
            <Select value={callStatusFilter} onValueChange={setCallStatusFilter}>
              <SelectTrigger className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-md hover:shadow-lg focus:shadow-xl focus:border-green-300 focus:ring-2 focus:ring-green-200/50 transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] group-hover:border-green-200">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="สถานะการโทร" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะการโทร</SelectItem>
                <SelectItem value="called">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    โทรแล้ว
                  </div>
                </SelectItem>
                <SelectItem value="not_called">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    ยังไม่เคยโทร
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* PPA Filter */}
        <div className="min-w-[140px] lg:w-48">
          <Select value={ppaFilter} onValueChange={setPpaFilter}>
            <SelectTrigger className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-md hover:shadow-lg focus:shadow-xl focus:border-green-300 focus:ring-2 focus:ring-green-200/50 transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] group-hover:border-green-200">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="โครงการ PPA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="ppa">PPA เท่านั้น</SelectItem>
              <SelectItem value="non_ppa">ไม่ใช่ PPA</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
};

export default LeadTableHeader;
