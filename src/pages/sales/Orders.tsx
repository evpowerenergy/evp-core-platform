import { useState, useEffect } from "react";
import { Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { useInventoryDataAPI as useInventoryData } from "@/hooks/useInventoryDataAPI";
import { supabase } from "@/integrations/supabase/client";

interface SalesOrder {
  id: string;
  doc_number: string;
  customer_id: string;
  salesperson_id: string;
  doc_date: string;
  total_amount: number;
  note?: string;
  items?: any[];
  customer_name?: string;
  salesperson_name?: string;
  items_count?: number;
}

export default function SalesOrders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // ใช้ centralized inventory data hook
  const { 
    data: inventoryData, 
    isLoading: inventoryLoading 
  } = useInventoryData({
    includeProducts: false,
    includeInventoryUnits: false,
    includePurchaseOrders: false,
    includeSuppliers: false,
    includeCustomers: true,
    includeSalesDocs: true
  });

  const { salesDocs = [], customers = [] } = inventoryData || {};

  // Transform data to include customer names and items count
  const salesOrders = salesDocs.map(order => ({
    id: order.id,
    doc_number: order.doc_number,
    customer_id: order.customer_id,
    salesperson_id: order.salesperson_id,
    doc_date: order.doc_date,
    total_amount: order.total_amount,
    note: order.note,
    customer_name: order.customers?.name || 'ไม่ระบุ',
    salesperson_name: 'ไม่ระบุ', // ต้องดึงจาก sales_team_with_user_info แยก
    items_count: order.sales_doc_items?.length || 0
  }));

  // Load sales team data for salesperson names
  const [salesTeam, setSalesTeam] = useState<any[]>([]);
  const [salesTeamLoading, setSalesTeamLoading] = useState(true);

  useEffect(() => {
    const loadSalesTeam = async () => {
      try {
        const { data, error } = await supabase
          .from('sales_team_with_user_info')
          .select('user_id, name');
        
        if (error) {
          console.error('Error loading sales team:', error);
        } else {
          setSalesTeam(data || []);
        }
      } catch (error) {
        console.error('Error loading sales team:', error);
      } finally {
        setSalesTeamLoading(false);
      }
    };

    loadSalesTeam();
  }, []);

  // Update salesperson names with sales team data
  const salesOrdersWithNames = salesOrders.map(order => {
    const salesperson = salesTeam.find(s => s.user_id?.toString() === order.salesperson_id?.toString());
    return {
      ...order,
      salesperson_name: salesperson?.name || 'ไม่ระบุ'
    };
  });

  const loading = inventoryLoading || salesTeamLoading;

  const handleDelete = async (orderId: string) => {
    if (window.confirm("คุณต้องการลบ Sales Order นี้ใช่หรือไม่?")) {
      try {
        // Delete sales order items first (due to foreign key constraint)
        const { error: itemsError } = await supabase
          .from('sales_doc_items')
          .delete()
          .eq('sales_doc_id', orderId);
        
        if (itemsError) {
          console.error('Error deleting sales order items:', itemsError);
          throw itemsError;
        }

        // Delete sales order
        const { error: orderError } = await supabase
          .from('sales_docs')
          .delete()
          .eq('id', orderId);
        
        if (orderError) {
          console.error('Error deleting sales order:', orderError);
          throw orderError;
        }

        toast({
          title: "ลบสำเร็จ",
          description: "ลบ Sales Order เรียบร้อยแล้ว"
        });
        window.location.reload(); // Reload data
      } catch (error) {
        console.error('Error deleting sales order:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบ Sales Order ได้",
          variant: "destructive"
        });
      }
    }
  };

  const filteredOrders = salesOrdersWithNames.filter(order =>
    order.doc_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.salesperson_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายการขายออก</h1>
          <p className="text-gray-600 mt-1">จัดการรายการขายและใบ Invoice</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการขายทั้งหมด ({salesOrdersWithNames.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหา Invoice, ลูกค้า หรือ เซลล์..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {salesOrdersWithNames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium mb-2">ยังไม่มีข้อมูล Sales Orders</p>
              <p className="text-sm">สร้าง Sales Order ใหม่เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลข Invoice</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>เซลล์</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>จำนวนรายการ</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.doc_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.salesperson_name}</TableCell>
                    <TableCell>{order.doc_date}</TableCell>
                    <TableCell>{order.items_count || 0} รายการ</TableCell>
                    <TableCell>฿{order.total_amount?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/inventory/sales/orders/${order.id}`)}
                          title="ดูรายละเอียด"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/inventory/sales/orders/${order.id}/edit`)}
                          title="แก้ไข"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          title="ลบ"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
