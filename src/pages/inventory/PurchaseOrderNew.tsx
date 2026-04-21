import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { inventoryAPI } from "@/lib/supabase/inventory";
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

interface POItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  serialNumbers: string[];
}

export default function PurchaseOrderNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [poNumber, setPONumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [poDate, setPODate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<POItem[]>([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load suppliers and products from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppliersData, productsData] = await Promise.all([
        inventoryAPI.getSuppliers(),
        inventoryAPI.getProducts()
      ]);
      setSuppliers(suppliersData);
      // Sort products by SKU
      const sortedProducts = [...productsData].sort((a, b) => {
        const skuA = (a.sku || '').toLowerCase();
        const skuB = (b.sku || '').toLowerCase();
        return skuA.localeCompare(skuB);
      });
      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const addItem = () => {
    const newItem: POItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      qty: 1,
      unitPrice: 0,
      totalPrice: 0,
      serialNumbers: []
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateSerialNumber = (itemId: string, serialIndex: number, value: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedSerials = [...(item.serialNumbers || [])];
        updatedSerials[serialIndex] = value;
        return { ...item, serialNumbers: updatedSerials };
      }
      return item;
    }));
  };

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === "productId") {
          const product = products.find(p => p.id === parseInt(value));
          if (product) {
            updatedItem.productName = product.name;
            // Don't auto-fill unitPrice, let user enter it manually
            // updatedItem.unitPrice = product.unit_price || 0;
            updatedItem.totalPrice = updatedItem.qty * updatedItem.unitPrice;
            // Reset serial numbers when product changes
            updatedItem.serialNumbers = new Array(updatedItem.qty).fill("");
          }
        } else if (field === "qty") {
          updatedItem.totalPrice = updatedItem.qty * updatedItem.unitPrice;
          // Adjust serial numbers array when quantity changes
          const currentSerials = updatedItem.serialNumbers || [];
          if (updatedItem.qty > currentSerials.length) {
            updatedItem.serialNumbers = [...currentSerials, ...new Array(updatedItem.qty - currentSerials.length).fill("")];
          } else {
            updatedItem.serialNumbers = currentSerials.slice(0, updatedItem.qty);
          }
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
    if (!supplierId) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณาเลือก Supplier",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Create purchase order
      const poData = {
        po_number: poNumber,
        supplier_id: supplierId,
        po_date: poDate,
        note: note,
        total_amount: totalAmount
      };
      
      const createdPO = await inventoryAPI.createPurchaseOrder(poData);
      
      // Create purchase order items and inventory units
      const itemPromises = items.map(async (item) => {
        const poItemData = {
          purchase_order_id: createdPO.id,
          product_id: parseInt(item.productId),
          qty: item.qty,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        };
        
        const createdItem = await inventoryAPI.createPurchaseOrderItem(poItemData);
        
        // Create inventory units for each serial number
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          const unitPromises = item.serialNumbers
            .filter(serial => serial.trim() !== "")
            .map(serial => 
              inventoryAPI.createInventoryUnit({
                product_id: parseInt(item.productId),
                purchase_order_item_id: createdItem.id,
                serial_no: serial.trim(),
                status: 'in_stock'
              })
            );
          await Promise.all(unitPromises);
        }
        
        return createdItem;
      });
      
      await Promise.all(itemPromises);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "สร้าง Purchase Order และรายการสินค้าเรียบร้อยแล้ว"
      });
      
      navigate("/inventory/purchase-orders");
      
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/inventory/purchase-orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">สร้าง Purchase Order ใหม่</h1>
          <p className="text-gray-600 mt-1">สร้างใบสั่งซื้อสินค้าใหม่ พร้อมรายการสินค้าที่ต้องการสั่งซื้อ</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูล Purchase Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="poNumber">PO Number</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPONumber(e.target.value)}
                placeholder="PO-"
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="poDate">วันที่</Label>
              <Input
                id="poDate"
                type="date"
                value={poDate}
                onChange={(e) => setPODate(e.target.value)}
              />
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
            <CardTitle>รายการสินค้าที่สั่งซื้อ</CardTitle>
            <Button onClick={addItem} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มรายการสินค้า
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">ยังไม่มีรายการสินค้า</p>
              <p className="text-sm">กดปุ่ม "เพิ่มรายการสินค้า" เพื่อเริ่มสร้างรายการสินค้าที่ต้องการสั่งซื้อ</p>
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
                  <TableHead>Serial Numbers</TableHead>
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
                           {products.map((product) => (
                             <SelectItem key={product.id} value={product.id.toString()}>
                               {product.sku ? `${product.sku} - ${product.name}` : product.name}
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
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>₿{item.totalPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {Array.from({ length: item.qty }, (_, index) => (
                          <Input
                            key={index}
                            placeholder={`Serial #${index + 1}`}
                            value={item.serialNumbers?.[index] || ""}
                            onChange={(e) => updateSerialNumber(item.id, index, e.target.value)}
                            className="text-sm"
                          />
                        ))}
                      </div>
                    </TableCell>
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
              ยอดรวมทั้งสิ้น: ₿{totalAmount.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/inventory/purchase-orders")}>
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก Purchase Order และรายการสินค้า"}
        </Button>
      </div>
    </div>
  );
}