
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCacheStrategy } from '@/lib/cacheStrategies';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import LeadManagementTable from '@/components/dashboard/LeadManagementTable';
import SaleChanceChart from '@/components/dashboard/SaleChanceChart';
import PlatformStats from "@/components/dashboard/PlatformStats";
import { useSaleChanceStats } from '@/hooks/useSaleChanceStats';
import { useSalesTeamData } from '@/hooks/useAppDataAPI';
import { PageLoading } from "@/components/ui/loading";

import { Download, Filter, BarChart3, Users, Calendar, RefreshCw, Search, Phone } from "lucide-react";
import { isInDateRange } from '@/utils/dateFilterUtils';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getOperationStatusColor } from "@/utils/leadStatusUtils";
import { PLATFORM_OPTIONS } from "@/utils/dashboardUtils";
import { normalizePhoneNumber } from "@/utils/leadValidation";

const AllLeadsReport = () => {
  // State for table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [operationStatusFilter, setOperationStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  // ✅ Default date range: วันนี้ ถึง วันนี้
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>({ 
    from: new Date(), // วันนี้
    to: new Date() // วันนี้
  });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all'); // เพิ่ม filter สำหรับผู้ที่เพิ่มลีด
  
  // Loading states
  const [tableLoading, setTableLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [tableLeads, setTableLeads] = useState([]);
  const [chartLeads, setChartLeads] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  // const [creators, setCreators] = useState([]); // ลบออกเพราะใช้ React Query แทน
  
  // Hooks
  const { saleChanceData, loading: saleChanceLoading, error: chartError, refetch: refetchChart } = useSaleChanceStats({
    creatorFilter
  });
  const { data: salesTeamData } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};

  // ✅ แก้ไข N+1 Queries: ใช้ React Query สำหรับ creators
  const reportsCacheStrategy = useCacheStrategy('REPORTS');
  const { data: creatorsData } = useQuery({
    queryKey: ['creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .order('first_name');
      
      if (error) {
        console.error('Error fetching creators:', error);
        throw error;
      }
      
      return data || [];
    },
    ...reportsCacheStrategy, // ✅ ใช้ REPORTS cache strategy
  });

  const creators = creatorsData || [];

  // Helper function to get creator name from created_by
  const getCreatorName = (createdBy: string | null) => {
    if (!createdBy) return 'ไม่ระบุ';
    
    const creator = creators.find(c => c.id === createdBy);
    if (creator) {
      const fullName = [creator.first_name, creator.last_name].filter(Boolean).join(' ');
      return fullName || creator.email || 'ไม่ระบุ';
    }
    
    return createdBy; // Return the ID if not found
  };

  // Create creatorNames mapping for table display
  const creatorNames = useMemo(() => {
    const mapping: { [key: string]: string } = {};
    creators.forEach(creator => {
      if (creator.id) {
        const fullName = [creator.first_name, creator.last_name].filter(Boolean).join(' ');
        mapping[creator.id] = fullName || creator.email || creator.id;
      }
    });
    
    return mapping;
  }, [creators]);

  // ✅ Handle delete lead using Edge Function
  const handleDeleteLead = async (leadId: number) => {
    if (window.confirm('คุณต้องการลบลีดนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
      try {
        // Get JWT token from Supabase session for Edge Function
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Call Supabase Edge Function
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-lead-mutations`;
        
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete_lead',
            leadId: leadId
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete lead');
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete lead');
        }

        alert('ลบลีดสำเร็จ');
        // รีเฟรชข้อมูล
        fetchTableLeads(currentPage);
        fetchChartLeads();
      } catch (error: any) {
        console.error('Error deleting lead:', error);
        alert('เกิดข้อผิดพลาดในการลบลีด: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Handle edit lead
  const handleEditLead = (leadId: number) => {
    // นำทางไปยังหน้า LeadDetail ที่มีฟังก์ชันแก้ไขลีดในตัว
    window.location.href = `/leads/${leadId}`;
  };

  // ✅ Fetch table data using Edge Function (all filtered data, paginated in frontend)
  const fetchTableLeads = async (page: number) => {
    setTableLoading(true);
    try {
      // Get JWT token from Supabase session for Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('type', 'table');
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (operationStatusFilter !== 'all') {
        params.append('operation_status', operationStatusFilter);
      }
      
      if (platformFilter !== 'all') {
        params.append('platform', platformFilter);
      }
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      if (creatorFilter !== 'all') {
        params.append('creator', creatorFilter);
      }
      
      if (searchTerm !== '') {
        params.append('search', searchTerm);
      }

      // Apply date range filter
      if (dateRangeFilter && dateRangeFilter.from) {
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
        
        params.append('from', startString);
        params.append('to', endString);
      }

      // Call Supabase Edge Function
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-all-leads-report?${params.toString()}`;
      
      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads for table');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leads for table');
      }

      const data = result.data || [];
      
      // Debug: แสดงจำนวนลีดตาม category และตรวจสอบ is_from_ppa_project
      if (data && data.length > 0) {
        const categoryCounts = data.reduce((acc: any, lead: any) => {
          const category = lead.category || 'ไม่มี category';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
        
        // Check if is_from_ppa_project field exists
        const sampleLead = data[0];
        const hasPpaField = 'is_from_ppa_project' in sampleLead;
        const ppaLeadsCount = data.filter((lead: any) => lead.is_from_ppa_project === true).length;
        
        console.log('📊 AllLeadsReport Debug:', {
          totalLeadsFromQuery: data.length,
          categoryCounts: categoryCounts,
          hasPpaField: hasPpaField,
          ppaLeadsCount: ppaLeadsCount,
          sampleLeadFields: Object.keys(sampleLead || {}),
          sampleLeadPpaValue: sampleLead?.is_from_ppa_project
        });
      }

      
      // Get latest productivity log for each lead
      // ✅ แก้ไข: แบ่ง leadIds เป็น chunks เพื่อหลีกเลี่ยง URL ยาวเกินไปหรือเกิน limit ของ PostgREST
      if (data && data.length > 0) {
        const leadIds = data.map(lead => lead.id);
        
        if (leadIds.length > 0) {
          // แบ่ง leadIds เป็น chunks ละ 500 items (PostgREST limit)
          const CHUNK_SIZE = 500;
          const chunks: number[][] = [];
          for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
            chunks.push(leadIds.slice(i, i + CHUNK_SIZE));
          }

          // Query productivity logs แบบ parallel สำหรับแต่ละ chunk
          const productivityLogsPromises = chunks.map(chunk =>
            supabase
              .from('lead_productivity_logs')
              .select(`
                id,
                lead_id,
                note,
                status,
                created_at_thai
              `)
              .in('lead_id', chunk)
              .order('created_at_thai', { ascending: false })
          );

          const productivityLogsResults = await Promise.all(productivityLogsPromises);
          
          // รวมผลลัพธ์จากทุก chunks
          let allProductivityLogs: any[] = [];
          let hasError = false;
          
          productivityLogsResults.forEach((result, index) => {
            if (result.error) {
              console.error(`Error fetching productivity logs for chunk ${index}:`, result.error);
              hasError = true;
            } else if (result.data) {
              allProductivityLogs = [...allProductivityLogs, ...result.data];
            }
          });

          if (!hasError && allProductivityLogs.length > 0) {
            // สร้าง map ของ productivity log ล่าสุดสำหรับแต่ละ lead
            const latestLogsMap = new Map();
            allProductivityLogs.forEach(log => {
              if (!latestLogsMap.has(log.lead_id)) {
                latestLogsMap.set(log.lead_id, log);
              } else {
                // ถ้ามี log เก่ากว่า ใช้ log ที่ใหม่กว่า
                const existingLog = latestLogsMap.get(log.lead_id);
                if (new Date(log.created_at_thai) > new Date(existingLog.created_at_thai)) {
                  latestLogsMap.set(log.lead_id, log);
                }
              }
            });

            // เพิ่มข้อมูล productivity log ล่าสุดให้กับแต่ละ lead
            data.forEach(lead => {
              const latestLog = latestLogsMap.get(lead.id);
              (lead as any).latest_productivity_log = latestLog || null;
            });
          }
        }
      }

      // No need for frontend date filtering - backend query already gets correct data
      const leadsWithCreatorNames = (data || []).map(lead => ({
        ...lead,
        creator_name: getCreatorName(lead.created_by)
      }));
      setTableLeads(leadsWithCreatorNames);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setTableLoading(false);
    }
  };

  // Fetch chart data (aggregate)
  // ✅ Fetch chart data using Edge Function
  const fetchChartLeads = async () => {
    setChartLoading(true);
    try {
      // Get JWT token from Supabase session for Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('type', 'chart');
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (operationStatusFilter !== 'all') {
        params.append('operation_status', operationStatusFilter);
      }
      
      if (platformFilter !== 'all') {
        params.append('platform', platformFilter);
      }
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      if (creatorFilter !== 'all') {
        params.append('creator', creatorFilter);
      }

      // Apply date range filter
      if (dateRangeFilter && dateRangeFilter.from) {
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
        
        params.append('from', startString);
        params.append('to', endString);
      }

      // Call Supabase Edge Function
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-all-leads-report?${params.toString()}`;
      
      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads for chart');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leads for chart');
      }

      const data = result.data || [];
      
      // No need for frontend date filtering - backend query already gets correct data
      setChartLeads(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTableLeads(currentPage),
        fetchChartLeads(),
        refetchChart()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ แก้ไข N+1 Queries: ใช้ Promise.all สำหรับ parallel queries
  useEffect(() => {
    // Only fetch when creators are available to avoid race condition
    if (creators.length > 0) {
      Promise.all([
        fetchTableLeads(currentPage),
        fetchChartLeads()
      ]).catch(error => {
        console.error('Error fetching data:', error);
      });
    }
  }, [creators]); // Wait for creators to be loaded first

  // Fetch data when filters change
  useEffect(() => {
    Promise.all([
      fetchTableLeads(currentPage),
      fetchChartLeads()
    ]).catch(error => {
      console.error('Error fetching data:', error);
    });
  }, [statusFilter, operationStatusFilter, platformFilter, categoryFilter, creatorFilter, dateRangeFilter, currentPage]);

  // Re-fetch table data when creators are loaded to ensure creator names are available
  useEffect(() => {
    if (creators.length > 0 && tableLeads.length > 0) {
      // Re-process leads with creator names when creators are available
      const leadsWithCreatorNames = tableLeads.map(lead => ({
        ...lead,
        creator_name: getCreatorName(lead.created_by)
      }));
      setTableLeads(leadsWithCreatorNames);
    }
  }, [creators]);

  // Chart data is now filtered in backend, so we can use chartLeads directly
  const filteredChartLeads = chartLeads;

  // Memoized filtered data for table
  const filteredTableLeads = useMemo(() => {
    if (!tableLeads.length) return [];
    
    let filtered = tableLeads;
    
    // ไม่ต้องกรองลีดที่มีข้อมูลติดต่อแล้ว เพราะ backend ใช้ has_contact_info column กรองให้แล้ว
    
    // Apply search filter
    if (searchTerm) {
      // Normalize search term if it's a phone number (starts with digit)
      const isPhoneSearch = /^\d/.test(searchTerm);
      const normalizedSearchTerm = isPhoneSearch 
        ? normalizePhoneNumber(searchTerm) 
        : searchTerm.toLowerCase();

      filtered = filtered.filter(lead => {
        // For phone searches, normalize both the search term and the phone number in the database
        const phoneMatches = lead.tel && isPhoneSearch
          ? normalizePhoneNumber(lead.tel).includes(normalizedSearchTerm)
          : lead.tel?.includes(searchTerm);
        
        return lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phoneMatches ||
          lead.line_id?.includes(searchTerm) ||
          lead.region?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // ไม่ต้องใช้ frontend date filter อีกต่อไป เพราะ backend query ตอนนี้ทำงานถูกต้องแล้ว
    // และไม่ต้องการ double filtering
    
    // leadTypeFilter ถูกกรองแล้วที่ backend ใน fetchTableLeads
    // ไม่ต้องกรองซ้ำที่นี่
    

    
    return filtered;
  }, [tableLeads, searchTerm]);

  // Calculate total count for pagination
  useEffect(() => {
    setTotalCount(filteredTableLeads.length);
  }, [filteredTableLeads]);

  // Calculate summary statistics for new cards
  // ⚠️ ใช้ tableLeads โดยตรง (ไม่ใช้ filteredTableLeads) เพื่อให้ตัวเลขสอดคล้องกัน
  // filteredTableLeads ใช้เฉพาะสำหรับแสดงผลใน table (กรองด้วย searchTerm)
  const summaryStats = useMemo(() => {
    // ใช้ tableLeads แทน filteredTableLeads เพื่อให้ตัวเลขสอดคล้องกับ backend query
    const leadsForStats = tableLeads;
    
    if (!leadsForStats.length) return {
      evLeads: 0,
      partnerLeads: 0,
      huaweiLeads: 0,
      huaweiCILeads: 0,
      atmocLeads: 0,
      solarEdgeLeads: 0,
      sigenergyLeads: 0,
      terawattLeads: 0,
      ppaProjectLeads: 0,
      totalLeads: 0,
      acceptedLeads: 0,
      notAcceptedLeads: 0,
      acceptanceRate: 0,
      // Platform stats
      facebookLeads: 0,
      lineLeads: 0,
      websiteLeads: 0,
      tiktokLeads: 0,
      igLeads: 0,
      youtubeLeads: 0,
      shopeeLeads: 0,
      lazadaLeads: 0,
      แนะนำLeads: 0,
      outboundLeads: 0,
      โทรLeads: 0
    };

    // Helper functions for platform classification
    const isEVLead = (platform: string) => {
      const evPlatforms = ['Facebook', 'Line', 'Website', 'TikTok', 'IG', 'YouTube', 'Shopee', 'Lazada', 'แนะนำ', 'Outbound', 'โทร', 'ลูกค้าเก่า service ครบ'];
      return evPlatforms.includes(platform);
    };

    const isPartnerLead = (platform: string) => {
      const partnerPlatforms = ['Huawei', 'Huawei (C&I)', 'ATMOCE', 'Solar Edge', 'Sigenergy', 'terawatt'];
      return partnerPlatforms.includes(platform);
    };

    // Calculate EV leads (บริษัทหามาเอง - ไม่รวม Partner)
    const evLeads = leadsForStats.filter(lead => 
      isEVLead(lead.platform)
    ).length;

    // Calculate Partner leads
    const huaweiLeads = leadsForStats.filter(lead => 
      lead.platform === 'Huawei'
    ).length;

    const huaweiCILeads = leadsForStats.filter(lead => 
      lead.platform === 'Huawei (C&I)'
    ).length;

    const atmocLeads = leadsForStats.filter(lead => 
      lead.platform === 'ATMOCE'
    ).length;

    const solarEdgeLeads = leadsForStats.filter(lead => 
      lead.platform === 'Solar Edge'
    ).length;

    const sigenergyLeads = leadsForStats.filter(lead => 
      lead.platform === 'Sigenergy'
    ).length;

    const terawattLeads = leadsForStats.filter(lead => 
      lead.platform === 'terawatt'
    ).length;

    const partnerLeads = huaweiLeads + huaweiCILeads + atmocLeads + solarEdgeLeads + sigenergyLeads + terawattLeads;

    // Calculate PPA Project leads
    const ppaProjectLeads = leadsForStats.filter(lead => 
      lead.is_from_ppa_project === true
    ).length;

    // Debug: Log PPA leads calculation
    console.log('📊 PPA Project Leads Debug:', {
      totalLeads: leadsForStats.length,
      ppaProjectLeads: ppaProjectLeads,
      sampleLeads: leadsForStats.slice(0, 5).map(lead => ({
        id: lead.id,
        full_name: lead.full_name,
        is_from_ppa_project: lead.is_from_ppa_project,
        hasField: 'is_from_ppa_project' in lead
      }))
    });

    // ✅ totalLeads = นับเฉพาะ EV + Partner (ให้ตรงกับ Index page)
    // ใช้ evAndPartnerLeads.length แทน evLeads + partnerLeads เพื่อให้แน่ใจว่าใช้ dataset เดียวกัน
    const evAndPartnerLeads = leadsForStats.filter(lead => 
      isEVLead(lead.platform) || isPartnerLead(lead.platform)
    );
    
    const totalLeads = evAndPartnerLeads.length; // ✅ ใช้ length ของ evAndPartnerLeads เพื่อให้ตรงกับ acceptedLeads
    
    // ✅ นับ acceptedLeads จาก evAndPartnerLeads เท่านั้น (ให้ตรงกับ totalLeads)
    const acceptedLeads = evAndPartnerLeads.filter(lead => 
      lead.sale_owner_id || lead.post_sales_owner_id
    ).length;

    const notAcceptedLeads = totalLeads - acceptedLeads;

    // Debug: ตรวจสอบการคำนวณ
    const calculatedEVPartner = evLeads + partnerLeads;
    
    console.log('📊 AllLeadsReport Debug Calculation:', {
      tableLeads: leadsForStats.length,
      filteredTableLeads: filteredTableLeads.length,
      evAndPartnerLeads: evAndPartnerLeads.length,
      totalLeads: totalLeads,
      calculatedEVPartner: calculatedEVPartner,
      evLeads: evLeads,
      partnerLeads: partnerLeads,
      huaweiLeads: huaweiLeads,
      atmocLeads: atmocLeads,
      solarEdgeLeads: solarEdgeLeads,
      sigenergyLeads: sigenergyLeads,
      terawattLeads: terawattLeads,
      acceptedLeads: acceptedLeads,
      notAcceptedLeads: notAcceptedLeads,
      // ✅ ตรวจสอบว่า evAndPartnerLeads.length เท่ากับ evLeads + partnerLeads หรือไม่
      isMatch: evAndPartnerLeads.length === calculatedEVPartner,
      // Platform breakdown
      platformBreakdown: leadsForStats.reduce((acc: any, lead) => {
        const platform = lead.platform || 'ไม่มี Platform';
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {}),
      // ✅ ตรวจสอบ leads ที่ไม่ใช่ EV หรือ Partner แต่ถูกนับ
      nonEVPartnerLeads: leadsForStats.filter(lead => 
        lead.platform && lead.platform.trim() !== '' && 
        !isEVLead(lead.platform) && !isPartnerLead(lead.platform)
      ).map(lead => ({ id: lead.id, platform: lead.platform }))
    });

    const acceptanceRate = totalLeads > 0 ? Math.round((acceptedLeads / totalLeads) * 100) : 0;


    // Calculate platform stats
    const facebookLeads = leadsForStats.filter(lead => lead.platform === 'Facebook').length;
    const lineLeads = leadsForStats.filter(lead => lead.platform === 'Line').length;
    const websiteLeads = leadsForStats.filter(lead => lead.platform === 'Website').length;
    const tiktokLeads = leadsForStats.filter(lead => lead.platform === 'TikTok').length;
    const igLeads = leadsForStats.filter(lead => lead.platform === 'IG').length;
    const youtubeLeads = leadsForStats.filter(lead => lead.platform === 'YouTube').length;
    const shopeeLeads = leadsForStats.filter(lead => lead.platform === 'Shopee').length;
    const lazadaLeads = leadsForStats.filter(lead => lead.platform === 'Lazada').length;
    const แนะนำLeads = leadsForStats.filter(lead => lead.platform === 'แนะนำ').length;
    const outboundLeads = leadsForStats.filter(lead => lead.platform === 'Outbound').length;
    const โทรLeads = leadsForStats.filter(lead => lead.platform === 'โทร').length;
    const ลูกค้าเก่าServiceครบLeads = leadsForStats.filter(lead => lead.platform === 'ลูกค้าเก่า service ครบ').length;
    const atmoceLeads = leadsForStats.filter(lead => lead.platform === 'ATMOCE').length;
    // Note: solarEdgeLeads and sigenergyLeads are already calculated above

    return {
      evLeads,
      partnerLeads,
      huaweiLeads,
      huaweiCILeads,
      atmocLeads,
      solarEdgeLeads,
      sigenergyLeads,
      terawattLeads,
      ppaProjectLeads,
      totalLeads,
      acceptedLeads,
      notAcceptedLeads,
      acceptanceRate,
      // Platform stats
      facebookLeads,
      lineLeads,
      websiteLeads,
      tiktokLeads,
      igLeads,
      youtubeLeads,
      shopeeLeads,
      lazadaLeads,
      แนะนำLeads,
      outboundLeads,
      โทรLeads,
      'ลูกค้าเก่า service ครบLeads': ลูกค้าเก่าServiceครบLeads, // ✅ เพิ่ม platform "ลูกค้าเก่า service ครบ"
      atmoceLeads
    };
  }, [tableLeads]); // ✅ ใช้ tableLeads แทน filteredTableLeads เพื่อให้ตัวเลขสอดคล้องกัน

  return (
    <div className="min-h-screen p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายงานลีดทั้งหมด</h1>
            <p className="text-gray-600 mt-1">จัดการและติดตามลีดที่มีเบอร์โทรหรือ Line ID ในระบบ</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              ลีดที่มีเบอร์โทรหรือ Line ID
            </Badge>
            {platformFilter !== 'all' && (
              <Badge variant="outline" className="text-xs">
                {platformFilter === 'โทร' ? (
                  <Phone className="h-4 w-4 mr-1" />
                ) : (
                  <span className="w-3 h-3 mr-1">📱</span>
                )}
                {platformFilter}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 text-green-600" />
              {filteredChartLeads.length} รายการ
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="border-t pt-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-700">สถานะ</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="รอรับ">รอรับ</SelectItem>
                  <SelectItem value="กำลังติดตาม">กำลังติดตาม</SelectItem>
                  <SelectItem value="ปิดการขาย">ปิดการขาย</SelectItem>
                  <SelectItem value="ยังปิดการขายไม่สำเร็จ">ยังปิดการขายไม่สำเร็จ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[160px]">
              <label className="text-xs font-medium text-gray-700">สถานะการดำเนินงาน</label>
              <Select value={operationStatusFilter} onValueChange={setOperationStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="เลือกสถานะการดำเนินงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="อยู่ระหว่างการติดต่อ" className={`${getOperationStatusColor('อยู่ระหว่างการติดต่อ')} hover:opacity-80 transition-opacity`}>อยู่ระหว่างการติดต่อ</SelectItem>
                  <SelectItem value="ปิดการขายแล้ว" className={`${getOperationStatusColor('ปิดการขายแล้ว')} hover:opacity-80 transition-opacity`}>ปิดการขายแล้ว</SelectItem>
                  <SelectItem value="ปิดการขายไม่สำเร็จ" className={`${getOperationStatusColor('ปิดการขายไม่สำเร็จ')} hover:opacity-80 transition-opacity`}>ปิดการขายไม่สำเร็จ</SelectItem>
                  <SelectItem value="ติดตามหลังการขาย" className={`${getOperationStatusColor('ติดตามหลังการขาย')} hover:opacity-80 transition-opacity`}>ติดตามหลังการขาย</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[130px]">
              <label className="text-xs font-medium text-gray-700">แพลตฟอร์ม</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="เลือกแพลตฟอร์ม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกแพลตฟอร์ม</SelectItem>
                  {PLATFORM_OPTIONS.map(platform => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[120px]">
              <label className="text-xs font-medium text-gray-700">ประเภทการขาย</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="เลือกประเภทการขาย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภทการขาย</SelectItem>
                  <SelectItem value="Package">Package</SelectItem>
                  <SelectItem value="Wholesales">Wholesales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-700">ผู้ที่เพิ่มลีด</label>
              <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="เลือกผู้ที่เพิ่มลีด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคน</SelectItem>
                  {creators.map((creator: any) => {
                    const fullName = [creator.first_name, creator.last_name].filter(Boolean).join(' ');
                    return (
                      <SelectItem key={creator.id} value={creator.id}>
                        {fullName || creator.email || creator.id}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-green-600" />
                ช่วงเวลา
              </label>
              <DateRangePicker
                value={dateRangeFilter}
                onChange={setDateRangeFilter}
                placeholder="เลือกช่วงเวลา"
                presets={true}
                className="w-full"
              />
            </div>

            <div className="space-y-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-700">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาชื่อ, เบอร์โทร, Line ID, หรือจังหวัด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
                className="w-full sm:w-auto self-start md:self-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(chartLoading || tableLoading || creators.length === 0) && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
            <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
            {creators.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                กำลังโหลดข้อมูลผู้ใช้...
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {!chartLoading && !tableLoading && (
          <>

            {/* Summary Cards - 3 Column Layout with Nested Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              
              {/* Column 1: ลีด EV */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  ลีด EV
                </h3>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-green-900 mb-2">{summaryStats.evLeads}</p>
                      <p className="text-sm font-medium text-green-700">บริษัทหามาเอง</p>
                      <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full mt-2">EV Leads</p>
                    </div>
                    <div className="border-t border-green-200 pt-4">
                      <p className="text-xs text-green-500 text-center">
                        Facebook, Line, Website, TikTok, IG, YouTube, Shopee, Lazada, แนะนำ, Outbound, โทร
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Column 2: ลีด Partner */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  ลีด Partner
                </h3>
                <div className="space-y-3">
                  {/* Partner Summary Card */}
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-900 mb-1">{summaryStats.partnerLeads}</p>
                        <p className="text-sm font-medium text-red-700">รวม Partner</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Individual Partner Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <Card className="bg-white border-red-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-900">{summaryStats.huaweiLeads}</p>
                          <p className="text-xs text-red-600">Huawei</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-900">{summaryStats.atmocLeads}</p>
                          <p className="text-xs text-blue-600">ATMOCE</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-yellow-900">{summaryStats.solarEdgeLeads}</p>
                          <p className="text-xs text-yellow-600">Solar Edge</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-900">{summaryStats.sigenergyLeads}</p>
                          <p className="text-xs text-purple-600">Sigenergy</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border-teal-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-teal-900">{summaryStats.terawattLeads}</p>
                          <p className="text-xs text-teal-600">terawatt</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Column 3: สรุปสถิติ */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                  สรุปสถิติ
                </h3>
                <div className="space-y-3">
                  {/* ลีดทั้งหมด */}
                  <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 mb-1">{summaryStats.totalLeads}</p>
                        <p className="text-sm font-medium text-gray-700">ลีดทั้งหมด</p>
                        <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full mt-2">
                          {summaryStats.evLeads} EV + {summaryStats.partnerLeads} Partner
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* โครงการ PPA */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-900 mb-1">{summaryStats.ppaProjectLeads}</p>
                        <p className="text-sm font-medium text-blue-700">ลีดจากโครงการ PPA</p>
                        <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full mt-2">
                          Power Purchase Agreement
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* การรับลีด & อัตราการรับ - แบ่งซ้าย-ขวา */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* การรับลีด - ซ้าย */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="text-center mb-3">
                          <p className="text-sm font-medium text-indigo-700">การรับลีด</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center">
                            <p className="text-lg font-bold text-indigo-900">{summaryStats.acceptedLeads}</p>
                            <p className="text-xs text-indigo-600">รับแล้ว</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-orange-600">{summaryStats.notAcceptedLeads}</p>
                            <p className="text-xs text-orange-600">ยังไม่ได้รับ</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* อัตราการรับ - ขวา */}
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-emerald-700 mb-2">อัตราการรับ</p>
                          <p className="text-xl font-bold text-emerald-900 mb-1">{summaryStats.acceptanceRate}%</p>
                          <p className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full mt-1">
                            {summaryStats.acceptedLeads} จาก {summaryStats.totalLeads}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

            </div>

            {/* Platform Stats Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">สถิติตามแพลตฟอร์ม</h3>
              <PlatformStats {...summaryStats} />
            </div>

            <hr className="my-4" />

            {/* Table with Pagination */}
            <LeadManagementTable
              leads={filteredTableLeads}
              salesTeam={salesTeam}
              currentSalesMember={null}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              operationStatusFilter={operationStatusFilter}
              setOperationStatusFilter={setOperationStatusFilter}
              platformFilter={platformFilter}
              setPlatformFilter={setPlatformFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              dateRangeFilter={dateRangeFilter}
              setDateRangeFilter={setDateRangeFilter}
              onAssignSalesOwner={() => {}}
              onAcceptLead={() => {}}
              isCreatingLead={false}
              isAcceptingLead={false}
              hideActions={false}
              hideTableHeader={true}
              preFiltered={true}
              creatorNames={creatorNames}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              showAcceptLeadColumn={false}
              showAssignColumn={true}
              showActionsColumn={true}
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              loading={tableLoading}
              onDeleteLead={handleDeleteLead}
              onEditLead={handleEditLead}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AllLeadsReport;