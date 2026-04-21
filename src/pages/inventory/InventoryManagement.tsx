import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Search, Edit, Trash2 } from "lucide-react";
import { useInventoryDataAPI as useInventoryData, useAddInventoryUnitAPI as useAddInventoryUnit } from "@/hooks/useInventoryDataAPI";
import { useProductsAPI as useProducts, useAddProductAPI as useAddProduct, useUpdateProductAPI as useUpdateProduct, useDeleteProductAPI as useDeleteProduct } from "@/hooks/useProductsAPI";

interface InventoryUnit {
  id: string;
  product_id: number;
  serial_no: string;
  status: 'in_stock' | 'sold' | 'reserved' | 'damaged' | 'returned';
  received_date: string;
  created_at: string;
  products?: {
    name: string;
    category: string;
    brand?: string;
    model?: string;
  };
}

interface Product {
  id: number;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  is_serialized: boolean;
}

interface FormState {
  product_id: number;
  serial_no: string;
  status: 'in_stock' | 'sold' | 'reserved' | 'damaged' | 'returned';
  received_date: string;
}

const initialForm: FormState = {
  product_id: 0,
  serial_no: "",
  status: 'in_stock',
  received_date: new Date().toISOString().split('T')[0],
};

const InventoryManagement: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingUnit, setEditingUnit] = useState<InventoryUnit | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ใช้ centralized inventory data hook
  const { 
    data: inventoryData, 
    isLoading: inventoryLoading,
    addInventoryUnit,
    isAddingInventoryUnit
  } = useInventoryData({
    includeProducts: true,
    includeInventoryUnits: true,
    includePurchaseOrders: false,
    includeSuppliers: false,
    includeCustomers: false,
    includeSalesDocs: false
  });

  // ใช้ specialized products hook
  const { data: products = [] } = useProducts(undefined, 1000);
  
  // ใช้ mutations
  const addProductMutation = useAddProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const { products: allProducts = [], inventoryUnits = [] } = inventoryData || {};

  // Filter inventory units based on search and status
  const filteredInventoryUnits = useMemo(() => {
    return inventoryUnits.filter((unit: InventoryUnit) => {
      const matchesSearch = !search || 
        unit.serial_no?.toLowerCase().includes(search.toLowerCase()) ||
        unit.products?.name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [inventoryUnits, search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.product_id || !form.serial_no) {
      return;
    }

    try {
      await addInventoryUnit({
        product_id: form.product_id,
        serial_no: form.serial_no,
        status: form.status,
        received_date: form.received_date
      });

      setForm(initialForm);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding inventory unit:', error);
    }
  };

  const handleEdit = (unit: InventoryUnit) => {
    setEditingUnit(unit);
    setForm({
      product_id: unit.product_id,
      serial_no: unit.serial_no,
      status: unit.status,
      received_date: unit.received_date
    });
    setShowModal(true);
  };

  const handleDelete = async (unitId: string) => {
    if (window.confirm('คุณต้องการลบหน่วยสินค้านี้ใช่หรือไม่?')) {
      try {
        // Note: You'll need to implement deleteInventoryUnit in the hook
    
      } catch (error) {
        console.error('Error deleting inventory unit:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_stock: { label: 'ในคลัง', variant: 'default' as const },
      sold: { label: 'ขายแล้ว', variant: 'secondary' as const },
      reserved: { label: 'จองแล้ว', variant: 'outline' as const },
      damaged: { label: 'เสียหาย', variant: 'destructive' as const },
      returned: { label: 'คืนแล้ว', variant: 'secondary' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_stock;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <h1 className="text-3xl font-bold text-gray-900">จัดการคลังสินค้า</h1>
          <p className="text-gray-600 mt-1">จัดการสินค้าและหน่วยสินค้าในคลัง</p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มหน่วยสินค้า
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? 'แก้ไขหน่วยสินค้า' : 'เพิ่มหน่วยสินค้าใหม่'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product">สินค้า</Label>
                <Select
                  value={form.product_id.toString()}
                  onValueChange={(value) => setForm({ ...form, product_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสินค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="serial_no">Serial Number</Label>
                <Input
                  id="serial_no"
                  value={form.serial_no}
                  onChange={(e) => setForm({ ...form, serial_no: e.target.value })}
                  placeholder="กรอก Serial Number"
                />
              </div>
              
              <div>
                <Label htmlFor="status">สถานะ</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: any) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">ในคลัง</SelectItem>
                    <SelectItem value="sold">ขายแล้ว</SelectItem>
                    <SelectItem value="reserved">จองแล้ว</SelectItem>
                    <SelectItem value="damaged">เสียหาย</SelectItem>
                    <SelectItem value="returned">คืนแล้ว</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="received_date">วันที่รับเข้า</Label>
                <Input
                  id="received_date"
                  type="date"
                  value={form.received_date}
                  onChange={(e) => setForm({ ...form, received_date: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isAddingInventoryUnit}>
                  {isAddingInventoryUnit ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการหน่วยสินค้า ({filteredInventoryUnits.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหา Serial Number หรือชื่อสินค้า..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="in_stock">ในคลัง</SelectItem>
                  <SelectItem value="sold">ขายแล้ว</SelectItem>
                  <SelectItem value="reserved">จองแล้ว</SelectItem>
                  <SelectItem value="damaged">เสียหาย</SelectItem>
                  <SelectItem value="returned">คืนแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInventoryUnits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ไม่พบหน่วยสินค้า
              </div>
            ) : (
              filteredInventoryUnits.map((unit: InventoryUnit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <Package className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">{unit.products?.name || 'ไม่ระบุสินค้า'}</h3>
                      <p className="text-sm text-gray-500">
                        Serial: {unit.serial_no} • {unit.products?.category || 'ไม่ระบุหมวดหมู่'}
                      </p>
                      <p className="text-xs text-gray-400">
                        วันที่รับเข้า: {new Date(unit.received_date).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(unit.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(unit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(unit.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;