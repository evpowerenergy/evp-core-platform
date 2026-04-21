import { useState } from "react";
import { ArrowLeft } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

export default function SupplierNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    tax_id: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contact_person) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกชื่อบริษัทและผู้ติดต่อ",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      await inventoryAPI.createSupplier(formData);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "เพิ่ม Supplier เรียบร้อยแล้ว"
      });
      
      navigate("/inventory/suppliers");
      
    } catch (error) {
      console.error('Error creating supplier:', error);
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
        <Button variant="ghost" onClick={() => navigate("/inventory/suppliers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">เพิ่ม Supplier ใหม่</h1>
          <p className="text-gray-600 mt-1">เพิ่มข้อมูลผู้จำหน่ายใหม่</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูล Supplier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">ชื่อบริษัท *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="ชื่อบริษัท..."
                required
              />
            </div>
            <div>
              <Label htmlFor="contactPerson">ผู้ติดต่อ *</Label>
              <Input
                id="contactPerson"
                value={formData.contact_person}
                onChange={(e) => handleInputChange("contact_person", e.target.value)}
                placeholder="ชื่อผู้ติดต่อ..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="อีเมล..."
              />
            </div>
            <div>
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="เบอร์โทรศัพท์..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
            <Input
              id="taxId"
              value={formData.tax_id}
              onChange={(e) => handleInputChange("tax_id", e.target.value)}
              placeholder="เลขประจำตัวผู้เสียภาษี (13 หลัก)..."
              maxLength={13}
            />
          </div>

          <div>
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="ที่อยู่บริษัท..."
              rows={3}
            />
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/inventory/suppliers")}>
          ยกเลิก
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!formData.name || !formData.contact_person || saving}
        >
          {saving ? "กำลังบันทึก..." : "บันทึก Supplier"}
        </Button>
      </div>
    </div>
  );
}