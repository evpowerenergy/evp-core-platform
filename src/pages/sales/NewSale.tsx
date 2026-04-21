import { useState, useEffect, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { useCacheStrategy } from '@/lib/cacheStrategies';
import { ArrowLeft, Plus, Trash2, Package, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSalesTeamData } from "@/hooks/useAppDataAPI";

interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

interface SalesTeamMember {
  id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  current_leads: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit_price?: number;
  cost_price: number;
  current_stock?: number;
  stock_available?: number;
  supplier_id?: string;
  created_at?: string;
  updated_at?: string;
}

export default function NewSale() {
  const navigate = useNavigate();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ ใช้ useSalesTeamData hook เหมือนหน้า reports/sales-closed
  const { data: salesTeamData, isLoading: salesTeamLoading, error: salesTeamError } = useSalesTeamData();
  const { salesTeam = [] } = salesTeamData || {};

  // ✅ แก้ไข N+1 Queries: ใช้ React Query + Promise.all
  const staticCacheStrategy = useCacheStrategy('STATIC');
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error loading products:', error);
        throw error;
      }
      
      return (data || []) as Product[];
    },
    ...staticCacheStrategy, // ✅ ใช้ STATIC cache strategy
  });

  // Filter products to show only those with stock_available > 0
  const availableProducts = useMemo(() => {
    return (productsData || []).filter(product => 
      (product.stock_available || 0) > 0
    );
  }, [productsData]);

  // Update state when data is loaded
  useEffect(() => {
    if (productsData) {
      setProducts(productsData);
    }
  }, [productsData]);

  // Update loading state
  useEffect(() => {
    setLoading(salesTeamLoading || productsLoading);
  }, [salesTeamLoading, productsLoading]);

  // ✅ Error states are now handled by React Query automatically
  // No need for manual error state management

  // Mock data - replace with real data from your API
  // const products = [
  //   { id: "1", name: "สินค้า A", price: 1000 },
  //   { id: "2", name: "สินค้า B", price: 2000 },
  //   { id: "3", name: "สินค้า C", price: 1500 }
  // ];

  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      qty: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof SaleItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === "productId") {
          const product = products.find(p => p.id.toString() === value);
          if (product) {
            updatedItem.productName = product.name;
            // Don't auto-fill unitPrice, let user enter it manually
            // updatedItem.unitPrice = product.unit_price || 0;
            updatedItem.totalPrice = updatedItem.qty * updatedItem.unitPrice;
          }
        } else if (field === "qty") {
          updatedItem.totalPrice = updatedItem.qty * updatedItem.unitPrice;
        } else if (field === "unitPrice") {
          updatedItem.totalPrice = updatedItem.qty * updatedItem.unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate required fields
      if (!customerName.trim()) {
        alert('กรุณากรอกชื่อลูกค้า');
        return;
      }
      
      if (!salesPerson) {
        alert('กรุณาเลือกเซลล์');
        return;
      } 
      
      // Validate salesperson_id is a valid UUID string
      if (!salesPerson || salesPerson.trim() === '') {
        console.error('Invalid salesperson_id format:', salesPerson);
        alert('ข้อมูลเซลล์ไม่ถูกต้อง กรุณาเลือกเซลล์ใหม่');
        return;
      }
      
      if (items.length === 0) {
        alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
        return;
      }
      
      // Validate all items have product and quantity
      for (const item of items) {
        if (!item.productId || !item.qty || item.qty <= 0) {
          alert('กรุณากรอกข้อมูลรายการสินค้าให้ครบถ้วน');
          return;
        }
      }

      // First, create or find customer
      let customerId: string;
      
      // Check if customer already exists
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from('customers')
        .select('id')
        .eq('name', customerName.trim())
        .single();
      
      if (customerCheckError && customerCheckError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        console.error('Error checking customer:', customerCheckError);
        alert('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลลูกค้า');
        return;
      }
      
      if (existingCustomer) {
        // Use existing customer ID
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: createCustomerError } = await supabase
          .from('customers')
          .insert({
            name: customerName.trim(),
            email: '', // Optional
            tel: '', // Optional (using correct column name)
            status: 'active'
          })
          .select('id')
          .single();
        
        if (createCustomerError) {
          console.error('Error creating customer:', createCustomerError);
          alert('เกิดข้อผิดพลาดในการสร้างข้อมูลลูกค้า');
          return;
        }
        
        customerId = newCustomer.id;
      }

      // Create sales document
      const salesDoc = {
        doc_number: invoiceNumber,
        doc_type: 'INV' as const, // Invoice
        customer_id: customerId, // Use actual customer ID from database
        salesperson_id: salesPerson, // Keep as string (UUID or ID string)
        doc_date: saleDate,
        total_amount: totalAmount,
        note: note
        // Removed status field - not in database schema
      };

      // Insert sales document
      const { data: salesDocData, error: salesDocError } = await supabase
        .from('sales_docs')
        .insert(salesDoc)
        .select()
        .single();

      if (salesDocError) {
        console.error('Error creating sales document:', salesDocError);
        alert('เกิดข้อผิดพลาดในการบันทึกใบขาย');
        return;
      }

      // Create sales document items
      const salesDocItems = items.map(item => ({
        sales_doc_id: salesDocData.id,
        product_id: parseInt(item.productId),
        qty: item.qty,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('sales_doc_items')
        .insert(salesDocItems)
        .select();

      if (itemsError) {
        console.error('Error creating sales document items:', itemsError);
        alert('เกิดข้อผิดพลาดในการบันทึกรายการสินค้า');
        await supabase.from('sales_docs').delete().eq('id', salesDocData.id);
        return;
      }

      const cleanupSale = async () => {
        await supabase.from('sales_doc_items').delete().eq('sales_doc_id', salesDocData.id);
        await supabase.from('sales_docs').delete().eq('id', salesDocData.id);
      };

      const salesDocItemUnits: { sales_doc_item_id: string; inventory_unit_id: string }[] = [];

      for (let idx = 0; idx < (insertedItems?.length || 0); idx++) {
        const insertedItem = insertedItems![idx];
        const originalItem = items[idx];

        if (!originalItem || originalItem.qty <= 0) {
          continue;
        }

        const { data: availableUnits, error: unitsError } = await supabase
          .from('inventory_units')
          .select('id, serial_no')
          .eq('product_id', insertedItem.product_id)
          .eq('status', 'in_stock')
          .order('created_at', { ascending: true })
          .limit(originalItem.qty);

        if (unitsError) {
          console.error('Error fetching inventory units:', unitsError);
          alert('เกิดข้อผิดพลาดในการตรวจสอบสต็อกสินค้า');
          await cleanupSale();
          return;
        }

        if (!availableUnits || availableUnits.length < originalItem.qty) {
          alert(`สต็อกสินค้าสำหรับ "${originalItem.productName || 'สินค้า'}" ไม่เพียงพอ กรุณาตรวจสอบอีกครั้ง`);
          await cleanupSale();
          return;
        }

        availableUnits.forEach(unit => {
          salesDocItemUnits.push({
            sales_doc_item_id: insertedItem.id,
            inventory_unit_id: unit.id,
          });
        });
      }

      if (salesDocItemUnits.length > 0) {
        const { error: linkError } = await supabase
          .from('sales_doc_item_units')
          .insert(salesDocItemUnits);

        if (linkError) {
          console.error('Error linking inventory units to sales items:', linkError);
          alert('เกิดข้อผิดพลาดในการเชื่อม Serial ของสินค้า');
          await cleanupSale();
          return;
        }
      } else {
        alert('ไม่พบ Serial Number สำหรับสินค้าที่เลือก กรุณาตรวจสอบอีกครั้ง');
        await cleanupSale();
        return;
      }

      // Success - navigate back to sales list
      alert('บันทึกใบขายสำเร็จ!');
      navigate("/inventory/sales/orders");
      
    } catch (error) {
      console.error('Error submitting sales order:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/inventory/sales/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">สร้างใบขายใหม่</h1>
          <p className="text-gray-600 mt-1">สร้างใบขายพร้อมรายการสินค้าที่ขาย</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลใบขาย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">เลข Invoice</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV"
              />
            </div>
            <div>
              <Label htmlFor="saleDate">วันที่ขาย</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">ชื่อลูกค้า</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="พิมพ์ชื่อลูกค้าหรือบริษัท"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="salesPerson">เซลล์</Label>
              <Select value={salesPerson} onValueChange={setSalesPerson}>
                <SelectTrigger className={salesTeamError ? "border-red-500" : ""}>
                  <SelectValue placeholder={loading ? "กำลังโหลด..." : "เลือกเซลล์"} />
                </SelectTrigger>
                <SelectContent>
                  {salesTeam.map((member) => (
                    <SelectItem key={member.id} value={(member as any).user_id || member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {salesTeamError && (
                <p className="text-sm text-red-500 mt-1">ไม่สามารถโหลดข้อมูลเซลล์ได้</p>
              )}
              {loading && (
                <p className="text-sm text-gray-500 mt-1">กำลังโหลดข้อมูลเซลล์...</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="note">หมายเหตุ</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการสินค้าที่ขาย</CardTitle>
            <Button onClick={addItem} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มรายการสินค้า
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productsError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">ไม่สามารถโหลดข้อมูลสินค้าได้</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                ลองใหม่
              </Button>
            </div>
          )}
          
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">ยังไม่มีรายการสินค้า</p>
              <p className="text-sm">กดปุ่ม "เพิ่มรายการสินค้า" เพื่อเริ่มสร้างรายการสินค้าที่ขาย</p>
            </div>
          )}
          
          {items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>จำนวน</TableHead>
                  <TableHead>ราคาต่อหน่วย</TableHead>
                  <TableHead>ราคารวม</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateItem(item.id, "productId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสินค้า" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                              {product.sku && ` (${product.sku})`}
                              {` ---[ คงเหลือ: ${product.stock_available || 0} ชิ้น ]`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, "qty", parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={item.unitPrice || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          updateItem(item.id, "unitPrice", parseFloat(value) || 0);
                        }}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>฿{item.totalPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 flex justify-end">
            <div className="text-lg font-semibold">
              ยอดรวมทั้งสิ้น: ฿{totalAmount.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/inventory/sales/orders")}>
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700" disabled={submitting}>
          {submitting ? 'กำลังบันทึก...' : 'บันทึกใบขายและรายการสินค้า'}
        </Button>
      </div>
    </div>
  );
}
