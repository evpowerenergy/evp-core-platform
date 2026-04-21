import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { PageLoading } from "@/components/ui/loading";

interface Product {
  id: number;
  name: string;
  category: string;
  unit_price: number;
  cost_price: number;
  description: string;
  is_active: boolean;
  created_at_thai: string;
}

interface FormState {
  name: string;
  category: string;
  unit_price: number;
  cost_price: number;
  description: string;
}

interface ProductInsert {
  name: string;
  category: string;
  unit_price: number;
  cost_price: number;
  description: string;
}

const initialForm: FormState = {
  name: "",
  category: "",
  unit_price: 0,
  cost_price: 0,
  description: "",
};

const ProductManagement: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch products with React Query
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, unit_price, cost_price, description, is_active, created_at_thai")
        .order("id", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // cache 5 นาที
    gcTime: 1000 * 60 * 30, // cache 30 นาที
    refetchOnWindowFocus: false,
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (insertData: ProductInsert) => {
      const { error } = await supabase.from("products").insert([insertData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setForm(initialForm);
      toast({
        title: "สำเร็จ",
        description: "เพิ่มผลิตภัณฑ์เรียบร้อยแล้ว",
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "สำเร็จ",
        description: "ลบผลิตภัณฑ์เรียบร้อยแล้ว",
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductInsert }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setForm(initialForm);
      setEditingProduct(null);
      toast({
        title: "สำเร็จ",
        description: "อัปเดตผลิตภัณฑ์เรียบร้อยแล้ว",
      });
    },
    onError: (error: any) => {
      setError(error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle add/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const insertData: ProductInsert = {
      name: form.name,
      category: form.category,
      unit_price: form.unit_price,
      cost_price: form.cost_price,
      description: form.description,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: insertData });
    } else {
      addProductMutation.mutate(insertData);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบผลิตภัณฑ์นี้?')) {
      deleteProductMutation.mutate(id);
    }
  };

  // Handle edit
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      unit_price: product.unit_price,
      cost_price: product.cost_price,
      description: product.description,
    });
    setShowModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setForm(initialForm);
    setEditingProduct(null);
    setError(null);
  };

  // Products Table with Pagination and Search
  const filteredProducts = useMemo(() =>
    products.filter(product =>
      (product.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (product.category?.toLowerCase() || '').includes(search.toLowerCase())
    ),
    [products, search]
  );
  const productsPerPage = 20;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = useMemo(() =>
    filteredProducts.slice((page - 1) * productsPerPage, page * productsPerPage),
    [filteredProducts, page]
  );

  if (isLoading) {
    return <PageLoading type="table" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการผลิตภัณฑ์</h1>
          <p className="text-gray-600 mb-1">จัดการรายการผลิตภัณฑ์และราคา</p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('th-TH', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
          {/* Search Bar */}
          <input
            type="text"
            className="border rounded px-3 py-2 w-full max-w-xs md:mr-4"
            placeholder="ค้นหาชื่อหรือประเภทการขายสินค้า..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มผลิตภัณฑ์
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'แก้ไขผลิตภัณฑ์' : 'เพิ่มผลิตภัณฑ์ใหม่'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">ชื่อผลิตภัณฑ์</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">ประเภทการขาย</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_price">ราคาขาย (บาท)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      value={form.unit_price}
                      onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost_price">ต้นทุน (บาท)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      value={form.cost_price}
                      onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">รายละเอียด</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleModalClose}>
                    ยกเลิก
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addProductMutation.isPending || updateProductMutation.isPending}
                  >
                    {editingProduct ? 'อัปเดต' : 'เพิ่ม'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow border p-4 mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ชื่อสินค้า</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ประเภทการขาย</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ราคาขาย</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ต้นทุน</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">กำไร</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">รายละเอียด</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">วันที่สร้าง</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400">ไม่พบสินค้า</td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-2 font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-2 text-gray-700">{product.category}</td>
                      <td className="px-4 py-2 text-gray-700">{product.unit_price != null ? product.unit_price.toLocaleString() : '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{product.cost_price != null ? product.cost_price.toLocaleString() : '-'}</td>
                      <td className="px-4 py-2 text-green-700 font-semibold">{(product.unit_price != null && product.cost_price != null) ? (product.unit_price - product.cost_price).toLocaleString() : '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{product.description || '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{product.created_at_thai ? (() => {
                        const date = new Date(product.created_at_thai);
                        const year = date.getFullYear();
                        const month = date.getMonth() + 1;
                        const day = date.getDate();
                        
                        // แสดงผลแบบไทย
                        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                        return `${day} ${monthNames[month - 1]} ${year}`;
                      })() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 font-semibold disabled:opacity-50"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                ก่อนหน้า
              </button>
              <span className="px-2 py-1 text-gray-700">หน้า {page} / {totalPages}</span>
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-700 font-semibold disabled:opacity-50"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีผลิตภัณฑ์</h3>
            <p className="text-gray-600">เริ่มต้นด้วยการเพิ่มผลิตภัณฑ์แรกของคุณ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement; 