import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAdsCampaigns } from "@/hooks/useAdsCampaigns";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { useToast } from "@/hooks/useToast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Eye, EyeOff, ChevronLeft, ChevronRight, Filter, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const AdsCampaignManagement = () => {
  // Filter states (ต้องประกาศก่อน useAdsCampaigns)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('active'); // Default: Campaign Active
  const [adStatusFilter, setAdStatusFilter] = useState<'all' | 'active' | 'inactive'>('active'); // Default: Ad Active
  const [syncFilter, setSyncFilter] = useState<'all' | 'active' | 'inactive'>('active');
  
  // Default date range: เดือนนี้ (This Month)
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: startOfMonth, to: now };
  });

  // ส่ง filters ไปที่ useAdsCampaigns เพื่อ query จาก database เลย
  const {
    campaigns,
    isLoading,
    isSyncing,
    syncFromFacebook,
  } = useAdsCampaigns({
    statusFilter,
    dateRange: dateRangeFilter?.from && dateRangeFilter?.to 
      ? { from: dateRangeFilter.from, to: dateRangeFilter.to }
      : undefined
  });
  
  const { toast } = useToast();

  const [leadCounts, setLeadCounts] = useState<Record<number, number>>({});
  const [salesAmounts, setSalesAmounts] = useState<Record<number, number>>({});
  const [leadCountsByCategory, setLeadCountsByCategory] = useState<Record<number, { package: number; wholesales: number }>>({});
  const [salesAmountsByCategory, setSalesAmountsByCategory] = useState<Record<number, { package: number; wholesales: number }>>({});
  const [isLoadingLeadData, setIsLoadingLeadData] = useState(false);
  
  // Sorting states
  type SortField = 'leads' | 'sales' | 'name' | 'campaign';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('leads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default: มากไปน้อย
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate unique campaign counts and ad counts
  const { campaignCounts, adCounts } = useMemo(() => {
    // นับจำนวน unique campaigns (ไม่ใช่ ads)
    const uniqueCampaigns = new Map<string, any>();
    
    campaigns.forEach(ad => {
      if (ad.facebook_campaign_id) {
        // ใช้ campaign_id เป็น key เพื่อไม่ให้ซ้ำ
        uniqueCampaigns.set(ad.facebook_campaign_id, {
          id: ad.facebook_campaign_id,
          name: ad.campaign_name,
          status: ad.campaign_status,
          start_time: ad.campaign_start_time,
          stop_time: ad.campaign_stop_time,
        });
      }
    });
    
    const uniqueArray = Array.from(uniqueCampaigns.values());
    
    // นับจำนวน ads (ไม่ใช่ campaigns)
    const adsActive = campaigns.filter(ad => ad.status === 'active').length;
    const adsInactive = campaigns.filter(ad => ad.status === 'inactive').length;
    
    return {
      campaignCounts: {
        total: uniqueArray.length,
        active: uniqueArray.filter(c => c.status === 'active').length,
        inactive: uniqueArray.filter(c => c.status === 'inactive').length,
        archived: uniqueArray.filter(c => c.status === 'archived').length,
      },
      adCounts: {
        active: adsActive,
        inactive: adsInactive,
      }
    };
  }, [campaigns]);

  // Apply sorting and pagination (filtering ทำที่ database แล้ว)
  const { filteredCampaigns, paginatedCampaigns, totalPages, startIndex, endIndex } = useMemo(() => {
    // ข้อมูลจาก useAdsCampaigns filter campaign status แล้ว
    // แต่ต้อง filter ad status ที่ฝั่ง client
    let filtered = [...campaigns];
    
    // Filter by ad status (ถ้าไม่ใช่ 'all')
    if (adStatusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === adStatusFilter);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let compareResult = 0;
      
      switch (sortField) {
        case 'leads':
          compareResult = (leadCounts[a.id] || 0) - (leadCounts[b.id] || 0);
          break;
        case 'sales':
          compareResult = (salesAmounts[a.id] || 0) - (salesAmounts[b.id] || 0);
          break;
        case 'name':
          compareResult = (a.name || '').localeCompare(b.name || '', 'th');
          break;
        case 'campaign':
          compareResult = (a.campaign_name || '').localeCompare(b.campaign_name || '', 'th');
          break;
      }
      
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
    
    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);
    const total = Math.ceil(filtered.length / itemsPerPage);
    
    return {
      filteredCampaigns: filtered,
      paginatedCampaigns: paginated,
      totalPages: total,
      startIndex: start + 1,
      endIndex: Math.min(end, filtered.length)
    };
  }, [campaigns, currentPage, itemsPerPage, statusFilter, adStatusFilter, dateRangeFilter, sortField, sortDirection, leadCounts, salesAmounts]);

  // Reset to page 1 when campaigns change or filters change or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [campaigns.length, statusFilter, adStatusFilter, dateRangeFilter, sortField, sortDirection]);

  // Load lead counts and sales amounts for each campaign
  useEffect(() => {
    const loadLeadData = async () => {
      if (campaigns.length === 0) {
        setIsLoadingLeadData(false);
        return;
      }

      setIsLoadingLeadData(true);
      const counts: Record<number, number> = {};
      const sales: Record<number, number> = {};
      const countsByCategory: Record<number, { package: number; wholesales: number }> = {};
      const salesByCategory: Record<number, { package: number; wholesales: number }> = {};
      
      for (const campaign of campaigns) {
        try {
          // นับจำนวนลีดทั้งหมด
          const { count, error } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("ad_campaign_id", campaign.id);

          if (!error && count !== null) {
            counts[campaign.id] = count;
          }

          // นับจำนวนลีดแยกตาม category
          const { data: leadsData, error: leadsError } = await supabase
            .from("leads")
            .select("id, category")
            .eq("ad_campaign_id", campaign.id);

          if (!leadsError && leadsData) {
            // นับจำนวนลีดแยกตาม category
            let packageCount = 0;
            let wholesalesCount = 0;
            
            leadsData.forEach(lead => {
              const category = lead.category?.toLowerCase() || '';
              if (category.includes('package')) {
                packageCount++;
              } else if (category.includes('wholesale')) {
                wholesalesCount++;
              }
            });
            
            countsByCategory[campaign.id] = {
              package: packageCount,
              wholesales: wholesalesCount
            };

            if (leadsData.length > 0) {
              const leadIds = leadsData.map(lead => lead.id);

              // ดึง productivity logs ที่ปิดการขายแล้ว
              const { data: salesLogs, error: salesLogsError } = await supabase
                .from("lead_productivity_logs")
                .select("id, lead_id")
                .in("lead_id", leadIds)
                .eq("status", "ปิดการขายแล้ว")
                .or(`sale_chance_status.eq.win,and(sale_chance_status.eq.win + สินเชื่อ,credit_approval_status.eq.อนุมัติ)`);

              if (!salesLogsError && salesLogs && salesLogs.length > 0) {
                const logIds = salesLogs.map(log => log.id);

                // ดึง quotation_documents พร้อม lead_id
                const { data: quotations, error: quotationsError } = await supabase
                  .from("quotation_documents")
                  .select("amount, productivity_log_id")
                  .in("productivity_log_id", logIds)
                  .eq("document_type", "quotation");

                if (!quotationsError && quotations) {
                  const totalSales = quotations.reduce((sum, q) => sum + (q.amount || 0), 0);
                  sales[campaign.id] = totalSales;

                  // คำนวณยอดขายแยกตาม category
                  let packageSales = 0;
                  let wholesalesSales = 0;

                  // สร้าง map จาก log_id ไปยัง lead_id
                  const logToLeadMap = new Map<number, number>();
                  salesLogs.forEach(log => {
                    logToLeadMap.set(log.id, log.lead_id);
                  });

                  // สร้าง map จาก lead_id ไปยัง category
                  const leadToCategoryMap = new Map<number, string>();
                  leadsData.forEach(lead => {
                    leadToCategoryMap.set(lead.id, lead.category?.toLowerCase() || '');
                  });

                  quotations.forEach(qt => {
                    const leadId = logToLeadMap.get(qt.productivity_log_id);
                    if (leadId) {
                      const category = leadToCategoryMap.get(leadId) || '';
                      if (category.includes('package')) {
                        packageSales += qt.amount || 0;
                      } else if (category.includes('wholesale')) {
                        wholesalesSales += qt.amount || 0;
                      }
                    }
                  });

                  salesByCategory[campaign.id] = {
                    package: packageSales,
                    wholesales: wholesalesSales
                  };
                } else {
                  sales[campaign.id] = 0;
                  salesByCategory[campaign.id] = { package: 0, wholesales: 0 };
                }
              } else {
                sales[campaign.id] = 0;
                salesByCategory[campaign.id] = { package: 0, wholesales: 0 };
              }
            } else {
              sales[campaign.id] = 0;
              salesByCategory[campaign.id] = { package: 0, wholesales: 0 };
            }
          } else {
            countsByCategory[campaign.id] = { package: 0, wholesales: 0 };
            sales[campaign.id] = 0;
            salesByCategory[campaign.id] = { package: 0, wholesales: 0 };
          }
        } catch (error) {
          console.error(`Error loading data for campaign ${campaign.id}:`, error);
          sales[campaign.id] = 0;
          countsByCategory[campaign.id] = { package: 0, wholesales: 0 };
          salesByCategory[campaign.id] = { package: 0, wholesales: 0 };
        }
      }

      setLeadCounts(counts);
      setSalesAmounts(sales);
      setLeadCountsByCategory(countsByCategory);
      setSalesAmountsByCategory(salesByCategory);
      setIsLoadingLeadData(false);
    };

    loadLeadData();
  }, [campaigns]);

  const handleSync = () => {
    syncFromFacebook({ statusFilter: syncFilter });
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 text-pink-600" />
      : <ArrowDown className="h-4 w-4 ml-1 text-pink-600" />;
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "active":
        return "default"; // สีเขียว
      case "inactive":
        return "secondary"; // สีเหลือง
      case "archived":
        return "outline"; // สีเทา
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "archived":
        return "Archived";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: string | null) => {
    return status === "active" ? (
      <Eye className="h-3 w-3 mr-1" />
    ) : (
      <EyeOff className="h-3 w-3 mr-1" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการแอดโฆษณา</h1>
          <p className="text-gray-600 mt-2">
            จัดการแคมเปญโฆษณาทั้งหมด เพื่อติดตามแหล่งที่มาของลีด
          </p>
          <p className="text-sm text-gray-500 mt-1">
            รายการแอดในฐานข้อมูล: {campaigns.length} แอด | หลังกรอง: {filteredCampaigns.length} แอด | แสดงผล: {startIndex}-{endIndex}
          </p>
          <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            💡 คลิกที่หัวตาราง (ชื่อแอด, Campaign, จำนวนลีด, ยอดขาย) เพื่อเรียงลำดับ
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={syncFilter} onValueChange={(v: any) => setSyncFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sync ทั้งหมด</SelectItem>
                <SelectItem value="active">Sync เฉพาะ Active</SelectItem>
                <SelectItem value="inactive">Sync เฉพาะ Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          

          <Button
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            className="flex items-center gap-2 border-2 hover:border-pink-300"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "กำลัง Sync..." : "Sync ข้อมูล Caption ใหม่"}
          </Button>
          
          <div className="text-xs text-gray-500 max-w-xs">
            💡 กดเพื่อดึง Caption ใหม่จาก Facebook API
          </div>

          {/* TODO: เพิ่มฟีเจอร์เพิ่มแอดด้วยตนเอง */}
          {/* <Button className="bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700">
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มแอดด้วยตนเอง
          </Button> */}
        </div>
      </div>

      {/* Info Cards - ย้ายขึ้นมาด้านบน */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-5 rounded-lg border-2 border-pink-200">
          <p className="text-sm text-gray-600 mb-1">แอดที่แสดงผล</p>
          {isLoading ? (
            <div className="flex items-center gap-2 my-2">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              <span className="text-sm text-gray-500">กำลังโหลด...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-pink-700">{filteredCampaigns.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                จาก {campaigns.length} แอด ({campaignCounts.total} Campaign)
                <br />
                🟢 {adCounts.active} แอด | ⚫ {adCounts.inactive} แอด
              </p>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200">
          <p className="text-sm text-gray-600 mb-1">🟢 Campaign Active</p>
          {isLoading ? (
            <div className="flex items-center gap-2 my-2">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <span className="text-sm text-gray-500">กำลังโหลด...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-green-700">
                {(() => {
                  const uniqueCampaigns = new Set(
                    filteredCampaigns
                      .filter(c => c.campaign_status === 'active' && c.facebook_campaign_id)
                      .map(c => c.facebook_campaign_id)
                  );
                  return uniqueCampaigns.size;
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">จำนวน Campaign</p>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-lg border-2 border-yellow-200">
          <p className="text-sm text-gray-600 mb-1">🟡 Campaign Inactive</p>
          {isLoading ? (
            <div className="flex items-center gap-2 my-2">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <span className="text-sm text-gray-500">กำลังโหลด...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-amber-700">
                {(() => {
                  const uniqueCampaigns = new Set(
                    filteredCampaigns
                      .filter(c => c.campaign_status === 'inactive' && c.facebook_campaign_id)
                      .map(c => c.facebook_campaign_id)
                  );
                  return uniqueCampaigns.size;
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">จำนวน Campaign</p>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-lg border-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">⚫ Campaign Archived</p>
          {isLoading ? (
            <div className="flex items-center gap-2 my-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">กำลังโหลด...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-700">
                {(() => {
                  const uniqueCampaigns = new Set(
                    filteredCampaigns
                      .filter(c => c.campaign_status === 'archived' && c.facebook_campaign_id)
                      .map(c => c.facebook_campaign_id)
                  );
                  return uniqueCampaigns.size;
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">จำนวน Campaign</p>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-lg border-2 border-blue-200">
          <p className="text-sm text-gray-600 mb-1">รวมลีดจากแอดที่แสดงผล</p>
          {isLoading || isLoadingLeadData ? (
            <div className="flex items-center gap-2 my-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm text-gray-500">กำลังโหลด...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-blue-700">
                {filteredCampaigns.reduce((total, campaign) => {
                  return total + (leadCounts[campaign.id] || 0);
                }, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{filteredCampaigns.length} แอด ในช่วงเวลาที่เลือก</p>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-lg border-2 border-emerald-200">
          <p className="text-sm text-gray-600 mb-1">รวมยอดขายที่ปิดได้</p>
          {isLoading || isLoadingLeadData ? (
            <div className="flex items-center gap-2 my-2">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="text-sm text-gray-500">กำลังโหลด...</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-emerald-700">
                ฿{filteredCampaigns.reduce((total, campaign) => {
                  return total + (salesAmounts[campaign.id] || 0);
                }, 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
          {/* Campaign Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Campaign:</span>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">🟢 Active</SelectItem>
                <SelectItem value="inactive">🟡 Inactive</SelectItem>
                <SelectItem value="archived">⚫ Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ad Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">สถานะแอด:</span>
            <Select value={adStatusFilter} onValueChange={(v: any) => setAdStatusFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">🟢 Active</SelectItem>
                <SelectItem value="inactive">⚫ Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">ช่วงเวลา:</span>
            <DateRangePicker
              value={dateRangeFilter}
              onChange={setDateRangeFilter}
              placeholder="ช่วงเวลาทั้งหมด"
              presets={true}
              className="w-auto"
            />
          </div>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || adStatusFilter !== 'all' || dateRangeFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setAdStatusFilter('all');
                setDateRangeFilter(undefined);
              }}
              className="text-pink-600 hover:text-pink-700"
            >
              ล้างตัวกรองทั้งหมด
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            {(statusFilter !== 'all' || adStatusFilter !== 'all' || dateRangeFilter) && (
              <>
                <span className="text-xs font-medium text-gray-500">ตัวกรองที่ใช้:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="outline" className="bg-pink-50 border-pink-200">
                    Campaign: {statusFilter === 'active' ? '🟢 Active' : statusFilter === 'inactive' ? '🟡 Inactive' : '⚫ Archived'}
                  </Badge>
                )}
                {adStatusFilter !== 'all' && (
                  <Badge variant="outline" className="bg-blue-50 border-blue-200">
                    แอด: {adStatusFilter === 'active' ? '🟢 Active' : '⚫ Inactive'}
                  </Badge>
                )}
                {dateRangeFilter && (
                  <Badge variant="outline" className="bg-cyan-50 border-cyan-200">
                    📅 {dateRangeFilter.from ? format(dateRangeFilter.from, "dd MMM yy") : ''} 
                    {dateRangeFilter.to ? ` - ${format(dateRangeFilter.to, "dd MMM yy")}` : ''}
                  </Badge>
                )}
                <span className="text-xs text-gray-400">|</span>
              </>
            )}
            <span className="text-xs font-medium text-gray-500">เรียงตาม:</span>
            <Badge variant="outline" className="bg-purple-50 border-purple-200">
              {sortField === 'leads' ? '📊 จำนวนลีด' : 
               sortField === 'sales' ? '💰 ยอดขาย' : 
               sortField === 'name' ? '📝 ชื่อแอด' : '📂 Campaign'} 
              {sortDirection === 'desc' ? ' ↓ มาก→น้อย' : ' ↑ น้อย→มาก'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-pink-50 to-rose-50">
                <TableHead className="w-20 font-semibold">รูปภาพ</TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    ชื่อแอด
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('campaign')}
                >
                  <div className="flex items-center">
                    Campaign
                    {getSortIcon('campaign')}
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Caption/ข้อความ</TableHead>
                <TableHead className="font-semibold">ช่วงเวลารัน Campaign</TableHead>
                <TableHead className="font-semibold">แพลตฟอร์ม</TableHead>
                <TableHead className="font-semibold">สถานะ</TableHead>
                <TableHead 
                  className="text-center font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('leads')}
                >
                  <div className="flex items-center justify-center">
                    จำนวนลีด
                    {getSortIcon('leads')}
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <span>จำนวนลีด</span>
                    <span className="text-xs font-normal text-gray-600">แยก Category</span>
                  </div>
                </TableHead>
                <TableHead 
                  className="text-center font-semibold cursor-pointer hover:bg-pink-100 transition-colors"
                  onClick={() => handleSort('sales')}
                >
                  <div className="flex items-center justify-center">
                    ยอดขาย
                    {getSortIcon('sales')}
                  </div>
                </TableHead>
                <TableHead className="text-center font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <span>ยอดขาย</span>
                    <span className="text-xs font-normal text-gray-600">แยก Category</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <RefreshCw className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">ยังไม่มีข้อมูลแอด</p>
                        <p className="text-gray-500 text-sm mt-1">
                          กดปุ่ม "Sync ข้อมูล Caption ใหม่" เพื่อดึงข้อมูลแอดและ Caption จาก Facebook
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCampaigns.map((campaign) => (
                  <TableRow
                    key={campaign.id}
                    className="hover:bg-pink-50/50 transition-colors"
                  >
                    <TableCell>
                      {campaign.image_url ? (
                        <img
                          src={campaign.image_url}
                          alt={campaign.name}
                          className="w-14 h-14 rounded-md object-cover border-2 border-gray-200 shadow-sm"
                          onError={(e) => {
                            // ✅ ป้องกัน error ไม่ให้แสดงใน console
                            e.preventDefault();
                            e.stopPropagation();
                            const img = e.target as HTMLImageElement;
                            // ตรวจสอบว่าเป็น Facebook CDN URL หรือไม่
                            if (img.src.includes('fbcdn.net') || img.src.includes('facebook.com')) {
                              // Silent error - ไม่ log เพราะเป็นเรื่องปกติที่ Facebook CDN URLs หมดอายุ
                            }
                            // เปลี่ยนเป็น placeholder
                            img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo img%3C/text%3E%3C/svg%3E";
                            img.onerror = null; // ป้องกัน infinite loop
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center border-2 border-gray-200">
                          <span className="text-xs text-gray-400 font-medium">No img</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="max-w-xs">
                        <p className="truncate">{campaign.name}</p>
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {campaign.facebook_ad_id && (
                            <p className="truncate">
                              Ad ID: {campaign.facebook_ad_id}
                            </p>
                          )}
                          {campaign.facebook_campaign_id && (
                            <p className="truncate">
                              Campaign ID: {campaign.facebook_campaign_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs">
                      <div>
                        <p className="truncate font-medium">{campaign.campaign_name || "-"}</p>
                        {campaign.campaign_status && (
                          <p className="text-xs text-gray-500 mt-1">
                            Campaign: {campaign.campaign_status === 'active' ? '🟢 Active' : campaign.campaign_status === 'inactive' ? '🟡 Inactive' : '⚫ Archived'}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-md">
                      {campaign.description ? (
                        <div className="space-y-1">
                          <p className="line-clamp-2 text-gray-700">
                            {campaign.description}
                          </p>
                          {campaign.description.length > 80 && (
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                              onClick={() => {
                                navigator.clipboard.writeText(campaign.description || '');
                                toast({
                                  title: "✅ คัดลอกแล้ว",
                                  description: "คัดลอกข้อความไปยัง Clipboard แล้ว",
                                });
                              }}
                            >
                              📋 คัดลอกข้อความทั้งหมด
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs italic">ไม่มีข้อความ</span>
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            📷 Story/Image-only
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {campaign.campaign_start_time || campaign.campaign_stop_time ? (
                        <div>
                          {campaign.campaign_start_time && (
                            <p className="font-medium text-green-700">
                              เริ่ม: {format(new Date(campaign.campaign_start_time), "dd MMM yy")}
                            </p>
                          )}
                          {campaign.campaign_stop_time ? (
                            <p className="font-medium text-red-600">
                              สิ้นสุด: {format(new Date(campaign.campaign_stop_time), "dd MMM yy")}
                            </p>
                          ) : (
                            <p className="text-xs text-blue-600 mt-1">
                              🔄 รันต่อเนื่อง
                            </p>
                          )}
                        </div>
                      ) : campaign.facebook_created_time ? (
                        <div>
                          <p className="font-medium text-gray-600">
                            สร้าง: {format(new Date(campaign.facebook_created_time), "dd MMM yy")}
                          </p>
                          <p className="text-xs text-gray-500">
                            (ไม่มีข้อมูลช่วงรัน)
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {campaign.platform || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(campaign.status)}
                        className="flex items-center w-fit"
                      >
                        {getStatusIcon(campaign.status)}
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {isLoadingLeadData ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                        </div>
                      ) : (
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-semibold">
                          {leadCounts[campaign.id] || 0}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isLoadingLeadData ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs w-full justify-center">
                            P: {leadCountsByCategory[campaign.id]?.package || 0}
                          </Badge>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs w-full justify-center">
                            W: {leadCountsByCategory[campaign.id]?.wholesales || 0}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isLoadingLeadData ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-green-700">
                          ฿{(salesAmounts[campaign.id] || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isLoadingLeadData ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs w-full justify-center">
                            P: ฿{((salesAmountsByCategory[campaign.id]?.package || 0)).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </Badge>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs w-full justify-center">
                            W: ฿{((salesAmountsByCategory[campaign.id]?.wholesales || 0)).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {filteredCampaigns.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            แสดง {startIndex} ถึง {endIndex} จากทั้งหมด {filteredCampaigns.length} แอด
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              ก่อนหน้า
            </Button>
            
            <div className="flex items-center gap-1">
              {/* แสดงหมายเลขหน้า */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 ${
                      currentPage === pageNum
                        ? "bg-pink-600 text-white hover:bg-pink-700"
                        : ""
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              ถัดไป
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            หน้า {currentPage} จาก {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsCampaignManagement;

