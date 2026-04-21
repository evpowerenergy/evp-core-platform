import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inventoryAPI } from "@/lib/supabase/inventory";
import { supabase } from "@/integrations/supabase/client";

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ แก้ไข N+1 Queries: ใช้ React Query + Parallel Queries
  const { data: order, isLoading: loading, error } = useQuery({
    queryKey: ['sales-order-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID provided');
      
      try {
        // ✅ ดึงข้อมูลทั้งหมดพร้อมกัน (Parallel Queries)
        const [salesOrderResult, customerResult, salesTeamResult] = await Promise.all([
          // Query 1: Sales Order พร้อม Items
          supabase
            .from('sales_docs')
            .select(`
              *,
              items:sales_doc_items(
                *,
                products:product_id(
                  id,
                  name,
                  description,
                  sku
                )
              )
            `)
            .eq('id', id)
            .single(),
          
          // Query 2: Customer (ต้องดึง customer_id ก่อน)
          supabase
            .from('sales_docs')
            .select('customer_id')
            .eq('id', id)
            .single()
            .then(async ({ data: orderData, error: orderError }) => {
              if (orderError || !orderData) throw orderError || new Error('Order not found');
              
              return supabase
                .from('customers')
                .select('*')
                .eq('id', orderData.customer_id)
                .single();
            }),
          
          // Query 3: Sales Team (ต้องดึง salesperson_id ก่อน)
          supabase
            .from('sales_docs')
            .select('salesperson_id')
            .eq('id', id)
            .single()
            .then(async ({ data: orderData, error: orderError }) => {
              if (orderError || !orderData) throw orderError || new Error('Order not found');
              
              return supabase
                .from('sales_team_with_user_info')
                .select('user_id, name')
                .eq('user_id', orderData.salesperson_id)
                .single();
            })
        ]);

        // ตรวจสอบ errors
        const { data: salesOrder, error: salesError } = salesOrderResult;
        const { data: customer, error: customerError } = customerResult;
        const { data: salesTeam, error: teamError } = salesTeamResult;

        if (salesError) throw salesError;
        if (customerError) throw customerError;
        if (teamError) throw teamError;

        // แปลงข้อมูลให้ตรงกับ UI
        return {
          id: salesOrder.id,
          invoiceNumber: salesOrder.doc_number,
          customerName: customer.name,
          customerPhone: customer.tel || 'ไม่ระบุ',
          customerEmail: customer.email || 'ไม่ระบุ',
          salesperson: salesTeam?.name || 'ไม่ระบุ',
          saleDate: salesOrder.doc_date,
          totalAmount: salesOrder.total_amount || 0,
          items: salesOrder.items?.map((item: any) => ({
            id: item.id,
            productName: item.products?.name || 'ไม่ระบุ',
            quantity: item.qty,
            unitPrice: item.unit_price,
            totalPrice: item.total_price
          })) || [],
          notes: salesOrder.note || '',
          createdAt: salesOrder.created_at
        };
      } catch (error) {
        console.error('Error loading sales order:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // cache 5 นาที
    gcTime: 1000 * 60 * 30,   // cache 30 นาที
    refetchOnWindowFocus: false,
    enabled: !!id
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">รอดำเนินการ</Badge>;
      case "confirmed":
        return <Badge variant="default">ยืนยันแล้ว</Badge>;
      case "shipped":
        return <Badge variant="outline">จัดส่งแล้ว</Badge>;
      case "delivered":
        return <Badge variant="default">จัดส่งสำเร็จ</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ยกเลิก</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEdit = () => {
    navigate(`/inventory/sales/orders/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm(`คุณต้องการลบ Sales Order ${order?.invoiceNumber} ใช่หรือไม่?`)) {
      try {
        // ลบ sales order items ก่อน (due to foreign key constraint)
        const { error: itemsError } = await supabase
          .from('sales_doc_items')
          .delete()
          .eq('sales_doc_id', id);
        
        if (itemsError) {
          console.error('Error deleting sales order items:', itemsError);
          alert('เกิดข้อผิดพลาดในการลบรายการสินค้า');
          return;
        }

        // ลบ sales order
        const { error: orderError } = await supabase
          .from('sales_docs')
          .delete()
          .eq('id', id);
        
        if (orderError) {
          console.error('Error deleting sales order:', orderError);
          alert('เกิดข้อผิดพลาดในการลบ Sales Order');
          return;
        }

        alert('ลบ Sales Order สำเร็จ');
        navigate("/inventory/sales/orders");
      } catch (error) {
        console.error('Error deleting sales order:', error);
        alert('เกิดข้อผิดพลาดในการลบ Sales Order');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">ไม่พบข้อมูล</h2>
          <p className="text-gray-600 mt-2">ไม่สามารถโหลดข้อมูล Sales Order ได้</p>
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
            onClick={() => navigate("/inventory/sales/orders")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Order: {order.invoiceNumber}</h1>
            <p className="text-gray-600 mt-1">รายละเอียดใบขายสินค้า</p>
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
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            ลบ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูล Sales Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                  <p className="text-lg font-semibold">{order.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">สถานะ</label>
                  <div className="mt-1">
                    <Badge variant="secondary">รอดำเนินการ</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">วันที่ขาย</label>
                  <p className="text-lg">{order.saleDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">พนักงานขาย</label>
                  <p className="text-lg">{order.salesperson}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>รายการสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {order.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">฿{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{item.totalPrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-right">
                <p className="text-lg font-semibold">
                  ยอดรวม: ฿{order.totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">ชื่อบริษัท</label>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">โทรศัพท์</label>
                <p className="text-sm">{order.customerPhone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">อีเมล</label>
                <p className="text-sm">{order.customerEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>หมายเหตุ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลระบบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">วันที่สร้าง</label>
                <p className="text-sm">{order.createdAt}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
