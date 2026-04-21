import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Search, Edit, Trash2, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventoryDataAPI as useInventoryData } from "@/hooks/useInventoryDataAPI";
import { useProductsAPI as useProducts, useAddProductAPI as useAddProduct, useUpdateProductAPI as useUpdateProduct, useDeleteProductAPI as useDeleteProduct } from "@/hooks/useProductsAPI";

interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit_price?: number;
  cost_price: number;
  stock_total?: number;
  stock_available?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FormState {
  name: string;
  description: string;
  sku: string;
  category: string;
  unit_price: number;
  cost_price: number;
  stock_total: number;
  stock_available: number;
  is_active: boolean;
}

const initialForm: FormState = {
  name: "",
  description: "",
  sku: "",
  category: "",
  unit_price: 0,
  cost_price: 0,
  stock_total: 0,
  stock_available: 0,
  is_active: true,
};

const ProductManagement: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // ใช้ centralized inventory data hook - ดึงข้อมูลสินค้าทั้งหมด
  const { 
    data: inventoryData, 
    isLoading: inventoryLoading 
  } = useInventoryData({
    includeProducts: true,
    includeInventoryUnits: false,
    includePurchaseOrders: false,
    includeSuppliers: true,
    includeCustomers: false,
    includeSalesDocs: false,
    limit: 1000 // เพิ่ม limit ให้สูงขึ้นเพื่อดึงข้อมูลสินค้าทั้งหมด
  });

  // ใช้ specialized products hook - ดึงข้อมูลสินค้าทั้งหมด
  const { data: products = [] } = useProducts(undefined, 1000);
  
  // ใช้ mutations
  const addProductMutation = useAddProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const { products: allProducts = [], suppliers = [] } = inventoryData || {};
  
  // รวมข้อมูลสินค้าจากทั้งสองแหล่งเพื่อให้ได้ข้อมูลครบถ้วน
  const combinedProducts = useMemo(() => {
    const inventoryProducts = allProducts || [];
    const hookProducts = products || [];
    
    // สร้าง Map เพื่อรวมข้อมูลและหลีกเลี่ยงการซ้ำ
    const productMap = new Map();
    
    // เพิ่มข้อมูลจาก inventory data
    inventoryProducts.forEach(product => {
      productMap.set(product.id, product);
    });
    
    // เพิ่มหรืออัปเดตข้อมูลจาก products hook
    hookProducts.forEach(product => {
      if (productMap.has(product.id)) {
        // รวมข้อมูลจากทั้งสองแหล่ง
        const existing = productMap.get(product.id);
        productMap.set(product.id, { ...existing, ...product });
      } else {
        productMap.set(product.id, product);
      }
    });
    
    return Array.from(productMap.values());
  }, [allProducts, products]);

  // Filter products based on search, category, and status
  const filteredProducts = useMemo(() => {
    return combinedProducts.filter((product: Product) => {
      const matchesSearch = !search || 
        product.name?.toLowerCase().includes(search.toLowerCase()) ||
        product.sku?.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const stockAvailable = product.stock_available ?? product.stock_total ?? 0;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'in_stock' && stockAvailable > 0) ||
        (statusFilter === 'out_of_stock' && stockAvailable <= 0);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [combinedProducts, search, categoryFilter, statusFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(combinedProducts.map((p: Product) => p.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [combinedProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || form.cost_price <= 0) {
      return;
    }

    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          ...form
        });
      } else {
        await addProductMutation.mutateAsync(form);
      }

      setForm(initialForm);
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      sku: product.sku || "",
      category: product.category || "",
      unit_price: product.unit_price || 0,
      cost_price: product.cost_price || 0,
      stock_total: product.stock_total ?? product.stock_available ?? 0,
      stock_available: product.stock_available ?? product.stock_total ?? 0,
      is_active: product.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (productId: number) => {
    if (window.confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) {
      try {
        await deleteProductMutation.mutateAsync(productId);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'ไม่ระบุ';
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the list
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <h1 className="text-3xl font-bold text-gray-900">จัดการสินค้า</h1>
          <p className="text-gray-600 mt-1">เพิ่ม แก้ไข และจัดการข้อมูลสินค้าในระบบ</p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มสินค้าใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">ชื่อสินค้า *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="กรอกชื่อสินค้า"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="กรอก SKU"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">รายละเอียด</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="กรอกรายละเอียดสินค้า"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">หมวดหมู่</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="กรอกหมวดหมู่"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_price">ต้นทุน</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit_price">ราคาขาย</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    setForm(initialForm);
                  }}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  disabled={addProductMutation.isPending || updateProductMutation.isPending}
                >
                  {addProductMutation.isPending || updateProductMutation.isPending 
                    ? 'กำลังบันทึก...' 
                    : editingProduct ? 'อัปเดต' : 'เพิ่มสินค้า'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการสินค้า ({filteredProducts.length} รายการ) - แสดงหน้า {currentPage} จาก {totalPages}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">หมวดหมู่ทั้งหมด</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สถานะสต็อกทั้งหมด</SelectItem>
                  <SelectItem value="in_stock">มีของ</SelectItem>
                  <SelectItem value="out_of_stock">ของหมด</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ไม่พบสินค้า
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">SKU</TableHead>
                      <TableHead>สินค้า</TableHead>
                      <TableHead>หมวดหมู่</TableHead>
                      <TableHead className="text-right">ต้นทุน</TableHead>
                      <TableHead className="text-right">ราคาขาย</TableHead>
                      <TableHead className="text-right">สต็อกพร้อมขาย</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProducts.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.sku || 'ไม่ระบุ'}</TableCell>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell>{product.category || 'ไม่ระบุหมวดหมู่'}</TableCell>
                        <TableCell className="text-right">
                          ฿{product.cost_price?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{product.unit_price?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.stock_available ?? product.stock_total ?? 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={(product.stock_available ?? product.stock_total ?? 0) > 0 ? "default" : "destructive"}>
                            {(product.stock_available ?? product.stock_total ?? 0) > 0 ? 'มีของ' : 'ของหมด'}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredProducts.length > itemsPerPage && (
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-sm text-gray-500">
                  แสดง {startIndex + 1} ถึง {Math.min(endIndex, filteredProducts.length)} จาก {filteredProducts.length} รายการ
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    ก่อนหน้า
                  </Button>
                  
                  <div className="flex items-center space-x-1">
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
                          onClick={() => handlePageChange(pageNum)}
                          className="w-10 h-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;