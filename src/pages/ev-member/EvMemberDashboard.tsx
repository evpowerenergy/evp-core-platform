import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Download,
  Filter,
  FileText,
  LayoutGrid,
  List,
  Megaphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";
import { useEvMemberDashboardData } from "@/hooks/useEvMemberDashboardData";
import { usePermissions } from "@/hooks/usePermissions";
import { TeamFilterSelect } from "@/components/filters/TeamFilterSelect";
import { PLATFORM_OPTIONS } from "@/utils/dashboardUtils";
import { getCategoryBadgeClassName } from "@/utils/categoryBadgeUtils";
import {
  aggregateEvMemberCustomers,
  type EvMemberCustomerSortKey,
  type EvMemberSortOrder,
} from "@/utils/evMemberUtils";
import * as XLSX from "xlsx";

function formatDateShort(dateString: string) {
  if (!dateString) return "ไม่ระบุ";
  try {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "ไม่ระบุ";
  }
}

function PhoneLineCell({ tel, lineId }: { tel: string; lineId: string }) {
  return (
    <div className="min-w-[128px] space-y-0.5 text-left text-xs">
      <div>
        <span className="text-gray-500">โทร:</span>{" "}
        <span className="text-gray-900">{tel}</span>
      </div>
      <div>
        <span className="text-gray-500">Line:</span>{" "}
        <span className="break-all text-gray-900">{lineId}</span>
      </div>
    </div>
  );
}

function NotesPreview({ text }: { text: string | null | undefined }) {
  const raw = (text ?? "").trim();
  if (!raw) {
    return <span className="text-gray-400">—</span>;
  }
  const truncated = raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
  return (
    <div
      className="max-w-[260px] text-left text-xs leading-snug text-gray-800"
      title={raw}
    >
      {truncated}
    </div>
  );
}

export default function EvMemberDashboard() {
  const permissions = usePermissions();
  const { data: salesTeamData } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};

  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [salesFilter, setSalesFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [customerSortKey, setCustomerSortKey] = useState<EvMemberCustomerSortKey>("amount");
  const [customerSortOrder, setCustomerSortOrder] = useState<EvMemberSortOrder>("desc");

  const { loading, salesCount, totalSalesValue, salesLeads } = useEvMemberDashboardData(
    dateRangeFilter,
    salesFilter,
    platformFilter,
    categoryFilter
  );

  const customerRows = useMemo(
    () => aggregateEvMemberCustomers(salesLeads, customerSortKey, customerSortOrder),
    [salesLeads, customerSortKey, customerSortOrder]
  );

  const uniqueCustomerCount = customerRows.length;

  const exportCustomerExcel = () => {
    if (customerRows.length === 0) {
      alert("ไม่มีข้อมูลให้ export");
      return;
    }
    const rows = customerRows.map((r) => ({
      อันดับ: r.rank,
      ชื่อแสดง: r.displayName,
      ชื่อเต็ม: r.fullName,
      เบอร์โทร: r.tel,
      Line_ID: r.lineId,
      จังหวัด: r.region,
      รายละเอียดเพิ่มเติม: r.leadNotes ?? "",
      จำนวนครั้งปิดขาย: r.purchaseEventCount,
      จำนวนQTรวม: r.totalQuotationCountSum,
      ยอดรวม: r.totalQuotationAmount,
      กลุ่มลูกค้า: r.category,
      Platform: r.platform,
      lead_id: r.leadId,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "สรุปต่อลูกค้า");
    XLSX.writeFile(wb, `EV_Member_สรุปลูกค้า_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportTransactionExcel = () => {
    if (salesLeads.length === 0) {
      alert("ไม่มีข้อมูลให้ export");
      return;
    }
    const rows = salesLeads.map((lead, index) => {
      const saleId = lead.sale_id || lead.sale_owner_id || 0;
      const salesMember = salesTeam.find((m) => m.id === saleId);
      return {
        ลำดับ: index + 1,
        วันที่: formatDateShort(lead.created_at_thai),
        เซลล์: salesMember?.name || "ไม่ระบุ",
        lead_id: lead.leadId,
        log_id: lead.logId,
        ชื่อลูกค้า: lead.display_name,
        เบอร์โทร: lead.tel,
        Line_ID: lead.line_id,
        จังหวัด: lead.region,
        รายละเอียดเพิ่มเติม: lead.lead_notes ?? "",
        กลุ่ม: lead.category,
        Platform: lead.platform,
        จำนวนQT: lead.totalQuotationCount,
        ยอดรวม: lead.totalQuotationAmount,
        ค่าไฟ: lead.avg_electricity_bill,
      };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "รายการแต่ละครั้ง");
    XLSX.writeFile(wb, `EV_Member_รายครั้ง_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">EV Member</h1>
              <p className="text-gray-600 mt-1 text-sm">
                ลูกค้าที่ปิดการขายสำเร็จ — นิยามเดียวกับรายงาน{" "}
                {permissions.canViewReports ? (
                  <Link to="/reports/sales-closed" className="text-teal-600 underline-offset-2 hover:underline">
                    ปิดการขาย
                  </Link>
                ) : (
                  <span className="text-teal-600">ปิดการขาย (Sales Closed)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-teal-50/30">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Filter className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">ตัวกรองข้อมูล</h3>
              <p className="text-xs text-gray-600">ช่วงเวลาใช้ timezone Asia/Bangkok เหมือนรายงานปิดการขาย</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                <span>ช่วงวันที่</span>
              </label>
              <DateRangePicker
                value={dateRangeFilter}
                onChange={setDateRangeFilter}
                placeholder="เลือกช่วงวันที่"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Users className="h-3.5 w-3.5 text-teal-600" />
                <span>เซลทีม</span>
              </label>
              <TeamFilterSelect
                value={salesFilter}
                onValueChange={setSalesFilter}
                salesTeam={salesTeam}
                placeholder="เลือกเซลทีม"
                triggerClassName="h-9 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Megaphone className="h-3.5 w-3.5 text-teal-600" />
                <span>Platforms</span>
              </label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="เลือก Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุก Platform</SelectItem>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FileText className="h-3.5 w-3.5 text-teal-600" />
                <span>กลุ่มลูกค้า</span>
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="เลือกกลุ่มลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกกลุ่มลูกค้า</SelectItem>
                  <SelectItem value="Package">Package</SelectItem>
                  <SelectItem value="Wholesales">Wholesales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">จำนวน QT (ปิดการขาย)</p>
                <p className="text-xs text-emerald-600">สอดคล้อง getSalesDataInPeriod</p>
              </div>
            </div>
            <span className="text-3xl font-bold text-emerald-700">{salesCount.toLocaleString()}</span>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">มูลค่ารวม</p>
                <p className="text-xs text-blue-600">ยอด QT รวม</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-700">
              ฿{totalSalesValue.toLocaleString("th-TH")}
            </span>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-r from-violet-50 to-purple-50">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 rounded-xl">
                <LayoutGrid className="h-6 w-6 text-violet-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-violet-800">จำนวนลูกค้า (ไม่ซ้ำ)</p>
                <p className="text-xs text-violet-600">ในช่วงฟิลเตอร์นี้</p>
              </div>
            </div>
            <span className="text-3xl font-bold text-violet-700">{uniqueCustomerCount.toLocaleString()}</span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customer" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="customer" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              สรุปต่อลูกค้า
            </TabsTrigger>
            <TabsTrigger value="transaction" className="gap-2">
              <List className="h-4 w-4" />
              รายการแต่ละครั้ง
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="customer" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">เรียงตาม</span>
              <Select
                value={customerSortKey}
                onValueChange={(v) => setCustomerSortKey(v as EvMemberCustomerSortKey)}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">ยอดรวม</SelectItem>
                  <SelectItem value="events">จำนวนครั้งปิดขาย</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={customerSortOrder}
                onValueChange={(v) => setCustomerSortOrder(v as EvMemberSortOrder)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">มาก → น้อย</SelectItem>
                  <SelectItem value="asc">น้อย → มาก</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportCustomerExcel}
              disabled={customerRows.length === 0}
              className="border-teal-300 text-teal-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">อันดับและยอดรวมต่อลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center w-14">อันดับ</TableHead>
                    <TableHead>ชื่อลูกค้า</TableHead>
                    <TableHead className="min-w-[140px]">เบอร์ / Line ID</TableHead>
                    <TableHead className="text-center">จังหวัด</TableHead>
                    <TableHead className="min-w-[200px]">รายละเอียดเพิ่มเติม</TableHead>
                    <TableHead className="text-center">ครั้งปิดขาย</TableHead>
                    <TableHead className="text-center">จำนวน QT รวม</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead className="text-center">กลุ่ม</TableHead>
                    <TableHead className="text-center">Platform</TableHead>
                    <TableHead className="text-center">CRM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerRows.map((row) => (
                    <TableRow key={row.leadId}>
                      <TableCell className="text-center font-semibold text-teal-700">{row.rank}</TableCell>
                      <TableCell>
                        <div className="font-medium">{row.displayName}</div>
                        <div className="text-xs text-gray-500">{row.fullName}</div>
                      </TableCell>
                      <TableCell>
                        <PhoneLineCell tel={row.tel} lineId={row.lineId} />
                      </TableCell>
                      <TableCell className="text-center text-sm">{row.region}</TableCell>
                      <TableCell>
                        <NotesPreview text={row.leadNotes} />
                      </TableCell>
                      <TableCell className="text-center">{row.purchaseEventCount}</TableCell>
                      <TableCell className="text-center">{row.totalQuotationCountSum}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        ฿{row.totalQuotationAmount.toLocaleString("th-TH")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getCategoryBadgeClassName(row.category)}>
                          {row.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{row.platform}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="link" className="h-auto p-0 text-teal-700" asChild>
                          <Link to={`/leads/${row.leadId}`}>เปิด Lead</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {customerRows.length === 0 && (
                <p className="text-center text-gray-500 py-8">ไม่มีข้อมูลในช่วงที่เลือก</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transaction" className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportTransactionExcel}
              disabled={salesLeads.length === 0}
              className="border-teal-300 text-teal-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">รายการแต่ละครั้งปิดการขาย ({salesLeads.length} แถว)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center">วันที่</TableHead>
                    <TableHead className="text-center">เซลล์</TableHead>
                    <TableHead className="text-center">Platform</TableHead>
                    <TableHead>ชื่อลูกค้า</TableHead>
                    <TableHead className="min-w-[140px]">เบอร์ / Line ID</TableHead>
                    <TableHead className="text-center">จังหวัด</TableHead>
                    <TableHead className="min-w-[200px]">รายละเอียดเพิ่มเติม</TableHead>
                    <TableHead className="text-center">กลุ่ม</TableHead>
                    <TableHead className="text-center">QT / ยอด</TableHead>
                    <TableHead className="text-center">ค่าไฟ</TableHead>
                    <TableHead className="text-center">CRM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesLeads.map((lead) => {
                    const saleId = lead.sale_id || lead.sale_owner_id || 0;
                    const salesMember = salesTeam.find((m) => m.id === saleId);
                    return (
                      <TableRow key={`${lead.leadId}-${lead.logId}`}>
                        <TableCell className="text-center text-sm whitespace-nowrap">
                          {formatDateShort(lead.created_at_thai)}
                        </TableCell>
                        <TableCell className="text-center text-sm">{salesMember?.name || "ไม่ระบุ"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {lead.platform}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{lead.display_name}</div>
                          <div className="text-xs text-gray-500">{lead.full_name}</div>
                        </TableCell>
                        <TableCell>
                          <PhoneLineCell tel={lead.tel} lineId={lead.line_id} />
                        </TableCell>
                        <TableCell className="text-center text-sm">{lead.region}</TableCell>
                        <TableCell>
                          <NotesPreview text={lead.lead_notes} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={getCategoryBadgeClassName(lead.category)}>
                            {lead.category || "ไม่ระบุ"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm min-w-[140px]">
                          {lead.quotationDocuments?.length ? (
                            <div className="space-y-1">
                              {lead.quotationDocuments.map((doc, i) => (
                                <div key={i} className="text-xs">
                                  <span className="text-blue-700">{doc.document_number}</span> — ฿
                                  {parseFloat(doc.amount || "0").toLocaleString()}
                                </div>
                              ))}
                              {lead.quotationDocuments.length > 1 && (
                                <div className="text-xs font-semibold text-emerald-700 pt-1 border-t">
                                  รวม ฿{lead.totalQuotationAmount?.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          ฿{(lead.avg_electricity_bill ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="link" className="h-auto p-0 text-teal-700" asChild>
                            <Link to={`/leads/${lead.leadId}`}>เปิด Lead</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {salesLeads.length === 0 && (
                <p className="text-center text-gray-500 py-8">ไม่มีข้อมูลในช่วงที่เลือก</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
