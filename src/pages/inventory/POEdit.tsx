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
import { usePurchaseOrderDetailAPI as usePurchaseOrderDetail, useUpdatePurchaseOrderAPI as useUpdatePurchaseOrder } from "@/hooks/useInventoryDataAPI";

export default function POEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ใช้ hook สำหรับดึงข้อมูล PO
  const { 
    data: po, 
    isLoading, 
    error 
  } = usePurchaseOrderDetail(id!);
  
  // ใช้ hook สำหรับอัปเดต PO
  const updatePOMutation = useUpdatePurchaseOrder();
  
  const [formData, setFormData] = useState({
    po_date: "",
    note: "",
    total_amount: 0,
    items: [] as any[]
  });

  // อัปเดต form data เมื่อได้ข้อมูลจาก API
  useEffect(() => {
    if (po) {
      setFormData({
        po_date: po.po_date ? po.po_date.split('T')[0] : "",
        note: po.note || "",
        total_amount: po.total_amount || 0,
        items: po.purchase_order_items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || '',
          qty: item.qty || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0
        })) || []
      });
    }
  }, [po]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      product_id: null,
      product_name: "",
      qty: 1,
      unit_price: 0,
      total_price: 0
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
          if (field === 'qty' || field === 'unit_price') {
            updatedItem.total_price = updatedItem.qty * updatedItem.unit_price;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSave = async () => {
    try {
      const poData = {
        po_date: formData.po_date,
        note: formData.note,
        total_amount: calculateTotal()
      };

      await updatePOMutation.mutateAsync({
        poId: id!,
        poData,
        items: formData.items
      });
      
      navigate(`/inventory/purchase-orders/${id}`);
    } catch (error) {
      console.error('Error saving PO:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">ไม่พบข้อมูล</h2>
          <p className="text-gray-600 mt-2">ไม่สามารถโหลดข้อมูล Purchase Order ได้</p>
          <Button 
            onClick={() => navigate("/inventory/purchase-orders")}
            className="mt-4"
          >
            กลับไปหน้ารายการ
          </Button>
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
            onClick={() => navigate(`/inventory/purchase-orders/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">แก้ไข Purchase Order: {po.po_number}</h1>
            <p className="text-gray-600 mt-1">แก้ไขข้อมูลใบสั่งซื้อสินค้า</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updatePOMutation.isPending} 
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updatePOMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO Details */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูล Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="po_date">วันที่สร้าง</Label>
                  <Input
                    id="po_date"
                    type="date"
                    value={formData.po_date}
                    onChange={(e) => handleInputChange("po_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="total_amount">มูลค่ารวม</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    value={calculateTotal()}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="note">หมายเหตุ</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติม"
                  rows={3}
                />
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
                        value={item.product_name}
                        onChange={(e) => updateItem(item.id, "product_name", e.target.value)}
                        placeholder="ชื่อสินค้า"
                      />
                    </div>
                    <div>
                      <Label>จำนวน</Label>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, "qty", parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>ราคาต่อหน่วย</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, "unit_price", parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      ราคารวม: ฿{item.total_price.toLocaleString()}
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
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูล Supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>ชื่อบริษัท</Label>
                <p className="text-sm font-medium">{po.suppliers?.name || 'ไม่ระบุ'}</p>
              </div>
              {po.suppliers?.address && (
                <div>
                  <Label>ที่อยู่</Label>
                  <p className="text-sm">{po.suppliers.address}</p>
                </div>
              )}
              {po.suppliers?.phone && (
                <div>
                  <Label>โทรศัพท์</Label>
                  <p className="text-sm">{po.suppliers.phone}</p>
                </div>
              )}
              {po.suppliers?.email && (
                <div>
                  <Label>อีเมล</Label>
                  <p className="text-sm">{po.suppliers.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลระบบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>วันที่สร้าง</Label>
                <p className="text-sm">
                  {po.created_at ? new Date(po.created_at).toLocaleString('th-TH') : '-'}
                </p>
              </div>
              <div>
                <Label>อัปเดตล่าสุด</Label>
                <p className="text-sm">
                  {po.updated_at ? new Date(po.updated_at).toLocaleString('th-TH') : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
