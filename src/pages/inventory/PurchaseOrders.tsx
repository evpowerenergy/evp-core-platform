import { useState, useMemo } from "react";
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
import { useInventoryDataAPI as useInventoryData } from "@/hooks/useInventoryDataAPI";

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // ใช้ centralized inventory data hook
  const { 
    data: inventoryData, 
    isLoading: inventoryLoading 
  } = useInventoryData({
    includeProducts: false,
    includeInventoryUnits: false,
    includePurchaseOrders: true,
    includeSuppliers: true,
    includeCustomers: false,
    includeSalesDocs: false
  });

  const { purchaseOrders = [], suppliers = [] } = inventoryData || {};

  // Filter purchase orders based on search only
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po: any) => {
      const matchesSearch = !searchTerm || 
        po.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [purchaseOrders, searchTerm]);

  const handleDelete = async (poId: string) => {
    if (window.confirm("คุณต้องการลบ Purchase Order นี้ใช่หรือไม่?")) {
      try {
        // Note: You'll need to implement deletePurchaseOrder in the hook
    
      } catch (error) {
        console.error('Error deleting purchase order:', error);
      }
    }
  };

  if (inventoryLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายการ Purchase Orders</h1>
          <p className="text-gray-600 mt-1">จัดการใบสั่งซื้อสินค้า</p>
        </div>
        <Button onClick={() => navigate('/inventory/purchase-orders/new')}>
          + สร้าง PO ใหม่
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการ Purchase Orders ({filteredPOs.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหา PO หรือ Supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>วันที่เปิด PO</TableHead>
                <TableHead>จำนวนสินค้า</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    ไม่พบรายการ Purchase Orders
                  </TableCell>
                </TableRow>
              ) : (
                filteredPOs.map((po: any) => {
                  const items = po.purchase_order_items || [];
                  const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.qty || 0), 0);
                  const totalAmount = items.reduce((sum: number, item: any) => {
                    if (typeof item.total_price === "number") return sum + item.total_price;
                    const qty = item.qty || 0;
                    const unitPrice = item.unit_price || 0;
                    return sum + qty * unitPrice;
                  }, 0);

                  return (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.suppliers?.name || 'ไม่ระบุ'}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {items.length === 0 ? (
                          <span>-</span>
                        ) : (
                          <ul className="space-y-1">
                            {items.map((item: any) => (
                              <li key={item.id}>
                                {(item.products?.name || `สินค้า ID ${item.product_id}`)}
                                <span className="text-gray-400"> (x{item.qty || 0})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell>
                        {po.po_date ? new Date(po.po_date).toLocaleDateString('th-TH') : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {totalQuantity} รายการ
                        </span>
                      </TableCell>
                      <TableCell>
                        {totalAmount > 0 ? `฿${totalAmount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/inventory/purchase-orders/${po.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/inventory/purchase-orders/${po.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(po.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}