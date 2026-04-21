import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FileText, ShoppingCart } from "lucide-react";

interface InventorySerialLedgerRow {
  id: string;
  serial_no: string;
  inventory_unit_id: string;
  inventory_status: "in_stock" | "reserved" | "sold" | "returned" | "damaged";
  last_movement_type: "IN" | "OUT" | null;
  last_movement_at: string | null;
  product_id: number | null;
  product_sku: string | null;
  product_name: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  po_id: string | null;
  po_number: string | null;
  po_date: string | null;
  sales_doc_id: string | null;
  sales_doc_number: string | null;
  sales_doc_type: "QT" | "BL" | "INV" | null;
  sales_doc_date: string | null;
  customer_id: string | null;
  customer_name: string | null;
  salesperson_id: string | null;
  salesperson_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusOptions: { value: InventorySerialLedgerRow["inventory_status"] | "all"; label: string }[] = [
  { value: "all", label: "สถานะทั้งหมด" },
  { value: "in_stock", label: "พร้อมขาย (in_stock)" },
  { value: "reserved", label: "จอง (reserved)" },
  { value: "sold", label: "ขายแล้ว (sold)" },
  { value: "returned", label: "คืนสินค้า (returned)" },
  { value: "damaged", label: "เสียหาย (damaged)" },
];

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
  }).format(date);
};

const InventorySerialLedger = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InventorySerialLedgerRow["inventory_status"] | "all">("all");

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventory-serial-ledger"],
    queryFn: async (): Promise<InventorySerialLedgerRow[]> => {
      const { data, error } = await supabase
        .from("inventory_serial_ledger")
        .select("*")
        .order("last_movement_at", { ascending: false })
        .limit(1000);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    const term = searchTerm.trim().toLowerCase();

    return data.filter((row) => {
      const matchesStatus =
        statusFilter === "all" || row.inventory_status === statusFilter;

      const haystack = [
        row.serial_no,
        row.product_name,
        row.product_sku,
        row.po_number,
        row.sales_doc_number,
        row.customer_name,
        row.supplier_name,
        row.salesperson_name,
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());

      const matchesSearch =
        term.length === 0 ||
        haystack.some((value) => value.includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [data, searchTerm, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            คลัง Serial / Inventory Serial Ledger
          </h1>
          <p className="text-gray-600 mt-1">
            ตรวจสอบเส้นทางสินค้าแบบ Serial ตั้งแต่รับเข้า PO จนถึงการขายออก
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          รีเฟรช
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                ค้นหา (Serial, SKU, ชื่อสินค้า, PO, ใบขาย, ลูกค้า, ผู้ขาย)
              </label>
              <Input
                placeholder="เช่น 12345 / INV-001 / Huawei"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                สถานะสินค้า
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as typeof statusFilter)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            แสดง {filteredData.length.toLocaleString()} รายการ
            {searchTerm || statusFilter !== "all"
              ? ` (จากทั้งหมด ${data?.length.toLocaleString() ?? 0} รายการ)`
              : ""}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการ Serial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">#</TableHead>
                    <TableHead>ว/ด/ป (เปิด PO)</TableHead>
                    <TableHead>รายการสินค้า</TableHead>
                    <TableHead>เลข S/N</TableHead>
                    <TableHead>PO รับเข้า</TableHead>
                    <TableHead>เลข INV</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>เซลล์</TableHead>
                    <TableHead>ซัพพลายเออร์ / ผู้ขาย</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-center font-medium cursor-default">
                          {index + 1}
                        </TableCell>
                        <TableCell className="whitespace-nowrap cursor-default">
                          <span>{formatDate(row.po_date)}</span>
                          <br />
                          <span className="text-xs text-gray-500">
                            รับเข้า: {formatDateTime(row.created_at ?? row.last_movement_at)}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap cursor-default">
                          <span className="font-medium">{row.product_name || "-"}</span>
                          <br />
                          <span className="text-xs text-gray-500">
                            SKU: {row.product_sku ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell className="cursor-default">
                          <span>{row.serial_no || "-"}</span>
                        </TableCell>
                        <TableCell className="cursor-default">{row.po_number || "-"}</TableCell>
                        <TableCell className="cursor-default">
                          <div>{row.sales_doc_number || "-"}</div>
                          <div className="text-xs text-gray-500">
                            {row.sales_doc_type ? `ประเภท: ${row.sales_doc_type}` : ""}
                          </div>
                        </TableCell>
                        <TableCell className="cursor-default">{row.customer_name || "-"}</TableCell>
                        <TableCell className="cursor-default">{row.salesperson_name || "-"}</TableCell>
                        <TableCell className="cursor-default">{row.supplier_name || "-"}</TableCell>
                        <TableCell className="text-center cursor-default">
                          <Badge
                            variant={
                              row.inventory_status === "sold"
                                ? "destructive"
                                : row.inventory_status === "in_stock"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {row.inventory_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {row.po_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/inventory/purchase-orders/${row.po_id}`)}
                                className="gap-1"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                ใบ-PO
                              </Button>
                            )}
                            {row.sales_doc_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/inventory/sales/orders/${row.sales_doc_id}`)}
                                className="gap-1"
                              >
                                <ShoppingCart className="h-3.5 w-3.5" />
                                ใบขาย
                              </Button>
                            )}
                            {!row.po_id && !row.sales_doc_id && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventorySerialLedger;

