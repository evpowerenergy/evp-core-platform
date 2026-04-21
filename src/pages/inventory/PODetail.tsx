import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePurchaseOrderDetailAPI as usePurchaseOrderDetail, useDeletePurchaseOrderAPI as useDeletePurchaseOrder } from "@/hooks/useInventoryDataAPI";
import { useToast } from "@/hooks/useToast";

const formatThaiTimestamp = (thaiValue?: string | null, fallbackValue?: string | null) => {
  if (thaiValue) {
    try {
      return new Date(thaiValue).toLocaleString("th-TH", { timeZone: "UTC" });
    } catch (error) {
      console.warn("Failed to format thai timestamp", thaiValue, error);
      return thaiValue;
    }
  }

  if (fallbackValue) {
    try {
      return new Date(fallbackValue).toLocaleString("th-TH");
    } catch (error) {
      console.warn("Failed to format fallback timestamp", fallbackValue, error);
      return fallbackValue;
    }
  }

  return "-";
};

export default function PODetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ใช้ hook สำหรับดึงข้อมูล PO
  const { 
    data: po, 
    isLoading, 
    error 
  } = usePurchaseOrderDetail(id!);
  
  // ใช้ hook สำหรับลบ PO
  const deletePOMutation = useDeletePurchaseOrder();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">รอดำเนินการ</Badge>;
      case "approved":
        return <Badge variant="default">อนุมัติแล้ว</Badge>;
      case "received":
        return <Badge variant="outline">รับสินค้าแล้ว</Badge>;
      default:
        return <Badge variant="secondary">{status || 'ไม่ระบุ'}</Badge>;
    }
  };

  const handleEdit = () => {
    navigate(`/inventory/purchase-orders/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm(`คุณต้องการลบ Purchase Order นี้ใช่หรือไม่?`)) {
      try {
        await deletePOMutation.mutateAsync(id!);
        navigate("/inventory/purchase-orders");
      } catch (error) {
        console.error('Error deleting PO:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">ไม่พบข้อมูล</h2>
          <p className="text-gray-600 mt-2">ไม่สามารถโหลดข้อมูล Purchase Order ได้</p>
          <Button 
            onClick={() => navigate("/inventory/purchase-orders")}
            className="mt-4"
          >
            กลับไปหน้ารายการ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/inventory/purchase-orders")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Order: {po.po_number}</h1>
            <p className="text-gray-600 mt-1">รายละเอียดใบสั่งซื้อสินค้า</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            ดาวน์โหลด
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            พิมพ์
          </Button>
          <Button onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            แก้ไข
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            className="gap-2"
            disabled={deletePOMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            {deletePOMutation.isPending ? "กำลังลบ..." : "ลบ"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO Details */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูล Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">PO Number</label>
                  <p className="text-lg font-semibold">{po.po_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">สถานะ</label>
                  <div className="mt-1">
                    <Badge variant='secondary'>รอดำเนินการ</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">วันที่สร้าง</label>
                  <p className="text-lg">
                    {po.po_date ? new Date(po.po_date).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">มูลค่ารวม</label>
                  <p className="text-lg font-semibold">
                    ฿{(po.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              {po.note && (
                <div>
                  <label className="text-sm font-medium text-gray-500">หมายเหตุ</label>
                  <p className="text-sm mt-1">{po.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>รายการสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              {po.purchase_order_items && po.purchase_order_items.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>สินค้า</TableHead>
                        <TableHead className="text-right">จำนวน</TableHead>
                        <TableHead className="text-right">ราคาต่อหน่วย</TableHead>
                        <TableHead className="text-right">ราคารวม</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.purchase_order_items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.products?.name || 'ไม่ระบุ'}
                          </TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">฿{item.unit_price?.toLocaleString()}</TableCell>
                          <TableCell className="text-right">฿{item.total_price?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 text-right">
                    <p className="text-lg font-semibold">
                      ยอดรวม: ฿{(po.total_amount || 0).toLocaleString()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>ไม่มีรายการสินค้า</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูล Supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">ชื่อบริษัท</label>
                <p className="font-medium">{po.suppliers?.name || 'ไม่ระบุ'}</p>
              </div>
              {po.suppliers?.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">ที่อยู่</label>
                  <p className="text-sm">{po.suppliers.address}</p>
                </div>
              )}
              {po.suppliers?.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">โทรศัพท์</label>
                  <p className="text-sm">{po.suppliers.phone}</p>
                </div>
              )}
              {po.suppliers?.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">อีเมล</label>
                  <p className="text-sm">{po.suppliers.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลระบบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">วันที่สร้าง (เวลาไทย)</label>
                <p className="text-sm">
                  {formatThaiTimestamp(po.created_at_thai, po.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">อัปเดตล่าสุด (เวลาไทย)</label>
                <p className="text-sm">
                  {formatThaiTimestamp(po.updated_at_thai, po.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

