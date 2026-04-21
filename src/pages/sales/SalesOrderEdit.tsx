import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";

export default function SalesOrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    salesperson: "",
    saleDate: "",
    notes: "",
    items: [] as any[]
  });

  // ดึงข้อมูลจริงจาก database
  useEffect(() => {
    const loadSalesOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // ดึงข้อมูล sales order พร้อม items
        const { data: salesOrder, error: salesError } = await supabase
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
          .single();
        
        if (salesError) throw salesError;

        // ดึงข้อมูลลูกค้า
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', salesOrder.customer_id)
          .single();
        
        if (customerError) throw customerError;

        // ดึงข้อมูล sales team
        const { data: salesTeam, error: teamError } = await supabase
          .from('sales_team_with_user_info')
          .select('user_id, name')
          .eq('user_id', salesOrder.salesperson_id)
          .single();
        
        if (teamError) throw teamError;

        // แปลงข้อมูลให้ตรงกับ UI
        setFormData({
          customerName: customer.name,
          customerPhone: customer.tel || '',
          customerEmail: customer.email || '',
          salesperson: salesTeam?.name || '',
          saleDate: salesOrder.doc_date,
          notes: salesOrder.note || '',
          items: salesOrder.items?.map((item: any) => ({
            id: item.id,
            productName: item.products?.name || '',
            quantity: item.qty,
            unitPrice: item.unit_price,
            totalPrice: item.total_price
          })) || []
        });
        
      } catch (error) {
        console.error('Error loading sales order:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูล Sales Order ได้",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSalesOrder();
  }, [id, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      productName: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "บันทึกสำเร็จ",
      description: `แก้ไข Sales Order ${id} เรียบร้อยแล้ว`,
    });
    
    setSaving(false);
    navigate(`/inventory/sales/orders/${id}`);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/inventory/sales/orders/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">แก้ไข Sales Order: {id}</h1>
            <p className="text-gray-600 mt-1">แก้ไขข้อมูลใบขายสินค้า</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูล Sales Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="saleDate">วันที่ขาย</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => handleInputChange("saleDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="salesperson">พนักงานขาย</Label>
                  <Input
                    id="salesperson"
                    value={formData.salesperson}
                    onChange={(e) => handleInputChange("salesperson", e.target.value)}
                    placeholder="ชื่อพนักงานขาย"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>รายการสินค้า</CardTitle>
                <Button onClick={addItem} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  เพิ่มรายการ
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">รายการที่ {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>ชื่อสินค้า</Label>
                      <Input
                        value={item.productName}
                        onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                        placeholder="ชื่อสินค้า"
                      />
                    </div>
                    <div>
                      <Label>จำนวน</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>ราคาต่อหน่วย</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      ราคารวม: ฿{item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {formData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg font-medium mb-2">ยังไม่มีรายการสินค้า</p>
                  <p className="text-sm">กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มสร้างรายการสินค้า</p>
                </div>
              )}

              <div className="border-t pt-4 text-right">
                <p className="text-xl font-semibold">
                  ยอดรวม: ฿{calculateTotal().toLocaleString()}
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">ชื่อบริษัท</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  placeholder="ชื่อบริษัทลูกค้า"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">โทรศัพท์</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">อีเมล</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                  placeholder="อีเมล"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>หมายเหตุ</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม"
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
