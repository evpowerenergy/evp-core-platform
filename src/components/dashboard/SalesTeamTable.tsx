import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Award, DollarSign, TrendingUp, Edit, Star, Trophy, Medal, Crown, Calendar } from "lucide-react";
import { SalesTeamMember } from "@/types/salesTeam";

interface SalesTeamTableProps {
  salesTeam: SalesTeamMember[];
  dateRange: string;
  setDateRange: (value: string) => void;
}

type SortField = 'name' | 'deals_closed' | 'pipeline_value' | 'conversion_rate';
type SortOrder = 'asc' | 'desc';

const SalesTeamTable = ({ salesTeam, dateRange, setDateRange }: SalesTeamTableProps) => {
  const [sortField, setSortField] = useState<SortField>('deals_closed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Memoize sorted and ranked team data
  const sortedTeam = useMemo(() => {
    const sorted = [...salesTeam].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle string comparison for name
      if (sortField === 'name') {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle numeric comparison
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Add rank based on deals_closed (for leaderboard ranking)
    return sorted.map((member, index) => ({
      ...member,
      rank: index + 1
    }));
  }, [salesTeam, sortField, sortOrder]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300';
      default:
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'ใช้งาน';
      case 'inactive':
        return 'ไม่ใช้งาน';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-green-100/50 overflow-hidden">
      <div className="p-8 border-b border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-green-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ทีมขาย & ลีดเดอร์บอร์ด
              </h2>
              <p className="text-gray-600 text-lg mt-1">สมาชิกทีมขายและอันดับผลงาน</p>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">เรียงตาม:</span>
            <Select value={sortField} onValueChange={(value: SortField) => handleSort(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deals_closed">ดีลที่ปิดสำเร็จ</SelectItem>
                <SelectItem value="pipeline_value">ยอดขาย</SelectItem>
                <SelectItem value="conversion_rate">อัตราการปิดการขาย</SelectItem>
                <SelectItem value="name">ชื่อ</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
              {sortOrder === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'}
            </Button>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">ช่วงเวลา:</span>
            </div>
            <div className="relative group">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className={`w-40 bg-white/90 backdrop-blur-sm border-2 shadow-md hover:shadow-lg focus:shadow-xl transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] ${
                  dateRange !== "30" 
                    ? 'border-green-400 shadow-green-100 hover:shadow-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200/50 bg-green-50/50' 
                    : 'border-gray-200/60 hover:border-green-200 focus:border-green-300 focus:ring-2 focus:ring-green-200/50'
                }`}>
                  <Calendar className={`h-4 w-4 mr-2 ${dateRange !== "30" ? 'text-green-600' : 'text-gray-500'}`} />
                  <SelectValue className={dateRange !== "30" ? 'text-green-700 font-medium' : 'text-gray-700'} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem 
                    value="today" 
                    className="hover:bg-green-50 focus:bg-green-50 cursor-pointer data-[highlighted]:bg-green-50 data-[highlighted]:text-gray-900"
                  >
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-gray-900">วันนี้</span>
                    </div>
                  </SelectItem>
                  <SelectItem 
                    value="7" 
                    className="hover:bg-green-50 focus:bg-green-50 cursor-pointer data-[highlighted]:bg-green-50 data-[highlighted]:text-gray-900"
                  >
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span className="text-gray-900">7 วันที่ผ่านมา</span>
                    </div>
                  </SelectItem>
                  <SelectItem 
                    value="30" 
                    className="hover:bg-green-50 focus:bg-green-50 cursor-pointer data-[highlighted]:text-gray-900"
                  >
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      <span className="text-gray-900">30 วันที่ผ่านมา</span>
                    </div>
                  </SelectItem>
                  <SelectItem 
                    value="90" 
                    className="hover:bg-green-50 focus:bg-green-50 cursor-pointer data-[highlighted]:bg-green-50 data-[highlighted]:text-gray-900"
                  >
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      <span className="text-gray-900">90 วันที่ผ่านมา</span>
                    </div>
                  </SelectItem>
                  <SelectItem 
                    value="365" 
                    className="hover:bg-green-50 focus:bg-green-50 cursor-pointer data-[highlighted]:bg-green-50 data-[highlighted]:text-gray-900"
                  >
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      <span className="text-gray-900">1 ปีที่ผ่านมา</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Active Filter Indicator */}
              {dateRange !== "30" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
              )}
              
              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <div className="overflow-hidden">
          <div className="rounded-2xl border border-gray-200/50 overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b-0">
                  <TableHead className="font-bold text-gray-700 py-4 w-16">อันดับ</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4">ชื่อ</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4">สถานะ</TableHead>
                  <TableHead 
                    className="font-bold text-gray-700 hidden lg:table-cell py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('deals_closed')}
                  >
                    <div className="flex items-center gap-1">
                      ดีลที่ปิดสำเร็จ
                      {sortField === 'deals_closed' && (
                        <span className="text-blue-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold text-gray-700 hidden lg:table-cell py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('pipeline_value')}
                  >
                    <div className="flex items-center gap-1">
                      ยอดขาย
                      {sortField === 'pipeline_value' && (
                        <span className="text-blue-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold text-gray-700 hidden xl:table-cell py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('conversion_rate')}
                  >
                    <div className="flex items-center gap-1">
                      อัตราการปิดการขาย
                      {sortField === 'conversion_rate' && (
                        <span className="text-blue-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeam.map((member) => (
                  <TableRow 
                    key={member.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-green-50/30 transition-all duration-200 border-b border-gray-100/50"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center justify-center">
                        <Badge className={`${getRankBadgeColor(member.rank)} font-semibold px-3 py-1`}>
                          {getRankIcon(member.rank)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`${getStatusColor(member.status)} font-semibold`}>
                        {getStatusText(member.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-500" />
                        <span className="font-bold text-green-600 text-lg">{member.deals_closed}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-orange-500" />
                        <span className="font-bold text-orange-600 text-lg">
                          ฿{member.pipeline_value?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        <span className="font-bold text-purple-600 text-lg">
                          {member.conversion_rate}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTeamTable;
