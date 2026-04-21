import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { useInventoryDataAPI as useInventoryData } from "@/hooks/useInventoryDataAPI";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormState {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
}

const initialForm: FormState = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  tax_id: "",
};

const Suppliers: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ใช้ centralized inventory data hook
  const { 
    data: inventoryData, 
    isLoading: inventoryLoading 
  } = useInventoryData({
    includeProducts: false,
    includeInventoryUnits: false,
    includePurchaseOrders: false,
    includeSuppliers: true,
    includeCustomers: false,
    includeSalesDocs: false
  });

  const { suppliers = [] } = inventoryData || {};

  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier: Supplier) => {
      const matchesSearch = !search || 
        supplier.name?.toLowerCase().includes(search.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(search.toLowerCase()) ||
        supplier.phone?.toLowerCase().includes(search.toLowerCase());
      
      return matchesSearch;
    });
  }, [suppliers, search]);

  // Add supplier mutation
  const addSupplierMutation = useMutation({
    mutationFn: async (supplierData: FormState) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "เพิ่ม Supplier ใหม่เรียบร้อยแล้ว",
      });
      setForm(initialForm);
      setShowModal(false);
    },
    onError: (error) => {
      console.error('Error adding supplier:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่ม Supplier ได้",
        variant: "destructive",
      });
    },
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "อัปเดต Supplier เรียบร้อยแล้ว",
      });
      setForm(initialForm);
      setShowModal(false);
      setEditingSupplier(null);
    },
    onError: (error) => {
      console.error('Error updating supplier:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดต Supplier ได้",
        variant: "destructive",
      });
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;
      return supplierId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "ลบ Supplier เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error deleting supplier:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบ Supplier ได้",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name) {
      return;
    }

    try {
      if (editingSupplier) {
        await updateSupplierMutation.mutateAsync({
          id: editingSupplier.id,
          ...form
        });
      } else {
        await addSupplierMutation.mutateAsync(form);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      tax_id: supplier.tax_id || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (window.confirm('คุณต้องการลบ Supplier นี้ใช่หรือไม่?')) {
      try {
        await deleteSupplierMutation.mutateAsync(supplierId);
      } catch (error) {
        console.error('Error deleting supplier:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">จัดการ Suppliers</h1>
          <p className="text-gray-600 mt-1">เพิ่ม แก้ไข และจัดการข้อมูลผู้จัดจำหน่าย</p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่ม Supplier ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'แก้ไข Supplier' : 'เพิ่ม Supplier ใหม่'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">ชื่อบริษัท *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="กรอกชื่อบริษัท"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_person">ผู้ติดต่อ</Label>
                  <Input
                    id="contact_person"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    placeholder="กรอกชื่อผู้ติดต่อ"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="กรอกอีเมล"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="กรอกเบอร์โทรศัพท์"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">ที่อยู่</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="กรอกที่อยู่"
                />
              </div>
              
              <div>
                <Label htmlFor="tax_id">เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  id="tax_id"
                  value={form.tax_id}
                  onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                  placeholder="กรอกเลขประจำตัวผู้เสียภาษี"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
                    setForm(initialForm);
                  }}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  disabled={addSupplierMutation.isPending || updateSupplierMutation.isPending}
                >
                  {addSupplierMutation.isPending || updateSupplierMutation.isPending 
                    ? 'กำลังบันทึก...' 
                    : editingSupplier ? 'อัปเดต' : 'เพิ่ม Supplier'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการ Suppliers ({filteredSuppliers.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหา Supplier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ไม่พบ Supplier
              </div>
            ) : (
              filteredSuppliers.map((supplier: Supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <Building2 className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-medium">{supplier.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {supplier.contact_person && (
                          <span className="flex items-center gap-1">
                            <span>👤</span>
                            {supplier.contact_person}
                          </span>
                        )}
                        {supplier.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </span>
                        )}
                        {supplier.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </span>
                        )}
                      </div>
                      {supplier.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {supplier.address}
                        </p>
                      )}
                      {supplier.tax_id && (
                        <p className="text-xs text-gray-400 mt-1">
                          เลขประจำตัวผู้เสียภาษี: {supplier.tax_id}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(supplier.id)}
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

export default Suppliers;