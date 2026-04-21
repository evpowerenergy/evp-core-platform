import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Crown, Trophy, Medal, DollarSign, Award, Users, Target, Clock, Sparkles, TrendingUp, BarChart3, FileText } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getSalesDataInPeriod, getQuotationDataFromView } from "@/utils/salesUtils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLoading } from "@/components/ui/loading";

// Helper function to get date range strings (same as Index page)
const getDateRangeStrings = (dateRange: DateRange | undefined) => {
  let startDate: string, endDate: string;
  
  if (dateRange && dateRange.from) {
    const fromDate = dateRange.from;
    const toDate = dateRange.to || dateRange.from;
    
    // ใช้ timezone ที่ถูกต้อง
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const startDateString = formatter.format(fromDate);
    startDate = startDateString + 'T00:00:00.000';
    
    const endDateString = formatter.format(toDate);
    endDate = endDateString + 'T23:59:59.999';
  } else {
    // Default to last 30 days
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 30);
    
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const startDateString = formatter.format(startDateObj);
    startDate = startDateString + 'T00:00:00.000';
    
    const endDateString = formatter.format(endDateObj);
    endDate = endDateString + 'T23:59:59.999';
  }
  
  return { startDate, endDate };
};

/**
 * Sales Ranking Dashboard – Real-time Wallboard
 * หน้าจอเดียวที่มองเห็นทุกอย่าง ไม่มี scroll
 * อัปเดตข้อมูลแบบ real-time ทุก 10 วินาที
 * แสดงเฉพาะ active users เท่านั้น
 */

const SalesTeam: React.FC = () => {
  // Performance monitoring
  const { getMetrics } = usePerformanceMonitor('SalesTeam');

  // State management
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(new Date().setDate(new Date().getDate() - 30)), 
    to: new Date() 
  });
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [newWins, setNewWins] = useState<Set<number>>(new Set());

  // Convert DateRange to string for hook compatibility
  const dateRangeString = useMemo(() => {
    if (!dateRangeFilter?.from) return '30';
    const diffTime = Math.abs(new Date().getTime() - dateRangeFilter.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  }, [dateRangeFilter]);

  // Data hooks
  const { data: salesTeamData, isLoading: salesTeamLoading, error: salesTeamError, refetch } = useSalesTeamData(dateRangeString, dateRangeFilter);
  const { salesTeam = [] } = salesTeamData || {};

  // ✅ ดึงข้อมูล leads จาก Edge Function (เหมือน Index และ Executive Dashboard)
  // เพื่อให้กรอง platform EV + Partner และ has_contact_info = true
  const { data: leadsFromEdgeFunction, isLoading: leadsLoading } = useQuery({
    queryKey: ['all-leads-for-sales-team', dateRangeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      const { startDate, endDate } = getDateRangeStrings(dateRangeFilter);
      
      params.append('from', startDate);
      params.append('to', endDate);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-leads-for-dashboard?${params.toString()}`;
      
      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads for dashboard');
      }
      
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!dateRangeFilter,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Auto-update effect - เพิ่ม interval เป็น 30 วินาที
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      refetch();
      setLastUpdate(new Date());
    }, 30000); // เปลี่ยนจาก 10 วินาที เป็น 30 วินาที

    return () => clearInterval(interval);
  }, [autoUpdate, refetch]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    refetch();
    setLastUpdate(new Date());
  }, [refetch]);

  // Filter only sales team to show only active users
  const activeSalesTeam = useMemo(() => {
    return salesTeam.filter(member => member.status === 'active');
  }, [salesTeam]);

  // Get date range strings for quotation query
  const dateRangeStrings = useMemo(() => {
    if (!dateRangeFilter?.from) {
      const defaultFrom = new Date();
      defaultFrom.setDate(defaultFrom.getDate() - 30);
      return {
        startDate: defaultFrom.toISOString(),
        endDate: new Date().toISOString()
      };
    }
    
    const fromDate = dateRangeFilter.from;
    const toDate = dateRangeFilter.to || dateRangeFilter.from;
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const startDateString = formatter.format(fromDate);
    const endDateString = formatter.format(toDate);
    
    return {
      startDate: startDateString + 'T00:00:00.000',
      endDate: endDateString + 'T23:59:59.999'
    };
  }, [dateRangeFilter]);

  // ✅ Fetch all quotation data for Win Rate (QT) calculation
  // ใช้ custom query เหมือน Index และ Executive Dashboard เพื่อให้ตรงกัน
  // Filter ตาม created_at_thai ของ productivity log (ไม่ใช่ quotation document)
  const { data: allQuotationData } = useQuery({
    queryKey: ['allQuotationData', dateRangeStrings.startDate, dateRangeStrings.endDate],
    queryFn: async () => {
      try {
        // ดึง productivity logs ที่มี QT (ไม่ว่าจะปิดหรือยังไม่ปิด) ในช่วงเวลาที่เลือก
        // ใช้ logic เดียวกับ getSalesDataInPeriod แต่ไม่ filter status
        let logsQuery = supabase
          .from('lead_productivity_logs')
          .select(`
            id, 
            lead_id, 
            created_at_thai,
            sale_id,
            leads!inner(
              id,
              category
            )
          `);

        // Filter ตามช่วงเวลา (ใช้ created_at_thai ของ log เหมือน getSalesDataInPeriod)
        // ต้องตรวจสอบว่า dateRangeStrings มีค่าหรือไม่
        if (dateRangeStrings?.startDate && dateRangeStrings?.endDate) {
          logsQuery = logsQuery
            .gte('created_at_thai', dateRangeStrings.startDate)
            .lte('created_at_thai', dateRangeStrings.endDate);
        }

        const { data: logs, error: logsError } = await logsQuery;

        if (logsError) {
          console.error('Error fetching productivity logs:', logsError);
          throw logsError;
        }

        // ดึง quotation_documents จาก logs เหล่านั้น
        const logIds = logs?.map(log => log.id) || [];
        let quotations: any[] = [];
        
        if (logIds.length > 0) {
          const { data: quotationsData, error: quotationsError } = await supabase
            .from('quotation_documents')
            .select(`
              amount, 
              productivity_log_id, 
              document_number,
              created_at_thai
            `)
            .in('productivity_log_id', logIds)
            .eq('document_type', 'quotation');

          if (quotationsError) {
            console.error('Error fetching quotation_documents:', quotationsError);
            throw quotationsError;
          }

          quotations = quotationsData || [];
        }

        // นับ QT ทั้งหมด (ไม่ซ้ำ) โดยใช้ document_number
        const uniqueQuotations = new Set(
          quotations.map(q => q.document_number?.toLowerCase().replace(/\s+/g, '') || '').filter(Boolean)
        );
        const totalQuotations = uniqueQuotations.size;

        // คำนวณจำนวน QT ตาม category
        const quotationByCategory = new Map<string, number>();
        const categoryQuotationMap = new Map<string, Set<string>>();

        logs?.forEach(log => {
          const category = log.leads?.category || 'ไม่ระบุ';
          const logQuotations = quotations.filter(q => q.productivity_log_id === log.id);
          
          if (!categoryQuotationMap.has(category)) {
            categoryQuotationMap.set(category, new Set());
          }
          
          logQuotations.forEach(q => {
            const normalizedDoc = q.document_number?.toLowerCase().replace(/\s+/g, '') || '';
            if (normalizedDoc) {
              categoryQuotationMap.get(category)!.add(normalizedDoc);
            }
          });
        });

        categoryQuotationMap.forEach((quotationSet, category) => {
          quotationByCategory.set(category, quotationSet.size);
        });
        
        // สร้าง quotationLeads สำหรับ Win Rate (QT) รายบุคคล
        // ต้องดึงข้อมูล sale_id จาก productivity logs เพื่อ map กับ member
        const quotationLeads: any[] = [];
        logs?.forEach(log => {
          const logQuotations = quotations.filter(q => q.productivity_log_id === log.id);
          const uniqueQuotationNumbers = new Set(
            logQuotations.map(q => q.document_number?.toLowerCase().replace(/\s+/g, '') || '').filter(Boolean)
          );
          
          if (uniqueQuotationNumbers.size > 0 && log.sale_id) {
            // ใช้ sale_id จาก log ที่ดึงมาแล้ว (ไม่ต้อง query เพิ่ม)
            quotationLeads.push({
              leadId: log.lead_id,
              saleId: log.sale_id,
              logId: log.id,
              quotationCount: uniqueQuotationNumbers.size,
              category: log.leads?.category || 'ไม่ระบุ'
            });
          }
        });
        
        return {
          quotationCount: totalQuotations, // ใช้ quotationCount เพื่อให้ตรงกับหน้าอื่นๆ
          totalQuotations, // เก็บไว้สำหรับ backward compatibility
          quotationByCategory,
          quotationLeads
        };
      } catch (error) {
        console.error('Error fetching all quotation data:', error);
        return {
          quotationCount: 0,
          totalQuotations: 0,
          quotationByCategory: new Map(),
          quotationLeads: []
        };
      }
    },
    enabled: !!dateRangeStrings.startDate && !!dateRangeStrings.endDate
  });

  // ✅ ดึงข้อมูล salesData เพื่อนับจำนวนลีดที่ปิดการขายจริงๆ (ไม่ใช่ QT)
  // เพื่อให้ตรงกับ Index และ Executive Dashboard
  const { data: salesData } = useQuery({
    queryKey: ['salesDataForConversionRate', dateRangeStrings.startDate, dateRangeStrings.endDate],
    queryFn: async () => {
      return await getSalesDataInPeriod(
        dateRangeStrings.startDate,
        dateRangeStrings.endDate,
        undefined
      );
    },
    enabled: !!dateRangeStrings.startDate && !!dateRangeStrings.endDate
  });

  // Calculate KPIs from active sales team
  const kpis = useMemo(() => {
    const totalMembers = activeSalesTeam.length;
    const activeMembers = activeSalesTeam.length; // All are active by default
    const totalDeals = activeSalesTeam.reduce((sum, member) => sum + (member.deals_closed || 0), 0);
    const totalRevenue = activeSalesTeam.reduce((sum, member) => sum + (member.pipeline_value || 0), 0);
    
    // ✅ ใช้ leads จาก Edge Function (core-leads-leads-for-dashboard) เพื่อให้ตรงกับ Index และ Executive Dashboard
    // Edge Function นี้กรอง has_contact_info = true และ platform EV + Partner แล้ว
    const leads = leadsFromEdgeFunction || [];
    const totalLeads = leads.length;
    
    // ✅ คำนวณ Conversion Rate (Lead): ลีดที่ปิด / ลีดทั้งหมด
    // ใช้จำนวนลีดที่ปิดการขายจริงๆ (ไม่ใช่ QT) จาก salesData.salesLeads
    // เพื่อให้ตรงกับ Index และ Executive Dashboard
    const uniqueClosedLeadIds = new Set(
      (salesData?.salesLeads || []).map((lead: any) => lead.leadId)
    );
    const closedLeadsCount = uniqueClosedLeadIds.size;
    
    const conversionRate = totalLeads > 0 
      ? (closedLeadsCount / totalLeads) * 100 
      : 0;

    // ✅ คำนวณ Win Rate (QT): QT ที่ปิด / QT ทั้งหมด
    // ใช้ salesData.salesCount สำหรับ QT ที่ปิด
    const totalQuotations = allQuotationData?.quotationCount || allQuotationData?.totalQuotations || 0;
    const closedQuotationsCount = salesData?.salesCount || 0;
    const winRateQt = totalQuotations > 0 
      ? (closedQuotationsCount / totalQuotations) * 100 
      : 0;

    return {
      totalMembers,
      activeMembers,
      totalDeals,
      totalRevenue,
      totalLeads,
      totalQuotations,
      conversionRate,
      winRateQt
    };
  }, [activeSalesTeam, salesTeamData, allQuotationData, leadsFromEdgeFunction, salesData]);

  // Calculate Win Rate (QT) for each member
  const rankedTeam = useMemo(() => {
    // Map to store total quotations per member
    const memberQuotationCounts = new Map<number, number>();
    
    // Count total quotations per member from allQuotationData
    // ใช้ quotationLeads ที่มี saleId เพื่อ map กับ member
    if (allQuotationData?.quotationLeads && Array.isArray(allQuotationData.quotationLeads)) {
      allQuotationData.quotationLeads.forEach((lead: any) => {
        const saleId = lead.saleId;
        if (saleId) {
          const currentCount = memberQuotationCounts.get(saleId) || 0;
          memberQuotationCounts.set(saleId, currentCount + (lead.quotationCount || 0));
        }
      });
    }

    return [...activeSalesTeam]
      .map(member => {
        const totalQuotations = memberQuotationCounts.get(member.id) || 0;
        const dealsClosed = member.deals_closed || 0;
        const winRateQt = totalQuotations > 0 ? (dealsClosed / totalQuotations) * 100 : 0;
        
        return {
          ...member,
          total_quotations: totalQuotations,
          win_rate_qt: winRateQt
        };
      })
      .sort((a, b) => {
        // Primary: Revenue (desc)
        if (b.pipeline_value !== a.pipeline_value) {
          return (b.pipeline_value || 0) - (a.pipeline_value || 0);
        }
        // Secondary: Conversion Rate (desc)
        if (b.conversion_rate !== a.conversion_rate) {
          return (b.conversion_rate || 0) - (a.conversion_rate || 0);
        }
        // Tertiary: Deals closed (desc)
        if (b.deals_closed !== a.deals_closed) {
          return (b.deals_closed || 0) - (a.deals_closed || 0);
        }
        // Quaternary: Latest activity (desc)
        return 0; // Placeholder for activity timestamp
      })
      .map((member, index) => ({
        ...member,
        rank: index + 1
      }));
  }, [activeSalesTeam, allQuotationData]);

  // Reset filters
  const handleReset = () => {
    setDateRangeFilter({ 
      from: new Date(new Date().setDate(new Date().getDate() - 30)), 
      to: new Date() 
    });
  };

  // Get rank icon with enhanced styling
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: 
        return (
          <div className="relative">
            <Crown className="h-6 w-6 text-yellow-500 drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        );
      case 2: 
        return (
          <div className="relative">
            <Trophy className="h-6 w-6 text-gray-400 drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        );
      case 3: 
        return (
          <div className="relative">
            <Medal className="h-6 w-6 text-amber-600 drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
        );
      default: 
        return (
          <div className="relative">
            <span className="text-lg font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              #{rank}
            </span>
          </div>
        );
    }
  };

  if (salesTeamLoading) {
    return <PageLoading type="dashboard" />;
  }

  if (salesTeamError) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-4">ไม่สามารถโหลดข้อมูลทีมขายได้</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              ลองใหม่
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Debug: ตรวจสอบข้อมูล
  console.log('SalesTeam Debug:', {
    salesTeamData,
    salesTeam,
    activeSalesTeam: activeSalesTeam.length,
    isLoading: salesTeamLoading,
    error: salesTeamError
  });

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Top Bar - Reduced height and margin */}
        <div className="h-16 bg-gradient-to-r from-white via-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100/50 flex items-center justify-between px-6 mb-4 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full -mr-12 -mt-12"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Sales Ranking Dashboard
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Real-time Wallboard
                  </Badge>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 border border-blue-100">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {lastUpdate.toLocaleTimeString('th-TH')}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
        </div>

        {/* KPI Cards - Reduced height and margin */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl shadow-lg border-0 p-4 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <p className="text-blue-100 text-xs font-medium mb-1">สมาชิกทีม</p>
              <p className="text-2xl font-bold text-white mb-1">{kpis.totalMembers}</p>
              <p className="text-blue-200 text-xs">ใช้งาน: {kpis.activeMembers} คน</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent rounded-full -mr-8 -mb-8"></div>
          </div>

          <div className="h-20 bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 rounded-xl shadow-lg border-0 p-4 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <p className="text-cyan-100 text-xs font-medium mb-1">จำนวนลีดทั้งหมด</p>
              <p className="text-2xl font-bold text-white mb-1">{kpis.totalLeads.toLocaleString()}</p>
              <p className="text-cyan-200 text-xs">ในช่วงเวลาที่เลือก</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent rounded-full -mr-8 -mb-8"></div>
          </div>

          <div className="h-20 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-xl shadow-lg border-0 p-4 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <p className="text-green-100 text-xs font-medium mb-1">ดีลที่ปิดสำเร็จ</p>
              <p className="text-2xl font-bold text-white mb-1">{kpis.totalDeals}</p>
              <p className="text-green-200 text-xs">เดือนนี้</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent rounded-full -mr-8 -mb-8"></div>
          </div>

          <div className="h-20 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-xl shadow-lg border-0 p-4 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <p className="text-orange-100 text-xs font-medium mb-1">ยอดขายรวม</p>
              <p className="text-2xl font-bold text-white mb-1">฿{kpis.totalRevenue.toLocaleString()}</p>
              <p className="text-orange-200 text-xs">มูลค่ารวม</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent rounded-full -mr-8 -mb-8"></div>
          </div>

          <div className="h-20 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 rounded-xl shadow-lg border-0 p-4 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <p className="text-purple-100 text-xs font-medium mb-1">Conversion Rate (Lead)</p>
              <p className="text-2xl font-bold text-white mb-1">{kpis.conversionRate.toFixed(1)}%</p>
              <p className="text-purple-200 text-xs">ลีดที่ปิด / ลีดทั้งหมด</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent rounded-full -mr-8 -mb-8"></div>
          </div>

          <div className="h-20 bg-gradient-to-br from-pink-500 via-rose-600 to-red-600 rounded-xl shadow-lg border-0 p-4 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <p className="text-pink-100 text-xs font-medium mb-1">Win Rate (QT)</p>
              <p className="text-2xl font-bold text-white mb-1">
                {kpis.winRateQt && !isNaN(kpis.winRateQt) ? kpis.winRateQt.toFixed(1) : '0.0'}%
              </p>
              <p className="text-pink-200 text-xs">QT ที่ปิด / QT ทั้งหมด</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent rounded-full -mr-8 -mb-8"></div>
          </div>
        </div>

        {/* Filter Bar - Reduced height and margin */}
        <div className="h-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100/50 px-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">ช่วงเวลา:</span>
              <DateRangePicker
                value={dateRangeFilter}
                onChange={setDateRangeFilter}
                placeholder="เลือกช่วงเวลา"
                presets={true}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-4 bg-white/80 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 transition-all duration-200" 
              onClick={handleReset}
            >
              Reset
            </Button>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 border border-blue-100">
              <Switch
                checked={autoUpdate}
                onCheckedChange={setAutoUpdate}
              />
              <span className="text-sm font-medium text-gray-700">Auto-Update</span>
              {autoUpdate && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Ranking Table - Optimized for full screen display */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100/50 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                <tr className="border-b border-blue-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16">อันดับ</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">รายชื่อ</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">ดีลที่ปิดสำเร็จ</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-36">ยอดขาย (฿)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-48">Conversion Rate (Lead)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-48">Win Rate (QT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {rankedTeam.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-gray-400" />
                        <p>ไม่มีข้อมูลทีมขาย</p>
                        <p className="text-sm">กรุณาตรวจสอบการเชื่อมต่อหรือลองใหม่</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rankedTeam.map((member, index) => (
                  <tr 
                    key={member.id} 
                    className={`transition-all duration-200 border-b border-blue-50/50 group ${
                      member.rank === 1 ? 'bg-gradient-to-r from-yellow-50/40 via-amber-50/30 to-orange-50/40' :
                      member.rank === 2 ? 'bg-gradient-to-r from-slate-50/40 via-gray-50/30 to-zinc-50/40' :
                      member.rank === 3 ? 'bg-gradient-to-r from-amber-50/40 via-yellow-50/30 to-orange-50/40' :
                      member.rank === 4 ? 'bg-gradient-to-r from-blue-50/40 via-indigo-50/30 to-purple-50/40' :
                      member.rank === 5 ? 'bg-gradient-to-r from-emerald-50/40 via-green-50/30 to-teal-50/40' :
                      member.rank === 6 ? 'bg-gradient-to-r from-violet-50/40 via-purple-50/30 to-indigo-50/40' :
                      member.rank === 7 ? 'bg-gradient-to-r from-rose-50/40 via-pink-50/30 to-red-50/40' :
                      member.rank === 8 ? 'bg-gradient-to-r from-sky-50/40 via-cyan-50/30 to-blue-50/50' :
                      member.rank === 9 ? 'bg-gradient-to-r from-lime-50/40 via-green-50/30 to-emerald-50/40' :
                      member.rank === 10 ? 'bg-gradient-to-r from-red-50/40 via-orange-50/30 to-pink-50/40' :
                      index % 2 === 0 ? 'bg-gradient-to-r from-slate-50/30 via-gray-50/20 to-zinc-50/30' :
                      'bg-gradient-to-r from-stone-50/30 via-neutral-50/20 to-gray-50/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {getRankIcon(member.rank)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                          {(() => {
                            // Show different icons based on rank
                            if (member.rank === 1) {
                              return <Crown className="h-4 w-4 text-yellow-300" />;
                            } else if (member.rank === 2) {
                              return <Trophy className="h-4 w-4 text-gray-200" />;
                            } else if (member.rank === 3) {
                              return <Medal className="h-4 w-4 text-amber-300" />;
                            } else if (member.rank <= 5) {
                              return <Award className="h-4 w-4 text-blue-200" />;
                            } else if (member.rank <= 10) {
                              return <Target className="h-4 w-4 text-green-200" />;
                            } else {
                              // For other ranks, show performance-based icons
                              const conversionRate = member.conversion_rate || 0;
                              if (conversionRate >= 80) {
                                return <Sparkles className="h-4 w-4 text-purple-200" />;
                              } else if (conversionRate >= 60) {
                                return <TrendingUp className="h-4 w-4 text-orange-200" />;
                              } else if (conversionRate >= 40) {
                                return <BarChart3 className="h-4 w-4 text-indigo-200" />;
                              } else {
                                return <Users className="h-4 w-4 text-gray-200" />;
                              }
                            }
                          })()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-base">{member.name}</div>
                          {newWins.has(member.id) && (
                            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 text-xs animate-pulse">
                              🎉 New win!
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{member.deals_closed || 0}</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        ฿{(member.pipeline_value || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out shadow-lg"
                              style={{ width: `${Math.min((member.conversion_rate || 0), 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-700 min-w-[2.5rem]">
                            {(member.conversion_rate || 0).toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Lead</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-pink-500 to-rose-600 h-2 rounded-full transition-all duration-500 ease-out shadow-lg"
                              style={{ width: `${Math.min((member.win_rate_qt || 0), 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-700 min-w-[2.5rem]">
                            {member.win_rate_qt && !isNaN(member.win_rate_qt) 
                              ? member.win_rate_qt.toFixed(1) 
                              : '0.0'}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">QT</span>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend/Notes - Reduced height and margin */}
        <div className="h-8 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-blue-100/50 px-4 mt-4 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3 text-yellow-500" />
                <span className="font-medium">1st Place</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-gray-400" />
                <span className="font-medium">2nd Place</span>
              </div>
              <div className="flex items-center gap-1">
                <Medal className="h-3 w-3 text-amber-600" />
                <span className="font-medium">3rd Place</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">Real-time Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTeam;
