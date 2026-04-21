import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Search, Edit, Trash2, Phone, Mail, MapPin, ShoppingBag } from "lucide-react";
import { useInventoryDataAPI as useInventoryData } from "@/hooks/useInventoryDataAPI";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { normalizePhoneNumber } from "@/utils/leadValidation";

interface Customer {
  id: string;
  name: string;
  tel?: string;
  email?: string;
  platform?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

interface FormState {
  name: string;
  tel: string;
  email: string;
  platform: string;
}

const initialForm: FormState = {
  name: "",
  tel: "",
  email: "",
  platform: "",
};

const Customers: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ใช้ centralized inventory data hook..
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

  const { customers = [], salesDocs = [] } = inventoryData || {};

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    // Normalize search term if it's a phone number (starts with digit)
    const isPhoneSearch = /^\d/.test(search);
    const normalizedSearchTerm = isPhoneSearch 
      ? normalizePhoneNumber(search) 
      : search.toLowerCase();

    return customers.filter((customer: Customer) => {
      // For phone searches, normalize both the search term and the phone number in the database
      const phoneMatches = customer.tel && isPhoneSearch
        ? normalizePhoneNumber(customer.tel).includes(normalizedSearchTerm)
        : customer.tel?.toLowerCase().includes(search.toLowerCase());
      
      const matchesSearch = !search || 
        customer.name?.toLowerCase().includes(search.toLowerCase()) ||
        phoneMatches ||
        customer.email?.toLowerCase().includes(search.toLowerCase());
      
      return matchesSearch;
    });
  }, [customers, search]);

  // Calculate customer statistics
  const customerStats = useMemo(() => {
    const totalCustomers = customers.length;
    const customersWithOrders = customers.filter(c => (c.total_orders || 0) > 0).length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const averageOrderValue = customersWithOrders > 0 ? totalRevenue / customersWithOrders : 0;

    return {
      totalCustomers,
      customersWithOrders,
      totalRevenue,
      averageOrderValue
    };
  }, [customers]);

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: FormState) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "เพิ่มลูกค้าใหม่เรียบร้อยแล้ว",
      });
      setForm(initialForm);
      setShowModal(false);
    },
    onError: (error) => {
      console.error('Error adding customer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มลูกค้าได้",
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
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
        description: "อัปเดตลูกค้าเรียบร้อยแล้ว",
      });
      setForm(initialForm);
      setShowModal(false);
      setEditingCustomer(null);
    },
    onError: (error) => {
      console.error('Error updating customer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตลูกค้าได้",
        variant: "destructive",
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      return customerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "ลบลูกค้าเรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error deleting customer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบลูกค้าได้",
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
      if (editingCustomer) {
        await updateCustomerMutation.mutateAsync({
          id: editingCustomer.id,
          ...form
        });
      } else {
        await addCustomerMutation.mutateAsync(form);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      tel: customer.tel || "",
      email: customer.email || "",
      platform: customer.platform || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('คุณต้องการลบลูกค้านี้ใช่หรือไม่?')) {
      try {
        await deleteCustomerMutation.mutateAsync(customerId);
      } catch (error) {
        console.error('Error deleting customer:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">จัดการลูกค้า</h1>
          <p className="text-gray-600 mt-1">เพิ่ม แก้ไข และจัดการข้อมูลลูกค้าในระบบ</p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มลูกค้าใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">ชื่อบริษัท/ลูกค้า *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="กรอกชื่อบริษัทหรือลูกค้า"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="tel">เบอร์โทรศัพท์</Label>
                  <Input
                    id="tel"
                    value={form.tel}
                    onChange={(e) => setForm({ ...form, tel: e.target.value })}
                    placeholder="กรอกเบอร์โทรศัพท์"
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
                  <Label htmlFor="platform">แพลตฟอร์ม</Label>
                  <Input
                    id="platform"
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    placeholder="กรอกแพลตฟอร์ม"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    setForm(initialForm);
                  }}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  disabled={addCustomerMutation.isPending || updateCustomerMutation.isPending}
                >
                  {addCustomerMutation.isPending || updateCustomerMutation.isPending 
                    ? 'กำลังบันทึก...' 
                    : editingCustomer ? 'อัปเดต' : 'เพิ่มลูกค้า'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              รายการทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าที่มีคำสั่งซื้อ</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.customersWithOrders}</div>
            <p className="text-xs text-muted-foreground">
              {customerStats.totalCustomers > 0 ? 
                `${((customerStats.customersWithOrders / customerStats.totalCustomers) * 100).toFixed(1)}%` : 
                '0%'} ของลูกค้าทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{customerStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              รายได้รวมจากลูกค้าทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มูลค่าคำสั่งซื้อเฉลี่ย</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{customerStats.averageOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              มูลค่าเฉลี่ยต่อคำสั่งซื้อ
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการลูกค้า ({filteredCustomers.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาลูกค้า..."
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
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ไม่พบลูกค้า
              </div>
            ) : (
              filteredCustomers.map((customer: Customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">{customer.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {customer.tel && (
                          <span className="flex items-center gap-1">
                            <span>📞</span>
                            {customer.tel}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                        )}
                        {customer.platform && (
                          <span className="flex items-center gap-1">
                            <span>💻</span>
                            {customer.platform}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                                             <p className="text-sm font-medium">
                         สถานะ: {customer.status || 'ไม่ระบุ'}
                       </p>
                       <p className="text-xs text-gray-500">
                         แพลตฟอร์ม: {customer.platform || 'ไม่ระบุ'}
                       </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default Customers;