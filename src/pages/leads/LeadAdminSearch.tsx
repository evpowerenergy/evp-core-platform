import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCacheStrategy } from "@/lib/cacheStrategies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import LeadManagementTable from "@/components/dashboard/LeadManagementTable";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { PageLoading } from "@/components/ui/loading";
import { Users, Calendar, RefreshCw, Search, Phone } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getOperationStatusColor } from "@/utils/leadStatusUtils";
import { PLATFORM_OPTIONS } from "@/utils/dashboardUtils";
import { normalizePhoneNumber } from "@/utils/leadValidation";
import { deleteLeadViaEdgeFunction } from "@/lib/leads/deleteLead";
import { fetchAllLeadsTableWithLogs } from "@/lib/leads/fetchAllLeadsTable";

function getDefaultAdminDateRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from, to };
}

const LeadAdminSearch = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [statusFilter, setStatusFilter] = useState("all");
  const [operationStatusFilter, setOperationStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(() =>
    getDefaultAdminDateRange()
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");

  const [tableLoading, setTableLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tableLeads, setTableLeads] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const { data: salesTeamData } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};

  const reportsCacheStrategy = useCacheStrategy("REPORTS");
  const { data: creatorsData, isLoading: creatorsLoading } = useQuery({
    queryKey: ["creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .order("first_name");

      if (error) {
        console.error("Error fetching creators:", error);
        throw error;
      }

      return data || [];
    },
    ...reportsCacheStrategy,
  });

  const creators = creatorsData || [];

  const getCreatorName = useCallback(
    (createdBy: string | null) => {
      if (!createdBy) return "ไม่ระบุ";

      const creator = creators.find((c) => c.id === createdBy);
      if (creator) {
        const fullName = [creator.first_name, creator.last_name].filter(Boolean).join(" ");
        return fullName || creator.email || "ไม่ระบุ";
      }

      return createdBy;
    },
    [creators]
  );

  const creatorNames = useMemo(() => {
    const mapping: { [key: string]: string } = {};
    creators.forEach((creator) => {
      if (creator.id) {
        const fullName = [creator.first_name, creator.last_name].filter(Boolean).join(" ");
        mapping[creator.id] = fullName || creator.email || creator.id;
      }
    });
    return mapping;
  }, [creators]);

  const fetchTableLeads = useCallback(
    async (_page: number) => {
      setTableLoading(true);
      try {
        const leads = await fetchAllLeadsTableWithLogs(
          {
            statusFilter,
            operationStatusFilter,
            platformFilter,
            categoryFilter,
            creatorFilter,
            searchTerm,
            dateRangeFilter,
          },
          getCreatorName
        );
        setTableLeads(leads);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setTableLoading(false);
      }
    },
    [
      statusFilter,
      operationStatusFilter,
      platformFilter,
      categoryFilter,
      creatorFilter,
      searchTerm,
      dateRangeFilter,
      getCreatorName,
    ]
  );

  useEffect(() => {
    if (creatorsLoading) return;
    fetchTableLeads(currentPage).catch((e) => console.error("Error fetching data:", e));
  }, [
    creatorsLoading,
    statusFilter,
    operationStatusFilter,
    platformFilter,
    categoryFilter,
    creatorFilter,
    dateRangeFilter,
    searchTerm,
    currentPage,
    fetchTableLeads,
  ]);

  const filteredTableLeads = useMemo(() => {
    if (!tableLeads.length) return [];

    let filtered = tableLeads;

    if (searchTerm) {
      const isPhoneSearch = /^\d/.test(searchTerm);
      const normalizedSearchTerm = isPhoneSearch
        ? normalizePhoneNumber(searchTerm)
        : searchTerm.toLowerCase();

      filtered = filtered.filter((lead) => {
        const phoneMatches =
          lead.tel && isPhoneSearch
            ? normalizePhoneNumber(lead.tel).includes(normalizedSearchTerm)
            : lead.tel?.includes(searchTerm);

        return (
          lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phoneMatches ||
          lead.line_id?.includes(searchTerm) ||
          lead.region?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return filtered;
  }, [tableLeads, searchTerm]);

  useEffect(() => {
    setTotalCount(filteredTableLeads.length);
  }, [filteredTableLeads]);

  const handleDeleteLead = async (leadId: number) => {
    if (!window.confirm("คุณต้องการลบลีดนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้")) {
      return;
    }
    try {
      await deleteLeadViaEdgeFunction(leadId);
      alert("ลบลีดสำเร็จ");
      await fetchTableLeads(currentPage);
    } catch (error: any) {
      console.error("Error deleting lead:", error);
      alert("เกิดข้อผิดพลาดในการลบลีด: " + (error.message || "Unknown error"));
    }
  };

  const handleEditLead = (leadId: number) => {
    navigate(`/leads/${leadId}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTableLeads(currentPage);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (creatorsLoading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ค้นหาและจัดการลีด</h1>
            <p className="text-gray-600 mt-1">
              ค้นหา ดูรายละเอียด แก้ไข หรือลบลีด (ช่วงวันที่เริ่มต้น 30 วันล่าสุด)
            </p>
          </div>
          <Badge variant="outline" className="text-xs w-fit">
            <Users className="h-3 w-3 mr-1" />
            ลีดที่มีเบอร์โทรหรือ Line ID
          </Badge>
        </div>

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
                  <SelectItem
                    value="อยู่ระหว่างการติดต่อ"
                    className={`${getOperationStatusColor("อยู่ระหว่างการติดต่อ")} hover:opacity-80 transition-opacity`}
                  >
                    อยู่ระหว่างการติดต่อ
                  </SelectItem>
                  <SelectItem
                    value="ปิดการขายแล้ว"
                    className={`${getOperationStatusColor("ปิดการขายแล้ว")} hover:opacity-80 transition-opacity`}
                  >
                    ปิดการขายแล้ว
                  </SelectItem>
                  <SelectItem
                    value="ปิดการขายไม่สำเร็จ"
                    className={`${getOperationStatusColor("ปิดการขายไม่สำเร็จ")} hover:opacity-80 transition-opacity`}
                  >
                    ปิดการขายไม่สำเร็จ
                  </SelectItem>
                  <SelectItem
                    value="ติดตามหลังการขาย"
                    className={`${getOperationStatusColor("ติดตามหลังการขาย")} hover:opacity-80 transition-opacity`}
                  >
                    ติดตามหลังการขาย
                  </SelectItem>
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
                  {PLATFORM_OPTIONS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
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
                    const fullName = [creator.first_name, creator.last_name].filter(Boolean).join(" ");
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
                disabled={refreshing || tableLoading}
                className="w-full sm:w-auto self-start md:self-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "กำลังโหลด..." : "รีเฟรช"}
              </Button>
            </div>
          </div>
        </div>

        {platformFilter !== "all" && (
          <Badge variant="outline" className="text-xs w-fit">
            {platformFilter === "โทร" ? (
              <Phone className="h-4 w-4 mr-1" />
            ) : (
              <span className="w-3 h-3 mr-1">📱</span>
            )}
            {platformFilter}
          </Badge>
        )}

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
      </div>
    </div>
  );
};

export default LeadAdminSearch;
